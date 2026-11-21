import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { getOrCreateApiKey } from "../services/api-key";
import { is_oidc_configured, resolve_token_role } from "../services/auth";

// Everything a guest may call. A new route is admin only until it lands here.
const GUEST_ROUTES = [
  "GET /api/settings",
  "GET /api/custom-css",
  "GET /api/queue/list",
  "GET /api/queue/status",
  "GET /api/stream-processing",
  "POST /api/save",
];

/**
 * Proxies are mounted with app.use, so they have no route pattern: they
 * forward anything upstream, and a guest only gets to read.
 */
function isGuestAllowed(req: Request) {
  if (!req.route) {
    return (
      req.baseUrl.startsWith("/proxy/") && ["GET", "HEAD"].includes(req.method)
    );
  }

  // req.route.path is the pattern, so "/stream-item-output/:id" stays exact
  return GUEST_ROUTES.includes(`${req.method} ${req.baseUrl}${req.route.path}`);
}

export function ensureAccessIsGranted(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
