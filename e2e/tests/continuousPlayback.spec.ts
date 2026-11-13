import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { endCurrentTrack, mockStreamEndpoints } from "./utils/mock";
import { runSearch } from "./utils/search";

/**
 * Continuous playback E2E tests
 * Pressing play on a track inside a track-list plays the whole list,
 * advancing automatically when each track ends.
 */

const TRACKS_TAB = "Tracks (300)";

test.describe("Continuous playback", () => {
  test("Should play the whole list and advance automatically when a track ends", async ({
    page,
  }) => {
    const signedTrackIds: string[] = [];
    await mockStreamEndpoints(page, (trackId) => signedTrackIds.push(trackId));

    await runSearch("Nirvana", page);
    await page.getByRole("tab", { name: TRACKS_TAB }).click();
    await page.waitForTimeout(500);

    const panel = page.getByTestId("floating-player-panel");

    // Press play on the second track of the list
    await page.getByTestId("item").nth(1).getByLabel("Play track").click();
    await expect(panel).toContainText("Come As You Are");

    // Playing from the chosen track, the previous control is available
    await expect(page.getByTestId("playback-previous")).toBeEnabled();

    // When the track ends, the next track of the list starts automatically
    await endCurrentTrack(page);
    await expect(panel).toContainText("Lithium");

    // Playback keeps advancing through the list
    await endCurrentTrack(page);
    await expect(panel).toContainText("Heart-Shaped Box");

    expect(signedTrackIds).toEqual(["77610759", "77610761", "77610847"]);
  });

  test("Should navigate the list with the Previous and Next controls", async ({
    page,
  }) => {
    const signedTrackIds: string[] = [];
    await mockStreamEndpoints(page, (trackId) => signedTrackIds.push(trackId));

    await runSearch("Nirvana", page);
    await page.getByRole("tab", { name: TRACKS_TAB }).click();
    await page.waitForTimeout(500);

    const panel = page.getByTestId("floating-player-panel");
    const previousButton = page.getByTestId("playback-previous");
    const nextButton = page.getByTestId("playback-next");

    // Press play on the first track of the list
    await page.getByTestId("item").first().getByLabel("Play track").click();
    await expect(panel).toContainText("Smells Like Teen Spirit");

    // First track of the list: no previous track, but a next one
    await expect(previousButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();

    // Next goes forward in the list
    await nextButton.click();
    await expect(panel).toContainText("Come As You Are");
    await expect(previousButton).toBeEnabled();

    // Previous goes back in the list
    await previousButton.click();
    await expect(panel).toContainText("Smells Like Teen Spirit");

    expect(signedTrackIds).toEqual(["77610757", "77610759", "77610757"]);
  });

  test("Should stop when the last track of the list ends", async ({ page }) => {
    const signedTrackIds: string[] = [];
    await mockStreamEndpoints(page, (trackId) => signedTrackIds.push(trackId));

    await runSearch("Nirvana", page);
    await page.getByRole("tab", { name: TRACKS_TAB }).click();
    await page.waitForTimeout(500);

    const panel = page.getByTestId("floating-player-panel");

    // Press play on the last track of the list
    await page.getByTestId("item").last().getByLabel("Play track").click();
    await expect(panel).toContainText("Territorial Pissings");

    // Last track of the list: no next track
    await expect(page.getByTestId("playback-next")).toBeDisabled();

    // When the last track ends, playback stops instead of advancing
    await endCurrentTrack(page);
    await expect(page.getByTestId("playback-resume")).toBeVisible();

    expect(signedTrackIds).toEqual(["77610763"]);
  });

  test("Should keep single-track playback outside a list context", async ({
    page,
  }) => {
    const signedTrackIds: string[] = [];
    await mockStreamEndpoints(page, (trackId) => signedTrackIds.push(trackId));

    // A single track page: the header play button is outside any track list
    await page.goto("/track/77610761");
    await page.getByLabel("Play track").first().click();

    const panel = page.getByTestId("floating-player-panel");
    await expect(panel).toContainText("Lithium");

    // No queue: Previous and Next are unavailable
    await expect(page.getByTestId("playback-previous")).toBeDisabled();
    await expect(page.getByTestId("playback-next")).toBeDisabled();

    // When the track ends, playback stops: no track is auto-played
    await endCurrentTrack(page);
    await expect(page.getByTestId("playback-resume")).toBeVisible();

    expect(signedTrackIds).toEqual(["77610761"]);
  });

  test("Should skip a track that cannot be signed and play the following one", async ({
    page,
  }) => {
    const signedTrackIds: string[] = [];
    await mockStreamEndpoints(page);
    // Record every sign attempt, including the ones intercepted by the
    // failing-sign route below (which cannot report via onSign)
    page.on("request", (request) => {
      const match = request.url().match(/\/api\/stream\/sign\/([^/?]+)/);
      if (match) signedTrackIds.push(match[1]);
    });

    // "Lithium" (3rd track) cannot be signed: the endpoint returns no URL
    await page.route("**/api/stream/sign/77610761", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      }),
    );

    await runSearch("Nirvana", page);
    await page.getByRole("tab", { name: TRACKS_TAB }).click();
    await page.waitForTimeout(500);

    const panel = page.getByTestId("floating-player-panel");

    // Press play on the second track of the list
    await page.getByTestId("item").nth(1).getByLabel("Play track").click();
    await expect(panel).toContainText("Come As You Are");

    // When it ends, the unstreamable track is skipped and the next one plays
    await endCurrentTrack(page);
    await expect(panel).toContainText("Heart-Shaped Box");
    await expect(page.getByTestId("playback-pause")).toBeVisible();

    expect(signedTrackIds).toEqual(["77610759", "77610761", "77610847"]);
  });

  test("Should keep the current track when no following track can be signed", async ({
    page,
  }) => {
    const signedTrackIds: string[] = [];
    await mockStreamEndpoints(page);
    // Record every sign attempt, including the ones intercepted by the
    // failing-sign route below (which cannot report via onSign)
    page.on("request", (request) => {
      const match = request.url().match(/\/api\/stream\/sign\/([^/?]+)/);
      if (match) signedTrackIds.push(match[1]);
    });

    // The last track of the list cannot be signed
    await page.route("**/api/stream/sign/77610763", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      }),
    );

    await runSearch("Nirvana", page);
    await page.getByRole("tab", { name: TRACKS_TAB }).click();
    await page.waitForTimeout(500);

    const panel = page.getByTestId("floating-player-panel");

    // Press play on the second-to-last track of the list
    await page.getByTestId("item").nth(16).getByLabel("Play track").click();
    await expect(panel).toContainText("Come As You Are");

    // A failed manual skip changes nothing: the current track keeps playing
    await page.getByTestId("playback-next").click();
    await expect(panel).toContainText("Come As You Are");
    await expect(page.getByTestId("playback-pause")).toBeVisible();

    // When the current track ends and no following track can be signed,
    // playback stops cleanly and the player still shows the last audible
    // track
    await endCurrentTrack(page);
    await expect(page.getByTestId("playback-resume")).toBeVisible();
    await expect(panel).toContainText("Come As You Are");

    expect(signedTrackIds).toEqual(["2570673", "77610763", "77610763"]);
  });
});
