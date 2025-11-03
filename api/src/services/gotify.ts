import { execSync } from "child_process";
import { Express } from "express";

import { curl_escape_double_quote } from "../helpers/curl_escape";
import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

export async function gotifyPush(item: ProcessingItemType, app: Express) {
  if (
    process.env.ENABLE_GOTIFY === "true" &&
    process.env.GOTIFY_URL &&
    process.env.GOTIFY_TOKEN
  ) {
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

      await execSync(command, { encoding: "utf-8" });
      logs(item, `✅ [GOTIFY] Notification success`, app);
    } catch (e: unknown) {
      logs(
        item,
        `❌ [GOTIFY] Notification error: ${(e as Error).message}`,
        app,
      );
    }
  }
}
