import { useCallback } from "react";
import { useConfigProvider } from "src/provider/ConfigProvider";

import {
  AlbumType,
  ArtistType,
  ContentType,
  PlaylistType,
  ProcessingItemType,
  SyncItemType,
  TidalItemType,
  TrackType,
  VideoType,
} from "../types";

export function useProcessingFormat() {
  const { quality, atmosFilter } = useConfigProvider();

  const formatItem = useCallback(
    (item: TidalItemType, type: ContentType): ProcessingItemType | null => {
      if (!quality) return null;

      const id =
        (item as AlbumType | TrackType | ArtistType).id ||
        (item as PlaylistType).uuid;

      if (!id) return null;

      return {
        id,
        artist: extractArtist(item, type),
        title: extractTitle(item, type),
        type,
        quality,
        atmosFilter,
        status: "queue_download",
        loading: true,
        error: false,
        url: extractUrl(item),
      };
    },
    [quality, atmosFilter],
  );

  return { formatItem };
}

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

function extractArtist(item: TidalItemType, type: ContentType): string {
  switch (type) {
    case "artist":
    case "artist_videos":
      return (item as ArtistType)?.name || (item as SyncItemType)?.artist || "";
    default:
      return (item as TrackType | AlbumType).artists?.[0]?.name || "";
  }
}

function extractUrl(item: TidalItemType): string {
  return (item as AlbumType)?.url || (item as VideoType).id.toString() || "";
}
