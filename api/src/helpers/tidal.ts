import { TiddlConfig } from "../types";

export async function getTracksByMixId(mixId: number, config: TiddlConfig) {
  const url = `https://api.tidal.com/v1/mixes/${mixId}/items?countryCode=${config.auth.country_code}`;
  const options: RequestInit = {};
  options.headers = new Headers({
    Authorization: `Bearer ${config.auth.token}`,
  });

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed to add track to playlist: ${response.status}`);
  }

  const json = await response.json();

  const ids: number[] = [];
  json.items.forEach((track: { item: { id: number } }) => {
    ids.push(track.item.id);
  });

  return ids;
}

export async function createNewPlaylist(title: string, config: TiddlConfig) {
  const url = `https://openapi.tidal.com/v2/playlists?countryCode=${config.auth.country_code}`;
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
        name: title,
      },
      type: "playlists",
    },
  });

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed to add track to playlist: ${response.status}`);
  }

  const json = await response.json();
  return json.data.id;
}

export async function deletePlaylist(playlistId: number, config: TiddlConfig) {
  const url = `https://api.tidal.com/v1/playlists/${playlistId}?countryCode=${config.auth.country_code}`;
  const options: RequestInit = {};
  options.method = "DELETE";
  options.headers = new Headers({
    Authorization: `Bearer ${config.auth.token}`,
    "Content-Type": "application/json",
  });

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed to delete playlist: ${response.status}`);
  }

  return response;
}

export async function getPlaylistEtag(playlistId: number, config: TiddlConfig) {
  const playlistRes = await fetch(
    `https://tidal.com/v1/playlists/${playlistId}?countryCode=${config.auth.country_code}`,
    {
      headers: { Authorization: `Bearer ${config.auth.token}` },
    },
  );

  if (!playlistRes.ok) {
    throw new Error(`Failed to fetch playlist ETag: ${playlistRes.status}`);
  }

  const etag = playlistRes.headers.get("etag");
  if (!etag) {
    throw new Error("No ETag returned by Tidal API");
  }

  return etag;
}

export async function addTracksToPlaylist(
  playlistId: number,
  trackIds: number[],
  config: TiddlConfig,
) {
  const etag = await getPlaylistEtag(playlistId, config);
  const url = `https://tidal.com/v1/playlists/${playlistId}/items?countryCode=FR&locale=fr_FR&deviceType=BROWSER`;

  const options: RequestInit = {
    method: "POST",
    headers: new Headers({
      Authorization: `Bearer ${config.auth.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "If-None-Match": etag,
    }),
    body: new URLSearchParams({
      trackIds: trackIds.join(","),
      onArtifactNotFound: "FAIL",
      onDupes: "SKIP",
    }).toString(),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed to add track to playlist: ${response.status}`);
  }
  const json = await response.json();
  return json;
}
