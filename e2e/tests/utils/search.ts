import { Page, expect } from "@playwright/test";
import { mockAPI } from "./mock";

export async function runSearch(keyword: string, page: Page) {
  mockAPI(page);

  await page.goto("/");

  await expect(page.getByRole("heading")).toContainText("Tidarr");
  await expect(
    page.getByLabel(
      "Tidal search (keywords, artist URL, album URL, playlist URL)",
    ),
  ).toBeVisible();

  await page.getByTestId("search-input").click();
  await page.getByTestId("search-input").fill(keyword);
  await page.getByTestId("search-input").press("Enter");
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
