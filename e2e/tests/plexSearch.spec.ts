import test, { expect } from "@playwright/test";

import { goToHome } from "./utils/helpers";
import { mockConfigAPI, mockTidalQueries } from "./utils/mock";

test("Plex Search: Should display 'Search on Plex' button on Album, Artist and Track pages", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockTidalQueries(page);
  await goToHome(page);

  // Test on Album page
  await page.goto("http://localhost:8484/album/77610756");
  await page.waitForLoadState("networkidle");

  const albumPlexButton = page.getByRole("button", {
    name: /Search on Plex/i,
  });
  await expect(albumPlexButton).toBeVisible();

  // Verify button opens search in new tab with correct query
  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    albumPlexButton.click(),
  ]);
  expect(newPage.url()).toContain("http://plex.url/web/index.html#!/search");
  expect(newPage.url()).toContain("pivot=albums");
  await newPage.close();

  // Test on Artist page
  await page.goto("http://localhost:8484/artist/19368");
  await page.waitForLoadState("networkidle");

  const artistPlexButton = page.getByRole("button", {
    name: /Search on Plex/i,
  });
  await expect(artistPlexButton).toBeVisible();

  const [artistNewPage] = await Promise.all([
    page.context().waitForEvent("page"),
    artistPlexButton.click(),
  ]);
  expect(artistNewPage.url()).toContain(
    "http://plex.url/web/index.html#!/search",
  );
  expect(artistNewPage.url()).toContain("pivot=artists");
  await artistNewPage.close();

  // Test on Track page
  await page.goto("http://localhost:8484/track/77610761");
  await page.waitForLoadState("networkidle");

  const trackPlexButton = page.getByRole("button", {
    name: /Search on Plex/i,
  });
  await expect(trackPlexButton).toBeVisible();

  const [trackNewPage] = await Promise.all([
    page.context().waitForEvent("page"),
    trackPlexButton.click(),
  ]);
  expect(trackNewPage.url()).toContain(
    "http://plex.url/web/index.html#!/search",
  );
  expect(trackNewPage.url()).toContain("pivot=tracks");
  await trackNewPage.close();
});

test("Plex Search: Should hide 'Search on Plex' button when PLEX_SEARCH_LINK is not true", async ({
  page,
}) => {
  // Mock config API with PLEX_SEARCH_LINK set to false
  await page.route("**/settings", async (route) => {
    const json = {
      noToken: false,
      output: "",
      parameters: {
        ENABLE_BEETS: "true",
        PLEX_URL: "http://plex.url",
        PLEX_LIBRARY: "3",
        PLEX_TOKEN: "abc-plex-token-xyz",
        PLEX_PATH: "/folder/to/plex/music",
        PLEX_SEARCH_LINK: false, // Disabled
        GOTIFY_URL: "http://gotify.url",
        GOTIFY_TOKEN: "abc-gotify-token-xyz",
        TIDARR_VERSION: "0.0.0-testing",
        PUID: "",
        PGID: "",
        UMASK: "",
        APPRISE_API_ENDPOINT: "",
        APPRISE_API_TAG: "",
        PUSH_OVER_URL: "",
        ENABLE_TIDAL_PROXY: "true",
      },
      tiddl_config: {
        auth: {
          token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires: 1234567890,
          user_id: "192283714",
          country_code: "FR",
        },
        templates: {
          track: "tracks/{artist}/{artist} - {title}",
          video: "videos/{artist}/{artist} - {title}",
          album: "albums/{album_artist}/{year} - {album}/{number:02d}. {title}",
          playlist:
            "playlists/{playlist}/{playlist_number:02d}. {artist} - {title}",
          mix: "playlists/{playlist}/{playlist_number:02d}. {artist} - {title}",
        },
        download: {
          quality: "high",
        },
      },
    };
    await route.fulfill({ json });
  });

  await mockTidalQueries(page);
  await goToHome(page);

  // Test on Album page - button should NOT be visible
  await page.goto("http://localhost:8484/album/77610756");
  await page.waitForLoadState("networkidle");

  const albumPlexButton = page.getByRole("button", {
    name: /Search on Plex/i,
  });
  await expect(albumPlexButton).not.toBeVisible();

  // Test on Artist page - button should NOT be visible
  await page.goto("http://localhost:8484/artist/19368");
  await page.waitForLoadState("networkidle");

  const artistPlexButton = page.getByRole("button", {
    name: /Search on Plex/i,
  });
  await expect(artistPlexButton).not.toBeVisible();

  // Test on Track page - button should NOT be visible
  await page.goto("http://localhost:8484/track/77610761");
  await page.waitForLoadState("networkidle");

  const trackPlexButton = page.getByRole("button", {
    name: /Search on Plex/i,
  });
  await expect(trackPlexButton).not.toBeVisible();
});
