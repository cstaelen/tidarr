import { expect } from "@playwright/test";
import dotenv from "dotenv";

import { test } from "../test-isolation";

import { mockConfigAPI, mockRelease } from "./utils/mock";

dotenv.config({ path: "../.env", override: false, quiet: true });

const CURRENT_VERSION = "0.0.0-testing";

test("Tidarr config : Should display token modal if no tidal token exists", async ({
  page,
}) => {
  await mockConfigAPI(page, {
    noToken: true,
    tiddl_config: { auth: { country_code: "FR" } },
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Tidal token not found !" }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "https://link.tidal.com/" }),
  ).toBeVisible();
});

test("Tidarr config : Should see app version", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(`v${CURRENT_VERSION}`)).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();

  // Tab updates
  await expect(
    page.getByText(`Current version: Tidarr ${CURRENT_VERSION}`),
  ).toBeVisible();
});

test("Tidarr config : Should see configuration dialog", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Tab updates
  await expect(page.getByRole("tab", { name: "Updates" })).toBeVisible();
  await expect(page.getByText("Current version:")).toBeVisible();
  await expect(page.getByText("Tidarr is up to date.")).toBeVisible();

  // Tab API
  await expect(page.getByRole("tab", { name: "Env vars" })).toBeVisible();
  await page.getByRole("tab", { name: "Env vars" }).click();

  const dataAPIRows = [
    ["ENABLE_BEETS", "false"],
    ["REPLAY_GAIN", "true"],
    ["PLEX_URL", ""],
    ["PLEX_LIBRARY", ""],
    ["PLEX_TOKEN", ""],
    ["PLEX_PATH", ""],
    ["JELLYFIN_URL", ""],
    ["JELLYFIN_API_KEY", ""],
    ["NAVIDROME_URL", ""],
    ["NAVIDROME_USER", ""],
    ["NAVIDROME_PASSWORD", ""],
    ["GOTIFY_URL", ""],
    ["GOTIFY_TOKEN", ""],
    ["NTFY_URL", ""],
    ["NTFY_TOPIC", ""],
    ["NTFY_TOKEN", ""],
    ["NTFY_PRIORITY", ""],
    ["PUID", "1000"],
    ["PGID", "1000"],
    ["UMASK", "0002"],
    ["TIDARR_VERSION", "0.0.0-testing"],
    ["APPRISE_API_ENDPOINT", ""],
    ["APPRISE_API_TAG", ""],
    ["PUSH_OVER_URL", ""],
    ["LOCK_QUALITY", ""],
    ["ENABLE_TIDAL_PROXY", "true"],
    ["SYNC_CRON_EXPRESSION", "0 3 * * *"],
    ["NO_DOWNLOAD", ""],
    ["ENABLE_HISTORY", "true"],
    ["M3U_BASEPATH_FILE", "../../"],
  ];
  const tableAPIRows = await page
    .locator("#alert-dialog-description div")
    .filter({ hasText: "Variable" })
    .locator("table tbody tr")
    .all();

  expect(tableAPIRows.length).toEqual(dataAPIRows?.length);
  for (const [index, row] of tableAPIRows.entries()) {
    await expect(row.locator("td").first()).toContainText(
      dataAPIRows[index][0],
    );
    await expect(row.locator("td").last()).toContainText(dataAPIRows[index][1]);
  }

  // Tab Tidal token
  await expect(page.getByRole("tab", { name: "Tidal" })).toBeVisible();
  await page.getByRole("tab", { name: "Tidal" }).click();
  await expect(
    page.getByRole("button", { name: "Revoke Tidal token" }),
  ).toBeInViewport();

  const tiddlTables = await page
    .locator("#alert-dialog-description div")
    .locator("table")
    .all();

  expect(tiddlTables.length).toEqual(5);
});

test("Tidarr config : Should see update button", async ({ page }) => {
  await mockRelease(page, "9.9.9");

  await page.goto("/");

  await expect(page.getByText("Update available")).toBeVisible();
  await page.getByText("Update available").click();
  // Tab updates
  await expect(page.getByRole("tab", { name: "Updates" })).toBeVisible();
  await expect(page.getByText("Update available: 9.9.9")).toBeVisible();
  await expect(page.getByText("docker compose pull tidarr")).toBeVisible();
});

test("Tidarr config : Should display Docs tab with documentation links", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Click on Docs tab
  await expect(page.getByRole("tab", { name: "Docs" })).toBeVisible();
  await page.getByRole("tab", { name: "Docs" }).click();

  // Check description
  await expect(
    page.getByText("Quick access to documentation resources"),
  ).toBeVisible();

  // Check all documentation links
  const expectedDocs = [
    "Tidarr Documentation",
    "Tiddl Configuration",
    "Path Templating",
    "Lidarr Integration",
    "Tidarr API",
  ];

  for (const docTitle of expectedDocs) {
    await expect(page.getByText(docTitle)).toBeVisible();
  }

  // Check that Open buttons are visible
  const openButtons = await page.getByRole("button", { name: "Open" }).all();
  expect(openButtons.length).toEqual(5);

  // Verify each button is visible
  for (const button of openButtons) {
    await expect(button).toBeVisible();
  }
});
