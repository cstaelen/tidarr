import { readFileSync } from "fs";
import toml from "toml";

import { CONFIG_PATH } from "../../constants";
import { TiddlConfig } from "../types";

export function get_tiddl_config(): TiddlConfig {
  // Use fixed path to avoid HOME variable issues with su-exec
  const tiddlDir = `${CONFIG_PATH}/.tiddl`;

  // Read config.toml
  let config;
  try {
    const configPath = `${tiddlDir}/config.toml`;
    const configContent = readFileSync(configPath, "utf-8");
    config = toml.parse(configContent);
  } catch {
    console.log("⚠️ [TIDDL] No configuration file found.");
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
    ...config,
    auth: auth,
  } as TiddlConfig;
}
