import { Express } from "express";

import { tidalDL } from "../../services/tiddl";
import { ProcessingItemType, ProcessingItemWithPlaylist } from "../../types";
import { getFavoriteTrackIds } from "../utils/favorite-tracks-to-playlist";
import { logs } from "../utils/logs";
import {
  addTracksToPlaylist,
  createNewPlaylist,
  deletePlaylist,
  getTracksByMixId,
} from "../utils/mix-to-playlist";

const TRACKS_BATCH_SIZE = 50;

/**
 * Prepares a mix for download by converting it to a Tidal playlist
 * @param item - The processing item with type "mix"
 * @returns The playlist ID or undefined if failed
 */
async function prepareMixToPlaylist(
  item: ProcessingItemType,
): Promise<string | undefined> {
  const tracks = await getTracksByMixId(item);
  const playlistId = await createNewPlaylist(item);

  if (tracks) {
    await addTracksToPlaylist(playlistId, tracks, item.id);
    return playlistId;
  }

  logs(item.id, `⚠️ [MIX]: No track found.`);
  item["status"] = "error";
  item["loading"] = false;
  if (playlistId) {
    deletePlaylist(playlistId, item.id);
  }
  return undefined;
}

/**
 * Prepares favorite tracks for download by converting them to a temporary Tidal playlist.
 * This allows tiddl to generate a complete M3U covering all tracks (including existing ones).
 * @param item - The processing item with type "favorite_tracks"
 * @returns The playlist ID or undefined if failed
 */
async function prepareFavoriteTracksToPlaylist(
  item: ProcessingItemType,
): Promise<string | undefined> {
  const trackIds = await getFavoriteTrackIds(item);

  if (trackIds.length === 0) {
    logs(item.id, `⚠️ [FAV]: No favorite tracks found.`);
    item["status"] = "error";
    item["loading"] = false;
    return undefined;
  }

  const playlistId = await createNewPlaylist(item);

  if (!playlistId) {
    logs(item.id, `❌ [FAV]: Failed to create temporary playlist.`);
    item["status"] = "error";
    item["loading"] = false;
    return undefined;
  }

  // Add tracks in batches to avoid Tidal API limits
  try {
    for (let i = 0; i < trackIds.length; i += TRACKS_BATCH_SIZE) {
      const batch = trackIds.slice(i, i + TRACKS_BATCH_SIZE);
      await addTracksToPlaylist(playlistId, batch, item.id);
    }
  } catch {
    logs(item.id, `❌ [FAV]: Failed to add tracks, cleaning up playlist.`);
    deletePlaylist(playlistId, item.id);
    item["status"] = "error";
    item["loading"] = false;
    return undefined;
  }

  return playlistId;
}

/**
 * Handles the download process for an item
 * @param item - The processing item to download
 * @param app - Express app instance
 * @param onComplete - Callback when download completes
 * @returns The child process or undefined
 */
export async function handleDownload(
  item: ProcessingItemType,
  app: Express,
  onComplete: (playlistId?: string) => void,
) {
  let playlistId: string | undefined;

  // Handle mix type: convert to playlist first
  if (item.type === "mix") {
    playlistId = await prepareMixToPlaylist(item);
    if (!playlistId) {
      // Error occurred, update status
      app.locals.processingStack.actions.updateItem(item);
      return;
    }
    item["url"] = `playlist/${playlistId}`;
  }

  // Handle favorite_tracks type: convert to temporary playlist so tiddl generates a complete M3U
  if (item.type === "favorite_tracks") {
    playlistId = await prepareFavoriteTracksToPlaylist(item);
    if (!playlistId) {
      // Error occurred, update status
      app.locals.processingStack.actions.updateItem(item);
      return;
    }
    item["url"] = `playlist/${playlistId}`;
    // Store early so removeItem/pauseQueue can clean it up if interrupted
    (item as ProcessingItemWithPlaylist).playlistId = playlistId;
  }

  // Start tiddl download
  const child = tidalDL(item.id, app, async () => {
    // Download completed, invoke callback
    onComplete(playlistId);
  });

  if (child) {
    item["process"] = child;
  }

  return child;
}
