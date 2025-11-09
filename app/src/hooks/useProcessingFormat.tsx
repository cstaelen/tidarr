import { useCallback } from "react";

import {
  AlbumType,
  ArtistType,
  ContentType,
  PlaylistType,
  ProcessingItemType,
  QualityType,
  SyncItemType,
  TidalItemType,
  TrackType,
  VideoType,
} from "../types";

/**
 * Hook to format various item types into ProcessingItemType
 * Extracts id, title, artist, and url from different Tidal content types
 */
export function useProcessingFormat() {
  /**
   * Format an item into a ProcessingItemType ready for the queue
   * @param item - The Tidal content item (album, track, artist, etc.)
   * @param type - The content type identifier
   * @param quality - The download quality setting
   * @returns Formatted ProcessingItemType or null if invalid
   */
  const formatItem = useCallback(
    (
      item: TidalItemType,
      type: ContentType,
      quality: QualityType,
    ): ProcessingItemType | null => {
      // Extract ID (varies by item type)
      const id =
        (item as AlbumType | TrackType | ArtistType).id ||
        (item as PlaylistType).uuid;

      if (!id) return null;

      // Extract title based on content type
      const title = extractTitle(item, type);

      // Extract artist based on content type
      const artist = extractArtist(item, type);

      // Extract URL
      const url = extractUrl(item);

      const itemToQueue: ProcessingItemType = {
        id,
        artist,
        title,
        type,
        quality,
        status: "queue",
        loading: true,
        error: false,
        url,
      };

      return itemToQueue;
    },
    [],
  );

  return { formatItem };
}

/**
 * Extract title from item based on content type
 */
function extractTitle(item: TidalItemType, type: ContentType): string {
  switch (type) {
    case "artist":
      return "All albums";
    case "artist_videos":
      return "All artist videos";
    default:
      return (item as TrackType | AlbumType)?.title || "";
  }
}

/**
 * Extract artist name from item based on content type
 */
function extractArtist(item: TidalItemType, type: ContentType): string {
  switch (type) {
    case "artist":
    case "artist_videos":
      return (item as ArtistType)?.name || (item as SyncItemType)?.artist || "";
    default:
      return (item as TrackType | AlbumType).artists?.[0]?.name || "";
  }
}

/**
 * Extract URL from item
 * For videos, use id.toString() as URL; for others, use url property
 */
function extractUrl(item: TidalItemType): string {
  if ((item as AlbumType)?.url) {
    return (item as AlbumType)?.url;
  }
  return (item as VideoType).id.toString() || "";
}
