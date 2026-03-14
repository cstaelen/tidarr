import path from "path";

import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Tidarr API",
      version: "1.0.0",
      description:
        "Self-hosted Tidal music downloader. Manage download queues, sync playlists, and configure your Tidarr instance.",
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "X-Api-Key",
          description: "API key for automation and integrations",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from POST /api/auth",
        },
      },
    },
    security: [{ ApiKeyHeader: [] }],
  },
  apis: [
    path.join(__dirname, "schemas.*"),
    path.join(__dirname, "../routes/auth.*"),
    path.join(__dirname, "../routes/processing.*"),
    path.join(__dirname, "../routes/config.*"),
    path.join(__dirname, "../routes/sync.*"),
    path.join(__dirname, "../routes/history.*"),
    path.join(__dirname, "../routes/custom-css.*"),
    path.join(__dirname, "../routes/tiddl-toml.*"),
    path.join(__dirname, "../routes/api-key.*"),
    path.join(__dirname, "../routes/lidarr.*"),
  ],
};

export const openapiSpec = swaggerJsdoc(options);

export function registerOpenApiEndpoint(app: Express): void {
  app.get("/api/openapi.json", (_req, res) => {
    res.json(openapiSpec);
  });
}
