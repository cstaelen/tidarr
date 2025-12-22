import { Express } from "express";

import { TIDAL_API_URL } from "../../constants";
import { TidalAlbum, TidalSearchResponse } from "../types";

import { getAlbumArtist } from "./lidarr-utils";

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
    url.searchParams.append("limit", "10");
    url.searchParams.append("offset", "0");

    console.log(`[Lidarr] Searching album on Tidal...`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[Lidarr] Tidal API error: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data: TidalSearchResponse = await response.json();
    const albums = data?.albums?.items || [];
    console.log(`[Lidarr] Found ${albums.length} results from Tidal`);

    return albums;
  } catch (error) {
    console.error("[Lidarr] Error searching Tidal:", error);
    return [];
  }
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  if (norm1 === norm2) return 1;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

  const words1 = norm1.split(" ");
  const words2 = norm2.split(" ");
  const commonWords = words1.filter((word) => words2.includes(word));

  return commonWords.length / Math.max(words1.length, words2.length);
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

  const normalizedQuery = normalizeString(query);
  console.log(
    `[Lidarr] Matching ${albums.length} albums against query: "${query}" (normalized: "${normalizedQuery}")`,
  );

  const scoredAlbums = albums.map((album) => {
    const albumArtist = getAlbumArtist(album);
    const normalizedArtist = normalizeString(albumArtist);
    const normalizedTitle = normalizeString(album.title);

    // Calculate remaining characters after removing artist and album name from query
    let remainingQuery = normalizedQuery;
    remainingQuery = remainingQuery.replace(normalizedArtist, "");
    remainingQuery = remainingQuery.replace(normalizedTitle, "");
    remainingQuery = remainingQuery.trim().replace(/\s+/g, " ");

    const remainingChars = remainingQuery.length;

    // Penalty factor based on remaining characters (0 chars = no penalty, more chars = higher penalty)
    const penalty =
      remainingChars > 0 ? Math.min(0.5, remainingChars * 0.05) : 0;

    console.log(
      `[Lidarr]   Album: "${album.title}" by "${albumArtist}" | Remaining: "${remainingQuery}" (${remainingChars} chars) | Penalty: ${penalty}`,
    );

    // Check if both artist and album title are present in the query
    // For title, check both ways: query contains title OR title contains query
    const artistInQuery = normalizedQuery.includes(normalizedArtist);
    const titleInQuery =
      normalizedQuery.includes(normalizedTitle) ||
      normalizedTitle.includes(
        normalizedQuery.replace(normalizedArtist, "").trim(),
      );

    // If both are in query, give high score with penalty for remaining chars
    if (artistInQuery && titleInQuery) {
      const score = 1.0 - penalty;
      console.log(`[Lidarr]     → Both found | Score: ${score.toFixed(2)}`);
      return { album, score };
    }

    // If only one is in query, give medium score based on which one
    if (artistInQuery) {
      const titleSimilarity = calculateSimilarity(
        normalizedTitle,
        normalizedQuery,
      );
      const score = 0.5 + titleSimilarity * 0.3 - penalty;
      console.log(
        `[Lidarr]     → Artist found, title similarity: ${titleSimilarity.toFixed(2)} | Score: ${score.toFixed(2)}`,
      );
      return { album, score };
    }

    if (titleInQuery) {
      const artistSimilarity = calculateSimilarity(
        normalizedArtist,
        normalizedQuery,
      );
      const score = 0.5 + artistSimilarity * 0.3 - penalty;
      console.log(
        `[Lidarr]     → Title found, artist similarity: ${artistSimilarity.toFixed(2)} | Score: ${score.toFixed(2)}`,
      );
      return { album, score };
    }

    // Otherwise, calculate similarity scores
    const artistSimilarity = calculateSimilarity(
      normalizedArtist,
      normalizedQuery,
    );
    const titleSimilarity = calculateSimilarity(
      normalizedTitle,
      normalizedQuery,
    );
    const score = Math.max(artistSimilarity, titleSimilarity) * 0.6 - penalty;
    console.log(
      `[Lidarr]     → Similarity only (artist: ${artistSimilarity.toFixed(2)}, title: ${titleSimilarity.toFixed(2)}) | Score: ${score.toFixed(2)}`,
    );

    return { album, score };
  });

  console.log(
    `[Lidarr] After scoring: ${scoredAlbums.filter((item) => item.score >= 0.5).length}/${scoredAlbums.length} albums passed threshold (≥0.5)`,
  );

  const filtered = scoredAlbums.filter((item) => item.score >= 0.5);

  // Sort by score (highest first)
  filtered.sort((a, b) => b.score - a.score);

  return [filtered[0].album];
}

export async function addAlbumToQueue(
  app: Express,
  albumData: TidalAlbum,
  albumId: string,
): Promise<void> {
  const processingItem = {
    id: `lidarr-${albumId}-${Date.now()}`,
    artist: getAlbumArtist(albumData),
    title: albumData.title,
    type: "album" as const,
    status: "queue" as const,
    quality: app.locals.tiddlConfig?.download?.track_quality || "max",
    url: `album/${albumId}`,
    loading: true,
    error: false,
  };

  await app.locals.processingStack.actions.removeItem(processingItem.id);
  await app.locals.processingStack.actions.addItem(processingItem);

  console.log(
    `[Lidarr] Album "${albumData.title}" (${albumId}) added to queue`,
  );
}
