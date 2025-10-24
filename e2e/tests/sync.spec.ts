import { expect, test } from "@playwright/test";

import { runSearch } from "./utils/search";

test.describe.configure({ mode: "serial" });

test("Tidarr sync : Should be able to sync a playlist", async ({ page }) => {
  await runSearch(
    "https://tidal.com/browse/playlist/0b5df380-47d3-48fe-ae66-8f0dba90b1ee",
    page,
  );

  await expect(page.getByRole("main")).toContainText("Grown Country");

  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync")).toBeVisible();

  await page.getByRole("button", { name: "Tidarr settings" }).click();
  await page.getByRole("tab", { name: "Watch (1)" }).click();
  await expect(page.getByRole("cell", { name: "Grown Country" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "playlist" })).toBeVisible();
  await page.getByRole("cell", { name: "Remove from sync list" }).click();
  await expect(page.getByText("No synced content")).toBeVisible();
  await page.getByRole("button", { name: "CLose" }).click();

  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(page.getByTestId("btn-sync")).toBeVisible();
});

test("Tidarr sync : Should be able to sync an artist", async ({ page }) => {
  await runSearch("https://tidal.com/browse/artist/19368", page);

  await expect(page.getByRole("main")).toContainText("Nirvana");

  await page.getByTestId("btn-sync").nth(0).click();
  await expect(page.getByTestId("btn-disable-sync").nth(0)).toBeVisible();

  await page.getByRole("button", { name: "Tidarr settings" }).click();
  await page.getByRole("tab", { name: "Watch (1)" }).click();
  await expect(page.getByRole("cell", { name: "Nirvana" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "artist" })).toBeVisible();
  await page.getByRole("cell", { name: "Remove from sync list" }).click();
  await expect(page.getByText("No synced content")).toBeVisible();
  await page.getByRole("button", { name: "CLose" }).click();

  await expect(page.getByTestId("btn-disable-sync")).not.toBeVisible();
  await expect(
    page.locator(".MuiPaper-root").nth(1).getByTestId("btn-sync"),
  ).toBeVisible();
});
