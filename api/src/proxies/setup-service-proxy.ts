import { Express, Request } from "express";
import proxy, { ProxyOptions } from "express-http-proxy";

import { ensureAccessIsGranted } from "../helpers/auth";

type ProxyReqPathResolver = NonNullable<ProxyOptions["proxyReqPathResolver"]>;
type ProxyReqOptsDecorator = NonNullable<ProxyOptions["proxyReqOptDecorator"]>;

/**
 * Sets up an optional third-party proxy (Plex, Navidrome, Jellyfin, ...).
 * Shared setup: env var guard, base URL normalization, referer/origin stripping.
 * Each service only provides its own credential injection.
 */
export function setupServiceProxy(
  app: Express,
  path: string,
  requiredEnvVars: string[],
  baseUrlEnvVar: string,
  options: {
    resolvePath?: ProxyReqPathResolver;
    decorateRequest?: ProxyReqOptsDecorator;
  } = {},
): void {
  if (!requiredEnvVars.every((name) => process.env[name])) {
    return;
  }

  const baseUrl = process.env[baseUrlEnvVar]!.replace(/\/$/, "");
  const { resolvePath, decorateRequest } = options;

  app.use(
    path,
    ensureAccessIsGranted,
    proxy(baseUrl, {
      ...(resolvePath ? { proxyReqPathResolver: resolvePath } : {}),
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        delete proxyReqOpts.headers?.["referer"];
        delete proxyReqOpts.headers?.["origin"];
        return decorateRequest
          ? decorateRequest(proxyReqOpts, srcReq)
          : proxyReqOpts;
      },
    }),
  );
}

/** Convenience for building a `resolvePath` that only adds query params. */
export function withQueryParams(
  build: (req: Request) => Record<string, string>,
): ProxyReqPathResolver {
  return (req) => {
    const url = new URL(req.url, "http://localhost");
    for (const [key, value] of Object.entries(build(req))) {
      url.searchParams.set(key, value);
    }
    return url.pathname + url.search;
  };
}
