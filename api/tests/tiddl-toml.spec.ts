import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import common mocks
import { mockCommonServices } from "./mocks";

// Setup all common mocks
mockCommonServices();

// Mock tiddl-toml service - specific to this test file
vi.mock("../src/services/tiddl-toml", () => ({
  getTomlConfig: vi.fn().mockReturnValue({
    toml: '[download]\nquality = "high"',
  }),
  setTomlConfig: vi.fn(),
}));

describe("Tiddl TOML Config Routes", () => {
  let app: Express.Application;

  beforeEach(async () => {
    const { default: importedApp } = await import("../index");
    app = importedApp;
  });

  describe("GET /api/tiddl/config", () => {
    it("should return Tiddl TOML config", async () => {
      const response = await request(app).get("/api/tiddl/config").expect(200);

      expect(response.body).toHaveProperty("toml");
      expect(typeof response.body.toml).toBe("string");
    });
  });

  describe("POST /api/tiddl/config", () => {
    it("should save Tiddl TOML config", async () => {
      const tomlData = {
        toml: '[download]\nquality = "max"',
      };

      const response = await request(app)
        .post("/api/tiddl/config")
        .send(tomlData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
    });

    it("should reject invalid TOML type", async () => {
      const invalidData = {
        toml: { invalid: "object" }, // Should be string
      };

      const response = await request(app)
        .post("/api/tiddl/config")
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject request without toml field", async () => {
      const response = await request(app)
        .post("/api/tiddl/config")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
