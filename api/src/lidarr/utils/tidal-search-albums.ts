import { Express } from "express";

import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { refreshTokenOnce } from "../../helpers/refresh-token";
import { TidalAlbum, TidalSearchResponse } from "../../types";

import { getAlbumArtist, mapQualityToTiddl } from "./lidarr";

/**
 * Fetch Tidal API with automatic token refresh on 401
 */
async function fetchTidalWithRefresh(
  url: string,
  app: Express,
): Promise<globalThis.Response> {
  const token = app.locals.tiddlConfig?.auth?.token;

  const makeRequest = (authToken: string) =>
    fetch(url, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

  let response = await makeRequest(token);

  if (response.status === 401) {
    console.log("🔑 [Lidarr] Got 401, refreshing token...");
    await refreshTokenOnce(app);
    const newToken = app.locals.tiddlConfig?.auth?.token;
    if (newToken && newToken !== token) {
      response = await makeRequest(newToken);
    }
  }

  return response;
}

/**
 * Searches Tidal for albums (for indexer search results)
 * @param query - Search query string
 * @param app - Express app instance (for tiddlConfig)
 * @returns Array of Tidal albums matching the query
 */
export async function searchTidalForLidarr(
  query: string,
  app: Express,
): Promise<TidalAlbum[]> {
  try {
    if (!app.locals.tiddlConfig?.auth?.token) {
      console.error("[Lidarr] Tidal authentication required");
      return [];
    }

    const countryCode = app.locals.tiddlConfig?.auth?.country_code || "US";

    const url = new URL("/v2/search", TIDAL_API_URL);
    url.searchParams.append("query", query);
    url.searchParams.append("countryCode", countryCode);
    url.searchParams.append("limit", "20");
    url.searchParams.append("offset", "0");

    console.log(`🔎 [Lidarr] Searching album on Tidal...`);

    const response = await fetchTidalWithRefresh(url.toString(), app);

    if (!response.ok) {
      console.error(
        `❌ [Lidarr] Tidal API error: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data: TidalSearchResponse = await response.json();
    return data?.albums?.items || [];
  } catch (error) {
    console.error("❌ [Lidarr] Error searching Tidal:", error);
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

  const response = await fetchTidalWithRefresh(albumUrl, app);

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
      url: `album/${id}`,
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
