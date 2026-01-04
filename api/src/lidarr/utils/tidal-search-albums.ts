import { Express } from "express";

import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { TidalAlbum, TidalSearchResponse } from "../../types";

import { getAlbumArtist } from "./lidarr";

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
    const tiddlConfig = app.locals.tiddlConfig;

    if (!tiddlConfig?.auth?.token) {
      console.error("[Lidarr] Tidal authentication required");
      return [];
    }

    const countryCode = tiddlConfig?.auth?.country_code || "US";
    const token = tiddlConfig?.auth?.token;

    // Build search URL
    const url = new URL("/v1/search", TIDAL_API_URL);
    url.searchParams.append("query", query);
    url.searchParams.append("countryCode", countryCode);
    url.searchParams.append("limit", "50"); // Increased from 10 to improve self-titled album matching
    url.searchParams.append("offset", "0");

    console.log(`🔎 [Lidarr] Searching album on Tidal...`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

export async function addAlbumToQueue(id: string): Promise<void> {
  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;
  const countryCode = tiddlConfig?.auth?.country_code || "US";
  const albumUrl = `${process.env.TIDAL_API_URL || "https://api.tidal.com"}/v1/albums/${id}?countryCode=${countryCode}`;

  const response = await fetch(albumUrl, {
    headers: {
      Authorization: `Bearer ${tiddlConfig?.auth?.token}`,
    },
  });

  if (response.ok) {
    const albumData = await response.json();
    const processingItem = {
      id: id,
      artist: getAlbumArtist(albumData),
      title: albumData.title,
      type: "album" as const,
      status: "queue" as const,
      quality: app.locals.tiddlConfig?.download?.track_quality || "high",
      url: `album/${id}`,
      loading: true,
      error: false,
    };

    await app.locals.processingStack.actions.removeItem(processingItem.id);
    await app.locals.processingStack.actions.addItem(processingItem);

    console.log(
      `🕖 [Lidarr] Album "${albumData.title}" (${id}) added to queue`,
    );
  }
}
