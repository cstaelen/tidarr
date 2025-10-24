import fs from "fs";
import path from "path";

import { configureServer } from "./config";

const CUSTOM_CSS_PATH = "/home/app/standalone/shared/custom.css";

/**
 * Read the custom CSS file content
 * @returns The CSS content as a string, or empty string if file doesn't exist
 */
export function getCustomCSS(): string {
  try {
    if (fs.existsSync(CUSTOM_CSS_PATH)) {
      return fs.readFileSync(CUSTOM_CSS_PATH, "utf-8");
    }
    return "";
  } catch (error) {
    console.error("Error reading custom.css:", error);
    return "";
  }
}

/**
 * Write CSS content to the custom CSS file
 * @param cssContent - The CSS content to write
 */
export function setCustomCSS(cssContent: string): void {
  try {
    // Ensure the shared directory exists
    const sharedDir = path.dirname(CUSTOM_CSS_PATH);
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }

    fs.writeFileSync(CUSTOM_CSS_PATH, cssContent, "utf-8");
    configureServer();
  } catch (error) {
    console.error("Error writing custom.css:", error);
    throw error;
  }
}
