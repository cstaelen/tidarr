import { expect, Page } from "@playwright/test";

import { goToHome, waitForLoader } from "./helpers";
import { mockConfigAPI, mockRelease, mockTidalQueries } from "./mock";

export async function runSearch(keyword: string, page: Page) {
  await mockConfigAPI(page);
  await mockRelease(page);
  await mockTidalQueries(page);

  await goToHome(page);
  await page.evaluate("localStorage.clear()");

  await expect(page.getByTestId("logo")).toBeInViewport();
  await expect(
    page.getByLabel(
      "Tidal search (keywords, artist URL, album URL, playlist URL)",
    ),
  ).toBeVisible();

  await page.getByTestId("search-input").locator("input").click();
  await page.getByTestId("search-input").locator("input").fill(keyword);
  await page.getByTestId("search-input").locator("input").press("Enter");
  await waitForLoader(page);
}

export async function countItems(
  wrapperSelector: string,
  toEqual: number,
  page: Page,
) {
  await page.waitForTimeout(500);
  const count = await page.locator(wrapperSelector).getByTestId("item").count();
  await expect(count).toEqual(toEqual);
}
