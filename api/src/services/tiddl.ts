import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";
import { chmodSync } from "fs";

import {
  CONFIG_PATH,
  NZB_DOWNLOAD_PATH,
  PROCESSING_PATH,
} from "../../constants";
import { get_tiddl_config } from "../helpers/get_tiddl_config";
import { extractFirstLineClean } from "../processing/utils/ansi-parse";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType, TiddlConfig } from "../types";

import {
  ATMOS_TIDDL_PATH,
  getAtmosAuth,
  getTiddlEnvironment,
  hasAtmosAuth,
  isPkceAuth,
  needsTokenRefresh,
  prepareAtmosProfile,
  refreshPkceAuth,
  selectTidalProfile,
  TidalProfile,
} from "./tidal-pkce";

// Constants
const TIDDL_BINARY = "tiddl";
const PROGRESS_UPDATE_THROTTLE_MS = 2000;

// Resource mapping for favorite types
const FAVORITE_TYPE_TO_RESOURCE: Record<string, string> = {
  favorite_tracks: "track",
  favorite_albums: "album",
  favorite_playlists: "playlist",
  favorite_videos: "video",
  favorite_artists: "artist",
};

export function tidalDL(id: string, app: Express, onFinish?: () => void) {
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);

  const config: TiddlConfig = app.locals.tiddlConfig;

  if (!item) {
    console.error(`tidalDL: Item with id ${id} not found in processing list`);
    if (onFinish) onFinish();
    return;
  }

  logs(item.id, "---------------------");
  logs(item.id, "🎵 TIDDL PROCESSING  ");
  logs(item.id, "---------------------");

  const args: string[] = [];

  args.push("download");

  if (item.source === "lidarr") {
    args.push("--path", `${NZB_DOWNLOAD_PATH}/${item.id}`);
    args.push(
      "-o",
      "{album.artist}/{album.title}/{item.number:02d}. {item.title_version}",
    );
  } else {
    args.push("--path", `${PROCESSING_PATH}/${item.id}`);
  }

  if (item.type === "mix" && config?.templates?.mix) {
    args.push("-o", config.templates.mix);
  }

  if (item.type !== "video" && item.quality) {
    args.push("-q");
    args.push(item.quality);
  }

  if (item.atmosFilter) {
    args.push("--dolby-atmos", item.atmosFilter);
  }

  if (["artist_videos", "video"].includes(item.type)) {
    args.push("--videos", "only");
  }

  const resource = FAVORITE_TYPE_TO_RESOURCE[item.type];
  if (resource && !item.url?.startsWith("playlist/")) {
    // Native fav download (no playlist conversion)
    args.push("fav", "-t", resource);
  } else {
    args.push("url", item.url);
  }

  logs(item.id, `🕖 [TIDDL] Executing: ${TIDDL_BINARY} ${args.join(" ")}`);
  logs(item.id, "\r\n");

  const profile = selectTidalProfile(item.atmosFilter);
  const auth = profile === "atmos" ? getAtmosAuth() : config.auth;

  const child = spawn(TIDDL_BINARY, args, {
    env: {
      ...getTiddlEnvironment(auth, profile),
      FORCE_COLOR: "1",
      TERM: "xterm-256color",
    },
  });

  child.stdout?.setEncoding("utf8");
  let lastTotalProgress = "";
  let hasProcessingError = false;
  let hasNetworkError = false;
  let lastProgressUpdate = 0;

  child.stdout?.on("data", (data: string) => {
    const lines = data?.split("\r");
    const errorLines = lines.filter(
      (line) =>
        // "not a MP4 file" is a tiddl-handled fallback, not a real error
        (line.includes("[31mError:\x1B") &&
          !line.includes("not a MP4 file") &&
          !line.includes("no longer available")) ||
        line.includes("Cannot connect to host") ||
        line.includes("validation errors") ||
        line.includes("due to Dolby Atmos filter") ||
        line.includes("ECONNRESET") ||
        line.includes("ContentLengthError") ||
        line.includes("is not completed") ||
        line.includes("TypeError: terminated"),
    );
    if (errorLines.length > 0) {
      hasProcessingError = true;
      if (
        lines.some(
          (line) =>
            line.includes("Cannot connect to host") ||
            line.includes("Connection reset by peer") ||
            line.includes("ECONNRESET") ||
            line.includes("ContentLengthError") ||
            line.includes("is not completed") ||
            line.includes("TypeError: terminated"),
        )
      ) {
        hasNetworkError = true;
      }
    }

    if (
      data.includes("Exists") ||
      data.includes("Total downloads") ||
      data.includes("Downloaded")
    ) {
      // Extract first line and clean it (remove ANSI hyperlinks and extra lines)
      const cleanedLine = extractFirstLineClean(data);

      if (cleanedLine) {
        // Console log important lines only (for Docker logs)
        console.log(cleanedLine);
        // Replace last Total Progress with important line
        logs(item.id, cleanedLine, { replaceLast: true, skipConsole: true });
        // Re-display Total Progress below (will continue updating)
        if (lastTotalProgress) {
          logs(item.id, lastTotalProgress, { skipConsole: true });
        }
      }

      return;
    }

    if (errorLines.length > 0) {
      logs(item.id, errorLines.join("\n"), { replaceLast: true });
      logs(item.id, " ");
      return;
    }

    if (data.includes("Total Progress")) {
      lastTotalProgress = data;

      // Parse progress (e.g., "47/210") and update item (throttled)
      const match = data.match(/(\d+)\/(\d+)/);
      const now = Date.now();
      if (match && now - lastProgressUpdate > PROGRESS_UPDATE_THROTTLE_MS) {
        lastProgressUpdate = now;
        item.progress = {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        };
        app.locals.processingStack.actions.updateItem(item);
      }

      logs(item.id, data, { replaceLast: true, skipConsole: true });
    }
  });

  child.on("close", async (code) => {
    const currentOutput = app.locals.processingStack.actions.getItemOutput(
      item.id,
    );

    const isDownloaded =
      !hasProcessingError &&
      (currentOutput.includes("can't save playlist m3u file") || code === 0);

    if (isDownloaded) {
      logs(item.id, `✅ [TIDDL] Download succeed (code: ${code})`);
    } else {
      logs(item.id, `❌ [TIDDL] Tiddl process exited with code ${code})`);
      hasProcessingError = true;
    }

    item["status"] = hasProcessingError ? "error" : item["status"];
    item["loading"] = false;
    item["networkError"] = hasNetworkError;
    app.locals.processingStack.actions.updateItem(item);

    if (onFinish) onFinish();
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
    logs(item.id, `❌ [TIDDL]: ${data}`);
    hasProcessingError = true;
  });

  child.on("error", (err) => {
    if (err) {
      logs(item.id, `❌ [TIDDL] Error: ${err}`);
      item["status"] = "error";
      item["loading"] = false;
      app.locals.processingStack.actions.updateItem(item);
      if (onFinish) onFinish();
    }
  });

  return child;
}

export function tidalAtmosToken(req: Request, res: Response) {
  console.log("🔑 [TIDDL] User requested new Atmos authentication ...");

  prepareAtmosProfile();

  // User explicitly requested login, so proceed with authentication
  // (No need to check existing token - user wants to re-authenticate)
  const tiddlProcess = spawn(TIDDL_BINARY, ["auth", "login"], {
    env: getTiddlEnvironment(getAtmosAuth(), "atmos"),
  });

  tiddlProcess.stdout.on("data", (data) => {
    console.log(data.toString());
    res.write(`data: ${data.toString()}\n\n`);
  });

  tiddlProcess.stderr.on("data", (data) => {
    console.log(data.toString());
    res.write(`data: ${data.toString()}\n\n`);
  });

  tiddlProcess.on("close", (code) => {
    if (code === 0) {
      const authPath = `${ATMOS_TIDDL_PATH}/auth.json`;
      try {
        chmodSync(authPath, 0o600);
      } catch (error) {
        res.write(
          "data: AuthError: Atmos authentication file was not created.\n\n",
        );
        console.error("❌ [TIDDL] Atmos auth file was not created:", error);
        res.end();
        return;
      }
      res.write(`data: Authenticated! Token saved to ${authPath}\n\n`);
      console.log("✅ [TIDDL]: Authenticated !");

      // Reload tiddl config to include new auth tokens
      const { config: freshConfig } = get_tiddl_config();
      req.app.locals.tiddlConfig = freshConfig;
      console.log("✅ [TIDDL]: Config reloaded with new auth tokens");
    } else {
      res.write(`data: closing ${code}\n\n`);
      console.log(`❌ [TIDDL]: Auth process exited with code ${code}`);
    }
    res.end();
  });

  req.on("close", () => {
    tiddlProcess.kill();
  });
}

export function deleteTiddlConfig() {
  try {
    const { config } = get_tiddl_config();
    const result = spawnSync(TIDDL_BINARY, ["auth", "logout", "--force"], {
      env: getTiddlEnvironment(config.auth),
      encoding: "utf-8",
    });
    if (result.status === 0) {
      console.log(
        `✅ [TIDDL] Auth tokens deleted from ${CONFIG_PATH}/.tiddl/auth.json`,
      );
    } else {
      console.error(
        `❌ [TIDDL] tiddl auth logout --force exited with code ${result.status}` +
          (result.stderr ? `:\n${result.stderr.trim()}` : ""),
      );
    }

    if (hasAtmosAuth()) {
      const atmosphereResult = spawnSync(
        TIDDL_BINARY,
        ["auth", "logout", "--force"],
        {
          env: getTiddlEnvironment(getAtmosAuth(), "atmos"),
          encoding: "utf-8",
        },
      );
      if (atmosphereResult.status === 0) {
        console.log(
          `✅ [TIDDL] Atmos auth tokens deleted from ${ATMOS_TIDDL_PATH}/auth.json`,
        );
      } else {
        console.error(
          `❌ [TIDDL] Atmos auth logout exited with code ${atmosphereResult.status}` +
            (atmosphereResult.stderr
              ? `:\n${atmosphereResult.stderr.trim()}`
              : ""),
        );
      }
    }
  } catch (e) {
    console.error("❌ [TIDDL] Error deleting tiddl config:", e);
  }
}

export async function refreshTidalToken(
  profile: TidalProfile = "hires",
): Promise<void> {
  console.log(`🕖 [TIDDL] Refreshing ${profile} Tidal token...`);

  const { config } = get_tiddl_config();
  const auth = profile === "atmos" ? getAtmosAuth() : config.auth;
  if (profile === "hires" && isPkceAuth(auth)) {
    await refreshPkceAuth(config.auth);
    console.log("✅ [TIDAL] Hi-Res token refreshed.");
    return;
  }

  // Use async spawn and wait for completion
  return new Promise((resolve) => {
    const refreshProcess = spawn(TIDDL_BINARY, ["auth", "refresh"], {
      env: getTiddlEnvironment(auth, profile),
    });

    const stderrChunks: Buffer[] = [];
    refreshProcess.stderr?.on("data", (chunk) => stderrChunks.push(chunk));

    refreshProcess.on("close", async (code) => {
      if (code === 0) {
        const authPath =
          profile === "atmos"
            ? `${ATMOS_TIDDL_PATH}/auth.json`
            : `${CONFIG_PATH}/.tiddl/auth.json`;
        console.log(
          `✅ [TIDDL] Tidal token refreshed and saved to ${authPath}`,
        );
        // Wait 500ms to ensure file is written to disk before resolving
        await new Promise((r) => setTimeout(r, 500));
      } else {
        const err = Buffer.concat(stderrChunks).toString("utf-8").trim();
        console.log(
          `⚠️ [TIDDL] Token refresh exited with code ${code}${err ? `:\n${err}` : ""}`,
        );
      }
      resolve();
    });

    refreshProcess.on("error", (error) => {
      console.log(`❌ [TIDDL] Token refresh error: ${error.message}`);
      resolve(); // Resolve anyway to not block the caller
    });
  });
}

/**
 * Refresh before Tiddl starts so its built-in refresh command never changes
 * the client identity of a PKCE token near expiry.
 */
export async function ensureTidalTokenFresh(
  app: Express,
  item?: ProcessingItemType,
): Promise<void> {
  const atmosphereAvailable = hasAtmosAuth();
  if (item?.atmosFilter === "only" && !atmosphereAvailable) {
    throw new Error(
      "Atmos authentication is required. Add it in Settings → Tiddl configuration.",
    );
  }

  const profile = selectTidalProfile(item?.atmosFilter, atmosphereAvailable);
  const auth =
    profile === "atmos" ? getAtmosAuth() : app.locals.tiddlConfig?.auth;
  if (!needsTokenRefresh(auth)) return;

  await refreshTidalToken(profile);
  if (profile === "hires") {
    const { config } = get_tiddl_config();
    app.locals.tiddlConfig = config;
  }
}
