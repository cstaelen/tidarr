import { expect, Page } from "@playwright/test";

import { test } from "../test-isolation";

import { mockConfigAPI } from "./utils/mock";

/**
 * Helper function to verify Jellyfin search button visibility and functionality
 * @param page - Playwright Page object
 * @param url - URL to navigate to
 * @param pivot - Expected pivot type (albums, artists, tracks, search)
 * @param shouldBeVisible - Whether the button should be visible or not
 */
async function checkJellyfinButton(
  page: Page,
  url: string,
  pivot: string,
  shouldBeVisible: boolean = true,
) {
  await page.goto(url);

  const jellyfinButton = page
    .getByRole("button", {
      name: /Jellyfin/i,
    })
    .first();

  if (shouldBeVisible) {
    await expect(jellyfinButton).toBeVisible();

    // Intercept window.open to verify the URL without actually opening it
    let openedUrl: string | undefined;
    await page.evaluate(() => {
      window.open = (url) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__lastOpenedUrl = url;
        return null;
      };
    });

    await jellyfinButton.click();
    await page.waitForTimeout(250);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
    openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl);
    await page.waitForTimeout(250);
    expect(openedUrl).toContain(
      "http://jellyfin.url/web/index.html#!/search.html?query=",
    );

    // Jellyfin doesn't have pivot filtering in the URL like Plex/Navidrome
    // It just performs a general search with the query
  } else {
    await expect(jellyfinButton).not.toBeVisible();
  }
}

/**
 * Mock Jellyfin API proxy endpoint
 */
async function mockJellyfinProxy(page: Page) {
  // Mock Jellyfin Artists endpoint
  await page.route("**/proxy/jellyfin/Artists/**", async (route) => {
    const json = {
      ArtistCount: 1,
      AlbumCount: 5,
      SongCount: 42,
    };
    await route.fulfill({ json });
  });

  // Mock Jellyfin Search/Hints endpoint for albums
  await page.route(
    "**/proxy/jellyfin/Search/Hints?**includeItemTypes=MusicAlbum**",
    async (route) => {
      const json = {
        SearchHints: [
          {
            ItemId: "test-album-id",
            Name: "Test Album",
            Type: "MusicAlbum",
          },
        ],
        TotalRecordCount: 1,
      };
      await route.fulfill({ json });
    },
  );

  // Mock Jellyfin Items endpoint for tracks in album
  await page.route(
    "**/proxy/jellyfin/Items?parentId=**includeItemTypes=Audio**",
    async (route) => {
      const json = {
        Items: [],
        TotalRecordCount: 12,
      };
      await route.fulfill({ json });
    },
  );

  // Mock Jellyfin Search/Hints endpoint for tracks within album
  await page.route(
    "**/proxy/jellyfin/Search/Hints?**parentId=**includeItemTypes=Audio**",
    async (route) => {
      const json = {
        SearchHints: [
          {
            ItemId: "test-track-id",
            Name: "Test Track",
            Type: "Audio",
          },
        ],
        TotalRecordCount: 1,
      };
      await route.fulfill({ json });
    },
  );
}

test("Jellyfin Search: Should display 'Jellyfin' button on Album, Artist and Track pages", async ({
  page,
}) => {
  await mockConfigAPI(page, {
    parameters: {
      JELLYFIN_URL: "http://jellyfin.url",
      JELLYFIN_API_KEY: "test-api-key",
    },
  });
  await mockJellyfinProxy(page);

  // Test on Album page
  await checkJellyfinButton(page, "/album/77610756", "albums");

  // Test on Artist page
  await checkJellyfinButton(page, "/artist/19368", "artists");

  // Test on Track page
  await checkJellyfinButton(page, "/track/77610761", "tracks");
});

test("Jellyfin Search: Should hide 'Jellyfin' button when JELLYFIN var does not exist", async ({
  page,
}) => {
  // Test on Album page - button should NOT be visible
  await checkJellyfinButton(page, "/album/77610756", "albums", false);

  // Test on Artist page - button should NOT be visible
  await checkJellyfinButton(page, "/artist/19368", "artists", false);

  // Test on Track page - button should NOT be visible
  await checkJellyfinButton(page, "/track/77610761", "tracks", false);
});
