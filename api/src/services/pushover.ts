import { execSync } from "child_process";
import { Express } from "express";

import { curl_escape_double_quote } from "../helpers/curl_escape";
import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function hookPushOver(item: ProcessingItemType, app: Express) {
  if (process.env.PUSH_OVER_URL) {
    console.log("--------------------");
    console.log(`🔔 PUSH OVER WEBHOOK`);
    console.log("--------------------");

    try {
      const url = process.env.PUSH_OVER_URL;
      const pushTitle = curl_escape_double_quote(`New ${item.type} added`);
      const message = curl_escape_double_quote(
        `${item?.title} ${item?.artist ? "-" : ""} ${item?.artist || ""} added to music library`,
      );
      const body = JSON.stringify({
        text: [pushTitle, message].join("\r\n"),
      });

      const command = `curl  -i -X POST -H 'Content-Type: application/json' -d '${body}' ${url}`;

      console.log(`🕖 [PUSHOVER WEBHOOK] Command : ${command}`);

      execSync(command, { encoding: "utf-8" });

      logs(item, `✅ [PUSHOVER WEBHOOK] Success output`, app);
    } catch (e: unknown) {
      logs(
        item,
        `❌ [PUSHOVER WEBHOOK] Error:\r\n${(e as Error).message}`,
        app,
      );
    }
  }
}
