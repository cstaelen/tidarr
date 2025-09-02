import { execSync } from "child_process";

import { TiddlConfig } from "../types";

export async function get_tiddl_config() {
  const token_output = await execSync(`cat /root/tiddl.json`, {
    encoding: "utf-8",
  });

  return JSON.parse(token_output) as TiddlConfig;
}
