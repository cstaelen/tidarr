import { Page } from "@playwright/test";

export async function mockAPI(page: Page) {
  await page.route("*/**/check", async (route) => {
    const json = {
      noToken: false,
      output: "",
      parameters: {
        api: {
          ENABLE_BEETS: "true",
          ENABLE_PLEX_UPDATE: "true",
          PLEX_URL: "http://plex.url",
          PLEX_LIBRARY: "3",
          PLEX_TOKEN: "abc-plex-token-xyz",
          PLEX_PATH: "/fodler/to/plex/music",
          ENABLE_GOTIFY: "true",
          GOTIFY_URL: "http://gotify.url",
          GOTIFY_TOKEN: "abc-gotify-token-xyz",
          TIDARR_VERSION: "0.0.0",
          TIDARR_REPO_URL: "cstaelen/tidarr",
        },
        app: {
          REACT_APP_TIDAL_SEARCH_TOKEN: "CzET4vdadNUFQ5JU",
          REACT_APP_TIDAL_COUNTRY_CODE: "CA",
          REACT_APP_TIDARR_SEARCH_URL: "http://www.tidal.com/album/",
        },
      },
    };
    await route.fulfill({ json });
  });
}
