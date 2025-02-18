import { expect, Page } from "@playwright/test";

export async function waitForLoader(page: Page) {
  const loader = await page.getByTestId("loader")?.isVisible();
  if (loader) {
    await expect(page.getByTestId("loader")).not.toBeVisible({ timeout: 5000 });
  }
}

export async function waitForImgLoaded(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  });
}

export async function emptyProcessingList(page: Page) {
  const isVisible = await page
    .locator("button.MuiFab-circular")
    .first()
    .isVisible();

  if (!isVisible || page.isClosed()) return null;

  await page.locator("button.MuiFab-circular").first()?.hover();
  const items = await page.locator("#Showprocessinglist-action-1 tbody tr");
  const count = await items.count();

  const firstButton = await items
    .nth(count - 1)
    .getByRole("button")
    .first();

  if (!firstButton || !firstButton.isVisible()) return null;

  await firstButton?.click();
  await page.waitForTimeout(500);

  emptyProcessingList(page);
}
