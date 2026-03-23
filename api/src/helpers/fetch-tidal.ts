import { getAppInstance } from "./app-instance";
import { refreshTokenOnce } from "./refresh-token";

/**
 * Fetch Tidal API with automatic token refresh on 401.
 * Shared helper used across mix-to-playlist, favorite-tracks, and lidarr.
 */
export async function fetchTidalWithRefresh(
  url: string,
  options: RequestInit = {},
): Promise<globalThis.Response> {
  const app = getAppInstance();
  const token = app.locals.tiddlConfig?.auth?.token;

  const makeRequest = (authToken: string) => {
    const headers = new Headers(options.headers as HeadersInit);
    headers.set("Authorization", `Bearer ${authToken}`);
    return fetch(url, { ...options, headers });
  };

  let response = await makeRequest(token);

  if (response.status === 401) {
    console.log("🔑 [TIDAL] Got 401, refreshing token...");
    await refreshTokenOnce(app);
    const newToken = app.locals.tiddlConfig?.auth?.token;

    if (newToken && newToken !== token) {
      response = await makeRequest(newToken);
    }
  }

  return response;
}
