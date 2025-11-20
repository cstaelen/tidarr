import test, { expect, Page } from "@playwright/test";

import { mockConfigAPI, mockTidalQueries } from "./utils/mock";

/**
 * Helper function to verify Plex search button visibility and functionality
 * @param page - Playwright Page object
 * @param url - URL to navigate to
 * @param pivot - Expected pivot parameter in Plex URL (albums, artists, tracks)
 * @param shouldBeVisible - Whether the button should be visible or not
 */
async function checkPlexButton(
  page: Page,
  url: string,
  pivot: string,
  shouldBeVisible: boolean = true,
) {
  await page.goto(url);

  const plexButton = page
    .getByRole("button", {
      name: /Search on Plex/i,
    })
    .first();

  if (shouldBeVisible) {
    await expect(plexButton).toBeVisible();

    // Intercept window.open to verify the URL without actually opening it
    let openedUrl: string | undefined;
    await page.evaluate(() => {
      window.open = (url) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__lastOpenedUrl = url;
        return null;
      };
    });

    await plexButton.click();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
    openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl);
    expect(openedUrl).toContain("http://plex.url/web/index.html#!/search");
    expect(openedUrl).toContain(`pivot=${pivot}`);
  } else {
    await expect(plexButton).not.toBeVisible();
  }
}

/**
 * Mock Plex API proxy endpoint
 */
async function mockPlexProxy(page: Page) {
  // Mock Plex search without type (returns artists and albums)
  await page.route("**/proxy/plex/search**", async (route) => {
    const url = new URL(route.request().url());
    const type = url.searchParams.get("type");

    if (type === "10") {
      // Tracks request
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<MediaContainer size="1">
  <Track title="Test Track" />
</MediaContainer>`;
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/xml" },
        body: xmlResponse,
      });
    } else {
      // General search (artists/albums)
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<MediaContainer size="2">
  <Directory type="artist" title="Test Artist"/>
  <Directory type="album" title="Test Album"/>
</MediaContainer>`;
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/xml" },
        body: xmlResponse,
      });
    }
  });
}

test("Plex Search: Should display 'Search on Plex' button on Album, Artist and Track pages", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockTidalQueries(page);
  await mockPlexProxy(page);

  // Test on Album page
  await checkPlexButton(page, "/album/77610756", "albums");

  // Test on Artist page
  await checkPlexButton(page, "/artist/19368", "artists");

  // Test on Track page
  await checkPlexButton(page, "/track/77610761", "tracks");
});

test("Plex Search: Should hide 'Search on Plex' button when PLEX var does not exists", async ({
  page,
}) => {
  await mockTidalQueries(page);

  // Mock config API with no PLEX var
  await page.route("**/settings", async (route) => {
    const json = {
      noToken: false,
      output: "",
      parameters: {
        ENABLE_BEETS: "true",
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
          expires_at: 1234567890,
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

  // Test on Album page - button should NOT be visible
  await checkPlexButton(page, "/album/77610756", "albums", false);

  // Test on Artist page - button should NOT be visible
  await checkPlexButton(page, "/artist/19368", "artists", false);

  // Test on Track page - button should NOT be visible
  await checkPlexButton(page, "/track/77610761", "tracks", false);
});
