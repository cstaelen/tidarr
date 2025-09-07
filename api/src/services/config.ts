import { execSync } from "child_process";

import { BUILD_PATH } from "../../constants";
import { get_tiddl_config } from "../helpers/get_tiddl_config";

export async function configureServer() {
  console.log(`=== Set config files ===`);
  console.log(`Executing: init.sh`);

  try {
    const output_config = execSync(
      `bash ${BUILD_PATH}/api/scripts/init.sh ${process.env.ENVIRONMENT}`,
      {
        encoding: "utf-8",
      },
    );
    console.log("Tidarr configuration :", output_config);

    const hasTiddlConfig = !output_config?.includes("[Tiddl] Init config OK");

    let tiddl_config = null;
    if (hasTiddlConfig) {
      tiddl_config = await get_tiddl_config();
    }

    return {
      noToken: !hasTiddlConfig || tiddl_config?.auth?.token.length === 0,
      tiddl_config: tiddl_config,
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
        TIDARR_VERSION: process.env.VERSION || "",
        ENABLE_APPRISE_API: process.env.ENABLE_APPRISE_API || "",
        APPRISE_API_ENDPOINT: process.env.APPRISE_API_ENDPOINT || "",
        APPRISE_API_TAG: process.env.APPRISE_API_TAG || "",
        LOCK_QUALITY: process.env.LOCK_QUALITY || "",
      },
    };
  } catch (error: unknown) {
    console.log("Error config", error);
  }
}
