import { readFileSync } from "fs";
import toml from "toml";

import { CONFIG_PATH } from "../../constants";
import { TiddlConfig } from "../types";

export function get_tiddl_config(): {
  config: TiddlConfig;
  errors: string[];
} {
  const tiddlDir = `${CONFIG_PATH}/.tiddl`;
  const errors: string[] = [];

  // Read config.toml
  let config;
  try {
    const configPath = `${tiddlDir}/config.toml`;
    const configContent = readFileSync(configPath, "utf-8");
    config = toml.parse(configContent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("⚠️ [TIDDL] There is an issue with the config file.");
    console.log(`⚠️ [TIDDL] Error: ${error}`);
    errors.push(`Config file error: ${errorMessage}`);
    errors.push(`Config path: ${tiddlDir}/config.toml`);
  }

  // Read auth.json
  let auth;
  try {
    const authPath = `${tiddlDir}/auth.json`;
    const authContent = readFileSync(authPath, "utf-8");
    auth = JSON.parse(authContent);
  } catch {
    console.log("⚠️ [TIDDL] No auth file found.");
  }

  // Merge config and auth into TiddlConfig structure
  return {
    config: {
      ...config,
      auth: auth,
    } as TiddlConfig,
    errors,
  };
}
