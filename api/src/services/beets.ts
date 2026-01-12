import { spawn } from "child_process";

import { CONFIG_PATH } from "../../constants";
import { getAppInstance } from "../helpers/app-instance";
import { getProcessingPath } from "../processing/jobs";
import { logs } from "../processing/logs";
import { ProcessingItemType } from "../types";

function spawnBeet(
  itemId: string,
  command: string,
  additionalArgs: string[] = [],
): Promise<void> {
  const binary = "beet";
  const args = [
    "-c",
    `${CONFIG_PATH}/beets-config.yml`,
    "-l",
    `${CONFIG_PATH}/beets/beets-library.blb`,
    command,
    ...additionalArgs,
  ];

  console.log(`${binary} ${args.join(" ")}`);

  return new Promise((resolve, reject) => {
    const beetProcess = spawn(binary, args);

    beetProcess.stdout?.on("data", (data: Buffer) => {
      const stdout = data.toString("utf8");
      console.log(stdout);
    });

    beetProcess.stderr?.on("data", (data: Buffer) => {
      const stderr = data.toString("utf8");
      console.error(stderr);
      if (stderr.trim()) {
        logs(itemId, `⚠️ [BEETS] ${stderr.trim()}`);
      }
    });

    beetProcess.on("close", (code) => {
      if (code === 0) {
        logs(itemId, `✅ [BEETS] ${command} success`);
        resolve();
      } else {
        reject(new Error(`Beets ${command} exited with code ${code}`));
      }
    });

    beetProcess.on("error", (error) => {
      reject(error);
    });
  });
}

export async function beets(id: string): Promise<void> {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);
  const processingPath = getProcessingPath();

  if (!item || !["album", "artist", "favorite_albums"].includes(item.type))
    return;

  const itemProcessingPath = `${processingPath}/${item.id}`;

  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      logs(item.id, "🕖 [BEETS] Running ...", { skipConsole: true });
      console.log("--------------------");
      console.log("🎧 BEETS             ");
      console.log("--------------------");

      await spawnBeet(item.id, "import", ["-qC", itemProcessingPath]);

      // Run beet write after import
      logs(item.id, "🕖 [BEETS] Writing tags ...", { skipConsole: true });
      console.log("--------------------");
      console.log("🏷️  BEETS WRITE      ");
      console.log("--------------------");

      await spawnBeet(item.id, "write", [itemProcessingPath]);
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [BEETS] Error during Beets processing :\r\n${(err as Error).message}`,
    );
  }
}
