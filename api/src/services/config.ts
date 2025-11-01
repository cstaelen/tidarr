import { execSync, spawnSync } from "child_process";

import { ROOT_PATH, SYNC_DEFAULT_CRON } from "../../constants";

export async function configureServer() {
  console.log(`---------------------`);
  console.log(`⚙️ LOAD TIDARR CONFIG`);
  console.log(`---------------------`);
  console.log(`🕖 [TIDARR] Executing: init.sh`);

  try {
    const output_config = execSync(
      `bash ${ROOT_PATH}/api/scripts/init.sh ${process.env.ENVIRONMENT}`,
      {
        encoding: "utf-8",
      },
    );

    return {
      output: output_config,
      parameters: {
        ENABLE_BEETS: process.env.ENABLE_BEETS || "",
        ENABLE_PLEX_UPDATE: process.env.ENABLE_PLEX_UPDATE || "",
        PLEX_URL: process.env.PLEX_URL || "",
        PLEX_LIBRARY: process.env.PLEX_LIBRARY || "",
        PLEX_TOKEN: process.env.PLEX_TOKEN || "",
        PLEX_PATH: process.env.PLEX_PATH || "",
        ENABLE_GOTIFY: process.env.ENABLE_GOTIFY || "",
        GOTIFY_URL: process.env.GOTIFY_URL || "",
        GOTIFY_TOKEN: process.env.GOTIFY_TOKEN || "",
        PUID: process.env.PUID || "",
        PGID: process.env.PGID || "",
        UMASK: process.env.UMASK || "",
        TIDARR_VERSION: process.env.VERSION || "",
        ENABLE_APPRISE_API: process.env.ENABLE_APPRISE_API || "",
        APPRISE_API_ENDPOINT: process.env.APPRISE_API_ENDPOINT || "",
        APPRISE_API_TAG: process.env.APPRISE_API_TAG || "",
        PUSH_OVER_URL: process.env.PUSH_OVER_URL || "",
        LOCK_QUALITY: process.env.LOCK_QUALITY || "",
        ENABLE_TIDAL_PROXY: process.env.ENABLE_TIDAL_PROXY || "",
        SYNC_CRON_EXPRESSION:
          process.env.SYNC_CRON_EXPRESSION || SYNC_DEFAULT_CRON || "",
      },
    };
  } catch (error: unknown) {
    console.log("❌ [TIDARR] Error config", error);
  }
}

export function refreshTidalToken() {
  execSync("cp -rf /home/app/standalone/shared/tiddl.json /root/tiddl.json");
  console.log("🕖 [TIDDL] Refreshing Tidal token...");
  spawnSync("tiddl", ["auth", "refresh"]);
  console.log("✅ [TIDDL] Tidal token refreshed.");
}
