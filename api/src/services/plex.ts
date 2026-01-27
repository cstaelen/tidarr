// PLEX API
// https://www.plexopedia.com/plex-media-server/api/library/scan-partial/

import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

import { plexMonitor } from "./plex-monitor";

export async function uploadPlaylist(
  item: ProcessingItemType,
  foldersToScan: string[],
): Promise<boolean> {
  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";
  const m3uPlaylistFolder =
    foldersToScan.find((f) => f.startsWith("m3u")) ?? "";
  const sanitizedTitle = item.title.replace(/\//g, "");
  const m3uPlaylistPath = `${basePath}/${m3uPlaylistFolder}/${sanitizedTitle}.m3u`;
  const url = `${process.env.PLEX_URL}/playlists/upload/?path=${encodeURIComponent(m3uPlaylistPath)}&sectionID=${process.env.PLEX_LIBRARY}&X-Plex-Token=${process.env.PLEX_TOKEN}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (response.status === 200) {
    logs(item.id, `✅ [PLEX] Playlist imported.`);
    return true;
  } else {
    console.error(item);
    console.error(
      `❌ [PLEX] Playlist import failed for ${m3uPlaylistPath} - Status: ${response.status}`,
    );
    return false;
  }
}

export async function plexUpdate(
  item: ProcessingItemType,
  foldersToScan: string[],
) {
  try {
    if (
      process.env.PLEX_URL &&
      process.env.PLEX_TOKEN &&
      process.env.PLEX_LIBRARY
    ) {
      console.log("--------------------");
      console.log(`🔄 PLEX UPDATE     `);
      console.log("--------------------");

      console.log(`🔍 [PLEX] Send scan request ...`);

      const scannedFolders: string[] = [];
      const basePath = process.env.PLEX_PATH || "";

      // Scan each folder individually
      for (const folder of foldersToScan) {
        const folderPath = basePath ? `${basePath}/${folder}` : folder;
        const url = `${process.env.PLEX_URL}/library/sections/${process.env.PLEX_LIBRARY}/refresh?path=${encodeURIComponent(folderPath)}&X-Plex-Token=${process.env.PLEX_TOKEN}`;
        const response = await fetch(url);

        if (response.status === 200) {
          scannedFolders.push(folder);
        } else {
          console.error(
            `❌ [PLEX] Scan request failed for ${folder} - Status: ${response.status}`,
          );
        }
      }

      // Log summary at the end
      if (scannedFolders.length > 0) {
        const folderList = scannedFolders.map((f) => `  - ${f}`).join("\r\n");
        logs(
          item.id,
          `✅ [PLEX] Scan requests sent. ${scannedFolders.length} Folder(s):\r\n${folderList}`,
        );
      } else {
        logs(item.id, `⚠️ [PLEX] No folders were successfully scanned`);
      }

      if (item.type === "playlist" && scannedFolders.length > 0) {
        plexMonitor.registerPendingPlaylist(item, foldersToScan);
      } else if (item.type === "playlist") {
        await uploadPlaylist(item, foldersToScan);
      }
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [PLEX] Error during Plex update: ${(err as Error).message}`,
    );
  }
}
