import { PROCESSING_PATH } from "../../../constants";
import { appriseApiPush } from "../../services/apprise-api";
import { beets } from "../../services/beets";
import {
  executeCustomScript,
  executePostScript,
} from "../../services/custom-scripts";
import { gotifyPush } from "../../services/gotify";
import { jellyfinUpdate } from "../../services/jellyfin";
import { navidromeUpdate } from "../../services/navidrome";
import { ntfyPush } from "../../services/ntfy";
import { plexUpdate } from "../../services/plex";
import { hookPushOver } from "../../services/pushover";
import { applyReplayGain } from "../../services/rsgain";
import { ProcessingItemType, ProcessingItemWithPlaylist } from "../../types";
import { generateFavoriteTracksM3U } from "../utils/generate-m3u";
import {
  getFolderToScan,
  hasFileToMove,
  moveAndClean,
  replacePathInM3U,
  setPermissions,
} from "../utils/jobs";
import { logs } from "../utils/logs";
import { deletePlaylist } from "../utils/mix-to-playlist";
import { getPlaylistAlbums } from "../utils/playlist-albums";

/**
 * Checks if an item should proceed with post-processing
 * @param item - The processing item
 * @param processingPath - The path to check for files
 * @returns true if post-processing should proceed
 */
async function shouldPostProcess(
  item: ProcessingItemType,
  processingPath: string,
): Promise<boolean> {
  const hasFile = await hasFileToMove(processingPath);

  if (!hasFile) {
    item["status"] = "finished";
    logs(item.id, "⚠️ [TIDARR] No file to process.");
    return false;
  }

  return true;
}

/**
 * Performs Tidarr post-processing for downloaded items
 * @param item - The processing item
 * @param onComplete - Callback when post-processing completes
 */
export async function postProcessTidarr(
  item: ProcessingItemType,
  onComplete: () => void,
) {
  logs(item.id, "---------------------");
  logs(item.id, "⚙️ POST PROCESSING   ");
  logs(item.id, "---------------------");

  const processingPath = `${PROCESSING_PATH}/${item.id}`;

  // Check for errors
  if (item["status"] === "error") {
    logs(item.id, "⚠️ [TIDDL] An error occured while downloading.");
    onComplete();
    return;
  }

  // Check if there are files to process
  const shouldProceed = await shouldPostProcess(item, processingPath);
  if (!shouldProceed) {
    onComplete();
    return;
  }

  // Execute custom script if exists
  await executeCustomScript(item);

  // Generate M3U for favorite tracks
  await generateFavoriteTracksM3U(item);

  // Update m3u item path
  await replacePathInM3U(item);

  // Beets process
  await beets(item.id);

  // Apply ReplayGain tags
  await applyReplayGain(item.id, `${PROCESSING_PATH}/${item.id}`);

  // Set permissions
  await setPermissions(item);

  // Keep trace of folders processed
  const foldersToScan = await getFolderToScan(item.id);

  // Move to output folder
  await moveAndClean(item.id);

  // Clean up mix playlist if needed
  const playlistId = (item as ProcessingItemWithPlaylist).playlistId;
  if (playlistId) {
    deletePlaylist(playlistId, item.id);
  }

  // Execute custom post-script if exists
  await executePostScript(item, foldersToScan);

  // Plex library update with specific paths
  await plexUpdate(item, foldersToScan);

  // Jellyfin library update
  await jellyfinUpdate(item);

  // Navidrome library update
  await navidromeUpdate(item);

  // Gotify notification
  await gotifyPush(item);

  // Ntfy notification
  await ntfyPush(item);

  // Webhook push over notification
  await hookPushOver(item);

  // Apprise API notification
  await appriseApiPush(item);

  // Add playlist albums to queue if enabled
  await getPlaylistAlbums(item.id);

  // Mark as finished
  logs(item.id, "---------------------");
  logs(item.id, "✅ [TIDARR] Post processing complete.");
  item["status"] = "finished";

  // Trigger completion callback
  onComplete();
}
