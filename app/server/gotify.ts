"use server";

import { spawnSync, execSync } from "child_process";

export async function gotifyPush(title: string) {
  if (process.env.ENABLE_GOTIFY === "true" && process.env.GOTIFY_URL && process.env.GOTIFY_TOKEN) {
    console.log(`=== Gotify push ===`);

    try {
      const url = `${process.env.GOTIFY_URL}/message?token=${encodeURIComponent(process.env.GOTIFY_TOKEN)}`;
      console.log('URL:', url);

      const pushTitle = `New album added`;
      const message = `${title} added to music library`;
      const response = await execSync(
        `curl -s ${url} -F title="${pushTitle}" -F message="${message}" -F priority=5`,
        { encoding: "utf-8" }
      );

      return { error: false, output: `=> Gotify output:\r\n${response}`};
    } catch (e: any) {
      return { error: true, output: `=> Gotify Error:\r\n${e.message}`};
    }
  } 
}
