import { Request, Response } from "express";

import { getAppInstance } from "../helpers/app-instance";

import {
  generateNewznabItem,
  generateNzbContent,
  getQualityInfo,
} from "./lidarr-utils";
import {
  addAlbumToQueue,
  matchTidalAlbums,
  searchTidalForLidarr,
} from "./tidal-search-albums";

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

export async function handleDownloadFromLidarr(id: string, res: Response) {
  console.log(`[Lidarr] Download triggered for album ID: ${id}`);

  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;
  const countryCode = tiddlConfig?.auth?.country_code || "US";
  const albumUrl = `${process.env.TIDAL_API_URL || "https://api.tidal.com"}/v1/albums/${id}?countryCode=${countryCode}`;

  const response = await fetch(albumUrl, {
    headers: {
      Authorization: `Bearer ${tiddlConfig?.auth?.token}`,
    },
  });

  if (response.ok) {
    const albumData = await response.json();
    await addAlbumToQueue(app, albumData, id);

    const nzbContent = generateNzbContent(id);
    res.set("Content-Type", "application/x-nzb");
    res.set("Content-Disposition", `attachment; filename="tidarr-${id}.nzb"`);
    res.send(nzbContent);

    console.log(`[Lidarr] Successfully returned NZB for album ${id}`);
  } else {
    const errorBody = await response.text();
    console.error(
      `[Lidarr] Failed to fetch album details: ${response.status} ${response.statusText}`,
    );
    console.error(`[Lidarr] Error response body: ${errorBody}`);

    res.status(500).json({
      error: "Failed to fetch album details from Tidal",
      tidalStatus: response.status,
      tidalStatusText: response.statusText,
    });
  }
}
