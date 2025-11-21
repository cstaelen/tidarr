import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

// Import common mocks - use full sync service for this test
import {
  mockConfigService,
  mockProcessingStackEmpty,
  mockSyncServiceFull,
  mockTiddlConfigHelper,
  mockTokenRefreshService,
} from "./mocks";

// Setup all common mocks with full sync service
mockConfigService();
mockTiddlConfigHelper();
mockTokenRefreshService();
mockSyncServiceFull(); // This test needs full sync functionality
mockProcessingStackEmpty();

describe("Sync Routes", () => {
  let app: Express.Application;

  beforeEach(async () => {
    const { default: importedApp } = await import("../index");
    app = importedApp;
  });

  describe("GET /api/sync/list", () => {
    it("should return sync list", async () => {
      const response = await request(app).get("/api/sync/list").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /api/sync/save", () => {
    it("should add playlist to sync list", async () => {
      const playlistData = {
        item: {
          id: "abcdef",
          type: "playlist",
          url: "https://tidal.com/browse/playlist/abcdef",
          title: "Test Sync Playlist",
        },
      };

      const response = await request(app)
        .post("/api/sync/save")
        .send(playlistData)
        .expect(201);

      expect(response.body).toEqual({});
    });

    it("should reject request without item", async () => {
      const response = await request(app)
        .post("/api/sync/save")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/sync/remove", () => {
    it("should remove playlist from sync list", async () => {
      const response = await request(app)
        .delete("/api/sync/remove")
        .send({ id: "abcdef" })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it("should reject request without id", async () => {
      const response = await request(app)
        .delete("/api/sync/remove")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/sync/remove-all", () => {
    it("should remove all playlists from sync list", async () => {
      const response = await request(app)
        .delete("/api/sync/remove-all")
        .expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe("POST /api/sync/trigger", () => {
    it("should trigger immediate sync", async () => {
      const response = await request(app).post("/api/sync/trigger").expect(202);

      expect(response.body).toEqual({});
    });
  });
});
