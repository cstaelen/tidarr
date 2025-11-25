import { expect, Page } from "@playwright/test";

import { test } from "../test-isolation";

import { mockConfigAPI } from "./utils/mock";

/**
 * Helper function to verify Navidrome search button visibility and functionality
 * @param page - Playwright Page object
 * @param url - URL to navigate to
 * @param pivot - Expected pivot type (albums, artists, tracks)
 * @param shouldBeVisible - Whether the button should be visible or not
 */
async function checkNavidromeButton(
  page: Page,
  url: string,
  pivot: string,
  shouldBeVisible: boolean = true,
) {
  await page.goto(url);

  const navidromeButton = page
    .getByRole("button", {
      name: /Navidrome/i,
    })
    .first();

  if (shouldBeVisible) {
    await expect(navidromeButton).toBeVisible();

    // Intercept window.open to verify the URL without actually opening it
    let openedUrl: string | undefined;
    await page.evaluate(() => {
      window.open = (url) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__lastOpenedUrl = url;
        return null;
      };
    });

    await navidromeButton.click();
    await page.waitForTimeout(250);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
    openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl);
    await page.waitForTimeout(250);
    expect(openedUrl).toContain("http://navidrome.url/app/#");

    // Verify the URL contains the correct resource type
    if (pivot === "artists") {
      expect(openedUrl).toContain("/artist?");
    } else if (pivot === "albums") {
      expect(openedUrl).toContain("/album?");
    } else if (pivot === "tracks") {
      expect(openedUrl).toContain("/song?");
    }
  } else {
    await expect(navidromeButton).not.toBeVisible();
  }
}

/**
 * Mock Navidrome API proxy endpoint
 */
async function mockNavidromeProxy(page: Page) {
  // Mock Navidrome search API responses
  await page.route("**/proxy/navidrome/rest/search3**", async (route) => {
    const json = {
      "subsonic-response": {
        status: "ok",
        version: "1.16.1",
        searchResult3: {
          artist: [{ id: "1", name: "Test Artist" }],
          album: [{ id: "1", name: "Test Album" }],
          song: [{ id: "1", title: "Test Track" }],
        },
      },
    };
    await route.fulfill({ json });
  });

  // Mock Navidrome ping endpoint for authentication
  await page.route("**/proxy/navidrome/rest/ping**", async (route) => {
    const json = {
      "subsonic-response": {
        status: "ok",
        version: "1.16.1",
      },
    };
    await route.fulfill({ json });
  });
}

test("Navidrome Search: Should display 'Navidrome' button on Album, Artist and Track pages", async ({
  page,
}) => {
  await mockConfigAPI(page, {
    parameters: {
      NAVIDROME_URL: "http://navidrome.url",
      NAVIDROME_USER: "test-user",
      NAVIDROME_PASSWORD: "test-password",
    },
  });
  await mockNavidromeProxy(page);

  // Test on Album page
  await checkNavidromeButton(page, "/album/77610756", "albums");

  // Test on Artist page
  await checkNavidromeButton(page, "/artist/19368", "artists");

  // Test on Track page
  await checkNavidromeButton(page, "/track/77610761", "tracks");
});

test("Navidrome Search: Should hide 'Navidrome' button when NAVIDROME var does not exist", async ({
  page,
}) => {
  // Test on Album page - button should NOT be visible
  await checkNavidromeButton(page, "/album/77610756", "albums", false);

  // Test on Artist page - button should NOT be visible
  await checkNavidromeButton(page, "/artist/19368", "artists", false);

  // Test on Track page - button should NOT be visible
  await checkNavidromeButton(page, "/track/77610761", "tracks", false);
});
