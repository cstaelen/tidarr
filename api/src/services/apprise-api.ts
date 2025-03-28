import { execSync } from "child_process";

import { curl_escape_all } from "../helpers/curl_escape";

export async function appriseApiPush(title: string, type: string) {
  if (
    process.env.ENABLE_APPRISE_API !== "true" ||
    !process.env.APPRISE_API_ENDPOINT
  ) {
    return;
  }

  console.log(`=== Apprise API push ===`);

  try {
    const url = process.env.APPRISE_API_ENDPOINT;
    const pushTitle = curl_escape_all(`New ${type} added`);
    const message = curl_escape_all(`${title} added to music library`);
    const command = `curl -d '{"body":"${message}", "title":"${pushTitle}","tag":"${process.env.APPRISE_API_TAG || "all"}"}' -H "Content-Type: application/json" ${url}`;
    console.log(command);
    const response = await execSync(command, { encoding: "utf-8" });

    return {
      error: false,
      output: `=> Apprise API success output:\r\n${response}`,
    };
  } catch (e: unknown) {
    return {
      error: true,
      output: `=> Apprise API Error:\r\n${(e as Error).message}`,
    };
  }
}
