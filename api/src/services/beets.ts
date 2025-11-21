import { spawn } from "child_process";

import { CONFIG_PATH, PROCESSING_PATH } from "../../constants";
import { getAppInstance } from "../app-instance";
import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function beets(id: string): Promise<void> {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);

  if (!item || !["album", "artist", "favorite_albums"].includes(item.type))
    return;

  const itemProcessingPath = `${PROCESSING_PATH}/${item.id}`;

  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      logs(item.id, "🕖 [BEETS] Running ...", { skipConsole: true });
      console.log("--------------------");
      console.log("🎧 BEETS             ");
      console.log("--------------------");

      // Use spawn (async) instead of spawnSync to avoid blocking the event loop
      await new Promise<void>((resolve, reject) => {
        const beetsProcess = spawn(binary, [
          "-c",
          `${CONFIG_PATH}/beets-config.yml`,
          "-l",
          `${CONFIG_PATH}/beets/beets-library.blb`,
          "import",
          "-qC",
          itemProcessingPath,
        ]);

        let stdout = "";
        let stderr = "";

        beetsProcess.stdout.on("data", (data: Buffer) => {
          const output = data.toString("utf8");
          stdout += output;
          console.log(output);
        });

        beetsProcess.stderr.on("data", (data: Buffer) => {
          const output = data.toString("utf8");
          stderr += output;
          console.error(output);
        });

        beetsProcess.on("close", (code: number | null) => {
          if (code === 0 && stdout) {
            logs(item.id, `✅ [BEETS] Success`);
            resolve();
          } else if (stderr) {
            logs(item.id, `⚠️ [BEETS] ${stderr.trim()}`);
            resolve();
          } else {
            resolve();
          }
        });

        beetsProcess.on("error", (err: Error) => {
          reject(err);
        });
      });
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [BEETS] Error during Beets processing :\r\n${(err as Error).message}`,
    );
  }
}
