import { expect, Page } from "@playwright/test";

import { test } from "../test-isolation";

import { login } from "./utils/login";

test.use({ envFile: ".env.e2e.guest" });

const GUEST_PASSWORD = "guesttidarr";

async function getToken(page: Page, password: string) {
  const response = await page.request.post("/api/auth", {
    data: { password },
  });

  expect(response.status()).toBe(200);

  const { token, role } = await response.json();
  return { token, role };
}

test("Guest access : Should get a guest role with the guest password", async ({
  page,
}) => {
  await page.goto("/login");

  const { role } = await getToken(page, GUEST_PASSWORD);
  expect(role).toBe("guest");

  const admin = await getToken(page, "passwdtidarr");
  expect(admin.role).toBe("admin");
});

test("Guest access : Should hide settings and watch list", async ({ page }) => {
  await page.goto("/");
  await login(page, GUEST_PASSWORD);

  // Settings are admin only
  await expect(page.getByLabel("Tidarr settings")).toHaveCount(0);

  // And the settings page redirects to homepage
  await page.goto("/parameters");
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  expect(new URL(page.url()).pathname).toBe("/");
});

test("Guest access : Should not receive integration credentials", async ({
  page,
}) => {
  await page.goto("/login");

  const { token } = await getToken(page, GUEST_PASSWORD);
  const response = await page.request.get("/api/settings", {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);

  const settings = await response.json();
  expect(settings.isGuest).toBe(true);
  expect(settings.parameters.PLEX_TOKEN).toBe("****");
  expect(settings.parameters.PUID).toBeUndefined();
  expect(settings.tiddl_config?.auth?.token).toBeUndefined();
  expect(settings.tiddl_config?.download?.download_path).toBeUndefined();
});

test("Guest access : Should not change what an admin receives", async ({
  page,
}) => {
  await page.goto("/login");

  const { token } = await getToken(page, "passwdtidarr");
  const response = await page.request.get("/api/settings", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const settings = await response.json();
  expect(settings.isGuest).toBe(false);

  // An admin gets the whole configuration, credentials included
  expect(settings.parameters.PLEX_TOKEN).toBe("plex-token");
  expect(settings.parameters.PUID).toBe("1000");
  expect(settings.parameters.PLEX_URL).toBe("http://plex.url");

  // The Tidal token stays on the server for everyone
  expect(settings.tiddl_config?.auth?.token).toBeUndefined();
});

test("Guest access : Should be rejected on admin routes without being logged out", async ({
  page,
}) => {
  await page.goto("/");
  await login(page, GUEST_PASSWORD);

  const token = await page.evaluate("localStorage.getItem('tidarr-token')");

  const response = await page.request.delete("/api/remove-all", {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(403);
  expect((await response.json()).code).toBe("FORBIDDEN_ROLE");

  // And the guest keeps browsing
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
  expect(await page.evaluate("localStorage.getItem('tidarr-token')")).toBe(
    token,
  );
});

test("Guest access : Should still be able to queue an item", async ({
  page,
}) => {
  await page.goto("/login");

  const { token } = await getToken(page, GUEST_PASSWORD);
  const response = await page.request.post("/api/save", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      item: {
        id: 77610756,
        title: "Nevermind",
        artist: "Nirvana",
        type: "album",
        url: "/album/77610756",
        quality: "high",
      },
    },
  });

  expect(response.status()).toBe(201);
});
