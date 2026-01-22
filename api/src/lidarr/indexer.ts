import { Request, Response } from "express";

import { getAppInstance } from "../helpers/app-instance";

import { generateNewznabItem, generateNzbContent } from "./utils/lidarr";
import { searchTidalForLidarr } from "./utils/tidal-search-albums";

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
  let { q } = params;
  const { artist, album } = params;

  if (!q && (artist || album)) {
    q = [artist, album].filter(Boolean).join(" ");
    console.log(`[Lidarr] Query: "${q}"`);
  }

  if (!q) {
    console.log(
      "⏹️ [Lidarr] No search query provided, returning empty results",
    );
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
  const results = await searchTidalForLidarr(q, app);

  const qualities = ["hires_lossless", "lossless", "high", "low"];
  const items =
    results.length > 0
      ? results
          .flatMap((album) =>
            qualities.map((quality) =>
              generateNewznabItem(album, req, quality),
            ),
          )
          .join("\n")
      : "";

  const totalResults = results.length * qualities.length;
  console.log(
    `${results.length > 0 ? "✅" : "0️⃣"} [Lidarr] ${totalResults} results (${results.length} albums × ${qualities.length} qualities)`,
  );

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

export async function handleDownloadFromLidarr(
  id: string,
  res: Response,
  quality: string,
) {
  console.log(`⬇ [Lidarr] Download album ${id} (${quality})`);

  const nzbContent = generateNzbContent(id, quality);
  res.set("Content-Type", "application/x-nzb");
  res.set(
    "Content-Disposition",
    `attachment; filename="tidarr-${id}-${quality}.nzb"`,
  );
  res.send(nzbContent);
}
