import fs from "fs";
import path from "path";

import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { fetchTidalWithRefresh } from "../../helpers/fetch-tidal";
import { ProcessingItemType, TiddlConfig } from "../../types";

import { logs } from "./logs";

const AUDIO_EXTENSIONS = [".flac", ".m4a", ".mp3", ".aac", ".ogg", ".opus"];
const TIDAL_PAGE_LIMIT = 100;
const ALBUM_BATCH_SIZE = 50;

type FavoriteTrackItem = {
  item: {
    id: number;
    title: string;
    version?: string | null;
    trackNumber: number;
    album: { id: number; title: string };
  };
};

type AlbumDetails = {
  releaseDate?: string;
  artists?: Array<{ name: string; type?: string }>;
};

async function fetchAllFavoriteTracks(
  tiddlConfig: TiddlConfig,
): Promise<FavoriteTrackItem[]> {
  const { user_id: userId, country_code: country } = tiddlConfig.auth;
  const baseUrl = `${TIDAL_API_URL}/v1/users/${userId}/favorites/tracks?countryCode=${country}&order=DATE&orderDirection=DESC`;

  const allItems: FavoriteTrackItem[] = [];
  let offset = 0;
  let totalItems = Infinity;

  while (offset < totalItems) {
    const response = await fetchTidalWithRefresh(
      `${baseUrl}&limit=${TIDAL_PAGE_LIMIT}&offset=${offset}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch favorites: ${response.status} - ${await response.text()}`,
      );
    }
    const data = await response.json();
    totalItems = data.totalNumberOfItems ?? data.items?.length ?? 0;
    if (data.items) allItems.push(...data.items);
    offset += TIDAL_PAGE_LIMIT;
  }

  return allItems;
}

async function fetchAlbumDetails(
  albumIds: number[],
  country: string,
): Promise<Map<number, AlbumDetails>> {
  const detailsMap = new Map<number, AlbumDetails>();
  const uniqueIds = [...new Set(albumIds)];

  for (let i = 0; i < uniqueIds.length; i += ALBUM_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + ALBUM_BATCH_SIZE);
    const response = await fetchTidalWithRefresh(
      `${TIDAL_API_URL}/v1/albums?ids=${batch.join(",")}&countryCode=${country}`,
    );
    if (!response.ok) continue;
    const albums: (AlbumDetails & { id: number })[] = await response.json();
    for (const album of albums) {
      detailsMap.set(album.id, album);
    }
  }

  return detailsMap;
}

function resolveTrackTemplate(
  template: string,
  track: FavoriteTrackItem["item"],
  albumDetails: AlbumDetails,
): string {
  const albumArtist =
    albumDetails.artists?.find((a) => a.type === "MAIN")?.name ??
    albumDetails.artists?.[0]?.name ??
    "Unknown Artist";
  const year = albumDetails.releaseDate
    ? new Date(albumDetails.releaseDate).getFullYear().toString()
    : "0000";
  const titleVersion = track.version
    ? `${track.title} (${track.version})`
    : track.title;

  return template
    .replace(/\{album\.artist\}/g, albumArtist)
    .replace(/\{album\.date:%Y\}/g, year)
    .replace(/\{album\.title\}/g, track.album.title || "Unknown Album")
    .replace(
      /\{item\.number:02d\}/g,
      (track.trackNumber ?? 1).toString().padStart(2, "0"),
    )
    .replace(/\{item\.title_version\}/g, titleVersion)
    .split("/")
    .map((segment) => segment.replace(/\.+$/, ""))
    .join("/");
}

function findAudioFile(
  libraryPath: string,
  resolvedPath: string,
): string | null {
  for (const ext of AUDIO_EXTENSIONS) {
    const fullPath = path.join(libraryPath, resolvedPath + ext);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

/**
 * Generates an M3U playlist for favorite_tracks, written directly to the library.
 * Fetches the full Tidal favorites list (newest first), resolves each track's path
 * via the tiddl template, and rewrites the M3U completely on every run.
 */
export async function generateFavoriteTracksM3U(
  item: ProcessingItemType,
): Promise<void> {
  if (item.type !== "favorite_tracks") return;

  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;

  if (!tiddlConfig?.m3u?.save) return;

  const libraryPath = tiddlConfig?.download?.download_path;
  if (!libraryPath) {
    logs(
      item.id,
      `⚠️ [FAV] No library path configured, skipping M3U generation`,
    );
    return;
  }

  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";
  const trackTemplate =
    tiddlConfig?.templates?.track ??
    tiddlConfig?.templates?.default ??
    `{album.artist}/{album.date:%Y} - {album.title}/{item.number:02d}. {item.title_version}`;

  const playlistTemplate =
    tiddlConfig?.m3u?.templates?.playlist ?? `Playlists/{playlist.title}`;
  const resolvedPlaylistPath = playlistTemplate.replace(
    /\{playlist\.title\}/g,
    item.title || "Favorite Tracks",
  );

  logs(item.id, `🕖 [FAV] Fetching favorite tracks from Tidal...`);

  try {
    const favoriteTracks = await fetchAllFavoriteTracks(tiddlConfig);
    logs(
      item.id,
      `📊 [FAV] Found ${favoriteTracks.length} favorite tracks, fetching album details...`,
    );

    const albumIds = favoriteTracks
      .filter(({ item: track }) => !!track?.album?.id)
      .map(({ item: track }) => track.album.id);

    const albumDetailsMap = await fetchAlbumDetails(
      albumIds,
      tiddlConfig.auth.country_code,
    );

    let missing = 0;
    const m3uEntries = favoriteTracks
      .filter(({ item: track }) => !!track)
      .map(({ item: track }) => {
        const albumDetails = albumDetailsMap.get(track.album.id) ?? {};
        const resolvedPath = resolveTrackTemplate(
          trackTemplate,
          track,
          albumDetails,
        );
        const audioFile = findAudioFile(libraryPath, resolvedPath);
        if (!audioFile) {
          missing++;
          return null;
        }
        return path.join(basePath, path.relative(libraryPath, audioFile));
      })
      .filter((entry): entry is string => entry !== null);

    if (m3uEntries.length === 0) {
      logs(
        item.id,
        `⚠️ [FAV] No tracks found in library, skipping M3U generation`,
      );
      return;
    }

    const m3uFilePath = path.join(libraryPath, `${resolvedPlaylistPath}.m3u`);
    fs.mkdirSync(path.dirname(m3uFilePath), { recursive: true });
    fs.writeFileSync(
      m3uFilePath,
      ["#EXTM3U", ...m3uEntries].join("\n") + "\n",
      "utf-8",
    );

    logs(
      item.id,
      `✅ [FAV] M3U generated: ${resolvedPlaylistPath}.m3u (${m3uEntries.length} tracks, ${missing} not yet downloaded)`,
    );
  } catch (e) {
    logs(item.id, `❌ [FAV] Error generating M3U: ${(e as Error).message}`);
  }
}
