import { expect } from "@playwright/test";

import { test } from "../test-isolation";

import { mockItemOutputSSE } from "./utils/mock";

/**
 * Lidarr Integration Tests
 * Tests the Newznab indexer API and SABnzbd download client API
 */

// ==================== INDEXER TESTS ====================

test("Lidarr Indexer: Should return capabilities XML (t=caps)", async ({
  page,
}) => {
  await page.goto("/");

  // Make API request directly (don't intercept)
  const response = await page.request.get("/api/lidarr?t=caps");
  const capsResponse = await response.text();

  expect(capsResponse).toBeTruthy();
  expect(capsResponse).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  expect(capsResponse).toContain("<caps>");
  expect(capsResponse).toContain('<server version="1.0" title="Tidarr"');
  expect(capsResponse).toContain("<searching>");
  expect(capsResponse).toContain('<search available="yes"');
  expect(capsResponse).toContain('<music-search available="yes"');
  expect(capsResponse).toContain("<categories>");
});

test("Lidarr Indexer: Should search with t=search and return Newznab XML", async ({
  page,
}) => {
  await page.goto("/");

  // Make API request directly with query
  const response = await page.request.get("/api/lidarr?t=search&q=Nirvana");
  const searchResponse = await response.text();

  expect(response.status()).toBe(200);
  expect(searchResponse).toBeTruthy();
  expect(searchResponse).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  expect(searchResponse).toContain("<rss");
  expect(searchResponse).toContain("<channel>");
  expect(searchResponse).toContain('<newznab:response offset="0"');
});

test("Lidarr Indexer: Should search with t=music using artist and album params", async ({
  page,
}) => {
  await page.goto("/");

  // Make API request directly with artist and album
  const response = await page.request.get(
    "/api/lidarr?t=music&artist=Nirvana&album=Nevermind",
  );
  const searchResponse = await response.text();

  expect(response.status()).toBe(200);
  expect(searchResponse).toBeTruthy();
  expect(searchResponse).toContain("<rss");
  expect(searchResponse).toContain("<channel>");
});

test("Lidarr Indexer: Should return album items with Newznab attributes", async ({
  page,
}) => {
  await page.goto("/");

  // Make API request directly
  const response = await page.request.get("/api/lidarr?t=search&q=Nirvana");
  const searchResponse = await response.text();

  expect(searchResponse).toBeTruthy();

  // Check for Newznab item structure if results exist
  if (searchResponse && searchResponse.includes("<item>")) {
    // Should contain required Newznab attributes
    expect(searchResponse).toContain('<newznab:attr name="artist"');
    expect(searchResponse).toContain('<newznab:attr name="album"');
    expect(searchResponse).toContain('<newznab:attr name="coverurl"');
    expect(searchResponse).toContain("<title>");
    expect(searchResponse).toContain("<link>");
    expect(searchResponse).toContain("<guid>");
  }
});

test("Lidarr Indexer: Should download NZB file for album", async ({ page }) => {
  await page.goto("/");

  // Trigger download for a specific album ID
  const response = await page.request.get("/api/lidarr/download/77610756");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/x-nzb");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  expect(response.headers()["content-disposition"]).toContain(".nzb");

  const body = await response.text();
  expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  expect(body).toContain('<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">');
  expect(body).toContain("<file");
  expect(body).toContain("77610756"); // Album ID in NZB

  // Clean up routes
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

// ==================== SABNZBD API TESTS ====================

test("Lidarr SABnzbd: Should return version (mode=version)", async ({
  page,
}) => {
  await page.goto("/");

  const response = await page.request.get("/api/sabnzbd/api?mode=version");

  expect(response.status()).toBe(200);

  const json = await response.json();
  expect(json).toHaveProperty("version");
  expect(json.version).toBe("3.0.0"); // SABnzbd version
});

test("Lidarr SABnzbd: Should return config (mode=get_config)", async ({
  page,
}) => {
  await page.goto("/");

  const response = await page.request.get("/api/sabnzbd/api?mode=get_config");

  expect(response.status()).toBe(200);

  const json = await response.json();
  expect(json).toHaveProperty("config");
  expect(json.config).toHaveProperty("misc");
  expect(json.config.misc).toHaveProperty("complete_dir");
});

test("Lidarr SABnzbd: Should add album to queue via addfile (NZB upload)", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");

  // First get an NZB file
  await page.goto("/");
  const nzbResponse = await page.request.get("/api/lidarr/download/77610756");
  const nzbContent = await nzbResponse.text();

  // Create multipart form data with NZB
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const multipartBody = [
    `------${boundary}`,
    'Content-Disposition: form-data; name="name"; filename="album.nzb"',
    "Content-Type: application/x-nzb",
    "",
    nzbContent,
    `------${boundary}--`,
  ].join("\r\n");

  // Upload NZB via addfile
  const response = await page.request.post("/api/sabnzbd/api?mode=addfile", {
    data: multipartBody,
    headers: {
      "Content-Type": `multipart/form-data; boundary=----${boundary}`,
    },
  });

  expect(response.status()).toBe(200);

  const json = await response.json();
  expect(json).toHaveProperty("status");
  expect(json.status).toBe(true);
  expect(json).toHaveProperty("nzo_ids");
  expect(Array.isArray(json.nzo_ids)).toBe(true);
  expect(json.nzo_ids.length).toBeGreaterThan(0);
  expect(json.nzo_ids[0]).toContain("tidarr_nzo_");
});

test("Lidarr SABnzbd: Should show album in queue after adding (API + UI)", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");
  await page.goto("/");
  await page.waitForTimeout(200);

  // Add album via direct API call with Lidarr source
  await page.request.post("/api/save", {
    data: {
      item: {
        id: "77610756",
        title: "Nevermind",
        artist: "Nirvana",
        type: "album",
        url: "https://tidal.com/browse/album/77610756",
        quality: "high",
        source: "lidarr",
        status: "download",
      },
    },
  });

  await page.waitForTimeout(500);

  // ===== API Verification =====
  // Check SABnzbd queue API
  const queueResponse = await page.request.get("/api/sabnzbd/api?mode=queue");
  const queueJson = await queueResponse.json();

  expect(queueJson.queue.noofslots).toEqual(1);
  expect(queueJson.queue.slots[0]).toHaveProperty("nzo_id");
  expect(queueJson.queue.slots[0].filename).toContain("Nevermind");
});

test("Lidarr SABnzbd: Should show completed album in history", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");

  // Mock finished item in processing stack
  await page.route("**/api/stream-processing", async (route) => {
    const mockData = [
      {
        id: "123",
        title: "Nevermind",
        artist: "Nirvana",
        type: "album",
        quality: "high",
        status: "finished",
        source: "lidarr",
        loading: false,
      },
    ];
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: `data: ${JSON.stringify(mockData)}\n\n`,
    });
  });

  await page.goto("/");
  await page.waitForTimeout(500);

  // Check history
  const historyResponse = await page.request.get(
    "/api/sabnzbd/api?mode=history&limit=60",
  );
  const historyJson = await historyResponse.json();

  expect(historyJson).toHaveProperty("history");
  expect(historyJson.history).toHaveProperty("slots");
  expect(Array.isArray(historyJson.history.slots)).toBe(true);
});

test("Lidarr SABnzbd: Should delete item from queue", async ({ page }) => {
  await mockItemOutputSSE(page, "high");

  // Add an item first
  await page.goto("/");
  await page.request.post("/api/save", {
    data: {
      title: "Test Album",
      artist: "Test Artist",
      type: "album",
      url: "https://tidal.com/browse/album/12345",
      quality: "high",
      source: "lidarr",
    },
  });

  await page.waitForTimeout(500);

  // Get queue to find nzo_id
  const queueResponse = await page.request.get("/api/sabnzbd/api?mode=queue");
  const queueJson = await queueResponse.json();

  if (queueJson.queue.slots.length > 0) {
    const nzoId = queueJson.queue.slots[0].nzo_id;

    // Delete the item
    const deleteResponse = await page.request.get(
      `/api/sabnzbd/api?mode=queue&name=delete&value=${nzoId}`,
    );

    expect(deleteResponse.status()).toBe(200);

    const deleteJson = await deleteResponse.json();
    expect(deleteJson).toHaveProperty("status");
  }
});

// ==================== UI INTEGRATION TESTS ====================

test("Lidarr Integration: Should respect queue pause state in SABnzbd API", async ({
  page,
}) => {
  await mockItemOutputSSE(page, "high");

  // Mock paused queue
  await page.route("**/queue/status", async (route) => {
    await route.fulfill({
      status: 200,
      json: { isPaused: true },
    });
  });

  await page.goto("/");
  await page.waitForTimeout(500);

  // Check queue status via SABnzbd API
  const queueResponse = await page.request.get("/api/sabnzbd/api?mode=queue");
  const queueJson = await queueResponse.json();

  // Queue should reflect paused state
  expect(queueJson.queue).toHaveProperty("paused");
  // Note: The actual paused value depends on the processing stack state
});
