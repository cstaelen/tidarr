import fs from "fs";
import path from "path";

import { CONFIG_PATH } from "../../constants";

import { configureServer } from "./config";

const CUSTOM_CSS_PATH = `${CONFIG_PATH}/custom.css`;

/**
 * Read the custom CSS file content
 * @returns An object containing the CSS content
 */
export function getCustomCSS(): { css: string } {
  try {
    if (fs.existsSync(CUSTOM_CSS_PATH)) {
      return { css: fs.readFileSync(CUSTOM_CSS_PATH, "utf-8") };
    }
    return { css: "" };
  } catch (error) {
    console.error("❌ [CSS] Error reading custom.css:", error);
    return { css: "" };
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
    console.error("❌ [CSS] Error writing custom.css:", error);
    throw error;
  }
}
