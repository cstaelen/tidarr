import { execSync } from "child_process";

import { curl_escape_double_quote } from "../helpers/curl_escape";

export async function gotifyPush(title: string, type: string) {
  if (
    process.env.ENABLE_GOTIFY === "true" &&
    process.env.GOTIFY_URL &&
    process.env.GOTIFY_TOKEN
  ) {
    console.log(`=== Gotify push ===`);

    try {
      const url = `${process.env.GOTIFY_URL}/message?token=${encodeURIComponent(process.env.GOTIFY_TOKEN)}`;
      console.log("URL:", url);

      const pushTitle = curl_escape_double_quote(`New ${type} added`);
      const message = curl_escape_double_quote(
        `${title} added to music library`,
      );
      const response = await execSync(
        `curl -s ${url} -F title="${pushTitle}" -F message="${message}" -F priority=5`,
        { encoding: "utf-8" },
      );

      return {
        error: false,
        output: `=> Gotify success output:\r\n${response}`,
      };
    } catch (e: unknown) {
      return {
        error: true,
        output: `=> Gotify Error:\r\n${(e as Error).message}`,
      };
    }
  }
}
