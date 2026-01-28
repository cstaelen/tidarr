import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { login } from "./utils/login";

test.use({ envFile: ".env.e2e.auth" });
test("Tidarr security : Should see login page", async ({ page }) => {
  await page.goto("/");

  await login(page);

  // And A new token should be set
  const token = await page.evaluate("localStorage.getItem('tidarr-token')");
  await expect(token).not.toBeNull();

  // When I remove token and navigate to a different page to trigger re-auth check
  await page.evaluate("localStorage.removeItem('tidarr-token')");

  // When I go to homepage
  await page.goto("/");
  // Then I should be redirected to login page
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("Tidarr security : Should be redirected to login page", async ({
  page,
}) => {
  await page.goto("/login");

  // When I go to homepage
  await page.goto("/");
  // Then I should be redirected to login page
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("Tidarr security : Should be redirected to requested url after login", async ({
  page,
}) => {
  await page.goto("/search/Nirvana");

  await login(page);

  // Then I should be redirected to the requested URL
  await expect(
    page.getByRole("link", { name: "Nirvana", exact: true }).first(),
  ).toBeInViewport();
});

test("Tidarr security : Should be able to log out", async ({ page }) => {
  await page.goto("/login");

  await login(page);

  await expect(page.getByLabel("Logout")).toBeInViewport();

  // When I click on logout button
  await page.getByLabel("Logout").click();

  // Then I should be redirected to login page
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("Tidarr security : Login page should redirect to home in public mode", async ({
  page,
}) => {
  // When I go to login page in public mode
  await page.goto("/login");
  // then I should be redirected to homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
});

test("Tidarr security : Wrong credentials should display an error", async ({
  page,
}) => {
  await page.route("*/**/auth", async (route) => {
    await route.fulfill({
      status: 401,
      json: { error: true, message: "Invalid credentials" },
    });
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // When I proceed to login with wrong credentials
  await page.getByPlaceholder("Password...").fill("passwdtidarr");
  await page.getByRole("button", { name: "Submit" }).click();

  // Then I should see error message
  await expect(page.getByText("Invalid credentials")).toBeInViewport();
});
