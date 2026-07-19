import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { fetchTidalWithRefresh } from "../../helpers/fetch-tidal";
import { ProcessingItemType, TiddlConfig } from "../../types";

import { logs } from "./logs";

const TIDAL_PAGE_LIMIT = 100;

type FavoriteAlbumItem = {
  item: {
    id: number;
    title: string;
    artist?: { name?: string };
    artists?: Array<{ name?: string }>;
  };
};

async function fetchAllFavoriteAlbums(
  tiddlConfig: TiddlConfig,
): Promise<FavoriteAlbumItem[]> {
  const { user_id: userId, country_code: country } = tiddlConfig.auth;
  const baseUrl = `${TIDAL_API_URL}/v1/users/${userId}/favorites/albums?countryCode=${country}&order=DATE&orderDirection=DESC`;

  const allItems: FavoriteAlbumItem[] = [];
  let offset = 0;
  let totalItems = Infinity;

  while (offset < totalItems) {
    const response = await fetchTidalWithRefresh(
      `${baseUrl}&limit=${TIDAL_PAGE_LIMIT}&offset=${offset}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch favorite albums: ${response.status} - ${await response.text()}`,
      );
    }
    const data = await response.json();
    totalItems = data.totalNumberOfItems ?? data.items?.length ?? 0;
    if (data.items) allItems.push(...data.items);
    offset += TIDAL_PAGE_LIMIT;
  }

  return allItems;
}

/**
 * Fetches all favorite albums and adds them individually to the download queue,
 * instead of a single "favorite_albums" job covering the whole collection.
 */
export async function getFavoriteAlbums(
  item: ProcessingItemType,
): Promise<void> {
  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;

  try {
    logs(item.id, `🕖 [FAV] Fetching favorite albums...`);

    const favoriteAlbums = await fetchAllFavoriteAlbums(tiddlConfig);

    logs(item.id, `📊 [FAV] Found ${favoriteAlbums.length} favorite albums`);

    const newItems: ProcessingItemType[] = favoriteAlbums
      .filter(({ item: album }) => !!album)
      .map(({ item: album }) => ({
        id: String(album.id),
        url: `album/${album.id}`,
        type: "album",
        status: "queue_download",
        loading: false,
        artist: album.artists?.[0]?.name || album.artist?.name || "",
        title: album.title,
        quality: item.quality,
        error: false,
        source: "tidarr",
      }));

    await app.locals.processingStack.actions.addItems(newItems, true);

    logs(item.id, `✅ [FAV] Added ${newItems.length} albums to queue`);
  } catch (error) {
    logs(
      item.id,
      `❌ [FAV] Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
