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

  const targetQuality = quality || album.audioQuality.toLowerCase();
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
