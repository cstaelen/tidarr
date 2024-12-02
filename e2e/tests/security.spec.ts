import { expect, test } from "@playwright/test";

import { mockAuthAPI } from "./utils/mock";

test("Tidarr security : Should see login page", async ({ page }) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await page.goto("/login");
  await page.evaluate("localStorage.clear()");
  await page.getByPlaceholder("Password...").fill("tidarrpwd");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  await expect(page.url()).not.toContain("/login");

  const token = await page.evaluate("localStorage.getItem('tidarr-token')");
  await expect(token).toEqual("tokenABCXYZ");

  await page.evaluate("localStorage.removeItem('tidarr-token')");
  await page.reload();
  await expect(page.url()).toContain("/login");

  await page.goto("/");
  await expect(page.url()).toContain("/login");
});

test("Tidarr security : Should be redirected to login page", async ({
  page,
}) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await page.goto("/login");
  await page.evaluate("localStorage.clear()");
  await expect(page.getByPlaceholder("Password...")).toBeInViewport();

  await page.goto("/");
  await expect(page.url()).toContain("/login");
  await expect(page.getByPlaceholder("Password...")).toBeInViewport();
});

test("Tidarr security : Should be able to log out", async ({ page }) => {
  await mockAuthAPI(page, "tokenABCXYZ");
  await page.goto("/login");
  await page.evaluate("localStorage.clear()");

  await page.getByPlaceholder("Password...").fill("tidarrpwd");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  await expect(page.url()).not.toContain("/login");

  await page.getByLabel("Logout").click();
  await expect(page.getByPlaceholder("Password...")).toBeInViewport();
});

test("Tidarr security : Login page should redirect to home in public mode", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  await expect(page.url()).not.toContain("/login");
});
