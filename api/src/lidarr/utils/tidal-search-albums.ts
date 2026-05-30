import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { fetchTidalWithRefresh } from "../../helpers/fetch-tidal";
import { TidalAlbum, TidalSearchResponse } from "../../types";

import { getAlbumArtist, mapQualityToTiddl } from "./lidarr";
import {
  type LidarrTidalSearchContext,
  searchTidalAlbumsWithFallbacks,
} from "./lidarr-search";

class TidalSearchRequestError extends Error {}

const DEFAULT_LIDARR_TIDAL_SEARCH_LIMIT = 20;
const MAX_LIDARR_TIDAL_SEARCH_LIMIT = 100;

export function resolveLidarrTidalSearchLimit(value?: string): number {
  const normalizedValue = value?.trim();

  if (!normalizedValue || !/^[+-]?\d+$/.test(normalizedValue)) {
    return DEFAULT_LIDARR_TIDAL_SEARCH_LIMIT;
  }

  const parsedValue = Number(normalizedValue);

  if (parsedValue < 0) {
    return DEFAULT_LIDARR_TIDAL_SEARCH_LIMIT;
  }

  if (parsedValue === 0) {
    return MAX_LIDARR_TIDAL_SEARCH_LIMIT;
  }

  return Math.min(parsedValue, MAX_LIDARR_TIDAL_SEARCH_LIMIT);
}

/**
 * Searches Tidal for albums (for indexer search results)
 * @param query - Search query string
 * @returns Array of Tidal albums matching the query
 */
export async function searchTidalForLidarr(
  query: string,
  context: LidarrTidalSearchContext = {},
): Promise<TidalAlbum[]> {
  const app = getAppInstance();
  try {
    if (!app.locals.tiddlConfig?.auth?.token) {
      console.error("[Lidarr] Tidal authentication required");
      return [];
    }

    const countryCode = app.locals.tiddlConfig?.auth?.country_code || "US";
    const searchLimit = resolveLidarrTidalSearchLimit(
      process.env.LIDARR_TIDAL_SEARCH_LIMIT,
    );

    const fetchAlbums = async (searchQuery: string): Promise<TidalAlbum[]> => {
      const url = new URL("/v2/search", TIDAL_API_URL);
      url.searchParams.append("query", searchQuery);
      url.searchParams.append("countryCode", countryCode);
      url.searchParams.append("limit", String(searchLimit));
      url.searchParams.append("offset", "0");

      console.log(`🔎 [Lidarr] Searching album on Tidal...`);

      const response = await fetchTidalWithRefresh(url.toString());

      if (!response.ok) {
        console.error(
          `❌ [Lidarr] Tidal API error: ${response.status} ${response.statusText}`,
        );
        throw new TidalSearchRequestError();
      }

      const data: TidalSearchResponse = await response.json();
      return data?.albums?.items || [];
    };

    return await searchTidalAlbumsWithFallbacks(query, context, fetchAlbums);
  } catch (error) {
    if (!(error instanceof TidalSearchRequestError)) {
      console.error("❌ [Lidarr] Error searching Tidal:", error);
    }

    return [];
  }
}

export async function addAlbumToQueue(
  id: string,
  quality?: string | null,
): Promise<void> {
  const app = getAppInstance();
  const countryCode = app.locals.tiddlConfig?.auth?.country_code || "US";
  const albumUrl = `${TIDAL_API_URL}/v1/albums/${id}?countryCode=${countryCode}`;

  const response = await fetchTidalWithRefresh(albumUrl);

  if (response.ok) {
    const albumData = await response.json();

    const tiddlQuality = quality
      ? mapQualityToTiddl(quality)
      : app.locals.tiddlConfig?.download?.track_quality || "high";

    const processingItem = {
      id: id,
      artist: getAlbumArtist(albumData),
      title: albumData.title,
      type: "album" as const,
      status: "queue_download" as const,
      quality: tiddlQuality,
      url: `https://www.tidal.com/album/${id}`,
      loading: true,
      error: false,
      source: "lidarr" as const,
    };

    await app.locals.processingStack.actions.removeItem(processingItem.id);
    await app.locals.processingStack.actions.addItem(processingItem);

    console.log(
      `🕖 [Lidarr] "${albumData.title}" (${id}) queued → ${tiddlQuality}`,
    );
  }
}
