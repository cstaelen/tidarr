import { Express, Request, Response } from "express";

import { getAppInstance } from "../helpers/app-instance";
import {
  generateNewznabItem,
  getAlbumArtist,
  getQualityInfo,
} from "../helpers/lidarr-utils";
import {
  matchTidalAlbums,
  searchTidalForLidarr,
} from "../helpers/tidal-search-albums";
import { TidalAlbum } from "../types";

export function handleCapsRequest(req: Request, res: Response): void {
  console.log("[Lidarr] Capabilities request (t=caps)");

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<caps>
  <server version="1.0" title="Tidarr" strapline="Tidal Music Indexer" email="tidarr@tidarr.com" url="${baseUrl}" image="${baseUrl}/logo.png"/>
  <limits max="100" default="100"/>
  <registration available="no" open="no"/>
  <searching>
    <search available="yes" supportedParams="q"/>
    <music-search available="yes" supportedParams="q,artist,album"/>
    <audio-search available="yes" supportedParams="q,artist,album"/>
  </searching>
  <categories>
    <category id="3000" name="Audio">
      <subcat id="3010" name="MP3"/>
      <subcat id="3040" name="Lossless"/>
      <subcat id="3050" name="Other"/>
    </category>
  </categories>
</caps>`);
}

export async function handleSearchRequest(
  req: Request,
  res: Response,
  params: { q?: string; artist?: string; album?: string },
): Promise<void> {
  const { q } = params;

  if (!q) {
    console.log("[Lidarr] No search query provided, returning empty results");
    res.set("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newzbin.com/DTD/2010/feeds/attributes/">
  <channel>
    <title>Tidarr</title>
    <description>Tidarr Indexer</description>
    <link>${req.protocol}://${req.get("host")}/api/lidarr</link>
    <language>en-us</language>
    <webMaster>tidarr@tidarr.com</webMaster>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <newznab:response offset="0" total="1"/>
    <item>
          <title>test</title>
          <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`);
    return;
  }

  const app = getAppInstance();
  let results = await searchTidalForLidarr(q, app);

  // Apply smart matching
  results = matchTidalAlbums(results, q);

  // Generate response
  const tiddlConfig = app.locals.tiddlConfig;
  const quality = tiddlConfig?.download?.track_quality || "max";
  const qualityInfo = getQualityInfo(quality);

  const items =
    results.length > 0
      ? results
          .map((album) => generateNewznabItem(album, req, qualityInfo))
          .join("\n")
      : "";

  console.log(`[Lidarr] Returning ${results.length} results to Lidarr`);

  res.set("Content-Type", "application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newzbin.com/DTD/2010/feeds/attributes/">
  <channel>
    <title>Tidarr</title>
    <description>Tidarr Indexer</description>
    <link>${req.protocol}://${req.get("host")}/api/lidarr</link>
    <language>en-us</language>
    <webMaster>tidarr@tidarr.com</webMaster>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <newznab:response offset="0" total="${results.length}"/>
${items}
  </channel>
</rss>`);
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
