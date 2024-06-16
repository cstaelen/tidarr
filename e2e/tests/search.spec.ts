import { expect, test } from "@playwright/test";

import { waitForImgLoaded, waitForLoader } from "./utils/helpers";
import { countItems, runSearch } from "./utils/search";

test("Tidarr search : Should see 'Top results' tab content", async ({
  page,
}) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-0")).toContainText(
    "Top results (700)",
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
  ).toHaveScreenshot({ maxDiffPixelRatio: 0.1 });

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
  ).toHaveScreenshot({ maxDiffPixelRatio: 0.1 });

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
    page.getByRole("link", { name: "Artist: Nirvana" }),
  ).toBeVisible();

  await expect(page.url()).toContain("/?query=artist:19368:Nirvana");
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
  ).toHaveScreenshot({ maxDiffPixels: 10 });

  // Test pager

  await page.getByRole("button", { name: "LOAD MORE (page: 1/17)" }).click();
  await waitForLoader(page);

  await countItems("#full-width-tabpanel-3 .MuiGrid-item", 36, page);
});

test("Tidarr search : Should see quality filtered results", async ({
  page,
}) => {
  await runSearch("Nirvana", page);
  await expect(page.locator("#full-width-tab-0")).toContainText(
    "Top results (700)",
  );

  await countItems("#full-width-tabpanel-0 .MuiGrid-item", 18, page);

  const countLossless = await page
    .locator(".MuiChip-root")
    .filter({ hasText: /^lossless$/ })
    .count();
  await expect(countLossless).toEqual(6);

  const countHiRes = await page
    .locator(".MuiChip-root")
    .filter({ hasText: /^hi_res$/ })
    .count();
  await expect(countHiRes).toEqual(9);

  // Filter lossless

  await page.getByRole("button", { name: "Lossless" }).click();

  await countItems("#full-width-tabpanel-0 .MuiGrid-item:visible", 9, page);

  await page.getByRole("button", { name: "Hi res" }).click();

  await countItems("#full-width-tabpanel-0 .MuiGrid-item:visible", 12, page);
});
