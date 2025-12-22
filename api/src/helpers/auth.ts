import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { getOrCreateApiKey } from "../services/api-key";
import { is_oidc_configured } from "../services/auth";

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

  // Get configured API key (generated or from env, fallback to ADMIN_PASSWORD for backward compatibility)
  const configuredApiKey = getOrCreateApiKey() || envPassword;

  // No auth configured
  if (!envPassword && !enableOidc) return next();

  if (!jwtSecret) {
    res
      .status(403)
      .json({ error: true, message: "JWT secret key is missing." });
    return;
  }

  // If API key is provided (*arr apps), validate it
  if (providedApiKey) {
    if (configuredApiKey && providedApiKey === configuredApiKey) {
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

    const payload = decoded as jwt.JwtPayload;

    // Validate based on auth type
    if (envPassword && payload.tidarrPasswd !== envPassword) {
      res.status(403).json({ error: true, message: "Wrong password" });
      return;
    }

    if (enableOidc && !payload.oidcSub) {
      res.status(403).json({ error: true, message: "Invalid OIDC token" });
      return;
    }

    return next();
  });
}
