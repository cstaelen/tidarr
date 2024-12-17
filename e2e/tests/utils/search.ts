import { expect, Page } from "@playwright/test";

import { waitForImgLoaded, waitForLoader } from "./helpers";
import { mockConfigAPI, mockRelease } from "./mock";

export async function runSearch(keyword: string, page: Page) {
  await mockConfigAPI(page);
  await mockRelease(page);

  await page.goto("/");
  await page.evaluate("localStorage.clear()");

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
  await waitForImgLoaded(page);
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
