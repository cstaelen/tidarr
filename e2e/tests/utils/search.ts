import { expect, Page } from "@playwright/test";

import { waitForImgLoaded, waitForLoader } from "./helpers";
import { mockConfigAPI, mockRelease } from "./mock";

export async function runSearch(keyword: string, page: Page) {
  mockConfigAPI(page);
  mockRelease(page);

  await page.goto("/");
  await page.evaluate("localStorage.clear()");

  await waitForImgLoaded(page);

  await expect(page.getByRole("heading")).toContainText("Tidarr");
  await expect(
    page.getByLabel(
      "Tidal search (keywords, artist URL, album URL, playlist URL)",
    ),
  ).toBeVisible();

  await page.getByTestId("search-input").click();
  await page.getByTestId("search-input").fill(keyword);
  await page.getByTestId("search-input").press("Enter");
  await waitForLoader(page);

  // Trigger loading of all images
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  });
}

export async function countItems(
  wrapperSelector: string,
  toEqual: number,
  page: Page,
) {
  await page.waitForTimeout(500);
  const countArtist = await page.locator(wrapperSelector).count();
  await expect(countArtist).toEqual(toEqual);
}
