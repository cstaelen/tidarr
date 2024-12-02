import { Page } from "@playwright/test";

export async function mockConfigAPI(page: Page) {
  await page.route("*/**/check", async (route) => {
    const json = {
      noToken: false,
      output: "",
      parameters: {
        ENABLE_BEETS: "true",
        ENABLE_PLEX_UPDATE: "true",
        PLEX_URL: "http://plex.url",
        PLEX_LIBRARY: "3",
        PLEX_TOKEN: "abc-plex-token-xyz",
        PLEX_PATH: "/fodler/to/plex/music",
        ENABLE_GOTIFY: "true",
        GOTIFY_URL: "http://gotify.url",
        GOTIFY_TOKEN: "abc-gotify-token-xyz",
      },
    };
    await route.fulfill({ json });
  });
}

export async function mockAuthAPI(page: Page, token: string) {
  await page.route("*/**/is_auth_active", async (route) => {
    const json = { isAuthActive: true };
    await route.fulfill({ json });
  });

  await page.route("*/**/auth", async (route) => {
    const json = { accessGranted: true, token: token };
    await route.fulfill({ json });
  });
}
