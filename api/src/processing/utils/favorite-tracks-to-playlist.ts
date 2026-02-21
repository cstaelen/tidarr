import { TIDAL_API_URL } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { ProcessingItemType } from "../../types";

import { logs } from "./logs";

const TIDAL_PAGE_LIMIT = 100;

/**
 * Fetches all favorite track IDs from the Tidal API with pagination.
 * @param item - The processing item (favorite_tracks type)
 * @returns Array of track IDs
 */
export async function getFavoriteTrackIds(
  item: ProcessingItemType,
): Promise<number[]> {
  const app = getAppInstance();
  const tiddlConfig = app.locals.tiddlConfig;

  if (!tiddlConfig?.auth) return [];

  logs(item.id, `🕖 [FAV]: Fetching favorite track IDs...`);

  const userId = tiddlConfig.auth.user_id;
  const country = tiddlConfig.auth.country_code;
  const headers = { Authorization: `Bearer ${tiddlConfig.auth.token}` };

  const ids: number[] = [];
  let offset = 0;
  let totalItems = Infinity;

  while (offset < totalItems) {
    const url = `${TIDAL_API_URL}/v1/users/${userId}/favorites/tracks?countryCode=${country}&limit=${TIDAL_PAGE_LIMIT}&offset=${offset}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      logs(item.id, `❌ [FAV]: Failed to fetch favorites: ${response.status}`);
      break;
    }

    const data = await response.json();
    totalItems = data.totalNumberOfItems ?? data.items?.length ?? 0;

    for (const trackItem of data.items || []) {
      if (trackItem.item?.id) {
        ids.push(trackItem.item.id);
      }
    }

    offset += TIDAL_PAGE_LIMIT;
  }

  logs(item.id, `✅ [FAV]: Found ${ids.length} favorite tracks.`);
  return ids;
}
