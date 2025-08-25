import test, { expect, Page } from "@playwright/test";

import mockAlbum from "./mocks/album.json";
import mockHome from "./mocks/home.json";
import { waitForLoader } from "./utils/helpers";
import { countItems, runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

async function testArtistSection(
  sectionIndex: number,
  title: string,
  count: number,
  page: Page,
  testPager?: number,
) {
  await expect(page.getByRole("tab", { name: title })).toBeVisible();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await countItems(
    `div.MuiContainer-root .list-modules .MuiBox-root:nth-child(${sectionIndex})`,
    count,
    page,
  );

  if (testPager) {
    await page.getByRole("button", { name: "LOAD MORE (page: 1/2)" }).click();
    await waitForLoader(page);

    await countItems(
      `div.MuiContainer-root .list-modules .MuiBox-root:nth-child(${sectionIndex})`,
      testPager,
      page,
    );
  }
}

test("Tidarr direct url : Should display album result using Tidal album url", async ({
  page,
}) => {
  await page.route("**/pages/home", async (route) => {
    await route.fulfill({ json: mockHome });
  });

  await page.route("**/pages/album", async (route) => {
    await route.fulfill({ json: mockAlbum });
  });

  await runSearch("https://listen.tidal.com/album/77610756", page);

  await expect(
    page.getByRole("tab", { name: "More Albums by Nirvana (21)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Related Albums (20)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Related Artists (20)" }),
  ).toBeVisible();

  await expect(
    page.locator(".MuiTypography-root.MuiTypography-inherit").first(),
  ).toContainText("Nevermind");

  await expect(
    page.locator(".MuiTypography-root > .MuiButtonBase-root").first(),
  ).toHaveText("Nirvana");
  await expect(
    page.getByRole("button", { name: "Get album" }).first(),
  ).toBeVisible();

  const albumCount = await page.getByRole("button", { name: "Album" }).count();
  await expect(albumCount).toEqual(54);
  const trackCount = await page.getByRole("button", { name: "Track" }).count();
  await expect(trackCount).toEqual(13);

  await expect(page.url()).toContain("/album/77610756");
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
  await runSearch("https://listen.tidal.com/artist/19368", page);

  await expect(
    page.getByRole("link", { name: "Nirvana", exact: true }).first(),
  ).toBeVisible();

  await testArtistSection(1, "Top tracks (300)", 4, page);
  await testArtistSection(2, "Albums (11)", 11, page);
  await testArtistSection(3, "EP & Singles (7)", 7, page);
  await testArtistSection(4, "Compilations (2)", 2, page);
  await testArtistSection(5, "Live albums (9)", 9, page);
  await testArtistSection(6, "Playlists (39)", 39, page);
  await testArtistSection(7, "Videos (111)", 50, page);
  await testArtistSection(8, "Appears On (14)", 14, page);
  await testArtistSection(9, "Fans Also Like (15)", 15, page);
  await testArtistSection(10, "Influencers (29)", 15, page, 29);

  await expect(page.url()).toContain("/artist/19368");
});
