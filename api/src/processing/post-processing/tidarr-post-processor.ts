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
import { generateFavoriteTracksM3U } from "../utils/favorite-tracks-to-playlist";
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
    item["skipped"] = true;
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
  // An item that errored during download but still produced files (e.g. 40/50
  // tracks of an album) goes through the same pipeline to rescue what was
  // downloaded, but keeps its "error" status at the end instead of "finished".
  // Status itself is "processing" at this point (set by preparePostProcessing
  // right before this call), so errorStage is what distinguishes this case —
  // captured once here since a later step (moveAndClean failing) can
  // overwrite errorStage on the item itself.
  const wasDownloadError = item["errorStage"] === "download";

  if (wasDownloadError) {
    logs(
      item.id,
      "⚠️ [TIDDL] An error occured while downloading. Rescuing any downloaded files...",
    );
  }

  // Check if there are files to process
  const shouldProceed = await shouldPostProcess(item, processingPath);
  if (!shouldProceed) {
    // No files at all — restore the error status shouldPostProcess overwrote
    // with "finished" (that default only makes sense for the non-error path).
    if (wasDownloadError) {
      item["status"] = "error";
      item["skipped"] = false;
    }
    onComplete();
    return;
  }

  // Update m3u item path (playlist/mix only — favorite_tracks M3U is written directly to library after move)
  await replacePathInM3U(item);

  // Beets process
  await beets(item.id);

  // Apply ReplayGain tags
  await applyReplayGain(item.id, `${PROCESSING_PATH}/${item.id}`);

  // Set permissions
  await setPermissions(item);

  // Execute custom script after tagging, before files are moved to the library
  await executeCustomScript(item);

  // Keep trace of folders processed
  const foldersToScan = await getFolderToScan(item.id);

  // Move to output folder
  const { status: moveStatus } = await moveAndClean(item.id);

  if (moveStatus === "error") {
    item["status"] = "error";
    // Keep "download" as the errorStage if this was already a rescued
    // partial download — the download itself is still the root cause, a
    // fresh download retry (not just a post-processing retry) is needed.
    if (!wasDownloadError) {
      item["errorStage"] = "post_processing";
    }
    onComplete();
    return;
  }

  // Clean up temporary playlist if needed (mix only)
  const playlistId = (item as ProcessingItemWithPlaylist).playlistId;
  if (playlistId) {
    deletePlaylist(playlistId, item.id);
  }

  // Generate M3U for favorite_tracks directly in library (fetches full list from Tidal in date-added order)
  await generateFavoriteTracksM3U(item);

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

  logs(item.id, "---------------------");
  if (wasDownloadError) {
    // Rescued a partial download — files are in the library, but the item
    // stays "error" since the download itself never completed.
    logs(
      item.id,
      "✅ [TIDARR] Post processing complete (partial download rescued).",
    );
    item["status"] = "error";
    item["error"] = true;
  } else {
    logs(item.id, "✅ [TIDARR] Post processing complete.");
    item["status"] = "finished";
  }

  // Trigger completion callback
  onComplete();
}
