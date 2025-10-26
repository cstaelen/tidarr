import test, { expect } from "@playwright/test";
import dotenv from "dotenv";

import { emptyProcessingList, goToHome } from "./utils/helpers";
import { mockConfigAPI, mockRelease } from "./utils/mock";

dotenv.config({ path: "../.env", override: false, quiet: true });

const CURRENT_VERSION = "0.0.0-testing";

test("Tidarr config : Should display token modal if no tidal token exists", async ({
  page,
}) => {
  await page.route("*/**/check", async (route) => {
    const json = {
      noToken: true,
      output: "",
      parameters: {},
      tiddl_config: {
        auth: {
          country_code: "FR",
        },
      },
    };
    await route.fulfill({ json });
  });

  await goToHome(page);

  await expect(
    page.getByRole("heading", { name: "Tidal token not found !" }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "https://link.tidal.com/" }),
  ).toBeVisible();
});

test("Tidarr config : Should see app version", async ({ page }) => {
  await mockConfigAPI(page);
  await goToHome(page);
  await emptyProcessingList(page);

  await expect(page.getByText(`v${CURRENT_VERSION}`)).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();

  // Tab updates
  await expect(
    page.getByText(`Current version: Tidarr ${CURRENT_VERSION}`),
  ).toBeVisible();
});

test("Tidarr config : Should see configuration dialog", async ({ page }) => {
  await mockConfigAPI(page);
  await mockRelease(page);

  await goToHome(page);
  await emptyProcessingList(page);

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
    ["ENABLE_BEETS", "true"],
    ["ENABLE_PLEX_UPDATE", "true"],
    ["PLEX_URL", "http://plex.url"],
    ["PLEX_LIBRARY", "3"],
    ["PLEX_TOKEN", "abc-plex-token-xyz"],
    ["PLEX_PATH", "/fodler/to/plex/music"],
    ["ENABLE_GOTIFY", "true"],
    ["GOTIFY_URL", "http://gotify.url"],
    ["GOTIFY_TOKEN", "abc-gotify-token-xyz"],
    ["TIDARR_VERSION", "0.0.0-testing"],
    ["PUID", ""],
    ["PGID", ""],
    ["UMASK", ""],
    ["ENABLE_APPRISE_API", ""],
    ["APPRISE_API_ENDPOINT", ""],
    ["APPRISE_API_TAG", ""],
    ["PUSH_OVER_URL", ""],
    ["ENABLE_TIDAL_PROXY", ""],
  ];
  const tableAPIRows = await page
    .locator("#alert-dialog-description div")
    .filter({ hasText: "Variable" })
    .locator("table tbody tr")
    .all();

  expect(tableAPIRows.length).toEqual(dataAPIRows?.length);
  tableAPIRows.forEach((row, index) => {
    expect(row.locator("td").first()).toContainText(dataAPIRows[index][0]);
    expect(row.locator("td").last()).toContainText(dataAPIRows[index][1]);
  });

  // Tab Tidal token
  await expect(page.getByRole("tab", { name: "Tidal token" })).toBeVisible();
  await page.getByRole("tab", { name: "Tidal token" }).click();
  await expect(
    page.getByRole("button", { name: "Revoke Tidal token" }),
  ).toBeInViewport();

  const tableTiddlRows = await page
    .locator("#alert-dialog-description div")
    .filter({ hasText: "Variable" })
    .locator("table tbody tr")
    .all();

  expect(tableTiddlRows.length).toEqual(13);
});

test("Tidarr config : Should see update button", async ({ page }) => {
  await mockConfigAPI(page);
  await mockRelease(page, "9.9.9");

  await goToHome(page);
  await emptyProcessingList(page);

  await expect(page.getByText("Update available")).toBeVisible();
  await page.getByText("Update available").click();
  // Tab updates
  await expect(page.getByRole("tab", { name: "Updates" })).toBeVisible();
  await expect(page.getByText("Update available: 9.9.9")).toBeVisible();
  await expect(page.getByText("docker compose pull tidarr")).toBeVisible();
});
