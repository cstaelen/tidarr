import { getAppInstance } from "../app-instance";
import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function getTracksByMixId(item: ProcessingItemType) {
  const app = getAppInstance();
  const config = app.locals.config;

  if (!config?.auth) return;

  logs(item.id, `🕖 [MIX]: Get track from mix id`);

  const url = `https://api.tidal.com/v1/mixes/${item.id}/items?countryCode=${config.auth.country_code}`;
  const options: RequestInit = {};
  options.headers = new Headers({
    Authorization: `Bearer ${config.auth.token}`,
  });

  const response = await fetch(url, options);

  if (!response.ok) {
    console.error(
      `❌ [MIX]: Failed to add track to playlist: ${response.status}`,
    );
    return;
  }

  const json = await response.json();

  const ids: number[] = [];
  json.items.forEach((track: { item: { id: number } }) => {
    ids.push(track.item.id);
  });

  if (ids?.length === 0)
    console.error(`❌ [MIX]: Failed to get track ids from mix.`);

  logs(item.id, `✅ [MIX]: Done.`);
  return ids;
}

export async function createNewPlaylist(item: ProcessingItemType) {
  const app = getAppInstance();
  const config = app.locals.config;

  if (!config?.auth) return;

  logs(item.id, `🕖 [MIX]: Create new playlist`);

  const url = `https://openapi.tidal.com/v2/playlists?countryCode=${config?.auth?.country_code}`;
  const options: RequestInit = {};
  options.method = "POST";
  options.headers = new Headers({
    Authorization: `Bearer ${config.auth.token}`,
    "Content-Type": "application/json",
  });

  options.body = JSON.stringify({
    data: {
      attributes: {
        accessType: "PUBLIC",
        description: "descriptions",
        name: item.title,
      },
      type: "playlists",
    },
  });

  const response = await fetch(url, options);

  if (!response.ok) {
    console.error(
      `❌ [MIX]: Failed to add track to playlist: ${response.status}`,
    );
    return;
  }

  const json = await response.json();

  logs(item.id, `✅ [MIX]: Done.`);
  return json.data.id;
}

export async function deletePlaylist(playlistId: number, itemId: string) {
  const app = getAppInstance();
  const config = app.locals.config;

  if (!config?.auth) return;

  logs(itemId, `🕖 [MIX]: Delete temporary playlist`);

  const url = `https://api.tidal.com/v1/playlists/${playlistId}?countryCode=${config.auth.country_code}`;
  const options: RequestInit = {};
  options.method = "DELETE";
  options.headers = new Headers({
    Authorization: `Bearer ${config.auth.token}`,
    "Content-Type": "application/json",
  });

  const response = await fetch(url, options);

  if (!response.ok) {
    console.error(`❌ [MIX]: Failed to delete playlist: ${response.status}`);
    return;
  }

  logs(itemId, `✅ [MIX]: Done.`);
  return response;
}

export async function getPlaylistEtag(playlistId: number) {
  const app = getAppInstance();
  const config = app.locals.config;

  if (!config) return;

  const playlistRes = await fetch(
    `https://tidal.com/v1/playlists/${playlistId}?countryCode=${config.auth.country_code}`,
    {
      headers: { Authorization: `Bearer ${config.auth.token}` },
    },
  );

  if (!playlistRes.ok) {
    console.error(
      `❌ [MIX]: Failed to fetch playlist ETag: ${playlistRes.status}`,
    );
    return;
  }

  const etag = playlistRes.headers.get("etag");
  if (!etag) {
    console.error("⚠️ [MIX]: No ETag returned by Tidal API");
    return;
  }

  return etag;
}

export async function addTracksToPlaylist(
  playlistId: number,
  trackIds: number[],
  itemId: string,
) {
  const app = getAppInstance();
  const config = app.locals.config;

  if (!config) return;

  logs(itemId, `🕖 [MIX]: Add track ids to new playlist`);

  const etag = await getPlaylistEtag(playlistId);
  const url = `https://tidal.com/v1/playlists/${playlistId}/items?countryCode=FR&locale=fr_FR&deviceType=BROWSER`;

  const options: RequestInit = {
    method: "POST",
    headers: new Headers({
      Authorization: `Bearer ${config.auth.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "If-None-Match": etag,
    } as HeadersInit),
    body: new URLSearchParams({
      trackIds: trackIds.join(","),
      onArtifactNotFound: "FAIL",
      onDupes: "SKIP",
    }).toString(),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `❌ [MIX]: Failed to add track to playlist: ${response.status}`,
    );
  }
  const json = await response.json();

  logs(itemId, `✅ [MIX]: Done.`);
  return json;
}
