import { expect, test } from "@playwright/test";

import { goToHome } from "./utils/helpers";
import { mockAuthAPI, mockConfigAPI, mockTidalQueries } from "./utils/mock";

test("Tidarr security : Should see login page", async ({ page }) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await mockConfigAPI(page);
  await goToHome(page);
  await page.evaluate("localStorage.clear()");
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // When I proceed to login
  await page.getByPlaceholder("Password...").fill("tidarrpwd");
  await page.getByRole("button", { name: "Submit" }).click();

  // Then I should be on homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();

  // And A new token should be set
  const token = await page.evaluate("localStorage.getItem('tidarr-token')");
  await expect(token).toEqual("tokenABCXYZ");

  // When I remove token
  await page.evaluate("localStorage.removeItem('tidarr-token')");
  // And I reload the page
  await page.reload();
  // Then I should be home login page
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // When I go to homepage
  await goToHome(page);
  // Then I should be redirected to login page
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("Tidarr security : Should be redirected to login page", async ({
  page,
}) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await page.goto("/login");
  await page.evaluate("localStorage.clear()");

  // When I go to homepage
  await goToHome(page);
  // Then I should be redirected to login page
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();
});

test("Tidarr security : Should be redirected to requested url after login", async ({
  page,
}) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await mockConfigAPI(page);
  await mockTidalQueries(page);
  await page.goto("/search/Nirvana");
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // When I proceed to login
  await page.getByPlaceholder("Password...").fill("tidarrpwd");
  await page.getByRole("button", { name: "Submit" }).click();

  // Then I should be on homepage
  await expect(
    page.getByRole("link", { name: "Nirvana", exact: true }).first(),
  ).toBeInViewport();
});

test("Tidarr security : Should be able to log out", async ({ page }) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await mockConfigAPI(page);
  await mockTidalQueries(page);
  await page.goto("/login");
  await page.evaluate("localStorage.clear()");

  // When I go to login page and log in
  await page.getByPlaceholder("Password...").fill("tidarrpwd");
  await page.getByRole("button", { name: "Submit" }).click();

  // Then I should be on the homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
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
  await mockTidalQueries(page);
  await mockConfigAPI(page);

  await page.goto("/login");
  await page.evaluate("localStorage.clear()");
  // then I should be redirected to homepage
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
});

test("Tidarr security : Wrong credentials should display an error", async ({
  page,
}) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await page.route("*/**/auth", async (route) => {
    await route.fulfill({
      status: 401,
      json: { error: true, message: "Invalid credentials" },
    });
  });
  await goToHome(page);
  await expect(
    page.getByRole("heading", { name: "Tidarr authentication" }),
  ).toBeInViewport();

  // When I proceed to login
  await page.getByPlaceholder("Password...").fill("tidarrpwd");
  await page.getByRole("button", { name: "Submit" }).click();

  // Then I should see error message
  await expect(page.getByText("Invalid credentials")).toBeInViewport();
});
