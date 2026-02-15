import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { PROCESSING_PATH } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { ProcessingItemType } from "../../types";

import { logs } from "./logs";

const execAsync = promisify(exec);

const AUDIO_EXTENSIONS = [".flac", ".m4a", ".mp3", ".ogg"];

/**
 * Generates an M3U playlist file for favorite_tracks downloads.
 * Scans the processing folder for audio files and creates a playlist
 * in the playlist template root directory.
 */
export async function generateFavoriteTracksM3U(
  item: ProcessingItemType,
): Promise<void> {
  if (item.type !== "favorite_tracks") return;

  const app = getAppInstance();
  const processingPath = `${PROCESSING_PATH}/${item.id}`;
  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";

  logs(item.id, "🕖 [TIDARR] Generating M3U for favorite tracks ...");

  try {
    // Find all audio files recursively
    const { stdout } = await execAsync(
      `find "${processingPath}" -type f \\( ${AUDIO_EXTENSIONS.map((ext) => `-name "*${ext}"`).join(" -o ")} \\)`,
      { encoding: "utf-8", shell: "/bin/sh" },
    );

    const audioFiles = stdout
      .trim()
      .split("\n")
      .filter((f: string) => f);

    if (audioFiles.length === 0) {
      logs(item.id, "⚠️ [TIDARR] No audio files found for M3U generation");
      return;
    }

    const m3uTemplate = app.locals.tiddlConfig?.m3u?.templates?.playlist;
    const m3uRelativePath = m3uTemplate.replaceAll(
      "{playlist.title}",
      "Favorite tracks",
    );
    const m3uFilePath = path.join(processingPath, m3uRelativePath + ".m3u");
    const m3uDir = path.dirname(m3uFilePath);

    fs.mkdirSync(m3uDir, { recursive: true });

    // Build M3U content with relative paths from the M3U file location
    const m3uLines = ["#EXTM3U"];

    for (const audioFile of audioFiles) {
      const relativePath = path.relative(m3uDir, audioFile);
      m3uLines.push(`${basePath}/${relativePath}`);
    }

    fs.writeFileSync(m3uFilePath, m3uLines.join("\n") + "\n", "utf-8");

    const m3uRelativeDisplay = path.relative(processingPath, m3uFilePath);
    logs(
      item.id,
      `✅ [TIDARR] M3U generated with ${audioFiles.length} track(s): ${m3uRelativeDisplay}`,
    );
  } catch (e) {
    logs(
      item.id,
      `❌ [TIDARR] Error generating favorite tracks M3U: ${(e as Error).message}`,
    );
  }
}
