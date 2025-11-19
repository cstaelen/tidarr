import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";

import { CONFIG_PATH } from "../../constants";
import { extractFirstLineClean } from "../helpers/ansi_parse";
import { logs } from "../helpers/logs";
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
  args.push("--path", "/home/app/standalone/shared/.processing");
  args.push("--scan-path", "/home/app/standalone/library");

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
      args.push("fav", "-r", resource);
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
    if (
      data.includes("Error") ||
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

      if (data.includes("Error")) hasProcessingError = true;

      return;
    }

    if (data.includes("Total Progress")) {
      lastTotalProgress = data;
      logs(item.id, data, { replaceLast: true, skipConsole: true });
    }
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
    logs(item.id, `❌ [TIDDL]: ${data}`);
    if (onFinish) onFinish();
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

    item["status"] =
      isDownloaded && !hasProcessingError ? "downloaded" : "error";
    item["loading"] = false;
    app.locals.processingStack.actions.updateItem(item);
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
