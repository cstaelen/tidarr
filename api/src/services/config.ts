import { SYNC_DEFAULT_CRON } from "../../constants";
import { get_tiddl_config } from "../helpers/get_tiddl_config";
import { initializeFiles } from "../helpers/initialize-server";
import { TiddlConfig } from "../types";

import { refreshTidalToken, shouldRefreshToken } from "./tiddl";

export async function configureServer() {
  console.log(`---------------------`);
  console.log(`⚙️ LOAD TIDARR CONFIG`);
  console.log(`---------------------`);

  try {
    const output_config = initializeFiles();

    return {
      output: output_config,
      parameters: {
        ENABLE_BEETS: process.env.ENABLE_BEETS || "",
        REPLAY_GAIN: process.env.REPLAY_GAIN || "",
        PLEX_URL: process.env.PLEX_URL || "",
        PLEX_LIBRARY: process.env.PLEX_LIBRARY || "",
        PLEX_TOKEN: process.env.PLEX_TOKEN || "",
        PLEX_PATH: process.env.PLEX_PATH || "",
        JELLYFIN_URL: process.env.JELLYFIN_URL || "",
        JELLYFIN_API_KEY: process.env.JELLYFIN_API_KEY || "",
        NAVIDROME_URL: process.env.NAVIDROME_URL || "",
        NAVIDROME_USER: process.env.NAVIDROME_USER || "",
        NAVIDROME_PASSWORD: process.env.NAVIDROME_PASSWORD ? "****" : "",
        GOTIFY_URL: process.env.GOTIFY_URL || "",
        GOTIFY_TOKEN: process.env.GOTIFY_TOKEN || "",
        NTFY_URL: process.env.NTFY_URL || "",
        NTFY_TOPIC: process.env.NTFY_TOPIC || "",
        NTFY_TOKEN: process.env.NTFY_TOKEN || "",
        NTFY_PRIORITY: process.env.NTFY_PRIORITY || "",
        PUID: process.env.PUID || "",
        PGID: process.env.PGID || "",
        UMASK: process.env.UMASK || "",
        TIDARR_VERSION: process.env.VERSION || "",
        APPRISE_API_ENDPOINT: process.env.APPRISE_API_ENDPOINT || "",
        APPRISE_API_TAG: process.env.APPRISE_API_TAG || "",
        PUSH_OVER_URL: process.env.PUSH_OVER_URL || "",
        LOCK_QUALITY: process.env.LOCK_QUALITY || "",
        ENABLE_TIDAL_PROXY: process.env.ENABLE_TIDAL_PROXY || "",
        SYNC_CRON_EXPRESSION:
          process.env.SYNC_CRON_EXPRESSION || SYNC_DEFAULT_CRON || "",
        NO_DOWNLOAD: process.env.NO_DOWNLOAD || "",
        ENABLE_HISTORY: process.env.ENABLE_HISTORY || "",
        M3U_BASEPATH_FILE: process.env.M3U_BASEPATH_FILE || "",
      },
    };
  } catch (error: unknown) {
    console.log("❌ [TIDARR] Error config", error);
  }
}

/**
 * Refresh Tidal token and reload config if needed
 * Checks if token needs refresh based on expires_at timestamp
 * Only refreshes if token is expired or expiring soon (< TOKEN_REFRESH_THRESHOLD)
 * @param tiddlConfig - Current TiddlConfig to check expiry
 * @returns Promise with updated TiddlConfig and errors
 */
export async function refreshAndReloadConfig(
  tiddlConfig?: TiddlConfig,
): Promise<{ config: TiddlConfig; errors: string[] }> {
  // Skip refresh if token is still valid
  if (!shouldRefreshToken(tiddlConfig)) {
    // If config is already loaded and valid, return it without re-reading files
    if (tiddlConfig) {
      return { config: tiddlConfig, errors: [] };
    }
    // Otherwise load config from disk (first time only)
    return get_tiddl_config();
  }

  // Refresh token using the centralized function
  await refreshTidalToken(true, tiddlConfig);

  // Reload config after refresh completes
  const result = get_tiddl_config();

  return result;
}
