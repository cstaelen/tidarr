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
export function escapeXml(str: string): string {
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

/**
 * Get quality description and category based on Tidal quality setting
 */
export function getQualityInfo(quality: string): {
  format: string;
  category: string;
  categoryId: string;
  qualityName: string;
  sizePerTrackMB: number;
} {
  const qualityMap: Record<
    string,
    {
      format: string;
      category: string;
      categoryId: string;
      qualityName: string;
      sizePerTrackMB: number;
    }
  > = {
    low: {
      format: "M4A 96kbps",
      category: "Audio &gt; Other",
      categoryId: "3050",
      qualityName: "MP3-96",
      sizePerTrackMB: 5,
    },
    high: {
      format: "M4A 320kbps",
      category: "Audio &gt; MP3",
      categoryId: "3010",
      qualityName: "AAC-320",
      sizePerTrackMB: 10,
    },
    lossless: {
      format: "FLAC 16-bit 44.1kHz",
      category: "Audio &gt; Lossless",
      categoryId: "3040",
      qualityName: "FLAC",
      sizePerTrackMB: 40,
    },
    hires_lossless: {
      format: "FLAC 24-bit 192kHz",
      category: "Audio &gt; Lossless",
      categoryId: "3040",
      qualityName: "FLAC 24bit",
      sizePerTrackMB: 80,
    },
  };

  return qualityMap[quality] || qualityMap.lossless;
}

/**
 * Generate NZB content for Lidarr download
 */
export function generateNzbContent(albumId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/nzb/nzb-1.1.dtd">
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <head>
    <meta type="title">Tidarr Album ${albumId}</meta>
    <meta type="category">Audio</meta>
    <meta type="description">Album download from Tidal via Tidarr</meta>
  </head>
  <file date="${Math.floor(Date.now() / 1000)}" subject="Tidarr Album ${albumId}">
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
export function generateNewznabItem(album: TidalAlbum, req: Request): string {
  if (!album?.id) return "";
  const guid = album.id;

  const qualityInfo = getQualityInfo(album.audioQuality.toLowerCase());

  // Include API key in download URL (Lidarr needs it to download)
  const apiKey = req.query.apikey || req.headers["x-api-key"];
  const downloadUrl = `${req.protocol}://${req.get("host")}/api/lidarr/download/${album.id}${apiKey ? `?apikey=${apiKey}` : ""}`;
  const tidarrUrl = `${req.protocol}://${req.get("host")}/album/${album.id}`;
  const albumArtist = getAlbumArtist(album);

  const pubDate = album.releaseDate
    ? new Date(album.releaseDate).toUTCString()
    : new Date().toUTCString();

  // Calculate estimated size based on quality
  const estimatedSize =
    (album.numberOfTracks || 10) * qualityInfo.sizePerTrackMB * 1024 * 1024;

  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : "";

  const formattedArtist = formatForMusicBrainz(albumArtist);
  const formattedTitle = formatForMusicBrainz(album.title);
  const titleWithQuality = `${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} [${qualityInfo.qualityName}] (${album.numberOfTracks} tracks)`;

  return `    <item>
      <title>${escapeXml(titleWithQuality)}</title>
      <guid isPermaLink="false">${guid}</guid>
      <link>${tidarrUrl}</link>
      <comments>${tidarrUrl}#comments</comments>
      <pubDate>${pubDate}</pubDate>
      <category>${qualityInfo.category}</category>
      <description>${escapeXml(`${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} [${qualityInfo.qualityName}] - ${qualityInfo.format} - ${album.numberOfTracks} tracks - type: ${album.type?.toUpperCase()}`)}</description>
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
