import { exec } from "child_process";
import { promisify } from "util";

import { curl_escape_double_quote } from "../helpers/curl_escape";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

const execAsync = promisify(exec);

export async function ntfyPush(item: ProcessingItemType) {
  if (process.env.NTFY_URL && process.env.NTFY_TOPIC) {
    console.log("--------------------");
    console.log(`🔔 NTFY              `);
    console.log("--------------------");

    try {
      // ntfy use URL base + topic
      const url = `${process.env.NTFY_URL.replace(/\/$/, "")}/${encodeURIComponent(process.env.NTFY_TOPIC)}`;

      const pushTitle = curl_escape_double_quote(`New ${item.type} added`);
      const message = curl_escape_double_quote(
        `${item?.title}${item?.artist ? " - " : ""}${item?.artist || ""} added to music library`,
      );

      // priority setting by var, default = 3
      const priority = process.env.NTFY_PRIORITY || "3";

      // common headers
      let headers = `-H "Title: ${pushTitle}" -H "Priority: ${priority}"`;
      if (process.env.NTFY_TOKEN) {
        headers += ` -H "Authorization: Bearer ${process.env.NTFY_TOKEN}"`;
      }

      const command = `curl -s ${headers} -d "${message}" ${url}`;

      console.log(`🕖 [NTFY] URL: ${url}`);

      const { stdout } = await execAsync(command, { encoding: "utf-8" });
      logs(item.id, `✅ [NTFY] Notification success:\r\n${stdout}`);
    } catch (e: unknown) {
      logs(item.id, `❌ [NTFY] Notification error: ${(e as Error).message}`);
    }
  }
}
