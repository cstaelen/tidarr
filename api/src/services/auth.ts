import { Response } from "express";
import jwt from "jsonwebtoken";

export async function proceed_auth(password: string, res: Response) {
  const envPassword = process.env?.ADMIN_PASSWORD;
  const jwtSecret = process.env?.JWT_SECRET;

  const isAllowed = !envPassword || password === envPassword;

  if (!jwtSecret) {
    return res.status(401).json({
      error: true,
      message: "No JWT secret",
    });
  }

  if (!isAllowed) {
    return res.status(401).json({
      error: true,
      message: "Invalid credentials",
    });
  }

  // Generate token
  const token = jwt.sign({ tidarrPasswd: envPassword }, jwtSecret, {
    expiresIn: "12h",
  });

  res.status(200).send({ accessGranted: true, token });
}

export function is_oidc_configured() {
  return !!(
    process.env?.OIDC_ISSUER &&
    process.env?.OIDC_CLIENT_ID &&
    process.env?.OIDC_CLIENT_SECRET &&
    process.env?.OIDC_REDIRECT_URI
  );
}

export function is_auth_active() {
  return !!process.env?.ADMIN_PASSWORD || is_oidc_configured();
}

export function get_auth_type(): "password" | "oidc" | null {
  if (process.env?.ADMIN_PASSWORD) return "password";
  if (is_oidc_configured()) return "oidc";
  return null;
}
