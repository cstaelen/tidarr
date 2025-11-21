import { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import common mocks
import { mockCommonServices } from "./mocks";

// Setup all common mocks
mockCommonServices();

// Mock tiddl service - specific to this test file
vi.mock("../src/services/tiddl", () => ({
  tidalToken: vi.fn(),
  deleteTiddlConfig: vi.fn(),
}));

describe("Config Routes", () => {
  let app: Express;

  beforeEach(async () => {
    // Import app après les mocks
    const { default: importedApp } = await import("../index");
    app = importedApp;

    // Initialize app.locals.config since server doesn't start in test mode
    app.locals.config = {
      PLEX_URL: "",
      PLEX_TOKEN: "",
      NAVIDROME_URL: "",
      NAVIDROME_USER: "",
      NAVIDROME_PASSWORD: "",
      BEETS_ENABLE: false,
      GOTIFY_ENABLE: false,
      APPRISE_ENABLE: false,
      ENABLE_TIDAL_PROXY: false,
    };
  });

  describe("GET /api/settings", () => {
    it("should return server configuration", async () => {
      const response = await request(app).get("/api/settings").expect(200);

      expect(response.body).toHaveProperty("tiddl_config");
      expect(response.body).toHaveProperty("BEETS_ENABLE");
      expect(response.body).toHaveProperty("PLEX_URL");
    });

    it("should return Tidal config with auth token", async () => {
      const response = await request(app).get("/api/settings").expect(200);

      expect(response.body.tiddl_config).toHaveProperty("auth");
      expect(response.body.tiddl_config.auth).toHaveProperty("token");
      expect(response.body.tiddl_config.auth.token).toBe("mock-tidal-token");
    });

    it("should return server config with feature flags", async () => {
      const response = await request(app).get("/api/settings").expect(200);

      expect(response.body).toHaveProperty("BEETS_ENABLE");
      expect(response.body).toHaveProperty("GOTIFY_ENABLE");
      expect(response.body).toHaveProperty("APPRISE_ENABLE");
      expect(response.body).toHaveProperty("ENABLE_TIDAL_PROXY");
    });

    it("should return download settings", async () => {
      const response = await request(app).get("/api/settings").expect(200);

      expect(response.body.tiddl_config.download).toBeDefined();
      expect(response.body.tiddl_config.download.quality).toBe("high");
      expect(response.body.tiddl_config.download.threads).toBe(5);
    });

    it("should return template paths", async () => {
      const response = await request(app).get("/api/settings").expect(200);

      const { template } = response.body.tiddl_config;
      expect(template).toHaveProperty("album");
      expect(template).toHaveProperty("track");
      expect(template).toHaveProperty("video");
      expect(template).toHaveProperty("playlist");
    });

    it("should include noToken flag", async () => {
      const response = await request(app).get("/api/settings").expect(200);

      expect(response.body).toHaveProperty("noToken");
      expect(typeof response.body.noToken).toBe("boolean");
    });
  });

  describe("DELETE /api/token", () => {
    it("should delete Tidal token", async () => {
      const response = await request(app).delete("/api/token").expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe("GET /api/run-token", () => {
    // Skipped: SSE endpoint keeps connection open, supertest waits indefinitely
    it.skip("should initiate token authentication flow (SSE)", async () => {
      // SSE endpoints return immediately with headers, testing just that it doesn't error
      const response = await request(app).get("/api/run-token");

      expect(response.headers["content-type"]).toContain("text/event-stream");
    });
  });
});
