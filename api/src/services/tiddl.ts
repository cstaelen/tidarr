import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";

import {
  CONFIG_PATH,
  NZB_DOWNLOAD_PATH,
  PROCESSING_PATH,
  TOKEN_REFRESH_THRESHOLD,
} from "../../constants";
import { get_tiddl_config } from "../helpers/get_tiddl_config";
import { extractFirstLineClean } from "../processing/utils/ansi-parse";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType, TiddlConfig } from "../types";

// Constants
const TIDDL_BINARY = "tiddl";

// Error messages to detect authentication issues
const AUTH_ERROR_MESSAGES = [
  "User does not have a valid session",
  '"token": token["access_token"]',
];

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

  args.push("--skip-errors");

  if (item.source === "lidarr") {
    args.push("--path", `${NZB_DOWNLOAD_PATH}/${item.id}`);
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

  if (["artist_videos", "video"].includes(item.type)) {
    args.push("--videos", "only");
  }

  if (item.type.includes("favorite_")) {
    const resource = FAVORITE_TYPE_TO_RESOURCE[item.type];
    if (resource) {
      args.push("fav", "-t", resource);
    }
  } else {
    args.push("url", item.url);
  }

  logs(item.id, `🕖 [TIDDL] Executing: ${TIDDL_BINARY} ${args.join(" ")}`);
  logs(item.id, "\r\n");

  const child = spawn(TIDDL_BINARY, args, {
    env: {
      ...process.env,
      FORCE_COLOR: "1",
      TERM: "xterm-256color",
    },
  });

  child.stdout?.setEncoding("utf8");
  let lastTotalProgress = "";
  let hasProcessingError = false;

  child.stdout?.on("data", (data: string) => {
    const lines = data?.split("\r");
    const errorLines = lines.filter(
      (line) =>
        line.includes("[31mError:\x1B") ||
        line.includes("Cannot connect to host"),
    );
    if (errorLines.length > 0) {
      hasProcessingError = true;
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
      logs(item.id, data, { replaceLast: true, skipConsole: true });
    }
  });

  child.on("close", (code) => {
    const currentOutput = app.locals.processingStack.actions.getItemOutput(
      item.id,
    );

    // Check for authentication errors
    const hasAuthError = AUTH_ERROR_MESSAGES.some((msg) =>
      currentOutput.includes(msg),
    );
    if (hasAuthError) {
      console.log("LOGOUT");
      code = 401;
      deleteTiddlConfig();
    }

    const isDownloaded =
      currentOutput.includes("can't save playlist m3u file") || code === 0;

    if (isDownloaded) {
      logs(item.id, `✅ [TIDDL] Download succeed (code: ${code})`);
    } else {
      logs(item.id, `❌ [TIDDL] Tiddl process exited with code ${code})`);
    }

    console.log("hasProcessingError", hasProcessingError);

    item["status"] =
      !isDownloaded || hasProcessingError ? "error" : item["status"];

    item["loading"] = false;
    app.locals.processingStack.actions.updateItem(item);
    if (onFinish) onFinish();
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
    logs(item.id, `❌ [TIDDL]: ${data}`);
    if (onFinish) onFinish();
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

export function tidalToken(req: Request, res: Response) {
  console.log("🔑 [TIDDL] Request a token ...");

  // Check if already authenticated with valid token
  const currentConfig = req.app.locals.tiddlConfig;
  if (currentConfig?.auth?.token && !shouldRefreshToken(currentConfig)) {
    return;
  }

  const tiddlProcess = spawn(TIDDL_BINARY, ["auth", "login"], {
    env: { ...process.env },
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
      res.write(
        `data: Authenticated! Token saved to ${CONFIG_PATH}/.tiddl/auth.json\n\n`,
      );
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
    spawnSync(TIDDL_BINARY, ["auth", "logout"], {
      env: { ...process.env },
    });
    console.log(
      `✅ [TIDDL] Auth tokens deleted from ${CONFIG_PATH}/.tiddl/auth.json`,
    );
  } catch (e) {
    console.error("❌ [TIDDL] Error deleting tiddl config:", e);
  }
}

/**
 * Check if Tidal token needs refresh based on expires_at timestamp
 * Returns true if:
 * - Token expires in less than TOKEN_REFRESH_THRESHOLD seconds (proactive refresh)
 * - Token is already expired (reactive refresh)
 * @param tiddlConfig - Optional TiddlConfig object from app.locals
 * @returns true if token should be refreshed, false otherwise
 */
export function shouldRefreshToken(tiddlConfig?: TiddlConfig): boolean {
  // If config is not provided or missing auth data, skip refresh
  if (!tiddlConfig?.auth?.expires_at) {
    console.log("⏭️ [TOKEN] No expires_at found, skipping refresh");
    return false;
  }

  const expiresAt = tiddlConfig.auth.expires_at;
  const nowInSeconds = Math.floor(Date.now() / 1000);

  // Refresh if token expires in less than TOKEN_REFRESH_THRESHOLD seconds
  // This covers both cases: already expired (negative value) and expiring soon
  const timeUntilExpiry = expiresAt - nowInSeconds;
  const hoursUntilExpiry = timeUntilExpiry / 3600;

  const needsRefresh = timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;

  console.log(
    `🔍 [TOKEN] Token check: expires in ${hoursUntilExpiry.toFixed(1)}h (threshold: ${TOKEN_REFRESH_THRESHOLD / 3600}h) → ${needsRefresh ? "NEEDS REFRESH" : "still valid"}`,
  );

  return needsRefresh;
}

export async function refreshTidalToken(
  force = false,
  tiddlConfig?: TiddlConfig,
): Promise<void> {
  // Skip refresh if token is still valid (unless forced)
  if (!force && !shouldRefreshToken(tiddlConfig)) {
    return;
  }

  console.log("🕖 [TIDDL] Refreshing Tidal token...");

  // Use async spawn and wait for completion
  return new Promise((resolve) => {
    const refreshProcess = spawn(TIDDL_BINARY, ["auth", "refresh"], {
      env: {
        ...process.env,
      },
    });

    refreshProcess.on("close", async (code) => {
      if (code === 0) {
        console.log(
          `✅ [TIDDL] Tidal token refreshed and saved to ${CONFIG_PATH}/.tiddl/auth.json`,
        );
        // Wait 500ms to ensure file is written to disk before resolving
        await new Promise((r) => setTimeout(r, 500));
      } else {
        console.log(`⚠️ [TIDDL] Token refresh exited with code ${code}`);
      }
      resolve();
    });

    refreshProcess.on("error", (error) => {
      console.log(`❌ [TIDDL] Token refresh error: ${error.message}`);
      resolve(); // Resolve anyway to not block the caller
    });
  });
}
