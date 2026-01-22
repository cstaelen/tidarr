import { SYNC_DEFAULT_CRON } from "../../constants";
import {
  ensureFreshToken,
  getFreshTiddlConfig,
} from "../helpers/get-fresh-token";
import { initializeFiles } from "../helpers/initialize-server";
import { TiddlConfig } from "../types";

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
        SYNC_CRON_EXPRESSION:
          process.env.SYNC_CRON_EXPRESSION || SYNC_DEFAULT_CRON || "",
        NO_DOWNLOAD: process.env.NO_DOWNLOAD || "",
        ENABLE_HISTORY: process.env.ENABLE_HISTORY || "",
        M3U_BASEPATH_FILE: process.env.M3U_BASEPATH_FILE || "",
        PLAYLIST_ALBUMS: process.env.PLAYLIST_ALBUMS || "",
      },
    };
  } catch (error: unknown) {
    console.log("❌ [TIDARR] Error config", error);
  }
}

/** Refresh token if needed and reload config from disk */
export async function refreshAndReloadConfig(): Promise<{
  config: TiddlConfig;
  errors: string[];
}> {
  // Try to ensure fresh token, but don't fail if no token exists
  try {
    await ensureFreshToken();
  } catch (error) {
    console.log(`❌ [Tidarr] Refresh token failed: ${error}`);
  }
  return getFreshTiddlConfig();
}
