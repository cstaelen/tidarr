import { TidalAlbum } from "../../types";

export type LidarrTidalSearchContext = {
  artist?: string;
  album?: string;
};

type FetchTidalAlbums = (query: string) => Promise<TidalAlbum[]>;

function cleanQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

function addQueryVariant(
  queries: string[],
  seenQueries: Set<string>,
  query: string,
): void {
  const cleanedQuery = cleanQuery(query);
  const queryKey = cleanedQuery.toLowerCase();

  if (!cleanedQuery || seenQueries.has(queryKey)) {
    return;
  }

  queries.push(cleanedQuery);
  seenQueries.add(queryKey);
}

function normalizeVolumeShorthand(query: string): string {
  return query
    .replace(/\bV\.\s*(\d+)\b/gi, "Vol. $1")
    .replace(/\bVol\.\s*(\d+)\b/gi, "Vol. $1");
}

function truncateAtFirstComma(query: string): string {
  const commaIndex = query.indexOf(",");
  return commaIndex === -1 ? query : query.slice(0, commaIndex);
}

function buildContextQuery(
  context: LidarrTidalSearchContext,
  album: string,
): string {
  return [context.artist, album]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");
}

function normalizeForLidarrExactMatch(value?: string): string {
  return normalizeVolumeShorthand(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAlbumArtistNames(album: TidalAlbum): string[] {
  return [
    album.artist?.name,
    ...(album.artists?.map((artist) => artist.name) || []),
  ].filter((name): name is string => Boolean(name?.trim()));
}

export function buildLidarrTidalSearchQueries(
  query: string,
  context: LidarrTidalSearchContext = {},
): string[] {
  const queries: string[] = [];
  const seenQueries = new Set<string>();

  addQueryVariant(queries, seenQueries, query);
  addQueryVariant(queries, seenQueries, normalizeVolumeShorthand(query));

  if (!context.album) {
    addQueryVariant(queries, seenQueries, truncateAtFirstComma(query));
    return queries;
  }

  const normalizedAlbum = normalizeVolumeShorthand(context.album);

  if (normalizedAlbum !== context.album) {
    addQueryVariant(
      queries,
      seenQueries,
      buildContextQuery(context, normalizedAlbum),
    );
  }

  if (context.album.includes(",")) {
    addQueryVariant(
      queries,
      seenQueries,
      buildContextQuery(context, truncateAtFirstComma(context.album)),
    );
  }

  return queries;
}

export function hasExactLidarrAlbumMatch(
  albums: TidalAlbum[],
  context: LidarrTidalSearchContext = {},
): boolean {
  const albumTitle = normalizeForLidarrExactMatch(context.album);

  if (!albumTitle) {
    return false;
  }

  const artistName = normalizeForLidarrExactMatch(context.artist);

  return albums.some((album) => {
    const titleMatches =
      normalizeForLidarrExactMatch(album.title) === albumTitle;

    if (!titleMatches) {
      return false;
    }

    if (!artistName) {
      return true;
    }

    return getAlbumArtistNames(album).some(
      (artist) => normalizeForLidarrExactMatch(artist) === artistName,
    );
  });
}

export async function searchTidalAlbumsWithFallbacks(
  query: string,
  context: LidarrTidalSearchContext | undefined,
  fetchAlbums: FetchTidalAlbums,
): Promise<TidalAlbum[]> {
  const searchContext = context || {};
  const queries = buildLidarrTidalSearchQueries(query, searchContext);
  const albums: TidalAlbum[] = [];
  const seenAlbumIds = new Set<string>();

  if (queries.length === 0) {
    return albums;
  }

  const mergeAlbums = (fetchedAlbums: TidalAlbum[]) => {
    for (const album of fetchedAlbums) {
      const albumId = String(album.id);

      if (seenAlbumIds.has(albumId)) {
        continue;
      }

      albums.push(album);
      seenAlbumIds.add(albumId);
    }
  };

  const initialAlbums = await fetchAlbums(queries[0]);
  mergeAlbums(initialAlbums);

  if (hasExactLidarrAlbumMatch(initialAlbums, searchContext)) {
    return albums;
  }

  for (const fallbackQuery of queries.slice(1)) {
    let fallbackAlbums: TidalAlbum[];

    try {
      fallbackAlbums = await fetchAlbums(fallbackQuery);
    } catch {
      return albums;
    }

    mergeAlbums(fallbackAlbums);

    if (hasExactLidarrAlbumMatch(fallbackAlbums, searchContext)) {
      return albums;
    }
  }

  return albums;
}
