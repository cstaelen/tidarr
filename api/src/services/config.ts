import { execSync } from "child_process";
import { BUILD_PATH } from "../../constants";

export async function configureServer() {
  console.log(`=== Set config files ===`);
  console.log(`Executing: init.sh`);

  const output_config = await execSync(`sh ${BUILD_PATH}/api/scripts/init.sh`, {
    encoding: "utf-8",
  });
  console.log("Tidarr configuration :", output_config);

  return {
    noToken: output_config?.includes("No token found"),
    output: output_config,
    parameters: {
      api: {
        ENABLE_BEETS: process.env.ENABLE_BEETS,
        ENABLE_PLEX_UPDATE: process.env.ENABLE_PLEX_UPDATE,
        PLEX_URL: process.env.PLEX_URL,
        PLEX_LIBRARY: process.env.PLEX_LIBRARY,
        PLEX_TOKEN: process.env.PLEX_TOKEN,
        PLEX_PATH: process.env.PLEX_PATH,
        ENABLE_GOTIFY: process.env.ENABLE_GOTIFY,
        GOTIFY_URL: process.env.GOTIFY_URL,
        GOTIFY_TOKEN: process.env.GOTIFY_TOKEN,
      },
      app: {
        REACT_APP_TIDAL_SEARCH_TOKEN: process.env.REACT_APP_TIDAL_SEARCH_TOKEN,
        REACT_APP_TIDAL_COUNTRY_CODE: process.env.REACT_APP_TIDAL_COUNTRY_CODE,
        REACT_APP_TIDARR_SEARCH_URL: process.env.REACT_APP_TIDARR_SEARCH_URL,
        REACT_APP_TIDARR_VERSION: process.env.REACT_APP_TIDARR_VERSION,
        REACT_APP_TIDARR_REPO_URL: process.env.REACT_APP_TIDARR_REPO_URL,
      },
    },
  };
}
