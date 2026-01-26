// NAVIDROME API
// https://www.subsonic.org/pages/api.jsp (startScan endpoint)

import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

export async function navidromeUpdate(item: ProcessingItemType) {
  try {
    if (
      process.env.NAVIDROME_URL &&
      process.env.NAVIDROME_USER &&
      process.env.NAVIDROME_PASSWORD
    ) {
      console.log("--------------------");
      console.log(`🔄 NAVIDROME UPDATE`);
      console.log("--------------------");

      console.log(`🔍 [NAVIDROME] Send scan request ...`);

      const baseUrl = process.env.NAVIDROME_URL.replace(/\/$/, "");
      const params = new URLSearchParams({
        u: process.env.NAVIDROME_USER,
        p: process.env.NAVIDROME_PASSWORD,
        v: "1.16.1",
        c: "tidarr",
        f: "json",
      });

      const url = `${baseUrl}/rest/startScan?${params.toString()}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const status = data?.["subsonic-response"]?.status;

        if (status === "ok") {
          const scanStatus = data?.["subsonic-response"]?.scanStatus;
          if (scanStatus?.scanning) {
            logs(
              item.id,
              `✅ [NAVIDROME] Library scan triggered successfully!`,
            );
          }
        } else {
          const error = data?.["subsonic-response"]?.error;
          logs(
            item.id,
            `❌ [NAVIDROME] Scan failed: ${error?.message || "Unknown error"} (code: ${error?.code || "unknown"})`,
          );
        }
      } else {
        switch (response.status) {
          case 401:
            logs(
              item.id,
              `❌ [NAVIDROME] Unauthorized (401). Check your credentials.`,
            );
            break;
          case 403:
            logs(
              item.id,
              `❌ [NAVIDROME] Forbidden (403). User may not have admin privileges.`,
            );
            break;
          default:
            logs(
              item.id,
              `❌ [NAVIDROME] Unexpected status: ${response.status}`,
            );
            break;
        }
      }
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [NAVIDROME] Error during Navidrome update: ${(err as Error).message}`,
    );
  }
}
