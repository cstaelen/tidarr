import { Express } from "express";
import proxy from "express-http-proxy";

import { ensureAccessIsGranted } from "../helpers/auth";

/**
 * Setup Jellyfin API proxy (optional)
 * Requires JELLYFIN_URL and JELLYFIN_API_KEY environment variables
 */
export function setupJellyfinProxy(app: Express): void {
  if (!process.env.JELLYFIN_URL || !process.env.JELLYFIN_API_KEY) {
    return;
  }

  const jellyfinBaseUrl = process.env.JELLYFIN_URL.replace(/\/$/, "");

  app.use(
    "/proxy/jellyfin",
    ensureAccessIsGranted,
    proxy(jellyfinBaseUrl, {
      proxyReqOptDecorator: function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];
        // Add Jellyfin API key in header
        if (!proxyReqOpts.headers) {
          proxyReqOpts.headers = {};
        }
        proxyReqOpts.headers["X-Emby-Token"] =
          process.env.JELLYFIN_API_KEY || "";
        return proxyReqOpts;
      },
    }),
  );
}
