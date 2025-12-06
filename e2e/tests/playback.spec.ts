import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { runSearch } from "./utils/search";

/**
 * Player E2E Tests
 * Tests the audio player functionality with mocked API calls
 */

test.describe("Tidarr Player", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the stream sign endpoint
    await page.route("**/api/stream/sign/*", async (route) => {
      const trackId = route.request().url().split("/").pop();
      const mockSignedUrl = `http://localhost:8484/api/stream/play/${trackId}?exp=9999999999&sig=mock-signature`;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: mockSignedUrl }),
      });
    });

    // Mock the stream play endpoint with a fake audio file
    await page.route("**/api/stream/play/*", async (route) => {
      // Create a minimal valid MP3 header (MPEG-1 Layer 3, 44.1kHz, 128kbps)
      const mockAudioBuffer = Buffer.from([
        // ID3v2 header
        0x49,
        0x44,
        0x33,
        0x03,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        // MPEG frame header
        0xff,
        0xfb,
        0x90,
        0x00,
        // Padding with zeros (minimal valid frame)
        ...new Array(100).fill(0x00),
      ]);

      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "audio/mpeg",
          "content-length": mockAudioBuffer.length.toString(),
          "accept-ranges": "bytes",
        },
        body: mockAudioBuffer,
      });
    });
  });

  test("Should open player when clicking play button on a track", async ({
    page,
  }) => {
    await runSearch("Nirvana", page);

    // Switch to Tracks tab
    await page.getByRole("tab", { name: "Tracks (300)" }).click();
    await page.waitForTimeout(500);

    // Find and click the first play button
    const firstTrack = page.getByTestId("item").first();
    const playButton = firstTrack.getByLabel("Play track");

    await expect(playButton).toBeVisible();
    await playButton.click();

    // Wait for player to appear
    await page.waitForTimeout(1000);

    // Verify SpeedDial (player FAB) is visible
    await expect(
      page.locator('[aria-label="Track audio player"]'),
    ).toBeVisible();
  });

  test("Should display player UI, controls, and handle interactions", async ({
    page,
  }) => {
    await runSearch("Nirvana", page);

    // Switch to Tracks tab
    await page.getByRole("tab", { name: "Tracks (300)" }).click();
    await page.waitForTimeout(500);

    // Click play on first track
    const firstTrack = page.getByTestId("item").first();
    await firstTrack.getByLabel("Play track").click();

    // Open player by clicking on SpeedDial
    const speedDial = page.locator('[aria-label="Track audio player"]');
    const speedDialParent = page.locator("#Trackaudioplayer-action-1");
    await speedDial.hover();

    await expect(speedDialParent).toBeVisible();

    // Verify track title appears in player (use last() to get the one in the player, not search results)
    await expect(
      page.getByText("Smells Like Teen Spirit").last(),
    ).toBeVisible();

    // Verify Pause button (initially playing)
    const pauseButton = page.getByTestId("playback-pause");
    await expect(pauseButton).toBeVisible();

    // Verify Stop button
    const stopButton = page.getByTestId("playback-stop");
    await expect(stopButton).toBeVisible();

    // 3. Test play/pause toggle
    // Initially shows Pause icon (playing)
    await pauseButton.click();
    await page.waitForTimeout(300);

    // Should now show Play icon (paused)
    const playButton = page.getByTestId("playback-resume");
    await expect(playButton).toBeVisible();

    // Click play again
    await playButton.click();
    await page.waitForTimeout(300);

    // Should show Pause icon again
    await expect(pauseButton).toBeVisible();

    // 4. Test stop functionality
    await stopButton.click();
    await page.waitForTimeout(500);

    // Player FAB should be hidden
    await expect(speedDial).toBeHidden();
  });

  test("Should show different play button states for playing track", async ({
    page,
  }) => {
    await runSearch("Nirvana", page);

    // Switch to Tracks tab
    await page.getByRole("tab", { name: "Tracks (300)" }).click();
    await page.waitForTimeout(500);

    // Get first and second track
    const tracks = page.getByTestId("item");
    const firstTrack = tracks.first();
    const secondTrack = tracks.nth(1);

    // Click play on first track
    await firstTrack.getByLabel("Play track").click();
    await page.waitForTimeout(500);

    // First track should show stop icon (playing)
    await expect(firstTrack.getByLabel("Stop track")).toBeVisible();

    // Second track should still show play icon
    await expect(secondTrack.getByLabel("Play track")).toBeVisible();
    await page.locator(".MuiBackdrop-root").click();
    // Click play on second track (should switch playback)
    await secondTrack.getByLabel("Play track").click();
    await page.waitForTimeout(500);

    // Now first track should show play icon again
    await expect(firstTrack.getByLabel("Play track")).toBeVisible();

    // And second track should show stop icon
    await expect(secondTrack.getByLabel("Stop track")).toBeVisible();
  });
});
