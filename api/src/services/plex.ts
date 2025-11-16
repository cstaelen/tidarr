// PLEX API
// https://www.plexopedia.com/plex-media-server/api/library/scan-partial/
import { Express } from "express";

import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function plexUpdate(item: ProcessingItemType, app: Express) {
  try {
    if (
      process.env.PLEX_URL &&
      process.env.PLEX_TOKEN &&
      process.env.PLEX_LIBRARY
    ) {
      console.log("--------------------");
      console.log(`🔄 PLEX UPDATE     `);
      console.log("--------------------");

      const url = `${process.env.PLEX_URL}/library/sections/${process.env.PLEX_LIBRARY}/refresh?${process.env.PLEX_PATH ? `path=${encodeURIComponent(process.env.PLEX_PATH)}&` : ""}X-Plex-Token=${process.env.PLEX_TOKEN}`;

      console.log("URL:", url);

      const response = await fetch(url);

      let message = "✅ [PLEX] Library updated !";
      if (response.status !== 200) {
        message = `❌ [PLEX] Update Error code: ${response.status} using url: ${url}`;
      }

      logs(item, message, app);
    }
  } catch (err: unknown) {
    logs(
      item,
      `❌ [PLEX] Error during Plex update: ${(err as Error).message}`,
      app,
    );
  }
}
