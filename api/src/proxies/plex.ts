import { Express } from "express";
import proxy from "express-http-proxy";

import { ensureAccessIsGranted } from "../helpers/auth";

/**
 * Setup Plex API proxy (optional)
 * Requires PLEX_URL and PLEX_TOKEN environment variables
 */
export function setupPlexProxy(app: Express): void {
  if (!process.env.PLEX_URL || !process.env.PLEX_TOKEN) {
    return;
  }

  const plexBaseUrl = process.env.PLEX_URL.replace(/\/$/, "");

  app.use(
    "/proxy/plex",
    ensureAccessIsGranted,
    proxy(plexBaseUrl, {
      proxyReqPathResolver: function (req) {
        // Keep the path and add Plex token
        const url = new URL(req.url, "http://localhost");
        url.searchParams.set("X-Plex-Token", process.env.PLEX_TOKEN || "");
        return url.pathname + url.search;
      },
      proxyReqOptDecorator: function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];
        return proxyReqOpts;
      },
    }),
  );
}
