import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

// Import common mocks
import { mockCommonServices } from "./mocks";

// Setup all common mocks
mockCommonServices();

describe("Processing Routes", () => {
  let app: Express.Application;

  beforeEach(async () => {
    const { default: importedApp } = await import("../index");
    app = importedApp;
  });

  describe("POST /api/save", () => {
    it("should add album to processing queue", async () => {
      const albumData = {
        item: {
          id: "123456",
          type: "album",
          status: "queue",
          url: "https://tidal.com/browse/album/123456",
          title: "Test Album",
          artist: "Test Artist",
        },
      };

      const response = await request(app)
        .post("/api/save")
        .send(albumData)
        .expect(201);

      expect(response.body).toEqual({});
    });

    it("should add track to processing queue", async () => {
      const trackData = {
        item: {
          id: "789012",
          type: "track",
          status: "queue",
          url: "https://tidal.com/browse/track/789012",
          title: "Test Track",
          artist: "Test Artist",
        },
      };

      const response = await request(app)
        .post("/api/save")
        .send(trackData)
        .expect(201);

      expect(response.body).toEqual({});
    });

    it("should add playlist to processing queue", async () => {
      const playlistData = {
        item: {
          id: "abcdef",
          type: "playlist",
          status: "queue",
          url: "https://tidal.com/browse/playlist/abcdef",
          title: "Test Playlist",
        },
      };

      const response = await request(app)
        .post("/api/save")
        .send(playlistData)
        .expect(201);

      expect(response.body).toEqual({});
    });

    it("should reject request with missing item field", async () => {
      const invalidData = {
        id: "123456",
        // Missing item wrapper
      };

      const response = await request(app)
        .post("/api/save")
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/remove", () => {
    it("should remove item from queue", async () => {
      const response = await request(app)
        .delete("/api/remove")
        .send({ id: "123456" })
        .expect(204);

      expect(response.body).toEqual({});
    });

    it("should reject request without id", async () => {
      const response = await request(app)
        .delete("/api/remove")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/remove-all", () => {
    it("should remove all items from queue", async () => {
      const response = await request(app).delete("/api/remove-all").expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe("DELETE /api/remove-finished", () => {
    it("should remove finished items from queue", async () => {
      const response = await request(app)
        .delete("/api/remove-finished")
        .expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe("Queue Control", () => {
    it("POST /api/queue/pause should pause the queue", async () => {
      const response = await request(app).post("/api/queue/pause").expect(204);

      expect(response.body).toEqual({});
    });

    it("POST /api/queue/resume should resume the queue", async () => {
      const response = await request(app).post("/api/queue/resume").expect(204);

      expect(response.body).toEqual({});
    });

    it("GET /api/queue/status should return queue status", async () => {
      const response = await request(app).get("/api/queue/status").expect(200);

      expect(response.body).toHaveProperty("isPaused");
      expect(typeof response.body.isPaused).toBe("boolean");
    });
  });
});
