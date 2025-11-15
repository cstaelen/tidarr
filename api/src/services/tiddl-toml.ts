import fs from "fs";
import path from "path";

const TOML_CONFIG_PATH = "/home/app/standalone/shared/.tiddl/config.toml";

/**
 * Read the config TOML file content
 * @returns The TOML content as a string, or empty string if file doesn't exist
 */
export function getTomlConfig(): string {
  try {
    if (fs.existsSync(TOML_CONFIG_PATH)) {
      return fs.readFileSync(TOML_CONFIG_PATH, "utf-8");
    }
    return "";
  } catch (error) {
    console.error("❌ [TOML] Error reading .tiddl/config.toml:", error);
    return "";
  }
}

/**
 * Write TOML content to the config TOML file
 * @param content - The TOML content to write
 */
export function setTomlConfig(content: string): void {
  try {
    // Ensure the shared directory exists
    const sharedDir = path.dirname(TOML_CONFIG_PATH);
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }

    fs.writeFileSync(TOML_CONFIG_PATH, content, "utf-8");
  } catch (error) {
    console.error("❌ [TOML] Error writing .tiddl/config.toml:", error);
    throw error;
  }
}
