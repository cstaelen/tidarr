import { NOTIFICATION_TIMEOUT_MS } from "../../constants";
import { withHttpScheme } from "../helpers/http-url";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

export async function appriseApiPush(item: ProcessingItemType) {
  if (!process.env.APPRISE_API_ENDPOINT) {
    return;
  }

  console.log("--------------------");
  console.log(`🔔 APPRISE API PUSH `);
  console.log("--------------------");

  try {
    const url = withHttpScheme(process.env.APPRISE_API_ENDPOINT);

    // Never log the full endpoint: it carries the Apprise config key
    console.log(`🕖 [APPRISE] Sending notification ...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: `${item?.title}${item?.artist ? " - " : ""}${item?.artist || ""} added to music library`,
        title: `New ${item.type} added`,
        tag: process.env.APPRISE_API_TAG || "all",
      }),
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // The timeout signal also covers the body, so a slow read must not report failure
    const body = await response.text().catch(() => "");
    logs(item.id, `✅ [APPRISE] API request success:\r\n${body}`);
  } catch (e: unknown) {
    logs(item.id, `❌ [APPRISE] API request error:\r\n${(e as Error).message}`);
  }
}
