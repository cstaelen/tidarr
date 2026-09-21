import { Express } from "express";

import { setupServiceProxy } from "./setup-service-proxy";

/**
 * Setup Jellyfin API proxy (optional)
 * Requires JELLYFIN_URL and JELLYFIN_API_KEY environment variables
 */
export function setupJellyfinProxy(app: Express): void {
  setupServiceProxy(
    app,
    "/proxy/jellyfin",
    ["JELLYFIN_URL", "JELLYFIN_API_KEY"],
    "JELLYFIN_URL",
    {
      decorateRequest: (proxyReqOpts) => {
        if (!proxyReqOpts.headers) {
          proxyReqOpts.headers = {};
        }
        proxyReqOpts.headers["X-Emby-Token"] =
          process.env.JELLYFIN_API_KEY || "";
        return proxyReqOpts;
      },
    },
  );
}
