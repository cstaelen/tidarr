import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import { CONFIG_PATH, ROOT_PATH } from "../../constants";

/**
 * Initialize Tidarr configuration files and directories
 * Creates necessary directories and copies template files if they don't exist
 * Replaces the shell script init.sh with native TypeScript
 */
export function initializeFiles(): string {
  const output: string[] = [];
  const SETTINGS_URL = join(ROOT_PATH, "docker", "settings");
  const PUBLIC_URL = join(ROOT_PATH, "app", "build");
  const DEV_PUBLIC_URL = join(ROOT_PATH, "app", "public");
  const SHARED_URL = CONFIG_PATH;

  output.push("🕖 [TIDARR] Application loading ... ");

  try {
    // Create .tiddl directory
    const tiddlDir = join(SHARED_URL, ".tiddl");
    if (!existsSync(tiddlDir)) {
      mkdirSync(tiddlDir, { recursive: true });
    }

    // Copy config.toml if it doesn't exist
    const configTomlPath = join(tiddlDir, "config.toml");
    if (!existsSync(configTomlPath)) {
      try {
        copyFileSync(join(SETTINGS_URL, "config.toml"), configTomlPath);
        output.push("✅ [TIDDL] Created config.toml from template");
      } catch (error) {
        output.push(
          "❌ [TIDDL] Failed to copy config.toml - check volume permissions",
        );
        throw error;
      }
    } else {
      output.push("✅ [TIDDL] Config.toml already exists");
    }

    // Copy beets-config.yml if it doesn't exist
    const beetsConfigPath = join(SHARED_URL, "beets-config.yml");
    if (!existsSync(beetsConfigPath)) {
      copyFileSync(join(SETTINGS_URL, "beets-config.yml"), beetsConfigPath);
      output.push("✅ [BEETS] Load config from template");
    }

    // Create beets directory and files
    const beetsDir = join(SHARED_URL, "beets");
    if (!existsSync(beetsDir)) {
      mkdirSync(beetsDir, { recursive: true });
    }

    const beetsLibPath = join(beetsDir, "beets-library.blb");
    if (!existsSync(beetsLibPath)) {
      writeFileSync(beetsLibPath, "");
      output.push("✅ [BEETS] DB file created");
    }

    const beetsLogPath = join(beetsDir, "beet.log");
    if (!existsSync(beetsLogPath)) {
      writeFileSync(beetsLogPath, "");
      output.push("✅ [BEETS] Log file created");
    }

    // Copy custom.css if it doesn't exist
    const customCssPath = join(SHARED_URL, "custom.css");
    if (!existsSync(customCssPath)) {
      copyFileSync(join(PUBLIC_URL, "custom.css"), customCssPath);
      output.push("✅ [CSS] Custom style file created");
    }

    // Copy custom.css to appropriate location based on environment
    const targetCssPath =
      process.env.ENVIRONMENT === "development"
        ? join(DEV_PUBLIC_URL, "custom.css")
        : join(PUBLIC_URL, "custom.css");

    copyFileSync(customCssPath, targetCssPath);
    output.push("✅ [CSS] Load custom styles");
  } catch (error) {
    output.push(`❌ [TIDARR] Failed to initialize files: ${error}`);
    throw error;
  }

  return output.join("\n");
}
