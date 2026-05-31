import { Request } from "express";

import { QualityType, TidalAlbum } from "../../types";

import { formatForMusicBrainz } from "./musicbrainz";

/**
 * Helper functions for Lidarr integration
 */

/**
 * Extract album artist name from Tidal album data
 */
export function getAlbumArtist(album: TidalAlbum): string {
  return album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return char;
    }
  });
}

interface QualityInfoType {
  format: string;
  category: string;
  categoryId: LidarrQualityCategoryId;
  qualityName: string;
  sizePerTrackMB: number;
  tiddlQuality: QualityType;
}

type LidarrIndexerQuality = "hires_lossless" | "lossless" | "high" | "low";
type LidarrQualityCategoryId = "3010" | "3040" | "3050";

type TidalQualityHint = "hires" | "lossless" | "high" | "low" | "unknown";
type TidalQualityHintSource = {
  audioQuality?: string;
  mediaMetadata?: {
    tags?: string[];
  };
};

export type AlbumTrackQualitySummary = {
  trackCount: number;
  hiResTrackCount: number;
};

type AlbumQualityFilterOptions = {
  trackQualitySummary?: AlbumTrackQualitySummary;
};

const TIDDL_QUALITIES: readonly QualityType[] = [
  "max",
  "high",
  "normal",
  "low",
];
const AUDIO_CATEGORY_ID = "3000";
const LIDARR_QUALITY_ORDER: readonly LidarrIndexerQuality[] = [
  "hires_lossless",
  "lossless",
  "high",
  "low",
];

const QUALITY_MAP: Record<LidarrIndexerQuality, QualityInfoType> = {
  hires_lossless: {
    format: "FLAC 24-bit 192kHz",
    category: "Audio &gt; Lossless",
    categoryId: "3040",
    qualityName: "FLAC 24bit",
    sizePerTrackMB: 80,
    tiddlQuality: "max",
  },
  lossless: {
    format: "FLAC 16-bit 44.1kHz",
    category: "Audio &gt; Lossless",
    categoryId: "3040",
    qualityName: "FLAC",
    sizePerTrackMB: 40,
    tiddlQuality: "high",
  },
  high: {
    format: "M4A 320kbps",
    category: "Audio &gt; MP3",
    categoryId: "3010",
    qualityName: "AAC-320",
    sizePerTrackMB: 6,
    tiddlQuality: "normal",
  },
  low: {
    format: "M4A 96kbps",
    category: "Audio &gt; Other",
    categoryId: "3050",
    qualityName: "MP3-96",
    sizePerTrackMB: 2,
    tiddlQuality: "low",
  },
};

const KNOWN_AUDIO_QUALITY_CATEGORY_IDS: readonly LidarrQualityCategoryId[] =
  LIDARR_QUALITY_ORDER.map((quality) => QUALITY_MAP[quality].categoryId);

function normalizeQualityHint(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalizedValue = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return normalizedValue || undefined;
}

function classifyQualityHint(value: unknown): TidalQualityHint {
  switch (normalizeQualityHint(value)) {
    case "HIRESLOSSLESS":
    case "HIRES":
    case "MAX":
      return "hires";
    case "LOSSLESS":
      return "lossless";
    case "HIGH":
    case "AAC320":
    case "MP3320":
      return "high";
    case "LOW":
    case "AAC96":
    case "MP396":
      return "low";
    default:
      return "unknown";
  }
}

function getQualityHints(source: TidalQualityHintSource): TidalQualityHint[] {
  const rawHints = [
    source.audioQuality,
    ...(source.mediaMetadata?.tags || []),
  ].filter((hint): hint is string => Boolean(hint));

  if (rawHints.length === 0) return ["unknown"];

  const qualityHints = rawHints.map(classifyQualityHint);
  const knownQualityHints = qualityHints.filter((hint) => hint !== "unknown");
  return knownQualityHints.length ? knownQualityHints : ["unknown"];
}

function getAlbumQualityHints(album: TidalAlbum): TidalQualityHint[] {
  return getQualityHints(album);
}

export function summarizeAlbumTrackQualityHints(
  tracks: readonly TidalQualityHintSource[],
): AlbumTrackQualitySummary {
  return tracks.reduce<AlbumTrackQualitySummary>(
    (summary, track) => {
      const trackQualityHints = getQualityHints(track);

      return {
        trackCount: summary.trackCount + 1,
        hiResTrackCount: trackQualityHints.includes("hires")
          ? summary.hiResTrackCount + 1
          : summary.hiResTrackCount,
      };
    },
    { trackCount: 0, hiResTrackCount: 0 },
  );
}

function isLidarrIndexerQuality(value: unknown): value is LidarrIndexerQuality {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(QUALITY_MAP, value)
  );
}

function getQualityInfo(quality: string): QualityInfoType {
  return isLidarrIndexerQuality(quality)
    ? QUALITY_MAP[quality]
    : QUALITY_MAP.lossless;
}

function isTiddlQuality(value: unknown): value is QualityType {
  return (
    typeof value === "string" &&
    TIDDL_QUALITIES.some((quality) => quality === value)
  );
}

function parseCategoryIds(categoryParam?: unknown): string[] {
  if (categoryParam === undefined) return [];

  const values = Array.isArray(categoryParam) ? categoryParam : [categoryParam];

  return values.flatMap((value) =>
    typeof value === "string"
      ? value
          .split(",")
          .map((categoryId) => categoryId.trim())
          .filter(Boolean)
      : [],
  );
}

function isAudioCategoryId(categoryId: string): boolean {
  return /^3\d{3}$/.test(categoryId);
}

function isKnownAudioQualityCategoryId(
  categoryId: string,
): categoryId is LidarrQualityCategoryId {
  return KNOWN_AUDIO_QUALITY_CATEGORY_IDS.some(
    (knownCategoryId) => knownCategoryId === categoryId,
  );
}

export function mapQualityToTiddl(quality: string): QualityType {
  if (isTiddlQuality(quality)) return quality;

  return isLidarrIndexerQuality(quality)
    ? QUALITY_MAP[quality].tiddlQuality
    : "high";
}

export function resolveLidarrIndexerQualities(
  categoryParam?: unknown,
): LidarrIndexerQuality[] {
  const categoryIds = parseCategoryIds(categoryParam);
  if (categoryIds.length === 0) return [...LIDARR_QUALITY_ORDER];

  const audioCategoryIds = categoryIds.filter(isAudioCategoryId);
  if (audioCategoryIds.length === 0) return [...LIDARR_QUALITY_ORDER];

  if (audioCategoryIds.includes(AUDIO_CATEGORY_ID)) {
    return [...LIDARR_QUALITY_ORDER];
  }

  const requestedCategoryIds = new Set(audioCategoryIds);
  const hasUnknownAudioCategory = audioCategoryIds.some(
    (categoryId) => !isKnownAudioQualityCategoryId(categoryId),
  );

  if (hasUnknownAudioCategory) {
    return [...LIDARR_QUALITY_ORDER];
  }

  return LIDARR_QUALITY_ORDER.filter((quality) =>
    requestedCategoryIds.has(QUALITY_MAP[quality].categoryId),
  );
}

export function filterLidarrIndexerQualitiesForAlbum(
  album: TidalAlbum,
  qualities: readonly LidarrIndexerQuality[],
  options: AlbumQualityFilterOptions = {},
): LidarrIndexerQuality[] {
  const albumQualityHints = getAlbumQualityHints(album);
  const hasHiResHint = albumQualityHints.includes("hires");
  const hasLosslessHint =
    hasHiResHint || albumQualityHints.includes("lossless");
  const hasUnknownHint = albumQualityHints.includes("unknown");
  const hasNonLowKnownHint =
    hasLosslessHint || albumQualityHints.includes("high");
  const allTracksHaveHiResHint = options.trackQualitySummary
    ? options.trackQualitySummary.trackCount > 0 &&
      options.trackQualitySummary.hiResTrackCount ===
        options.trackQualitySummary.trackCount
    : true;

  return qualities.filter((quality) => {
    switch (quality) {
      case "hires_lossless":
        return hasHiResHint && allTracksHaveHiResHint;
      case "lossless":
        return hasLosslessHint;
      case "high":
        return hasUnknownHint || hasNonLowKnownHint;
      case "low":
        return true;
      default:
        return false;
    }
  });
}

/**
 * Generate NZB content for Lidarr download
 */
export function generateNzbContent(albumId: string, quality: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/nzb/nzb-1.1.dtd">
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <head>
    <meta type="title">Tidarr Album ${albumId}|${quality}</meta>
    <meta type="category">Audio</meta>
    <meta type="description">Album download from Tidal via Tidarr (${quality})</meta>
  </head>
  <file date="${Math.floor(Date.now() / 1000)}" subject="Tidarr Album ${albumId}|${quality}">
    <groups>
      <group>alt.binaries.sounds.flac</group>
      <group>alt.binaries.mp3</group>
    </groups>
    <segments>
      <segment bytes="1048576" number="1">tidarr-${albumId}-segment-1</segment>
    </segments>
  </file>
</nzb>`;
}

/**
 * Generate Newznab XML item for an album
 */
export function generateNewznabItem(
  album: TidalAlbum,
  req: Request,
  quality?: string,
): string {
  if (!album?.id) return "";

  const targetQuality = quality || album.audioQuality?.toLowerCase() || "high";
  const guid = `${album.id}-${targetQuality}`;
  const qualityInfo = getQualityInfo(targetQuality);
  const downloadQuality = qualityInfo.tiddlQuality;

  const apiKey = req.query.apikey || req.headers["x-api-key"];
  const downloadUrl = `${req.protocol}://${req.get("host")}/api/lidarr/download/${album.id}/${downloadQuality}${apiKey ? `?apikey=${apiKey}` : ""}`;
  const tidarrUrl = `${req.protocol}://${req.get("host")}/album/${album.id}`;
  const albumArtist = getAlbumArtist(album);

  const pubDate = album.releaseDate
    ? new Date(album.releaseDate).toUTCString()
    : new Date().toUTCString();

  const estimatedSize =
    (album.numberOfTracks || 10) * qualityInfo.sizePerTrackMB * 1024 * 1024;

  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : "";

  const formattedArtist = formatForMusicBrainz(albumArtist);
  const formattedTitle = formatForMusicBrainz(album.title);
  const explicitTag = album.explicit ? "[EXPLICIT]" : "";
  const tracksInfo = album.numberOfTracks
    ? ` (${album.numberOfTracks} tracks)`
    : "";
  const titleWithQuality = `${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} ${explicitTag} ${qualityInfo.qualityName} [WEB]-Tidarr${tracksInfo}`;

  return `    <item>
      <title>${escapeXml(titleWithQuality)}</title>
      <guid isPermaLink="false">${guid}</guid>
      <link>${tidarrUrl}</link>
      <comments>${tidarrUrl}#comments</comments>
      <pubDate>${pubDate}</pubDate>
      <category>${qualityInfo.category}</category>
      <description>${escapeXml(`${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} ${explicitTag} [${qualityInfo.qualityName}] - ${qualityInfo.format} - ${album.numberOfTracks} tracks - type: ${album.type?.toUpperCase()}`)}</description>
      <enclosure url="${downloadUrl}" length="${estimatedSize}" type="application/x-nzb"/>
      <newznab:attr name="artist" value="${escapeXml(albumArtist)}"/>
      <newznab:attr name="album" value="${escapeXml(album.title)}"/>
      <newznab:attr name="size" value="${estimatedSize}"/>
      <newznab:attr name="category" value="${qualityInfo.categoryId}"/>
      ${year ? `<newznab:attr name="year" value="${year}"/>` : ""}
      ${album.numberOfTracks ? `<newznab:attr name="tracks" value="${album.numberOfTracks}"/>` : ""}
      ${album.type ? `<newznab:attr name="type" value="${escapeXml(album.type)}"/>` : ""}
    </item>`;
}
