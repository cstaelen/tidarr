import { Express } from "express";

import { TIDAL_API_URL } from "../../constants";
import { TidalAlbum, TidalSearchResponse } from "../types";

import { getAlbumArtist } from "./lidarr-utils";
import { getAlbumScoring } from "./scoring-album";

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
    const albums = data?.albums?.items || [];
    console.log(
      `✅ [Lidarr] Found ${albums.length} results from Tidal : ${query}`,
    );

    return albums;
  } catch (error) {
    console.error("❌ [Lidarr] Error searching Tidal:", error);
    return [];
  }
}

/**
 * Match albums against search criteria
 * @param albums - Array of albums to filter
 * @param query - Complete query string that may contain "artist - album" format
 */
export function matchTidalAlbums(
  albums: TidalAlbum[],
  query: string,
): TidalAlbum[] {
  if (!albums?.length) return [];

  console.log(
    `[Lidarr] Matching ${albums.length} albums against query: "${query}"`,
  );

  const scoredAlbums = albums.map((album) => {
    return getAlbumScoring(album, query);
  });

  console.log(
    `[Lidarr] After scoring: ${scoredAlbums.filter((item) => item.score >= 0.5).length}/${scoredAlbums.length} albums passed threshold (≥0.5)`,
  );

  const filtered = scoredAlbums.filter((item) => item.score >= 0.5);

  // Sort by score (highest first)
  if (filtered?.length > 0) {
    filtered.sort((a, b) => b.score - a.score);
    // return [filtered[0].album];
    return filtered.slice(0, 10).map((item) => item.album);
  }

  return [];
}

export async function addAlbumToQueue(
  app: Express,
  albumData: TidalAlbum,
  albumId: string,
): Promise<void> {
  const processingItem = {
    id: albumId,
    artist: getAlbumArtist(albumData),
    title: albumData.title,
    type: "album" as const,
    status: "queue" as const,
    quality: app.locals.tiddlConfig?.download?.track_quality || "high",
    url: `album/${albumId}`,
    loading: true,
    error: false,
  };

  await app.locals.processingStack.actions.removeItem(processingItem.id);
  await app.locals.processingStack.actions.addItem(processingItem);

  console.log(
    `🕖 [Lidarr] Album "${albumData.title}" (${albumId}) added to queue`,
  );
}
