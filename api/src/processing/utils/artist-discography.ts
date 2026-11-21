import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { fetchAllTidalPages } from "../../helpers/fetch-tidal";
import { ProcessingItemType, TiddlConfig } from "../../types";

import { logs } from "./logs";

type AlbumItem = {
  id: number;
  title: string;
  explicit?: boolean;
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

  return fetchAllTidalPages<AlbumItem>(baseUrl, "albums");
}

/**
 * Keeps a single album per title, preferring the explicit release.
 *
 * Tidal lists the clean and the explicit variant of a release under the exact
 * same title, so a title collision is how we spot the pair. Without an explicit
 * preference the winner is whichever variant the API happened to return first,
 * which is why clean albums sometimes end up in the queue.
 *
 * A non-explicit album is NOT necessarily a "clean" edit (a release with no
 * profanity is flagged non-explicit too), so the preference only applies to
 * albums colliding on the same title — nothing is ever filtered out on its own.
 */
function deduplicateAlbums(albums: AlbumItem[]): AlbumItem[] {
  const seenIds = new Set<number>();
  const byTitle = new Map<string, AlbumItem>();

  for (const album of albums) {
    if (seenIds.has(album.id)) continue;
    seenIds.add(album.id);

    const title = album.title.toLowerCase().trim();
    const kept = byTitle.get(title);

    // Map.set on an existing key keeps the original insertion position.
    if (!kept || (album.explicit && !kept.explicit)) {
      byTitle.set(title, album);
    }
  }

  return [...byTitle.values()];
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
