import { execSync } from "child_process";

import { ROOT_PATH, SYNC_DEFAULT_CRON } from "../../constants";

export async function configureServer() {
  console.log(`---------------------`);
  console.log(`⚙️ LOAD TIDARR CONFIG`);
  console.log(`---------------------`);

  try {
    const output_config = execSync(
      `bash ${ROOT_PATH}/api/scripts/init.sh ${process.env.ENVIRONMENT}`,
      {
        encoding: "utf-8",
      },
    );

    console.log(output_config);

    return {
      output: output_config,
      parameters: {
        ENABLE_BEETS: process.env.ENABLE_BEETS || "",
        PLEX_URL: process.env.PLEX_URL || "",
        PLEX_LIBRARY: process.env.PLEX_LIBRARY || "",
        PLEX_TOKEN: process.env.PLEX_TOKEN || "",
        PLEX_PATH: process.env.PLEX_PATH || "",
        NAVIDROME_URL: process.env.NAVIDROME_URL || "",
        NAVIDROME_USER: process.env.NAVIDROME_USER || "",
        NAVIDROME_PASSWORD: process.env.NAVIDROME_PASSWORD ? "****" : "",
        GOTIFY_URL: process.env.GOTIFY_URL || "",
        GOTIFY_TOKEN: process.env.GOTIFY_TOKEN || "",
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
      },
    };
  } catch (error: unknown) {
    console.log("❌ [TIDARR] Error config", error);
  }
}
