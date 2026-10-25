import { NOTIFICATION_TIMEOUT_MS } from "../../constants";
import { withHttpScheme } from "../helpers/http-url";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

export async function gotifyPush(item: ProcessingItemType) {
  if (process.env.GOTIFY_URL && process.env.GOTIFY_TOKEN) {
    console.log("--------------------");
    console.log(`🔔 GOTIFY            `);
    console.log("--------------------");

    try {
      const baseUrl = withHttpScheme(process.env.GOTIFY_URL);
      const url = `${baseUrl}/message?token=${encodeURIComponent(process.env.GOTIFY_TOKEN)}`;

      const form = new FormData();
      form.append("title", `New ${item.type} added`);
      form.append(
        "message",
        `${item?.title}${item?.artist ? " - " : ""}${item?.artist || ""} added to music library`,
      );
      form.append("priority", "5");

      // Never log the full URL: it carries the token
      console.log(`🕖 [GOTIFY] URL: ${baseUrl}/message`);

      const response = await fetch(url, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      logs(item.id, `✅ [GOTIFY] Notification success`);
    } catch (e: unknown) {
      logs(item.id, `❌ [GOTIFY] Notification error: ${(e as Error).message}`);
    }
  }
}
