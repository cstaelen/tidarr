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
        const apiKey = process.env.JELLYFIN_API_KEY || "";
        // Jellyfin 12+ disables the legacy X-Emby-Token header by default
        proxyReqOpts.headers["X-Emby-Token"] = apiKey;
        proxyReqOpts.headers["Authorization"] =
          `MediaBrowser Token="${apiKey}"`;
        return proxyReqOpts;
      },
    },
  );
}
