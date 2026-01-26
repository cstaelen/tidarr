import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { mockConfigAPI } from "./utils/mock";

const LOCALSTORAGE_KEY = "tidarr-last-seen-version";

const mockReleases = [
  {
    name: "1.1.6",
    tag_name: "1.1.6",
    body: "## 1.1.6\n- Feature A\n- Bug fix B",
    prerelease: false,
  },
  {
    name: "1.1.5",
    tag_name: "1.1.5",
    body: "## 1.1.5\n- Feature C\n- Improvement D",
    prerelease: false,
  },
  {
    name: "1.1.4",
    tag_name: "1.1.4",
    body: "## 1.1.4\n- Initial release notes",
    prerelease: false,
  },
  {
    name: "1.1.3",
    tag_name: "1.1.3",
    body: "## 1.1.3\n- Old version",
    prerelease: false,
  },
];

test.describe("Update changelog dialog", () => {
  test("First visit: should show only current version changelog", async ({
    page,
  }) => {
    // Mock releases API
    await page.route("*/**/releases", async (route) => {
      await route.fulfill({ json: mockReleases });
    });

    await mockConfigAPI(page, {
      parameters: {
        TIDARR_VERSION: "1.1.6",
      },
    });

    // Override the default addInitScript from test-isolation to simulate first visit
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, LOCALSTORAGE_KEY);

    // Navigate to trigger the init scripts (ours runs after default, clearing the key)
    await page.goto("/");

    // Wait for the changelog dialog to appear
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).toBeVisible({ timeout: 10000 });

    // Should show only current version changelog (1.1.6)
    await expect(page.getByText("Feature A")).toBeVisible();
    await expect(page.getByText("Bug fix B")).toBeVisible();

    // Should NOT show older versions
    await expect(page.getByText("Feature C")).not.toBeVisible();
    await expect(page.getByText("Old version")).not.toBeVisible();
  });

  test("Version upgrade: should show changelogs between lastSeen and current", async ({
    page,
  }) => {
    // Mock releases API
    await page.route("*/**/releases", async (route) => {
      await route.fulfill({ json: mockReleases });
    });

    await mockConfigAPI(page, {
      parameters: {
        TIDARR_VERSION: "1.1.6",
      },
    });

    // Set localStorage to simulate previous version
    await page.addInitScript((key) => {
      localStorage.setItem(key, "1.1.3");
    }, LOCALSTORAGE_KEY);

    await page.goto("/");

    // Wait for the changelog dialog to appear
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).toBeVisible({ timeout: 10000 });

    // Should show "Updated from" message
    await expect(page.getByText(/Updated from 1.1.3 to 1.1.6/i)).toBeVisible();

    // Should show changelogs for 1.1.6, 1.1.5, 1.1.4 (not 1.1.3)
    await expect(page.getByText("Feature A")).toBeVisible();
    await expect(page.getByText("Feature C")).toBeVisible();
    await expect(page.getByText("Initial release notes")).toBeVisible();

    // Should NOT show 1.1.3 changelog
    await expect(page.getByText("Old version")).not.toBeVisible();
  });

  test("Same version: should not show changelog dialog", async ({ page }) => {
    // Mock releases API
    await page.route("*/**/releases", async (route) => {
      await route.fulfill({ json: mockReleases });
    });

    await mockConfigAPI(page, {
      parameters: {
        TIDARR_VERSION: "1.1.6",
      },
    });

    // Set localStorage to current version (already seen)
    await page.addInitScript((key) => {
      localStorage.setItem(key, "1.1.6");
    }, LOCALSTORAGE_KEY);

    await page.goto("/");

    // Wait for page to load
    await expect(page.getByTestId("logo")).toBeVisible({ timeout: 10000 });

    // Changelog dialog should NOT appear
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).not.toBeVisible();
  });

  test("Clicking 'Got it' should mark version as seen", async ({ page }) => {
    // Mock releases API
    await page.route("*/**/releases", async (route) => {
      await route.fulfill({ json: mockReleases });
    });

    await mockConfigAPI(page, {
      parameters: {
        TIDARR_VERSION: "1.1.6",
      },
    });

    // Clear localStorage to simulate first visit
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, LOCALSTORAGE_KEY);

    await page.goto("/");

    // Wait for the changelog dialog to appear
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).toBeVisible({ timeout: 10000 });

    // Click "Got it" button
    await page.getByRole("button", { name: /Got it/i }).click();

    // Dialog should close
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).not.toBeVisible();

    // Verify localStorage was updated
    const storedVersion = await page.evaluate(
      ([key]) => localStorage.getItem(key),
      [LOCALSTORAGE_KEY],
    );
    expect(storedVersion).toBe("1.1.6");

    // Reload page - dialog should not appear again
    await page.reload();
    await expect(page.getByTestId("logo")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).not.toBeVisible();
  });

  test("Closing dialog should dismiss temporarily but reappear on reload", async ({
    page,
  }) => {
    // Mock releases API
    await page.route("*/**/releases", async (route) => {
      await route.fulfill({ json: mockReleases });
    });

    await mockConfigAPI(page, {
      parameters: {
        TIDARR_VERSION: "1.1.6",
      },
    });

    // Clear localStorage to simulate first visit
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, LOCALSTORAGE_KEY);

    await page.goto("/");

    // Wait for the changelog dialog to appear
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).toBeVisible({ timeout: 10000 });

    // Click "Close" button (not "Got it")
    await page.getByRole("button", { name: "Close" }).click();

    // Dialog should close
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).not.toBeVisible();

    // localStorage should NOT be updated (still no value)
    const storedVersion = await page.evaluate(
      ([key]) => localStorage.getItem(key),
      [LOCALSTORAGE_KEY],
    );
    expect(storedVersion).toBeNull();

    // Reload page - dialog should reappear
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /What's new in Tidarr/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
