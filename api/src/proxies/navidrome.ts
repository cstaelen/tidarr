import { Express } from "express";
import proxy from "express-http-proxy";

import { ensureAccessIsGranted } from "../helpers/auth";

/**
 * Setup Navidrome API proxy (optional)
 * Requires NAVIDROME_URL, NAVIDROME_USER, and NAVIDROME_PASSWORD environment variables
 */
export function setupNavidromeProxy(app: Express): void {
  if (
    !process.env.NAVIDROME_URL ||
    !process.env.NAVIDROME_USER ||
    !process.env.NAVIDROME_PASSWORD
  ) {
    return;
  }

  const navidromeBaseUrl = process.env.NAVIDROME_URL.replace(/\/$/, "");

  app.use(
    "/proxy/navidrome",
    ensureAccessIsGranted,
    proxy(navidromeBaseUrl, {
      proxyReqPathResolver: function (req) {
        // Keep the path and add Subsonic auth params
        const url = new URL(req.url, "http://localhost");
        url.searchParams.set("u", process.env.NAVIDROME_USER || "");
        url.searchParams.set("p", process.env.NAVIDROME_PASSWORD || "");
        url.searchParams.set("v", "1.16.1");
        url.searchParams.set("c", "tidarr");
        url.searchParams.set("f", "json");
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
