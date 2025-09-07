import { execSync } from "child_process";

import { TiddlConfig } from "../types";

export function get_tiddl_config() {
  const token_output = execSync(`cat /root/tiddl.json`, {
    encoding: "utf-8",
  });

  return JSON.parse(token_output) as TiddlConfig;
}
