import { getAppInstance } from "../../helpers/app-instance";
import { ProcessingItemType } from "../../types";

import { logs } from "./logs";

/**
 * Retrieves all unique album IDs from a playlist and adds them to the download queue.
 * Only processes if PLAYLIST_ALBUMS environment variable is set to "true".
 *
 * @param itemId - The playlist item ID to process
 * @returns Promise that resolves when all albums have been added to queue
 */
export async function getPlaylistAlbums(itemId: string): Promise<void> {
  const app = getAppInstance();

  // Check if feature is enabled
  if (process.env.PLAYLIST_ALBUMS !== "true") {
    return;
  }

  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(itemId);

  if (!item || (item.type !== "playlist" && item.type !== "mix")) {
    return;
  }

  const tiddlConfig = app.locals.tiddlConfig;

  try {
    // Extract playlist ID from URL (format: "playlist/123456")
    const playlistId = item.url.split("/").pop();
    if (!playlistId) {
      throw new Error("⚠️ [PLAYLIST_ALBUMS] Invalid playlist URL format");
    }

    logs(itemId, "🕖 [PLAYLIST_ALBUMS] Fetching playlist tracks...");

    // Fetch playlist items from Tidal API
    const url = `https://api.tidal.com/v1/playlists/${playlistId}/items?countryCode=${tiddlConfig.auth.country_code}&limit=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tiddlConfig.auth.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `❌ [PLAYLIST_ALBUMS] Failed to fetch playlist: ${response.status}`,
      );
    }

    const data = await response.json();

    // Extract unique album IDs from tracks with artist and title info
    const albumsMap = new Map<number, { artist: string; title: string }>();
    let trackCount = 0;

    if (data.items && Array.isArray(data.items)) {
      for (const playlistItem of data.items) {
        if (playlistItem.item?.album?.id) {
          const albumId = playlistItem.item.album.id;
          const artist = playlistItem.item.artist?.name || "";
          const albumTitle = playlistItem.item.album.title || "";

          // Only add if not already in the map (keep first occurrence)
          if (!albumsMap.has(albumId)) {
            albumsMap.set(albumId, { artist, title: albumTitle });
          }
          trackCount++;
        }
      }
    }

    logs(
      itemId,
      `📊 [PLAYLIST_ALBUMS] Found ${trackCount} tracks with ${albumsMap.size} unique albums`,
    );

    // Add each unique album to the queue
    if (albumsMap.size > 0) {
      for (const [albumId, albumInfo] of albumsMap.entries()) {
        const newItem: ProcessingItemType = {
          id: `album-${albumId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          url: `album/${albumId}`,
          type: "album",
          status: "queue_download",
          loading: false,
          artist: albumInfo.artist,
          title: albumInfo.title,
          quality: item.quality,
          error: false,
          source: "tidarr",
        };

        await app.locals.processingStack.actions.addItem(newItem);
      }

      logs(
        itemId,
        `✅ [PLAYLIST_ALBUMS] Successfully added ${albumsMap.size} albums to queue`,
      );
    } else {
      logs(itemId, "⚠️ [PLAYLIST_ALBUMS] No albums found in playlist");
    }
  } catch (error) {
    logs(
      itemId,
      `❌ [PLAYLIST_ALBUMS] Error fetching playlist albums: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
