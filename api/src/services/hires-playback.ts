import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import type { Request, Response } from "express";

import { CONFIG_PATH } from "../../constants";

// TIDAL grants hi-res FLAC to a different client profile than the login client.
// The secret is sent in the form body. Basic auth is rejected for this profile.
const PLAYBACK_CLIENT_ID = "6BDSRdpK9hqEBTgU";
const PLAYBACK_CLIENT_SECRET = "xeuPmY7nbpZ9IIbLAcQ93shka1VNheUAqN6IcszjTG8=";
const TOKEN_URL = "https://auth.tidal.com/v1/oauth2/token";
const API_URL = "https://api.tidal.com/v1";
const PLAYBACK_SCOPE = "r_usr+w_usr";

type HiresPlay =
  | { mode: "proxy"; url: string }
  | { mode: "dash"; urls: string[] };

type TokenCache = { accessToken: string; expiresAt: number };
let cachedToken: TokenCache | null = null;

function log(message: string) {
  console.error(`play ${message}`);
}

function unescapeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function dashSegmentUrls(xml: string): string[] {
  const blocks = xml.match(/<Representation\b[\s\S]*?<\/Representation>/g) || [xml];
  const block = blocks.find((item) => /codecs="flac"/.test(item)) || blocks[0];
  const init = block.match(/initialization="([^"]+)"/);
  const media = block.match(/media="([^"]+)"/);
  if (!init || !media) return [];

  const rep = block.match(/\bid="([^"]*)"/);
  const repId = rep ? rep[1] : "";
  const startMatch = block.match(/startNumber="(\d+)"/);
  const startNumber = startMatch ? Number(startMatch[1]) : 1;
  let segments = 0;
  for (const attrs of block.match(/<S\b([^>]*)\/>/g) || []) {
    const repeat = attrs.match(/\br="(\d+)"/);
    segments += (repeat ? Number(repeat[1]) : 0) + 1;
  }
  if (segments < 1) return [];

  const expand = (url: string, number?: number) => {
    let next = unescapeXml(url).replaceAll("$RepresentationID$", repId);
    if (number !== undefined) next = next.replaceAll("$Number$", String(number));
    return next;
  };

  const urls = [expand(init[1])];
  for (let index = 0; index < segments; index += 1) {
    urls.push(expand(media[1], startNumber + index));
  }
  return urls;
}

function storeRefreshToken(refreshToken: string) {
  const path = `${CONFIG_PATH}/.tiddl/auth.json`;
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (!data.refresh_token || data.refresh_token === refreshToken) return;
    data.refresh_token = refreshToken;
    writeFileSync(path, JSON.stringify(data));
  } catch {
    log("could not store rotated refresh token");
  }
}

async function playbackAccessToken(refreshToken: string): Promise<string | null> {
  const now = Date.now() / 1000;
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.accessToken;

  const body = new URLSearchParams({
    client_id: PLAYBACK_CLIENT_ID,
    client_secret: PLAYBACK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: PLAYBACK_SCOPE,
  });

  let response: globalThis.Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    log("token request failed");
    return null;
  }
  if (!response.ok) {
    log(`token status ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!data.access_token) {
    log("token response had no access token");
    return null;
  }
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    storeRefreshToken(data.refresh_token);
  }
  const ttl = Math.max((data.expires_in || 3600) - 300, 60);
  cachedToken = { accessToken: data.access_token, expiresAt: now + ttl };
  return data.access_token;
}

async function playbackInfo(trackId: string, token: string, quality: string) {
  const url = new URL(`${API_URL}/tracks/${trackId}/playbackinfopostpaywall`);
  url.searchParams.set("audioquality", quality);
  url.searchParams.set("playbackmode", "STREAM");
  url.searchParams.set("assetpresentation", "FULL");

  let response: globalThis.Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tidal-Token": PLAYBACK_CLIENT_ID,
        Accept: "application/json",
      },
    });
  } catch {
    log(`request ${quality} failed`);
    return null;
  }
  if (!response.ok) {
    log(`request ${quality} failed ${response.status}`);
    return null;
  }
  return (await response.json()) as {
    audioQuality?: string;
    audioMode?: string;
    manifestMimeType?: string;
    manifest?: string;
    bitDepth?: number;
    sampleRate?: number;
  };
}

export async function resolveHires(
  trackId: string,
  refreshToken: string,
): Promise<HiresPlay | null> {
  const token = await playbackAccessToken(refreshToken);
  if (!token) return null;

  for (const quality of ["HI_RES_LOSSLESS", "LOSSLESS"]) {
    const info = await playbackInfo(trackId, token, quality);
    if (!info?.manifest || !info.manifestMimeType) continue;
    if (info.audioMode === "DOLBY_ATMOS") {
      log(`skip atmos ${quality}`);
      continue;
    }
    log(
      `${info.audioQuality || quality} depth=${info.bitDepth ?? "?"} rate=${info.sampleRate ?? "?"} mime=${info.manifestMimeType} mode=${info.audioMode || "?"}`,
    );

    let decoded = "";
    try {
      decoded = Buffer.from(info.manifest, "base64").toString("utf8");
    } catch {
      log(`manifest decode failed ${quality}`);
      continue;
    }

    if (info.manifestMimeType === "application/dash+xml") {
      const urls = dashSegmentUrls(decoded);
      if (urls.length > 1 && /codecs="flac"/.test(decoded)) return { mode: "dash", urls };
      log(`dash was not flac ${quality}`);
      continue;
    }

    if (info.manifestMimeType === "application/vnd.tidal.bts") {
      try {
        const manifest = JSON.parse(decoded) as { urls?: string[]; codecs?: string };
        const direct = manifest.urls?.[0];
        if (direct && (manifest.codecs === "flac" || info.audioQuality === "LOSSLESS")) {
          return { mode: "proxy", url: direct };
        }
      } catch {
        log(`bts parse failed ${quality}`);
      }
    }
  }
  return null;
}

export function streamDashFlac(urls: string[], req: Request, res: Response) {
  const ff = spawn(
    "ffmpeg",
    ["-v", "error", "-vn", "-i", "pipe:0", "-c:a", "copy", "-f", "flac", "-"],
    { stdio: ["pipe", "pipe", "ignore"] },
  );

  let started = false;
  let stopped = false;

  const stop = () => {
    stopped = true;
    if (!ff.killed) ff.kill("SIGTERM");
  };

  const timer = setTimeout(() => {
    if (!started) {
      stop();
      if (!res.headersSent) res.status(504).json({ error: "Playback timed out" });
    }
  }, 45000);

  ff.stdout?.on("data", (chunk: Buffer) => {
    if (!started) {
      started = true;
      clearTimeout(timer);
      if (res.headersSent || res.writableEnded) {
        stop();
        return;
      }
      res.status(200);
      res.setHeader("Content-Type", "audio/flac");
      res.setHeader("Cache-Control", "no-store");
    }
    if (!res.write(chunk)) ff.stdout?.pause();
  });
  res.on("drain", () => ff.stdout?.resume());
  req.on("close", () => {
    if (!res.writableFinished) stop();
  });

  ff.on("close", () => {
    clearTimeout(timer);
    if (!started && !res.headersSent) res.status(502).json({ error: "No playable stream" });
    else if (!res.writableEnded) res.end();
  });
  ff.on("error", () => {
    clearTimeout(timer);
    if (!res.headersSent) res.status(502).json({ error: "Playback failed" });
  });

  void (async () => {
    try {
      for (const url of urls) {
        if (stopped) return;
        const upstream = await fetch(url);
        if (!upstream.ok || !upstream.body) {
          log(`segment status ${upstream.status}`);
          stop();
          return;
        }
        const reader = upstream.body.getReader();
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!ff.stdin?.write(value)) {
            await new Promise((resolve) => ff.stdin?.once("drain", resolve));
          }
        }
      }
      ff.stdin?.end();
    } catch {
      log("segment fetch failed");
      stop();
    }
  })();
}
