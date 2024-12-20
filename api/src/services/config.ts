import { execSync } from "child_process";

import { BUILD_PATH } from "../../constants";
import { TiddlConfig } from "../types";

export async function configureServer() {
  console.log(`=== Set config files ===`);
  console.log(`Executing: init.sh`);

  const output_config = await execSync(`sh ${BUILD_PATH}/api/scripts/init.sh`, {
    encoding: "utf-8",
  });
  console.log("Tidarr configuration :", output_config);

  const hasTiddlConfig = !output_config?.includes("[Tiddl] No token set");

  let tiddl_config = null;
  if (hasTiddlConfig) {
    const token_output = await execSync(`cat /root/.tiddl_config.json`, {
      encoding: "utf-8",
    });

    tiddl_config = JSON.parse(token_output) as TiddlConfig;
  }

  const version_output = await execSync(`cat ${BUILD_PATH}/api/package.json`, {
    encoding: "utf-8",
  });

  const version = JSON.parse(version_output)?.version;

  return {
    noToken: !hasTiddlConfig || tiddl_config?.token.length === 0,
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
      TIDDL_FORMAT: process.env.TIDDL_FORMAT || "",
      TIDDL_PLAYLIST_FORMAT: process.env.TIDDL_PLAYLIST_FORMAT || "",
      TIDDL_QUALITY: process.env.TIDDL_QUALITY || "",
      TIDDL_FORCE_EXT: process.env.TIDDL_FORCE_EXT || "",
      TIDARR_VERSION: version || "",
    },
  };
}
