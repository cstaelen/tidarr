import { spawnSync } from "child_process";
import { Express } from "express";

import { CONFIG_PATH, PROCESSING_PATH } from "../../constants";
import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function beets(id: string, app: Express) {
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);

  if (!item || !["album", "artist", "favorite_albums"].includes(item.type))
    return;

  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      logs(item, "🕖 [BEETS] Running ...", app, false, true);
      console.log("--------------------");
      console.log("🎧 BEETS             ");
      console.log("--------------------");

      const response = spawnSync(
        binary,
        [
          "-c",
          `${CONFIG_PATH}/beets-config.yml`,
          "-l",
          `${CONFIG_PATH}/beets/beets-library.blb`,
          "import",
          "-qC",
          PROCESSING_PATH,
        ],
        {
          encoding: "utf8",
        },
      );
      if (response.stdout) {
        console.log(response.stdout);
        logs(item, `✅ [BEETS] Success`, app);
      } else if (response.stderr) {
        logs(item, `⚠️ [BEETS] ${response.stderr}`, app);
      }
    }
  } catch (err: unknown) {
    logs(
      item,
      `❌ [BEETS] Error during Beets processing :\r\n${(err as Error).message}`,
      app,
    );
  }
}
