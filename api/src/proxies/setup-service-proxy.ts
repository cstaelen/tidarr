import { Express, Request } from "express";
import proxy, { ProxyOptions } from "express-http-proxy";

import { ensureAccessIsGranted } from "../helpers/auth";

type ProxyReqPathResolver = NonNullable<ProxyOptions["proxyReqPathResolver"]>;
type ProxyReqOptsDecorator = NonNullable<ProxyOptions["proxyReqOptDecorator"]>;

/**
 * Sets up a simple credential-injecting proxy for an optional third-party
 * service (Plex, Navidrome, Jellyfin, ...). Shared by all of them since they
 * only differ in which env vars gate them, their base URL, and how they
 * inject credentials (query params on the path, and/or headers) — the env
 * var guard, base URL normalization, and referer/origin stripping are
 * otherwise identical.
 *
 * @param app - Express app instance
 * @param path - Mount path, e.g. "/proxy/plex"
 * @param requiredEnvVars - Env vars that must all be set for the proxy to be enabled
 * @param baseUrlEnvVar - Env var holding the service's base URL
 * @param options.resolvePath - Builds the forwarded path, e.g. to add query params
 * @param options.decorateRequest - Injects credentials into request headers
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
