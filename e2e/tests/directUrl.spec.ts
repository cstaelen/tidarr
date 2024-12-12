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
    page.getByRole("heading", { name: `${title} (${count})` }),
  ).toBeVisible();
  await countItems(
    `div > section.MuiContainer-root:nth-child(${sectionIndex + 1}) .MuiGrid-item`,
    count < 18 ? count : 18,
    page,
  );

  if (count > 18) {
    await page.getByRole("button", { name: "LOAD MORE (page: 1/2)" }).click();
    await waitForLoader(page);

    await countItems(
      `div > section.MuiContainer-root:nth-child(${sectionIndex + 1}) .MuiGrid-item`,
      count,
      page,
    );
  }
}
test("Tidarr direct url : Should display album result using Tidal album url", async ({
  page,
}) => {
  runSearch("https://listen.tidal.com/album/121121877", page);

  await expect(
    page.getByRole("link", { name: "Land Of The Free?" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Pennywise" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get album" })).toBeVisible();
});

test("Tidarr direct url : Should display playlist result using Tidal playlist url", async ({
  page,
}) => {
  runSearch(
    "https://listen.tidal.com/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("link", { name: "Grown Country" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Get playlist" }),
  ).toBeVisible();
});

test("Tidarr direct url : Should display artist page using Tidal artist url", async ({
  page,
}) => {
  runSearch("https://listen.tidal.com/artist/17713", page);

  await expect(
    page.getByRole("link", { name: "Artist: Pennywise" }),
  ).toBeVisible();

  await testArtistSection(1, "Albums", 13, page);
  await testArtistSection(2, "EP & Singles", 2, page);
  await testArtistSection(3, "Compilations", 1, page);
  await testArtistSection(4, "Live albums", 1, page);
  await testArtistSection(5, "Appears On", 28, page);
});
