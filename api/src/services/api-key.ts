import crypto from "crypto";
import fs from "fs";
import path from "path";

import { CONFIG_PATH } from "../../constants";

const API_KEY_FILE = path.join(CONFIG_PATH, ".tidarr-api-key");

/**
 * Generate a random API key (32 bytes = 64 hex characters)
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get the API key from file, or generate one if it doesn't exist
 */
export function getOrCreateApiKey(): string {
  // Check if API key file exists
  if (fs.existsSync(API_KEY_FILE)) {
    try {
      const apiKey = fs.readFileSync(API_KEY_FILE, "utf-8").trim();
      if (apiKey && apiKey.length > 0) {
        return apiKey;
      }
    } catch (error) {
      console.error("[API Key] Error reading API key file:", error);
    }
  }

  // Generate new API key
  const newApiKey = generateApiKey();
  try {
    fs.writeFileSync(API_KEY_FILE, newApiKey, { mode: 0o600 }); // Restrict permissions
    console.log("[API Key] Generated new API key");
    return newApiKey;
  } catch (error) {
    console.error("[API Key] Error writing API key file:", error);
    return newApiKey; // Return it anyway, but it won't persist
  }
}

/**
 * Regenerate the API key (create a new one and save it)
 */
export function regenerateApiKey(): string {
  const newApiKey = generateApiKey();

  try {
    fs.writeFileSync(API_KEY_FILE, newApiKey, { mode: 0o600 });
    console.log("[API Key] Regenerated API key");
    return newApiKey;
  } catch (error) {
    console.error("[API Key] Error writing new API key:", error);
    throw new Error("Failed to regenerate API key");
  }
}
