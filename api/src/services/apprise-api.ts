import { exec } from "child_process";
import { promisify } from "util";

import { curl_escape_all } from "../helpers/curl_escape";
import { logs } from "../processing/logs";
import { ProcessingItemType } from "../types";

const execAsync = promisify(exec);

export async function appriseApiPush(item: ProcessingItemType) {
  if (!process.env.APPRISE_API_ENDPOINT) {
    return;
  }

  console.log("--------------------");
  console.log(`🔔 APPRISE API PUSH `);
  console.log("--------------------");

  try {
    const url = process.env.APPRISE_API_ENDPOINT;
    const pushTitle = curl_escape_all(`New ${item.type} added`);
    const message = curl_escape_all(
      `${item?.title}${item?.artist ? " - " : ""}${item?.artist || ""} added to music library`,
    );
    const command = `curl -d '{"body":"${message}", "title":"${pushTitle}","tag":"${process.env.APPRISE_API_TAG || "all"}"}' -H "Content-Type: application/json" ${url}`;

    console.log(`🕖 [APPRISE] Command: ${command}`);
    const { stdout } = await execAsync(command, { encoding: "utf-8" });

    logs(item.id, `✅ [APPRISE] API request success:\r\n${stdout}`);
  } catch (e: unknown) {
    logs(item.id, `❌ [APPRISE] API request error:\r\n${(e as Error).message}`);
  }
}
