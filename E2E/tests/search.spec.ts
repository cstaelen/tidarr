import { test, expect } from "@playwright/test";

test("Run search from homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading")).toContainText("Tidarr");
  await expect(
    page.getByLabel(
      "Tidal search (keywords, artist URL, album URL, playlist URL)",
    ),
  ).toBeVisible();

  await page.getByTestId("search-input").click();
  await page.getByTestId("search-input").fill("COucouc");
  await page.getByTestId("search-input").press("Meta+Shift+ArrowLeft");
  await page.getByTestId("search-input").fill("Nirvana");
  await page.getByTestId("search-input").press("Enter");

  await expect(page.locator("#full-width-tab-0")).toContainText(
    "Top results (700)",
  );
  await expect(page.locator("#full-width-tab-1")).toContainText("Albums (300)");
  await expect(page.locator("#full-width-tab-2")).toContainText(
    "Artists (100)",
  );
  await expect(page.locator("#full-width-tab-3")).toContainText("Tracks (300)");

  await expect(page.getByLabel("Top results (700)")).toContainText("Artist(s)");
  await expect(page.getByRole("heading", { name: "Album(s)" })).toBeVisible();
  await expect(
    page.locator(".MuiStack-root > .MuiAvatar-root > .MuiAvatar-img").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nevermind", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("hi_res13 tracks49 min1991Get").first(),
  ).toBeVisible();
  await expect(page.locator(".MuiStack-root > img").first()).toBeVisible();
  await expect(page.getByLabel("Top results (700)")).toContainText(
    "See all albums (300)",
  );
  await expect(page.getByRole("heading", { name: "Track(s)" })).toBeVisible();

  await page.getByRole("tab", { name: "Albums (300)" }).click();
  await expect(page.getByLabel("Albums (300)")).toContainText(
    "Nevermind by Nirvana",
  );
  await expect(page.getByLabel("Albums (300)")).toContainText(
    "hi_res13 tracks49 min1991Get album",
  );
  await expect(page.locator(".MuiStack-root > img").first()).toBeVisible();

  await page.getByRole("tab", { name: "Artists (100)" }).click();
  await expect(page.getByLabel("Artists (100)")).toContainText(
    "NirvanaPopularity: 73Show discography",
  );
  await expect(
    page.getByRole("img", { name: "Nirvana" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "LOAD MORE (page: 1/6)" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Tracks (300)" }).click();
  await expect(page.locator(".MuiStack-root").first()).toBeVisible();
  await expect(page.getByLabel("Tracks (300)")).toContainText(
    "Smells Like Teen Spirit by Nirvana",
  );

  await expect(
    page
      .locator(
        "div:nth-child(2) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > div > div > .MuiChip-label",
      )
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lossless" }).click();
  await expect(
    page
      .locator(
        "div:nth-child(2) > .MuiPaper-root > div:nth-child(2) > .MuiBox-root > .MuiCardContent-root > div > div > .MuiChip-label",
      )
      .first(),
  ).not.toBeVisible();
});
