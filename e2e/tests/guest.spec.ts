import { expect, Page } from "@playwright/test";

import { test } from "../test-isolation";

import { login } from "./utils/login";
import { mockConfigAPI } from "./utils/mock";

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

async function loginAsGuestWithoutUI(page: Page) {
  await page.goto("/login");
  const { token } = await getToken(page, GUEST_PASSWORD);
  await page.evaluate(
    (value) => localStorage.setItem("tidarr-token", value),
    token,
  );
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

  // Watch list is admin only
  await page.goto("/processing");
  await expect(page.getByRole("tab", { name: /^Queue/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Watch list/ })).toHaveCount(0);

  // And the settings page redirects to homepage
  await page.goto("/parameters");
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { name: "Tidarr" })).toBeInViewport();
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
        status: "queue_download",
      },
    },
  });

  expect(response.status()).toBe(201);
});

test("Guest access : Should explain a missing Tidal token instead of offering to fix it", async ({
  page,
}) => {
  await mockConfigAPI(page, { noToken: true });

  const runTokenCalls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/run-token"))
      runTokenCalls.push(request.url());
  });

  await loginAsGuestWithoutUI(page);
  await page.goto("/");

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Tidal token not found !" }),
  ).toBeVisible();
  await expect(dialog).toContainText("Ask its administrator to authenticate");

  // Authenticating is admin only: no link, and no call to the SSE route
  await expect(dialog.getByText("Click on the link below")).toHaveCount(0);
  expect(runTokenCalls).toEqual([]);
});

test("Guest access : Should not flash admin controls while the config loads", async ({
  page,
}) => {
  await loginAsGuestWithoutUI(page);

  // Delay /api/settings: the role has to come from the token, not from there
  await page.route("**/settings", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.fallback();
  });

  await page.goto("/");

  // Still loading the config...
  await expect(page.getByRole("progressbar")).toBeVisible();

  // ... and the admin controls were never rendered (no retry here, on purpose)
  expect(await page.getByLabel("Tidarr settings").count()).toBe(0);
});
