import { Request } from "express";

import { TidalAlbum } from "../../types";

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

interface qualityInfoType {
  format: string;
  category: string;
  categoryId: string;
  qualityName: string;
  sizePerTrackMB: number;
  tiddlQuality: string;
}

const QUALITY_MAP: Record<string, qualityInfoType> = {
  low: {
    format: "M4A 96kbps",
    category: "Audio &gt; Other",
    categoryId: "3050",
    qualityName: "MP3-96",
    sizePerTrackMB: 2,
    tiddlQuality: "low",
  },
  high: {
    format: "M4A 320kbps",
    category: "Audio &gt; MP3",
    categoryId: "3010",
    qualityName: "AAC-320",
    sizePerTrackMB: 6,
    tiddlQuality: "normal",
  },
  lossless: {
    format: "FLAC 16-bit 44.1kHz",
    category: "Audio &gt; Lossless",
    categoryId: "3040",
    qualityName: "FLAC",
    sizePerTrackMB: 40,
    tiddlQuality: "high",
  },
  hires_lossless: {
    format: "FLAC 24-bit 192kHz",
    category: "Audio &gt; Lossless",
    categoryId: "3040",
    qualityName: "FLAC 24bit",
    sizePerTrackMB: 80,
    tiddlQuality: "max",
  },
};

export function mapQualityToTiddl(quality: string): string {
  return QUALITY_MAP[quality]?.tiddlQuality || "high";
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
  const qualityInfo = QUALITY_MAP[targetQuality] || QUALITY_MAP.lossless;

  const apiKey = req.query.apikey || req.headers["x-api-key"];
  const downloadUrl = `${req.protocol}://${req.get("host")}/api/lidarr/download/${album.id}/${targetQuality}${apiKey ? `?apikey=${apiKey}` : ""}`;
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
  const explicitTag = album.explicit ? " [EXPLICIT]" : "";
  const qualityTag = `[${qualityInfo.qualityName}]`;
  const sourceTag = "[Tidarr]";
  const titleWithQuality = `${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} ${explicitTag}${qualityTag}${sourceTag}`;

  return `    <item>
      <title>${escapeXml(titleWithQuality)}</title>
      <guid isPermaLink="false">${guid}</guid>
      <link>${tidarrUrl}</link>
      <comments>${tidarrUrl}#comments</comments>
      <pubDate>${pubDate}</pubDate>
      <category>${qualityInfo.category}</category>
      <description>${escapeXml(`${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""}${explicitTag} [${qualityInfo.qualityName}] - ${qualityInfo.format} - ${album.numberOfTracks} tracks - type: ${album.type?.toUpperCase()}`)}</description>
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
