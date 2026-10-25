import { NOTIFICATION_TIMEOUT_MS } from "../../constants";
import { withHttpScheme } from "../helpers/http-url";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

export async function hookPushOver(item: ProcessingItemType) {
  if (process.env.PUSH_OVER_URL) {
    console.log("--------------------");
    console.log(`🔔 PUSH OVER WEBHOOK`);
    console.log("--------------------");

    try {
      const pushTitle = `New ${item.type} added`;
      const message = `${item?.title} ${item?.artist ? "-" : ""} ${item?.artist || ""} added to music library`;

      // The webhook URL is a secret, so only log that we are about to call it
      console.log(`🕖 [PUSHOVER WEBHOOK] Sending notification ...`);

      const response = await fetch(withHttpScheme(process.env.PUSH_OVER_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: [pushTitle, message].join("\r\n") }),
        signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      logs(item.id, `✅ [PUSHOVER WEBHOOK] Success output`);
    } catch (e: unknown) {
      logs(item.id, `❌ [PUSHOVER WEBHOOK] Error:\r\n${(e as Error).message}`);
    }
  }
}
