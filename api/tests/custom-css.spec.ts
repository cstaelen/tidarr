import { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import common mocks
import { mockCommonServices } from "./mocks";

// Setup all common mocks
mockCommonServices();

// Mock custom-css service - specific to this test file
vi.mock("../src/services/custom-css", () => ({
  getCustomCSS: vi.fn().mockReturnValue({ css: "body { color: red; }" }),
  setCustomCSS: vi.fn(),
}));

describe("Custom CSS Routes", () => {
  let app: Express;

  beforeEach(async () => {
    const { default: importedApp } = await import("../index");
    app = importedApp;
  });

  describe("GET /api/custom-css", () => {
    it("should return custom CSS", async () => {
      const response = await request(app).get("/api/custom-css").expect(200);

      expect(response.body).toHaveProperty("css");
      expect(response.body.css).toBe("body { color: red; }");
    });
  });

  describe("POST /api/custom-css", () => {
    it("should save custom CSS", async () => {
      const cssData = {
        css: "body { background-color: black; }",
      };

      const response = await request(app)
        .post("/api/custom-css")
        .send(cssData)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
    });

    it("should reject invalid CSS type", async () => {
      const invalidData = {
        css: 123, // Should be string
      };

      const response = await request(app)
        .post("/api/custom-css")
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject request without css field", async () => {
      const response = await request(app)
        .post("/api/custom-css")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
