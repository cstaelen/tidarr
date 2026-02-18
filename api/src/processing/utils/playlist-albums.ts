import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { ProcessingItemType, TiddlConfig } from "../../types";

import { logs } from "./logs";

const SUPPORTED_TYPES = ["playlist", "mix", "favorite_tracks"] as const;
const TIDAL_PAGE_LIMIT = 100;

type TrackItem = {
  item?: {
    album?: { id: number; title?: string };
    artist?: { name?: string };
  };
};

/**
 * Fetches all tracks from Tidal API with pagination (max 100 per page).
 */
async function fetchAllTracks(
  item: ProcessingItemType,
  tiddlConfig: TiddlConfig,
): Promise<TrackItem[]> {
  const headers = { Authorization: `Bearer ${tiddlConfig.auth.token}` };
  const country = tiddlConfig.auth.country_code;

  const baseUrl = buildBaseUrl(item, tiddlConfig, country);
  const allItems: TrackItem[] = [];
  let offset = 0;
  let totalItems = Infinity;

  while (offset < totalItems) {
    const url = `${baseUrl}&limit=${TIDAL_PAGE_LIMIT}&offset=${offset}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch tracks: ${response.status} - ${body}`);
    }

    const data = await response.json();
    totalItems = data.totalNumberOfItems ?? data.items?.length ?? 0;

    if (data.items) {
      allItems.push(...data.items);
    }

    offset += TIDAL_PAGE_LIMIT;
  }

  return allItems;
}

function buildBaseUrl(
  item: ProcessingItemType,
  tiddlConfig: TiddlConfig,
  country: string,
): string {
  if (item.type === "favorite_tracks") {
    const userId = tiddlConfig.auth.user_id;
    return `${TIDAL_API_URL}/v1/users/${userId}/favorites/tracks?countryCode=${country}`;
  }

  const playlistId = item.url.split("/").pop();
  if (!playlistId) {
    throw new Error("Invalid playlist URL format");
  }
  return `${TIDAL_API_URL}/v1/playlists/${playlistId}/items?countryCode=${country}`;
}

/**
 * Extracts unique album IDs from track items.
 */
function extractAlbums(
  items: TrackItem[],
): Map<number, { artist: string; title: string }> {
  const albumsMap = new Map<number, { artist: string; title: string }>();

  for (const trackItem of items) {
    if (trackItem.item?.album?.id) {
      const albumId = trackItem.item.album.id;
      if (!albumsMap.has(albumId)) {
        albumsMap.set(albumId, {
          artist: trackItem.item.artist?.name || "",
          title: trackItem.item.album.title || "",
        });
      }
    }
  }

  return albumsMap;
}

/**
 * Retrieves all unique album IDs from a playlist or favorite tracks and adds them to the download queue.
 * Only processes if PLAYLIST_ALBUMS environment variable is set to "true".
 *
 * @param itemId - The playlist item ID to process
 * @returns Promise that resolves when all albums have been added to queue
 */
export async function getPlaylistAlbums(itemId: string): Promise<void> {
  const app = getAppInstance();

  if (process.env.PLAYLIST_ALBUMS !== "true") {
    return;
  }

  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(itemId);

  if (
    !item ||
    !SUPPORTED_TYPES.includes(item.type as (typeof SUPPORTED_TYPES)[number])
  ) {
    return;
  }

  const tiddlConfig = app.locals.tiddlConfig;
  const label =
    item.type === "favorite_tracks" ? "favorite tracks" : "playlist";

  try {
    logs(itemId, `🕖 [PLAYLIST_ALBUMS] Fetching ${label} tracks...`);

    const items = await fetchAllTracks(item, tiddlConfig);
    const albumsMap = items.length > 0 ? extractAlbums(items) : new Map();

    logs(
      itemId,
      `📊 [PLAYLIST_ALBUMS] Found ${albumsMap.size} unique albums from ${label}`,
    );

    if (albumsMap.size > 0) {
      for (const [albumId, albumInfo] of albumsMap.entries()) {
        const newItem: ProcessingItemType = {
          id: albumId,
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
      logs(itemId, `⚠️ [PLAYLIST_ALBUMS] No albums found in ${label}`);
    }
  } catch (error) {
    logs(
      itemId,
      `❌ [PLAYLIST_ALBUMS] Error fetching ${label} albums: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
