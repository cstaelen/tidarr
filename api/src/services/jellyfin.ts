// JELLYFIN API
// https://api.jellyfin.org/#tag/Library/operation/RefreshLibrary

import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

export async function jellyfinUpdate(item: ProcessingItemType) {
  try {
    if (process.env.JELLYFIN_URL && process.env.JELLYFIN_API_KEY) {
      console.log("--------------------");
      console.log(`🔄 JELLYFIN UPDATE`);
      console.log("--------------------");

      console.log(`🔍 [JELLYFIN] Send refresh request ...`);

      // Jellyfin 12+ disables the legacy X-Emby-Token header by default
      const headers = {
        "X-Emby-Token": process.env.JELLYFIN_API_KEY,
        Authorization: `MediaBrowser Token="${process.env.JELLYFIN_API_KEY}"`,
      };
      const url = `${process.env.JELLYFIN_URL}/Library/Refresh`;

      const response = await fetch(url, { method: "POST", headers });

      switch (response.status) {
        case 204:
          logs(item.id, `✅ [JELLYFIN] Libraries refreshed successfully!`);
          break;
        case 401:
          logs(
            item.id,
            `❌ [JELLYFIN] Unauthorized (401). Check your API key or permissions.`,
          );
          break;
        case 403:
          logs(
            item.id,
            `❌ [JELLYFIN] Forbidden (403). The server rejected the request.`,
          );
          break;
        case 503:
          logs(
            item.id,
            `❌ [JELLYFIN] Service unavailable (503). The server is starting or temporarily unavailable.`,
          );
          break;
        default:
          logs(item.id, `❌ [JELLYFIN] Unexpected status: ${response.status}`);
          break;
      }
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [JELLYFIN] Error during Jellyfin update: ${(err as Error).message}`,
    );
  }
}
