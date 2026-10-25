import { NOTIFICATION_TIMEOUT_MS } from "../../constants";
import { withHttpScheme } from "../helpers/http-url";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

export async function ntfyPush(item: ProcessingItemType) {
  if (process.env.NTFY_URL && process.env.NTFY_TOPIC) {
    console.log("--------------------");
    console.log(`🔔 NTFY              `);
    console.log("--------------------");

    try {
      // ntfy use URL base + topic
      const baseUrl = withHttpScheme(process.env.NTFY_URL).replace(/\/$/, "");
      const url = `${baseUrl}/${encodeURIComponent(process.env.NTFY_TOPIC)}`;

      const message = `${item?.title}${item?.artist ? " - " : ""}${item?.artist || ""} added to music library`;

      const headers: Record<string, string> = {
        Title: `New ${item.type} added`,
        // priority setting by var, default = 3
        Priority: process.env.NTFY_PRIORITY || "3",
      };

      if (process.env.NTFY_TOKEN) {
        headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
      }

      console.log(`🕖 [NTFY] URL: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: message,
        signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      // The timeout signal also covers the body, so a slow read must not report failure
      const body = await response.text().catch(() => "");
      logs(item.id, `✅ [NTFY] Notification success:\r\n${body}`);
    } catch (e: unknown) {
      logs(item.id, `❌ [NTFY] Notification error: ${(e as Error).message}`);
    }
  }
}
