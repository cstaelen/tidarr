import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { login, oidcLogin } from "./utils/login";

test("API Key : Should display authentication mode and API key in settings", async ({
  page,
}) => {
  await page.goto("/");

  // Open settings modal
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Navigate to Authentication tab
  await page.getByRole("tab", { name: "Security" }).click();

  // Check authentication heading
  await expect(
    page.getByRole("heading", { name: "Authentication" }),
  ).toBeVisible();

  // Check auth mode display - should show "None (Public)" by default
  await expect(page.getByText("Current Mode:")).toBeVisible();
  await expect(page.getByText("None (Public)")).toBeVisible();

  // API key section should NOT be visible when auth is none
  await expect(
    page.getByRole("heading", { name: "API Key" }),
  ).not.toBeVisible();
});

test.describe("Tests with password auth", () => {
  test.use({ envFile: ".env.e2e.auth" });

  test("API Key : Should display API key section when authentication is active (Password)", async ({
    page,
  }) => {
    await page.goto("/");

    await login(page);

    // Open settings modal
    await page.getByRole("button", { name: "Settings" }).click();

    // Navigate to Authentication tab
    await page.getByRole("tab", { name: "Security" }).click();

    // Check auth mode shows Password
    await expect(page.getByText("Current Mode:")).toBeVisible();
    await expect(page.getByText("Password")).toBeVisible();

    // API key section should be visible
    await expect(page.getByRole("heading", { name: "API Key" })).toBeVisible();

    // Check API key field is present and populated
    const apiKeyField = page.getByRole("textbox", { name: "API Key" });
    await expect(apiKeyField).toBeVisible();

    const apiKey = await apiKeyField.inputValue();
    await expect(apiKey).toBeDefined();
    await expect(apiKeyField).toHaveValue(apiKey);

    // Check copy button is present
    await expect(
      page.getByRole("button", { name: /Copy to clipboard/ }),
    ).toBeVisible();

    // Check regenerate button is present
    await expect(
      page.getByRole("button", { name: "Generate new API key" }),
    ).toBeVisible();

    // Check usage tip
    await expect(
      page.getByText("Use this API key to authenticate with *arr applications"),
    ).toBeVisible();
  });

  test("API Key : Should regenerate API key when clicking regenerate button", async ({
    page,
  }) => {
    await page.goto("/");

    await login(page);

    // Open settings modal
    await page.getByRole("button", { name: "Settings" }).click();

    // Navigate to Authentication tab
    await page.getByRole("tab", { name: "Security" }).click();

    // Check original API key is present
    const apiKeyField = page.getByRole("textbox", { name: "API Key" });
    await expect(apiKeyField).not.toBeEmpty();

    const apiKey = await apiKeyField.inputValue();
    expect(apiKey).toBeDefined();

    // Click regenerate button
    const regenerateButton = page.getByRole("button", {
      name: "Generate new API key",
    });

    // Accept confirmation dialog
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("invalidate your current API key");
      await dialog.accept();
    });

    await regenerateButton.click();

    // Wait for the API key to update
    await expect(apiKeyField).not.toBeEmpty();

    const apiKeyNew = await apiKeyField.inputValue();
    expect(apiKeyNew).toBeDefined();

    expect(apiKeyNew).not.toEqual(apiKey);
  });
});

test.describe("Tests with OIDC auth", () => {
  test.use({ envFile: ".env.e2e.oidc" });

  test("API Key : Should display API key section when authentication is active (OIDC)", async ({
    page,
  }) => {
    await page.goto("/");
    await oidcLogin(page);

    // Open settings modal
    await page.getByRole("button", { name: "Settings" }).click();

    // Navigate to Authentication tab
    await page.getByRole("tab", { name: "Security" }).click();

    // Check auth mode shows OpenID Connect
    await expect(page.getByText("Current Mode:")).toBeVisible();
    await expect(page.getByText("OpenID Connect")).toBeVisible();

    // API key section should be visible
    await expect(page.getByRole("heading", { name: "API Key" })).toBeVisible();

    // Check API key field is present
    const apiKeyField = page.getByRole("textbox", { name: "API Key" });
    await expect(apiKeyField).toBeVisible();

    const apiKey = await apiKeyField.inputValue();
    await expect(apiKeyField).toHaveValue(apiKey);
    await expect(apiKeyField).toBeDefined();
    await expect(apiKeyField).not.toHaveValue("");
  });
});
