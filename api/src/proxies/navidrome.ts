import { Express } from "express";

import { setupServiceProxy, withQueryParams } from "./setup-service-proxy";

/**
 * Setup Navidrome API proxy (optional)
 * Requires NAVIDROME_URL, NAVIDROME_USER, and NAVIDROME_PASSWORD environment variables
 */
export function setupNavidromeProxy(app: Express): void {
  setupServiceProxy(
    app,
    "/proxy/navidrome",
    ["NAVIDROME_URL", "NAVIDROME_USER", "NAVIDROME_PASSWORD"],
    "NAVIDROME_URL",
    {
      resolvePath: withQueryParams(() => ({
        u: process.env.NAVIDROME_USER || "",
        p: process.env.NAVIDROME_PASSWORD || "",
        v: "1.16.1",
        c: "tidarr",
        f: "json",
      })),
    },
  );
}
