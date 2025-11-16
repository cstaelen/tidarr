import { spawnSync } from "child_process";

import { CONFIG_PATH, PROCESSING_PATH } from "../../constants";
import { getAppInstance } from "../app-instance";
import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function beets(id: string) {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);

  if (!item || !["album", "artist", "favorite_albums"].includes(item.type))
    return;

  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      logs(item.id, "🕖 [BEETS] Running ...", { skipConsole: true });
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
        logs(item.id, `✅ [BEETS] Success`);
      } else if (response.stderr) {
        logs(item.id, `⚠️ [BEETS] ${response.stderr}`);
      }
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [BEETS] Error during Beets processing :\r\n${(err as Error).message}`,
    );
  }
}
