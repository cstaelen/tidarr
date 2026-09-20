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

const TIDAL_PAGE_LIMIT = 100;

/**
 * Fetches every page of a Tidal v1 API list endpoint (max page size is 100 —
 * see https://developer.tidal.com), accumulating `items` across pages using
 * `totalNumberOfItems` to know when to stop.
 *
 * @param baseUrl - Tidal API URL without `limit`/`offset` query params
 * @param errorContext - Used in the thrown error message on a non-ok response
 */
export async function fetchAllTidalPages<T>(
  baseUrl: string,
  errorContext: string,
): Promise<T[]> {
  const allItems: T[] = [];
  let offset = 0;
  let totalItems = Infinity;

  while (offset < totalItems) {
    const response = await fetchTidalWithRefresh(
      `${baseUrl}&limit=${TIDAL_PAGE_LIMIT}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${errorContext}: ${response.status} - ${await response.text()}`,
      );
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
