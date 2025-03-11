import { expect, test } from "@playwright/test";

import { waitForImgLoaded, waitForLoader } from "./utils/helpers";
import { mockConfigAPI, mockRelease } from "./utils/mock";
import { countItems, runSearch } from "./utils/search";

test("Tidarr search : Should see 'Top results' tab content", async ({
  page,
}) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-0")).toContainText(
    "Top results (1191)",
  );

  await expect(page.getByRole("heading", { name: "Artist(s)" })).toBeVisible();
  await countItems(
    "#full-width-tabpanel-0 > div > div:first-child .MuiGrid-item",
    3,
    page,
  );

  await expect(
    page.getByRole("button", { name: "See all artists (100)" }),
  ).toBeVisible();

  await expect(page.getByRole("heading", { name: "Album(s)" })).toBeVisible();
  const countAlbums = await page
    .locator("#full-width-tabpanel-0 > div > div:nth-child(2) .MuiGrid-item")
    .count();
  await expect(countAlbums).toEqual(9);

  await countItems(
    "#full-width-tabpanel-0 > div > div:nth-child(2) .MuiGrid-item",
    9,
    page,
  );

  await expect(
    page.getByRole("button", { name: "See all albums (300)" }),
  ).toBeVisible();

  await expect(page.getByRole("heading", { name: "Track(s)" })).toBeVisible();

  await countItems(
    "#full-width-tabpanel-0 > div > div:nth-child(3) .MuiGrid-item",
    6,
    page,
  );

  await expect(
    page.getByRole("button", { name: "See all tracks (300)" }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Playlist(s)" }),
  ).toBeVisible();

  await countItems(
    "#full-width-tabpanel-0 > div > div:nth-child(4) .MuiGrid-item",
    6,
    page,
  );

  await expect(
    page.getByRole("button", { name: "See all playlists (191)" }),
  ).toBeVisible();
});

test("Tidarr search : Should see albums results", async ({ page }) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-1")).toContainText("Albums (300)");

  await page.getByRole("tab", { name: "Albums (300)" }).click();
  await waitForImgLoaded(page);

  await countItems("#full-width-tabpanel-1 .MuiGrid-item", 18, page);

  await expect(
    page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }),
  ).toBeVisible();

  // Test album card snapshot

  await expect(
    page.locator("#full-width-tabpanel-1 .MuiGrid-item").first(),
  ).toHaveScreenshot();

  // Test pager

  await page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }).click();
  await waitForLoader(page);

  await countItems("#full-width-tabpanel-1 .MuiGrid-item", 36, page);
});

test("Tidarr search : Should see artists results", async ({ page }) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-2")).toContainText(
    "Artists (100)",
  );

  await page.getByRole("tab", { name: "Artists (100)" }).click();
  await waitForImgLoaded(page);

  await countItems("#full-width-tabpanel-2 .MuiGrid-item", 18, page);

  await expect(
    page.getByRole("button", { name: "LOAD MORE (page: 1/6)" }),
  ).toBeVisible();

  // Test album card snapshot

  await expect(
    page.locator("#full-width-tabpanel-2 .MuiGrid-item").first(),
  ).toHaveScreenshot();

  // Test pager

  await page.getByRole("button", { name: "LOAD MORE (page: 1/6)" }).click();
  await waitForLoader(page);

  await countItems("#full-width-tabpanel-2 .MuiGrid-item", 36, page);

  // On last page, pager should be hidden

  await page.getByRole("button", { name: "LOAD MORE (page: 2/6)" }).click();
  await waitForLoader(page);
  await page.getByRole("button", { name: "LOAD MORE (page: 3/6)" }).click();
  await waitForLoader(page);
  await page.getByRole("button", { name: "LOAD MORE (page: 4/6)" }).click();
  await waitForLoader(page);
  await page.getByRole("button", { name: "LOAD MORE (page: 5/6)" }).click();
  await waitForLoader(page);

  await expect(
    page.getByRole("button", { name: "LOAD MORE*" }),
  ).not.toBeVisible();

  // Click on discography should redirect to artist page

  await page
    .locator("#full-width-tabpanel-2 .MuiGrid-item")
    .first()
    .getByRole("button", { name: "Show discography" })
    .click();

  await waitForLoader(page);

  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Nirvana$/ })
      .getByRole("link")
      .first(),
  ).toBeVisible();

  await expect(page.url()).toContain("/artist/19368");
});

test("Tidarr search : Should see tracks results", async ({ page }) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-3")).toContainText("Tracks (300)");

  await page.getByRole("tab", { name: "Tracks (300)" }).click();
  await waitForImgLoaded(page);

  await countItems("#full-width-tabpanel-3 .MuiGrid-item", 18, page);

  await expect(
    page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }),
  ).toBeVisible();

  // Test album card snapshot

  await expect(
    page.locator("#full-width-tabpanel-3 .MuiGrid-item").first(),
  ).toHaveScreenshot();

  // Test pager

  await page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }).click();
  await waitForLoader(page);

  await countItems("#full-width-tabpanel-3 .MuiGrid-item", 36, page);
});

test("Tidarr search : Should see playlists results", async ({ page }) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-4")).toContainText(
    "Playlists (191)",
  );

  await page.getByRole("tab", { name: "Playlists (191)" }).click();
  await waitForImgLoaded(page);

  await countItems("#full-width-tabpanel-4 .MuiGrid-item", 18, page);

  await expect(
    page.getByRole("button", { name: "LOAD MORE (page: 1/11)" }),
  ).toBeVisible();

  // Test album card snapshot

  await expect(
    page.locator("#full-width-tabpanel-4 .MuiGrid-item").first(),
  ).toHaveScreenshot();

  // Test pager

  await page.getByRole("button", { name: "LOAD MORE (page: 1/11)" }).click();
  await waitForLoader(page);

  await countItems("#full-width-tabpanel-4 .MuiGrid-item", 36, page);
});

test("Tidarr search : Should see videos results", async ({ page }) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-5")).toContainText("Videos (300)");

  await page.getByRole("tab", { name: "Videos (300)" }).click();
  await waitForImgLoaded(page);

  await countItems("#full-width-tabpanel-5 .MuiGrid-item", 18, page);

  await expect(
    page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }),
  ).toBeVisible();

  // Test album card snapshot

  await expect(
    page.locator("#full-width-tabpanel-5 .MuiGrid-item").first(),
  ).toHaveScreenshot();

  // Test pager

  await page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }).click();
  await waitForLoader(page);

  await countItems("#full-width-tabpanel-5 .MuiGrid-item", 36, page);
});

test("Tidarr search : Should see quality filtered results", async ({
  page,
}) => {
  await mockConfigAPI(page);
  await mockRelease(page);
  await page.goto("/artist/3634161");
  await expect(
    page.getByRole("heading", { name: "Albums (21)" }),
  ).toBeInViewport();

  await countItems(".MuiGrid-item", 67, page);

  const countLossless = await page
    .locator(".MuiChip-root")
    .filter({ hasText: /^lossless$/ })
    .count();
  await expect(countLossless).toEqual(54);

  const countHigh = await page
    .locator(".MuiChip-root")
    .filter({ hasText: /^high$/ })
    .count();
  await expect(countHigh).toEqual(0);

  const countLow = await page
    .locator(".MuiChip-root")
    .filter({ hasText: /^low$/ })
    .count();
  await expect(countLow).toEqual(3);

  // Filter lossless

  await page.getByRole("button", { name: "Lossless" }).click();

  // Test localstorage persistence

  await page.goto("/artist/3634161");
  await waitForLoader(page);

  await expect(
    await page.getByRole("button", { name: "Lossless" }),
  ).toHaveAttribute("aria-pressed", "true");

  await countItems(".MuiGrid-item:visible", 54, page);

  await page.getByRole("button", { name: "High" }).click();

  await countItems(".MuiGrid-item:visible", 0, page);
});

test("Tidarr search : Should have two display mode", async ({ page }) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-3")).toContainText("Tracks (300)");

  await expect(
    page
      .locator(
        "#full-width-tabpanel-0 > div > div:nth-child(2) > div > div > div",
      )
      .first(),
  ).toHaveScreenshot();

  await page.getByLabel("Display mode").click();

  await expect(
    page
      .locator(
        "#full-width-tabpanel-0 > div > div:nth-child(2) > div > div > div",
      )
      .first(),
  ).toHaveScreenshot();
});
