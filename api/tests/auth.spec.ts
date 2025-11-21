import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import common mocks
import { mockCommonServices } from "./mocks";

// Setup all common mocks
mockCommonServices();

// Mock auth service - specific to this test file
vi.mock("../src/services/auth", () => ({
  is_auth_active: vi.fn().mockReturnValue(true),
  proceed_auth: vi.fn((password, res) => {
    if (password === "test123") {
      res.status(200).json({ token: "mock-jwt-token" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  }),
}));

describe("Authentication Routes", () => {
  let app: Express.Application;

  beforeEach(async () => {
    const { default: importedApp } = await import("../index");
    app = importedApp;
  });

  describe("GET /api/is-auth-active", () => {
    it("should return authentication status", async () => {
      const response = await request(app)
        .get("/api/is-auth-active")
        .expect(200);

      expect(response.body).toHaveProperty("isAuthActive");
      expect(typeof response.body.isAuthActive).toBe("boolean");
    });

    it("should return true when ADMIN_PASSWORD is set", async () => {
      process.env.ADMIN_PASSWORD = "test123";

      const response = await request(app)
        .get("/api/is-auth-active")
        .expect(200);

      expect(response.body.isAuthActive).toBe(true);
    });
  });

  describe("POST /api/auth", () => {
    it("should authenticate with correct password", async () => {
      const response = await request(app)
        .post("/api/auth")
        .send({ password: "test123" })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body.token).toBe("mock-jwt-token");
    });

    it("should reject invalid password", async () => {
      const response = await request(app)
        .post("/api/auth")
        .send({ password: "wrongpassword" })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject request without password", async () => {
      const response = await request(app)
        .post("/api/auth")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
