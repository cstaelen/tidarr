import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { getOrCreateApiKey } from "../services/api-key";
import { is_oidc_configured, resolve_token_role } from "../services/auth";

// Everything a guest may call. A new route is admin only until it lands here.
const GUEST_ROUTES = [
  "GET /api/settings",
  "GET /api/queue/list",
  "GET /api/queue/status",
  "GET /api/stream-processing",
  "POST /api/save",
];

/**
 * What the service proxies may forward, per mount path — for every caller,
 * not just guests.
 *
 * These endpoints are reached with the admin's own credentials, injected
 * server-side, and the UI only ever calls the handful listed here. Keeping
 * the rest closed means a stolen token, an XSS, or an instance left without a
 * password (every request is then an admin one, and CORS answers "*") cannot
 * turn a browser into a remote control for the media server: streaming media
 * (`/library/parts/...`, `/rest/download`, `/Items/:id/Download`), reading
 * `/myplex/account` or `/Users`, or firing a mutating GET like
 * `/rest/startScan`.
 *
 * Every proxied service is read-only: nothing in the app writes through them,
 * so only GET and HEAD are forwarded. Tidal is the app itself, so all of its
 * paths go through. Paths match the whole pathname, query string excluded;
 * "/x/*" means "anything under /x/". A new call from the UI has to land here,
 * and it now fails for everyone during development instead of only for guests
 * in production.
 */
const PROXY_PATHS: Record<string, "all" | string[]> = {
  "/proxy/tidal": "all",
  "/proxy/plex": ["/search"],
  "/proxy/jellyfin": ["/Artists/*", "/Search/Hints", "/Items"],
  "/proxy/navidrome": ["/rest/search3", "/rest/ping"],
};

/**
 * Normalized path a proxy request is really going to hit: no query string, no
 * "..", and without the ".view" suffix every Subsonic endpoint accepts.
 */
function proxyPathname(req: Request) {
  const { pathname } = new URL(req.url, "http://proxy");
  return pathname.replace(/\.view$/, "");
}

function isProxyAllowed(req: Request) {
  const allowed = PROXY_PATHS[req.baseUrl];

  // Not a service proxy request: none of this list's business
  if (!allowed) return true;
  if (!["GET", "HEAD"].includes(req.method)) return false;
  if (allowed === "all") return true;

  const pathname = proxyPathname(req);

  return allowed.some((path) =>
    path.endsWith("/*")
      ? pathname.startsWith(path.slice(0, -1))
      : pathname === path,
  );
}

function isGuestAllowed(req: Request) {
  // Proxies are mounted with app.use, so they have no route pattern. What
  // they forward is already read-only for every role, so there is nothing
  // left to restrict here — adding a write path to PROXY_PATHS would mean
  // bringing a role check back.
  if (!req.route) return true;

  // req.route.path is the pattern, so "/stream-item-output/:id" stays exact
  return GUEST_ROUTES.includes(`${req.method} ${req.baseUrl}${req.route.path}`);
}

export function ensureAccessIsGranted(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Role-independent, and checked before any early return below: an API key,
  // or no password at all, must not open the whole media server API
  if (!isProxyAllowed(req)) {
    res.status(403).json({
      error: true,
      code: "FORBIDDEN_PATH",
      message: "This method or path is not proxied",
    });
    return;
  }

  const jwtSecret = process.env?.JWT_SECRET;
  const authHeader = req?.headers?.["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const envPassword = process.env?.ADMIN_PASSWORD;
  const enableOidc = is_oidc_configured();

  // Check for API key (used by *arr apps: Lidarr, Radarr, Sonarr, etc.)
  // They can send it via X-Api-Key header OR apikey query parameter
  const xApiKey = req.headers["x-api-key"] as string;
  const queryApiKey = req.query.apikey as string;
  const providedApiKey = xApiKey || queryApiKey;

  // Get configured API key (always generated/exists)
  const configuredApiKey = getOrCreateApiKey();

  // No auth configured
  if (!envPassword && !enableOidc) {
    req.role = "admin";
    return next();
  }

  if (!jwtSecret) {
    res
      .status(403)
      .json({ error: true, message: "JWT secret key is missing." });
    return;
  }

  // If API key is provided (*arr apps), validate it
  if (providedApiKey) {
    if (providedApiKey === configuredApiKey) {
      req.role = "admin";
      return next();
    } else {
      res.status(403).json({ error: true, message: "Invalid API key" });
      return;
    }
  }

  if (!token) {
    res.status(403).json({ error: true, message: "Token required" });
    return;
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: true, message: "JWT decode failed" });
      return;
    }

    const role = resolve_token_role(decoded as jwt.JwtPayload);

    if (!role) {
      res.status(403).json({ error: true, message: "Invalid token" });
      return;
    }

    req.role = role;

    if (role === "guest" && !isGuestAllowed(req)) {
      // The code tells the front the token is valid, only the role is not
      res.status(403).json({
        error: true,
        code: "FORBIDDEN_ROLE",
        message: "Admin access required",
      });
      return;
    }

    return next();
  });
}
