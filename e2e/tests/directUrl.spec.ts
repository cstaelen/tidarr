import test, { expect, Page } from "@playwright/test";

import { waitForLoader } from "./utils/helpers";
import { countItems, runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

async function testArtistSection(
  sectionIndex: number,
  title: string,
  count: number,
  page: Page,
) {
  await expect(
    page.getByRole("tab", { name: `${title} (${count})` }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: `${title} (${count})` }),
  ).toBeVisible();

  await countItems(
    `div > section.MuiContainer-root:nth-child(${sectionIndex + 1})`,
    count < 18 ? count : 18,
    page,
  );

  if (count > 18) {
    await page.getByRole("button", { name: "LOAD MORE (page: 1/2)" }).click();
    await waitForLoader(page);

    await countItems(
      `div > section.MuiContainer-root:nth-child(${sectionIndex + 1})`,
      count,
      page,
    );
  }
}

test("Tidarr direct url : Should display album result using Tidal album url", async ({
  page,
}) => {
  await runSearch("https://listen.tidal.com/album/121121877", page);

  await expect(
    page.locator("a h1").filter({ hasText: /^Land Of The Free\?$/ }),
  ).toBeVisible();

  await expect(
    page.locator(".MuiTypography-root > .MuiButtonBase-root").first(),
  ).toHaveText("Pennywise");
  await expect(page.getByRole("button", { name: "Get album" })).toBeVisible();

  const albumCount = await page.getByRole("button", { name: "Album" }).count();
  await expect(albumCount).toEqual(15);
  const trackCount = await page.getByRole("button", { name: "Track" }).count();
  await expect(trackCount).toEqual(14);

  await expect(page.url()).toContain("/album/121121877");
});

test("Tidarr direct url : Should display playlist result using Tidal playlist url", async ({
  page,
}) => {
  await runSearch(
    "https://listen.tidal.com/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("link", { name: "Grown Country" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Get playlist" }),
  ).toBeVisible();

  await waitForLoader(page);

  const albumCount = await page.getByRole("button", { name: "Album" }).count();
  await expect(albumCount).toEqual(18);
  const trackCount = await page.getByRole("button", { name: "Track" }).count();
  await expect(trackCount).toEqual(18);

  await expect(page.url()).toContain(
    "/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
  );
});

test("Tidarr direct url : Should display track result using Tidal track url", async ({
  page,
}) => {
  await runSearch("https://tidal.com/browse/track/77610761", page);

  // Should see selected track header

  await expect(
    page
      .locator("a h1")
      .filter({ hasText: /^Lithium$/ })
      .first(),
  ).toBeVisible();

  // Should see Album

  await expect(
    page.locator("a h1").filter({ hasText: /^Nevermind$/ }),
  ).toBeVisible();

  // Should see Album download button

  await expect(page.getByRole("button", { name: "Get album" })).toBeVisible();

  // Should see other album tracks

  const albumCount = await page.getByRole("button", { name: "Album" }).count();
  await expect(albumCount).toEqual(15);
  const trackCount = await page.getByRole("button", { name: "Track" }).count();
  await expect(trackCount).toEqual(14);

  await expect(page.url()).toContain("/track/77610761");
});

test("Tidarr direct url : Should display mix result using Tidal mix url", async ({
  page,
}) => {
  await runSearch("https://tidal.com/mix/00166fec481604e645532e233b958b", page);

  await expect(
    page.getByRole("link", { name: "Horizons" }).first(),
  ).toBeVisible();
  const albumCount = await page.getByRole("button", { name: "Album" }).count();
  await expect(albumCount).toEqual(100);
  const trackCount = await page.getByRole("button", { name: "Track" }).count();
  await expect(trackCount).toEqual(100);

  await expect(page.url()).toContain("/mix/00166fec481604e645532e233b958b");
});

test("Tidarr direct url : Should display artist page using Tidal artist url", async ({
  page,
}) => {
  await runSearch("https://listen.tidal.com/artist/17713", page);

  await expect(
    page.getByRole("link", { name: "Pennywise", exact: true }),
  ).toBeVisible();

  await testArtistSection(1, "Albums", 13, page);
  await testArtistSection(2, "EP & Singles", 1, page);
  await testArtistSection(3, "Compilations", 1, page);
  await testArtistSection(4, "Live albums", 1, page);
  await testArtistSection(5, "Videos", 1, page);
  await testArtistSection(6, "Appears On", 28, page);

  await expect(page.url()).toContain("/artist/17713");
});
