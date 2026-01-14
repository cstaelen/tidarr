import { Express } from "express";

import { tidalDL } from "../../services/tiddl";
import { ProcessingItemType } from "../../types";
import { logs } from "../utils/logs";

import {
  addTracksToPlaylist,
  createNewPlaylist,
  deletePlaylist,
  getTracksByMixId,
} from "./mix-to-playlist";

/**
 * Prepares a mix for download by converting it to a Tidal playlist
 * @param item - The processing item with type "mix"
 * @returns The playlist ID or undefined if failed
 */
export async function prepareMixToPlaylist(
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
