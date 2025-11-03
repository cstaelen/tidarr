import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";

import { ROOT_PATH } from "../../constants";
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

  if (item.type.includes("favorite_")) {
    const resource = FAVORITE_TYPE_TO_RESOURCE[item.type];
    if (resource) {
      args.push("fav", "-r", resource);
    }
  } else {
    args.push("url", item.url);
  }

  args.push("download");

  if (item.type !== "video" && item.quality) {
    args.push("-q");
    args.push(item.quality);
  }

  if (item.type === "video") {
    args.push("-V");
  }

  logs(
    item,
    `🕖 [TIDDL] Executing: TIDDL_PATH=${ROOT_PATH}/shared ${TIDDL_BINARY} ${args.join(" ")}`,
    app,
  );

  const child = spawn(TIDDL_BINARY, args, {
    env: {
      ...process.env,
      TIDDL_PATH: `${ROOT_PATH}/shared`,
      FORCE_COLOR: "1",
      TERM: "xterm-256color",
    },
  });

  child.stdout?.setEncoding("utf8");
  child.stdout?.on("data", (data: string) => {
    const lines = data.split(/\r?\n/);
    for (const line of lines) {
      const formatted = line.replaceAll(/[\r\n]+/gm, "").trim();

      if (formatted.includes("Track ") || formatted.length <= 6) return;

      logs(item, `⬇️ [TIDDL] ${formatted}`, app);
    }
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
    logs(item, `❌ [TIDDL]: ${data}`, app);
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
    env: { ...process.env, TIDDL_PATH: `${ROOT_PATH}/shared` },
  });

  tiddlProcess.stdout.on("data", (data) => {
    res.write(`data: ${data.toString()}\n\n`);
  });

  tiddlProcess.stderr.on("data", (data) => {
    res.write(`data: ${data.toString()}\n\n`);
  });

  tiddlProcess.on("close", (code) => {
    if (code === 0) {
      res.write(`data: Authenticated!\n\n`);
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
      env: { ...process.env, TIDDL_PATH: `${ROOT_PATH}/shared` },
    });
  } catch (e) {
    console.error("❌ [TIDDL] Error deleting tiddl config:", e);
  }
}
