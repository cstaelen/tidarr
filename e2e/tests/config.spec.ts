import test, { expect } from "@playwright/test";
import dotenv from "dotenv";

import { emptyProcessingList } from "./utils/helpers";
import { mockConfigAPI, mockRelease } from "./utils/mock";

dotenv.config({ path: "../.env", override: false });

const CURRENT_VERSION = "0.0.1";

test("Tidarr config : Should display modal error if no tidal token exists", async ({
  page,
}) => {
  await page.route("*/**/check", async (route) => {
    const json = {
      noToken: true,
      output: "",
    };
    await route.fulfill({ json });
  });

  await page.route("*/**/token_log", async (route) => {
    const json = {
      link: "https://token-url/ABC123",
      output: "",
    };
    await route.fulfill({ json });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Tidal token not found !" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "https://token-url/ABC123" }),
  ).toBeVisible();
});

test("Tidarr config : Should see app version", async ({ page }) => {
  mockConfigAPI(page);

  await page.goto("/");
  await emptyProcessingList(page);

  await expect(page.getByText(`v${CURRENT_VERSION}`)).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();

  // Tab updates
  await expect(
    page.getByText(`Current version: ${CURRENT_VERSION}`),
  ).toBeVisible();
});

test("Tidarr config : Should see configuration dialog", async ({ page }) => {
  mockConfigAPI(page);
  mockRelease(page);

  await page.goto("/");
  await emptyProcessingList(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Tab updates
  await expect(page.getByRole("tab", { name: "Updates" })).toBeVisible();
  await expect(page.getByText("Current version:")).toBeVisible();
  await expect(page.getByText("Tidarr is up to date.")).toBeVisible();

  // Tab API
  await expect(page.getByRole("tab", { name: "API" })).toBeVisible();
  await page.getByRole("tab", { name: "API" }).click();
  await expect(
    page
      .locator("#alert-dialog-description div")
      .filter({ hasText: "Environment" }),
  ).toHaveScreenshot();

  // Tab APP
  await expect(page.getByRole("tab", { name: "Application" })).toBeVisible();
  await page.getByRole("tab", { name: "Application" }).click();
  await expect(
    page
      .locator("#alert-dialog-description div")
      .filter({ hasText: "Environment" }),
  ).toHaveScreenshot();

  // Tab Tidal token
  await expect(page.getByRole("tab", { name: "Tidal token" })).toBeVisible();
  await page.getByRole("tab", { name: "Tidal token" }).click();
  await expect(page.locator("#alert-dialog-description")).toHaveScreenshot();
});

test("Tidarr config : Should see update button", async ({ page }) => {
  mockConfigAPI(page);
  mockRelease(page, "9.9.9");

  await page.goto("/");
  await emptyProcessingList(page);

  await expect(page.getByText("Update available")).toBeVisible();
  await page.getByText("Update available").click();
  // Tab updates
  await expect(page.getByRole("tab", { name: "Updates" })).toBeVisible();
  await expect(page.getByText("Update available: 9.9.9")).toBeVisible();
  await expect(page.getByText("docker compose pull tidarr")).toBeVisible();
});
