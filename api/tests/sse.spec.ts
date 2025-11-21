import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

// Import common mocks - use processing stack with data for SSE tests
import {
  mockConfigService,
  mockProcessingStackWithData,
  mockSyncServiceBasic,
  mockTiddlConfigHelper,
  mockTokenRefreshService,
} from "./mocks";

// Setup all common mocks with processing stack that has data
mockConfigService();
mockTiddlConfigHelper();
mockTokenRefreshService();
mockSyncServiceBasic();
mockProcessingStackWithData(); // This test needs queue data for SSE

/**
 * SSE Routes tests are skipped because supertest waits for the response to end,
 * but SSE endpoints keep the connection open indefinitely.
 * TODO: Implement proper SSE testing with a different approach (e.g., EventSource, custom client)
 */
describe.skip("SSE Routes", () => {
  let app: Express.Application;

  beforeEach(async () => {
    const { default: importedApp } = await import("../index");
    app = importedApp;
  });

  describe("GET /api/stream-processing", () => {
    it("should establish SSE connection for processing queue", async () => {
      const response = await request(app).get("/api/stream-processing");

      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["cache-control"]).toBe("no-cache");
      expect(response.headers["connection"]).toBe("keep-alive");
    });

    it("should send initial queue data", async () => {
      const response = await request(app).get("/api/stream-processing");

      // SSE data is sent as "data: {json}\n\n"
      expect(response.text).toContain("data:");
    });
  });

  describe("GET /api/stream-item-output/:id", () => {
    it("should establish SSE connection for item output", async () => {
      const response = await request(app).get("/api/stream-item-output/123");

      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.headers["cache-control"]).toBe("no-cache");
      expect(response.headers["connection"]).toBe("keep-alive");
    });

    it("should send initial output for the item", async () => {
      const response = await request(app).get("/api/stream-item-output/123");

      // SSE data should contain the item id and output
      expect(response.text).toContain("data:");
      expect(response.text).toContain("123");
    });

    it("should handle different item IDs", async () => {
      const response1 = await request(app).get("/api/stream-item-output/123");
      const response2 = await request(app).get("/api/stream-item-output/456");

      expect(response1.headers["content-type"]).toContain("text/event-stream");
      expect(response2.headers["content-type"]).toContain("text/event-stream");
    });
  });
});
