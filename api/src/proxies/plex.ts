import { Express } from "express";

import { setupServiceProxy, withQueryParams } from "./setup-service-proxy";

/**
 * Setup Plex API proxy (optional)
 * Requires PLEX_URL and PLEX_TOKEN environment variables
 */
export function setupPlexProxy(app: Express): void {
  setupServiceProxy(
    app,
    "/proxy/plex",
    ["PLEX_URL", "PLEX_TOKEN"],
    "PLEX_URL",
    {
      resolvePath: withQueryParams(() => ({
        "X-Plex-Token": process.env.PLEX_TOKEN || "",
      })),
    },
  );
}
