import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";

import { CONFIG_PATH } from "../../constants";
import { extractFirstLineClean } from "../helpers/ansi_parse";
import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

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
    app.settings.processingList.actions.getItem(id);

  if (!item) {
    console.error(`tidalDL: Item with id ${id} not found in processing list`);
    if (onFinish) onFinish();
    return;
  }

  logs(item, "---------------------", app);
  logs(item, "🎵 TIDDL PROCESSING  ", app);
  logs(item, "---------------------", app);

  const args: string[] = [];

  args.push("download");
  args.push("--path", "/home/app/standalone/shared/.processing");
  args.push("--scan-path", "/home/app/standalone/library");

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

  logs(item, `🕖 [TIDDL] Executing: ${TIDDL_BINARY} ${args.join(" ")}`, app);
  logs(item, "\r\n", app);

  const child = spawn(TIDDL_BINARY, args, {
    env: {
      ...process.env,
      FORCE_COLOR: "1",
      TERM: "xterm-256color",
    },
  });

  child.stdout?.setEncoding("utf8");
  child.stdout?.on("data", (data: string) => {
    if (
      data.includes("Error:") ||
      data.includes("Exists") ||
      data.includes("Total downloads") ||
      data.includes("Downloaded")
    ) {
      // Extract first line and clean it (remove ANSI hyperlinks and extra lines)
      const cleanedLine = extractFirstLineClean(data);
      if (cleanedLine) {
        console.log(cleanedLine);
        logs(item, cleanedLine, app, true);
        logs(item, "\r", app);
      }
      return;
    }

    if (data.includes("Total Progress")) {
      logs(item, data, app, true);
    }
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
    logs(item, `❌ [TIDDL]: ${data}`, app);
    if (onFinish) onFinish();
  });

  child.on("close", (code) => {
    const currentOutput = app.settings.processingList.actions.getItemOutput(
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
      logs(item, `✅ [TIDDL] Download succeed (code: ${code})`, app);
    } else {
      logs(item, `❌ [TIDDL] Tiddl process exited with code ${code}`, app);
    }

    item["status"] = isDownloaded ? "downloaded" : "error";
    item["loading"] = false;
    app.settings.processingList.actions.updateItem(item);
    if (onFinish) onFinish();
  });

  child.on("error", (err) => {
    if (err) {
      logs(item, `❌ [TIDDL] Error: ${err}`, app);
      item["status"] = "error";
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
      if (onFinish) onFinish();
    }
  });

  return child;
}

export function tidalToken(req: Request, res: Response) {
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
    } else {
      res.write(`data: closing ${code}\n\n`);
    }
    console.log(
      `${code === 0 ? "✅" : "❌"} [TIDDL]: Auth process exited with code ${code}`,
    );
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
