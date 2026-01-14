import { exec } from "child_process";
import { promisify } from "util";

import { curl_escape_double_quote } from "../helpers/curl_escape";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

const execAsync = promisify(exec);

export async function gotifyPush(item: ProcessingItemType) {
  if (process.env.GOTIFY_URL && process.env.GOTIFY_TOKEN) {
    console.log("--------------------");
    console.log(`🔔 GOTIFY            `);
    console.log("--------------------");

    try {
      const url = `${process.env.GOTIFY_URL}/message?token=${encodeURIComponent(process.env.GOTIFY_TOKEN)}`;

      const pushTitle = curl_escape_double_quote(`New ${item.type} added`);
      const message = curl_escape_double_quote(
        `${item?.title}${item?.artist ? " - " : ""}${item?.artist || ""} added to music library`,
      );

      const command = `curl -s ${url} -F title="${pushTitle}" -F message="${message}" -F priority=5`;

      console.log(`🕖 [GOTIFY] URL: ${command}`);

      await execAsync(command, { encoding: "utf-8" });
      logs(item.id, `✅ [GOTIFY] Notification success`);
    } catch (e: unknown) {
      logs(item.id, `❌ [GOTIFY] Notification error: ${(e as Error).message}`);
    }
  }
}
