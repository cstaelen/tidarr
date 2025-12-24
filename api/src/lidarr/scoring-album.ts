import { TidalAlbum } from "../types";

import { getAlbumArtist } from "./lidarr-utils";

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ") // Replace special chars with space (e.g., "AC/DC" → "ac dc")
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
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

export function getAlbumScoring(
  album: TidalAlbum,
  query: string,
): {
  album: TidalAlbum;
  score: number;
} {
  const albumArtist = getAlbumArtist(album);
  const normalizedArtist = normalizeString(albumArtist);
  const normalizedTitle = normalizeString(album.title);
  const normalizedQuery = normalizeString(query);

  // Calculate similarity scores
  const artistSimilarity = calculateSimilarity(
    normalizedArtist,
    normalizedQuery,
  );
  const titleSimilarity = calculateSimilarity(normalizedTitle, normalizedQuery);

  // Check if artist/title are contained in query
  const artistInQuery = normalizedQuery.includes(normalizedArtist);
  const titleInQuery = normalizedQuery.includes(normalizedTitle);

  // Special case: Self-titled albums (e.g., "Bad Religion" by "Bad Religion")
  // If artist and title are the same, check if the term appears twice in query
  const isSelfTitled =
    normalizedArtist === normalizedTitle &&
    normalizedQuery.split(normalizedArtist).length - 1 >= 2;

  // Check if query (with or without artist) is contained in title
  // For partial matches like "For Those About to Rock" in "For Those About to Rock (We Salute You)"
  const queryWithoutArtist = normalizedQuery
    .replace(normalizedArtist, "")
    .trim()
    .replace(/\s+/g, " ");
  const queryInTitle =
    normalizedTitle.includes(normalizedQuery) ||
    normalizedTitle.includes(queryWithoutArtist);

  let score = 0;
  let reasoning = "";

  // Special case: Self-titled album with exact match
  if (isSelfTitled) {
    score = 1.0;
    reasoning = "Self-titled album - exact match";
  }
  // Best case: Both artist and title are in query
  else if (artistInQuery && titleInQuery) {
    score = 1.0;
    reasoning = "Both artist and title found in query";
  }
  // Very good case: Query is fully contained in title (means user searched for exact album)
  else if (queryInTitle) {
    score = 0.95;
    reasoning = "Query contained in album title";
  }
  // Good case: Artist in query + title has good similarity
  else if (artistInQuery) {
    score = 0.4 + titleSimilarity * 0.6;
    reasoning = `Artist found, title similarity: ${titleSimilarity.toFixed(2)}`;
  }
  // Good case: Title in query + artist has good similarity
  else if (titleInQuery) {
    score = 0.4 + artistSimilarity * 0.6;
    reasoning = `Title found, artist similarity: ${artistSimilarity.toFixed(2)}`;
  }
  // Fallback: Use best similarity score
  else {
    score = Math.max(artistSimilarity, titleSimilarity) * 0.7;
    reasoning = `Similarity scores - artist: ${artistSimilarity.toFixed(2)}, title: ${titleSimilarity.toFixed(2)}`;
  }

  console.log(
    `[Lidarr]   "${album.title}" by "${albumArtist}" | ${reasoning} | Score: ${score.toFixed(2)}`,
  );

  return { album, score };
}
