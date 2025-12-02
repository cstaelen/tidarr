import crypto from "crypto";

const SECRET = process.env.STREAM_SECRET || "supersecret";

/**
 * Generates an HMAC signature for a streaming resource.
 * @param id Identifier of the resource (track, etc.)
 * @param expires Expiration timestamp in seconds
 * @returns Hex-encoded signature
 */
export function signUrl(id: string, expires: number): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(`${id}:${expires}`);
  return hmac.digest("hex");
}
