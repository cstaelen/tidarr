import { Request, Response } from "express";

import {
  filterLidarrIndexerQualitiesForAlbum,
  generateNewznabItem,
  generateNzbContent,
  resolveLidarrIndexerQualities,
} from "./utils/lidarr";
import {
  fetchAlbumTrackQualitySummary,
  searchTidalForLidarr,
} from "./utils/tidal-search-albums";

type LidarrSearchRequestParams = {
  searchType?: string;
  q?: string;
  artist?: string;
  album?: string;
};

type NewznabPagination = {
  offset: number;
  limit: number;
};

type NewznabRssOptions = {
  baseUrl: string;
  offset: number;
  total: number;
  items: string[];
};

const NEWZNAB_DEFAULT_PAGE_SIZE = 50;
const NEWZNAB_MAX_PAGE_SIZE = 100;

export function handleCapsRequest(req: Request, res: Response): void {
  console.log("[Lidarr] Capabilities request (t=caps)");

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.send(buildLidarrCapsXml(baseUrl));
}

export function buildLidarrCapsXml(baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<caps>
  <server version="1.0" title="Tidarr" strapline="Tidal Music Indexer" email="tidarr@tidarr.com" url="${baseUrl}" image="${baseUrl}/logo.png"/>
  <limits max="${NEWZNAB_MAX_PAGE_SIZE}" default="${NEWZNAB_DEFAULT_PAGE_SIZE}"/>
  <registration available="no" open="no"/>
  <searching>
    <audio-search available="yes" supportedParams="q,artist,album,cat" searchEngine="raw"/>
  </searching>
  <categories>
    <category id="3000" name="Audio">
      <subcat id="3010" name="MP3"/>
      <subcat id="3040" name="Lossless"/>
      <subcat id="3050" name="Other"/>
    </category>
  </categories>
</caps>`;
}

function getFirstStringParam(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string");
  }

  return undefined;
}

function parseIntegerParam(
  value: unknown,
  defaultValue: number,
  minimum: number,
  maximum: number = Number.MAX_SAFE_INTEGER,
  zeroMeansMax: boolean = false,
): number {
  const rawValue = getFirstStringParam(value);

  if (!rawValue || !/^\d+$/.test(rawValue)) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if ((zeroMeansMax && parsedValue === 0) || parsedValue > maximum) {
    return maximum;
  }

  return Number.isSafeInteger(parsedValue) && parsedValue >= minimum
    ? parsedValue
    : defaultValue;
}

export function resolveNewznabPagination(
  query: Request["query"],
): NewznabPagination {
  const offset = parseIntegerParam(query.offset, 0, 0);
  const requestedLimit = parseIntegerParam(
    query.limit,
    NEWZNAB_DEFAULT_PAGE_SIZE,
    1,
    NEWZNAB_MAX_PAGE_SIZE,
    true,
  );

  return {
    offset,
    limit: Math.min(requestedLimit, NEWZNAB_MAX_PAGE_SIZE),
  };
}

export function buildNewznabRssXml({
  baseUrl,
  offset,
  total,
  items,
}: NewznabRssOptions): string {
  const itemXml = items.length ? `\n${items.join("\n")}` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newzbin.com/DTD/2010/feeds/attributes/">
  <channel>
    <title>Tidarr</title>
    <description>Tidarr Indexer</description>
    <link>${baseUrl}/api/lidarr</link>
    <language>en-us</language>
    <webMaster>tidarr@tidarr.com</webMaster>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <newznab:response offset="${offset}" total="${total}"/>${itemXml}
  </channel>
</rss>`;
}

function buildNoQueryItemXml(): string {
  return `    <item>
          <title>test</title>
          <pubDate>${new Date().toUTCString()}</pubDate>
    </item>`;
}

export async function handleSearchRequest(
  req: Request,
  res: Response,
  params: LidarrSearchRequestParams,
): Promise<void> {
  let { q } = params;
  const { artist, album, searchType = "unspecified" } = params;
  const { offset, limit } = resolveNewznabPagination(req.query);
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (q || artist || album) {
    console.log(
      `[Lidarr] Search request type=${searchType}, q=${q ? "yes" : "no"}, artist=${artist ? "yes" : "no"}, album=${album ? "yes" : "no"}, offset=${offset}, limit=${limit}`,
    );
  } else {
    console.log(
      "ℹ️ [Lidarr] Returning empty results for no-query request (health check)",
    );
    res.set("Content-Type", "application/xml");
    res.send(
      buildNewznabRssXml({
        baseUrl,
        offset: 0,
        total: 1,
        items: [buildNoQueryItemXml()],
      }),
    );
    return;
  }

  if (!q) {
    q = [artist, album].filter(Boolean).join(" ");
    console.log(`[Lidarr] Synthesized query from artist/album: "${q}"`);
  }

  const results = await searchTidalForLidarr(q, { artist, album });

  const qualities = resolveLidarrIndexerQualities(req.query.cat);
  const albumQualityResults = await Promise.all(
    results.map(async (album) => {
      const albumQualities = filterLidarrIndexerQualitiesForAlbum(
        album,
        qualities,
      );

      if (!albumQualities.includes("hires_lossless")) {
        return { album, trackQualitySummary: undefined };
      }

      const trackQualitySummary = await fetchAlbumTrackQualitySummary(album.id);

      return {
        album,
        trackQualitySummary: trackQualitySummary || {
          trackCount: 0,
          hiResTrackCount: 0,
        },
      };
    }),
  );
  const items = albumQualityResults.flatMap(({ album, trackQualitySummary }) =>
    filterLidarrIndexerQualitiesForAlbum(album, qualities, {
      trackQualitySummary,
    }).map((quality) => generateNewznabItem(album, req, quality)),
  );

  const totalResults = items.length;
  const pagedItems = items.slice(offset, offset + limit);
  const resultIcon = results.length > 0 ? "✅" : "0️⃣";
  console.log(
    `${resultIcon} [Lidarr] ${totalResults} quality-filtered results from ${results.length} albums, ` +
      `returning ${pagedItems.length} from offset ${offset}`,
  );

  res.set("Content-Type", "application/xml");
  res.send(
    buildNewznabRssXml({
      baseUrl,
      offset,
      total: totalResults,
      items: pagedItems,
    }),
  );
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
