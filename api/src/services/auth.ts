import { createHash } from "crypto";
import { Response } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "admin" | "guest";

/**
 * Short hash of a password, stored in the JWT instead of the password itself.
 * Lets us invalidate tokens when a password changes, without shipping the
 * password inside a token anyone can decode.
 */
function password_fingerprint(password: string) {
  return createHash("sha256").update(password).digest("hex").slice(0, 16);
}

/**
 * Match a submitted password against the configured ones.
 * Admin wins if both passwords are identical.
 */
export function resolve_password_role(password: string): UserRole | null {
  const adminPassword = process.env?.ADMIN_PASSWORD;
  const guestPassword = process.env?.GUEST_PASSWORD;

  // No password configured: open instance, everyone is admin
  if (!adminPassword) return "admin";
  if (password === adminPassword) return "admin";
  if (is_guest_configured() && password === guestPassword) return "guest";

  return null;
}

/**
 * Read the role out of a verified JWT payload.
 * Returns null when the token no longer matches the current configuration.
 */
export function resolve_token_role(payload: jwt.JwtPayload): UserRole | null {
  if (is_oidc_configured() && payload.oidcSub) return "admin";

  const adminPassword = process.env?.ADMIN_PASSWORD;
  if (!adminPassword) return "admin";

  const role: UserRole = payload.role === "guest" ? "guest" : "admin";
  const expected =
    role === "guest" ? process.env?.GUEST_PASSWORD : adminPassword;

  if (role === "guest" && !is_guest_configured()) return null;
  if (!expected || payload.pwd !== password_fingerprint(expected)) return null;

  return role;
}

export async function proceed_auth(password: string, res: Response) {
  const jwtSecret = process.env?.JWT_SECRET;
  const role = resolve_password_role(password);

  if (!jwtSecret) {
    return res.status(401).json({
      error: true,
      message: "No JWT secret",
    });
  }

  if (!role) {
    return res.status(401).json({
      error: true,
      message: "Invalid credentials",
    });
  }

  const matchedPassword =
    role === "guest"
      ? process.env?.GUEST_PASSWORD
      : process.env?.ADMIN_PASSWORD;

  const token = jwt.sign(
    {
      role,
      ...(matchedPassword
        ? { pwd: password_fingerprint(matchedPassword) }
        : {}),
    },
    jwtSecret,
    { expiresIn: "12h" },
  );

  res.status(200).send({ accessGranted: true, token, role });
}

export function is_oidc_configured() {
  return !!(
    process.env?.OIDC_ISSUER &&
    process.env?.OIDC_CLIENT_ID &&
    process.env?.OIDC_CLIENT_SECRET &&
    process.env?.OIDC_REDIRECT_URI
  );
}

/**
 * Guest access needs an admin password to protect: without it the whole
 * instance is already public.
 */
export function is_guest_configured() {
  return !!(process.env?.ADMIN_PASSWORD && process.env?.GUEST_PASSWORD);
}

export function is_auth_active() {
  return !!process.env?.ADMIN_PASSWORD || is_oidc_configured();
}

export function get_auth_type(): "password" | "oidc" | null {
  if (process.env?.ADMIN_PASSWORD) return "password";
  if (is_oidc_configured()) return "oidc";
  return null;
}
