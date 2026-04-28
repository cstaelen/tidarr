import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { fetchTidalWithRefresh } from "../../helpers/fetch-tidal";
import { ProcessingItemType, TiddlConfig } from "../../types";

import { logs } from "./logs";

const TIDAL_PAGE_LIMIT = 100;

type AlbumItem = {
  id: number;
  title: string;
  artist?: { name?: string };
  artists?: Array<{ name?: string }>;
};

async function fetchAlbumsByFilter(
  artistId: string,
  filter: string,
  tiddlConfig: TiddlConfig,
): Promise<AlbumItem[]> {
  const country = tiddlConfig.auth.country_code;
  const baseUrl = `${TIDAL_API_URL}/v1/artists/${artistId}/albums?countryCode=${country}&filter=${filter}`;

  const allItems: AlbumItem[] = [];
  let offset = 0;
  let totalItems = Infinity;

  while (offset < totalItems) {
    const url = `${baseUrl}&limit=${TIDAL_PAGE_LIMIT}&offset=${offset}`;
    const response = await fetchTidalWithRefresh(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch albums: ${response.status} - ${body}`);
    }

    const data = await response.json();
    totalItems = data.totalNumberOfItems ?? data.items?.length ?? 0;

    if (data.items) {
      allItems.push(...data.items);
    }

    offset += TIDAL_PAGE_LIMIT;
  }

  return allItems;
}

function deduplicateAlbums(albums: AlbumItem[]): AlbumItem[] {
  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  return albums.filter((album) => {
    const title = album.title.toLowerCase().trim();
    if (seenIds.has(album.id) || seenTitles.has(title)) return false;
    seenIds.add(album.id);
    seenTitles.add(title);
    return true;
  });
}

async function fetchAllArtistAlbums(
  artistId: string,
  tiddlConfig: TiddlConfig,
): Promise<AlbumItem[]> {
  const singlesFilter = tiddlConfig.download?.singles_filter ?? "none";

  if (singlesFilter === "only") {
    return deduplicateAlbums(
      await fetchAlbumsByFilter(artistId, "EPSANDSINGLES", tiddlConfig),
    );
  }

  if (singlesFilter === "include") {
    const [albums, singles] = await Promise.all([
      fetchAlbumsByFilter(artistId, "ALBUMS", tiddlConfig),
      fetchAlbumsByFilter(artistId, "EPSANDSINGLES", tiddlConfig),
    ]);
    return deduplicateAlbums([...albums, ...singles]);
  }

  // Default: "none" → albums only
  return deduplicateAlbums(
    await fetchAlbumsByFilter(artistId, "ALBUMS", tiddlConfig),
  );
}

/**
 * Fetches all albums from an artist and adds them individually to the download queue.
 * Respects the singles_filter setting from tiddl config.toml.
 */
export async function getArtistAlbums(item: ProcessingItemType): Promise<void> {
  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;
  const artistId = item.url.split("/").pop();

  if (!artistId) {
    logs(item.id, `❌ [DISCOGRAPHY] Invalid artist URL: ${item.url}`);
    return;
  }

  try {
    logs(item.id, `🕖 [DISCOGRAPHY] Fetching albums for artist ${artistId}...`);

    const albums = await fetchAllArtistAlbums(artistId, tiddlConfig);

    logs(item.id, `📊 [DISCOGRAPHY] Found ${albums.length} albums`);

    const newItems: ProcessingItemType[] = albums.map((album) => ({
      id: String(album.id),
      url: `album/${album.id}`,
      type: "album",
      status: "queue_download",
      loading: false,
      artist:
        album.artists?.[0]?.name || album.artist?.name || item.artist || "",
      title: album.title,
      quality: item.quality,
      error: false,
      source: "tidarr",
    }));

    await app.locals.processingStack.actions.addItems(newItems, true);

    logs(item.id, `✅ [DISCOGRAPHY] Added ${albums.length} albums to queue`);
  } catch (error) {
    logs(
      item.id,
      `❌ [DISCOGRAPHY] Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
