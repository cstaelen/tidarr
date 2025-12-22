import { Request } from "express";

import { TidalAlbum } from "../types";

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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Get quality description and category based on Tidal quality setting
 */
export function getQualityInfo(quality: string): {
  format: string;
  category: string;
  categoryId: string;
  qualityName: string;
} {
  const qualityMap: Record<
    string,
    {
      format: string;
      category: string;
      categoryId: string;
      qualityName: string;
    }
  > = {
    low: {
      format: "M4A 96kbps",
      category: "Audio &gt; Other",
      categoryId: "3050",
      qualityName: "MP3-96",
    },
    normal: {
      format: "M4A 320kbps",
      category: "Audio &gt; MP3",
      categoryId: "3010",
      qualityName: "AAC-320",
    },
    high: {
      format: "FLAC 16-bit 44.1kHz",
      category: "Audio &gt; Lossless",
      categoryId: "3040",
      qualityName: "FLAC",
    },
    max: {
      format: "FLAC 24-bit 192kHz",
      category: "Audio &gt; Lossless",
      categoryId: "3040",
      qualityName: "FLAC 24bit",
    },
  };

  return qualityMap[quality] || qualityMap.max;
}

/**
 * Get album edition type
 */
export function getAlbumEditionType(title: string): string {
  const lowerTitle = title.toLowerCase();

  const editionKeywords: Record<string, string> = {
    deluxe: "Deluxe",
    expanded: "Expanded",
    remastered: "Remastered",
    anniversary: "Anniversary",
    special: "Special",
    limited: "Limited",
    collector: "Collector",
    bonus: "Bonus",
    live: "Live",
    tour: "Tour",
    edition: "Special",
  };

  const found = Object.entries(editionKeywords).find(([keyword]) =>
    lowerTitle.includes(keyword),
  );

  return found ? found[1] : "Standard";
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
export function generateNewznabItem(
  album: TidalAlbum,
  req: Request,
  qualityInfo: ReturnType<typeof getQualityInfo>,
): string {
  const guid = `tidarr-album-${album.id}`;

  // Include API key in download URL (Lidarr needs it to download)
  const apiKey = req.query.apikey || req.headers["x-api-key"];
  const downloadUrl = `${req.protocol}://${req.get("host")}/api/lidarr/download/${album.id}${apiKey ? `?apikey=${apiKey}` : ""}`;

  const albumUrl = `https://listen.tidal.com/album/${album.id}`;
  const tidarrUrl = `${req.protocol}://${req.get("host")}/album/${album.id}`;
  const albumArtist = getAlbumArtist(album);

  const pubDate = album.releaseDate
    ? new Date(album.releaseDate).toUTCString()
    : new Date().toUTCString();

  const estimatedSize = (album.numberOfTracks || 10) * 50 * 1024 * 1024;
  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : "";

  const formattedArtist = formatForMusicBrainz(albumArtist);
  const formattedTitle = formatForMusicBrainz(album.title);
  const titleWithQuality = `${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} [${qualityInfo.qualityName}]`;

  const editionType = getAlbumEditionType(formattedTitle);

  return `    <item>
      <title>${escapeXml(titleWithQuality)}</title>
      <guid isPermaLink="false">${guid}</guid>
      <link>${tidarrUrl}</link>
      <comments>${tidarrUrl}#comments</comments>
      <pubDate>${pubDate}</pubDate>
      <category>${qualityInfo.category}</category>
      <description>${escapeXml(`${formattedArtist} - ${formattedTitle}${year ? ` (${year})` : ""} [${qualityInfo.qualityName}] - ${qualityInfo.format}`)}</description>
      <enclosure url="${downloadUrl}" length="${estimatedSize}" type="application/x-nzb"/>
      <newznab:attr name="category" value="3000"/>
      <newznab:attr name="category" value="${qualityInfo.categoryId}"/>
      <newznab:attr name="size" value="${estimatedSize}"/>
      <newznab:attr name="quality" value="${qualityInfo.qualityName}"/>
      <newznab:attr name="artist" value="${escapeXml(formattedArtist)}"/>
      <newznab:attr name="album" value="${escapeXml(formattedTitle)}"/>
      <newznab:attr name="year" value="${year}"/>
      <newznab:attr name="genre" value="Music"/>
      <newznab:attr name="tracks" value="${album.numberOfTracks || 0}"/>
      <newznab:attr name="coverurl" value="https://resources.tidal.com/images/${album.id?.toString().replace(/-/g, "/")}/1280x1280.jpg"/>
      <newznab:attr name="files" value="${album.numberOfTracks || 0}"/>
      <newznab:attr name="grabs" value="0"/>
      <newznab:attr name="info" value="${albumUrl}"/>
      <newznab:attr name="edition" value="${editionType}"/>
      <newznab:attr name="tidarrurl" value="${tidarrUrl}"/>
    </item>`;
}
