import { spawn } from "child_process";
import { Express } from "express";

import { NZB_DOWNLOAD_PATH, PROCESSING_PATH } from "../../constants";
import { extractFirstLineClean } from "../processing/utils/ansi-parse";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

const TIDAL_DL_BINARY = process.env.TIDAL_DL_BINARY || "tidal-dl";
const PROGRESS_UPDATE_THROTTLE_MS = 2000;

const FAVORITE_TYPE_TO_URL: Record<string, string> = {
  favorite_tracks: "favorites/tracks",
  favorite_albums: "favorites/albums",
  favorite_playlists: "favorites/playlists",
  favorite_videos: "favorites/videos",
};

function normalizeTidalUrl(item: ProcessingItemType): string {
  if (item.url?.startsWith("http://") || item.url?.startsWith("https://")) {
    return item.url;
  }

  const favoriteUrl = FAVORITE_TYPE_TO_URL[item.type];
  if (favoriteUrl) {
    return favoriteUrl;
  }

  const type = item.type === "artist_videos" ? "artist" : item.type;
  const cleanUrl = item.url?.replace(/^\//, "") || "";

  if (cleanUrl.includes("/")) {
    return `https://tidal.com/browse/${cleanUrl}`;
  }

  return `https://tidal.com/browse/${type}/${cleanUrl}`;
}

function qualityToTidalDl(quality?: string): string | undefined {
  switch (quality) {
    case "low":
      return "Normal";
    case "normal":
      return "High";
    case "high":
      return "HiFi";
    case "max":
      return "Master";
    default:
      return undefined;
  }
}

export function buildTidalDlArgs(item: ProcessingItemType): string[] {
  const args: string[] = [];
  const targetPath =
    item.source === "lidarr"
      ? `${NZB_DOWNLOAD_PATH}/${item.id}`
      : `${PROCESSING_PATH}/${item.id}`;

  // Legacy tidal-dl's stable non-interactive entrypoint is `tidal-dl -l URL`.
  args.push("-l", normalizeTidalUrl(item));

  const quality = qualityToTidalDl(item.quality);
  if (quality) {
    args.push("-q", quality);
  }

  args.push("-o", targetPath);

  return args;
}

export function tidalDlDownload(
  id: string,
  app: Express,
  onFinish?: () => void,
) {
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);

  if (!item) {
    console.error(`tidalDlDownload: Item with id ${id} not found in processing list`);
    if (onFinish) onFinish();
    return;
  }

  logs(item.id, "---------------------");
  logs(item.id, "🎵 TIDAL-DL PROCESSING");
  logs(item.id, "---------------------");

  const args = buildTidalDlArgs(item);
  logs(item.id, `🕖 [TIDAL-DL] Executing: ${TIDAL_DL_BINARY} ${args.join(" ")}`);
  logs(item.id, "\r\n");

  const child = spawn(TIDAL_DL_BINARY, args, {
    env: {
      ...process.env,
      FORCE_COLOR: "1",
      TERM: "xterm-256color",
    },
  });

  child.stdout?.setEncoding("utf8");
  child.stderr?.setEncoding("utf8");

  let hasProcessingError = false;
  let lastProgressUpdate = 0;

  child.stdout?.on("data", (data: string) => {
    const cleanedLine = extractFirstLineClean(data);
    if (cleanedLine) {
      logs(item.id, cleanedLine, { replaceLast: true, skipConsole: true });
    }

    const progressMatch = data.match(/(\d{1,3})%/);
    const now = Date.now();
    if (progressMatch && now - lastProgressUpdate > PROGRESS_UPDATE_THROTTLE_MS) {
      lastProgressUpdate = now;
      item.progress = {
        current: parseInt(progressMatch[1], 10),
        total: 100,
      };
      app.locals.processingStack.actions.updateItem(item);
    }
  });

  child.stderr?.on("data", (data: string) => {
    logs(item.id, `❌ [TIDAL-DL]: ${data}`);
    hasProcessingError = true;
  });

  child.on("close", async (code) => {
    if (!hasProcessingError && code === 0) {
      logs(item.id, `✅ [TIDAL-DL] Download succeed (code: ${code})`);
    } else {
      logs(item.id, `❌ [TIDAL-DL] Process exited with code ${code})`);
      hasProcessingError = true;
    }

    item["status"] = hasProcessingError ? "error" : item["status"];
    item["loading"] = false;
    app.locals.processingStack.actions.updateItem(item);

    if (onFinish) onFinish();
  });

  child.on("error", (err) => {
    logs(item.id, `❌ [TIDAL-DL] Error: ${err.message}`);
    item["status"] = "error";
    item["loading"] = false;
    app.locals.processingStack.actions.updateItem(item);
    if (onFinish) onFinish();
  });

  return child;
}
