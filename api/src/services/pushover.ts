import { execSync } from "child_process";

import { curl_escape_double_quote } from "../helpers/curl_escape";

export async function hookPushOver(title: string, type: string) {
  if (process.env.PUSH_OVER_URL) {
    console.log(`=== Pushover webhook ===`);

    try {
      const url = process.env.PUSH_OVER_URL;
      console.log("URL:", url);

      const pushTitle = curl_escape_double_quote(`New ${type} added`);
      const message = curl_escape_double_quote(
        `${title} added to music library`,
      );
      const body = JSON.stringify({
        text: [pushTitle, message].join("\r\n"),
      });

      const command = `curl  -i -X POST -H 'Content-Type: application/json' -d '${body}' ${url}`;
      console.log(`Push over : ${command}`);

      const response = await execSync(command, { encoding: "utf-8" });

      return {
        error: false,
        output: `=> Success output:\r\n${response}`,
      };
    } catch (e: unknown) {
      return {
        error: true,
        output: `=> Error:\r\n${(e as Error).message}`,
      };
    }
  }
}
