import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

import { PROCESSING_PATH } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { ProcessingItemType } from "../../types";

import { logs } from "./logs";

const AUDIO_EXTENSIONS = [".flac", ".m4a", ".mp3", ".aac", ".ogg", ".opus"];

/**
 * Generates an M3U playlist file for favorite_tracks downloads.
 * Uses the playlist template from tiddl config (m3u.templates.playlist) to determine the output path.
 * Falls back to "Playlists/{title}" if no template is configured.
 * @param item - The processing item (favorite_tracks type)
 */
export async function generateFavoriteTracksM3U(
  item: ProcessingItemType,
): Promise<void> {
  if (item.type !== "favorite_tracks") return;

  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;

  if (!tiddlConfig?.m3u?.save) return;

  const processingDir = `${PROCESSING_PATH}/${item.id}`;
  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";

  logs(item.id, `🕖 [FAV] Generating M3U playlist...`);

  try {
    // Find all audio files recursively
    const { stdout } = await execAsync(
      `find "${processingDir}" -type f 2>/dev/null || true`,
      { encoding: "utf-8", shell: "/bin/sh" },
    );

    const audioFiles = stdout
      .trim()
      .split("\n")
      .filter(
        (f) => f && AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()),
      )
      .sort();

    if (audioFiles.length === 0) {
      logs(item.id, `⚠️ [FAV] No audio files found for M3U generation`);
      return;
    }

    // Build M3U content with paths relative to basePath
    const lines = ["#EXTM3U"];
    for (const file of audioFiles) {
      const relativePath = file.replace(`${processingDir}/`, `${basePath}/`);
      lines.push(relativePath);
    }
    const m3uContent = lines.join("\n") + "\n";

    // Resolve M3U output path from tiddl config template
    const playlistTemplate =
      tiddlConfig?.m3u?.templates?.playlist || `Playlists/{playlist.title}`;
    const playlistName = item.title || "Favorite Tracks";
    const resolvedTemplate = playlistTemplate.replace(
      /\{playlist\.title\}/g,
      playlistName,
    );
    const m3uFilePath = path.join(processingDir, `${resolvedTemplate}.m3u`);

    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(m3uFilePath), { recursive: true });
    fs.writeFileSync(m3uFilePath, m3uContent, "utf-8");

    logs(
      item.id,
      `✅ [FAV] M3U generated: ${resolvedTemplate}.m3u (${audioFiles.length} tracks)`,
    );
  } catch (e) {
    logs(item.id, `❌ [FAV] Error generating M3U: ${(e as Error).message}`);
  }
}
