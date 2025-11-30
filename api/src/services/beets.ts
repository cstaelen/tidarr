import { spawnSync } from "child_process";

import { CONFIG_PATH } from "../../constants";
import { getAppInstance } from "../app-instance";
import { logs } from "../helpers/logs";
import { getProcessingPath } from "../processing/jobs";
import { ProcessingItemType } from "../types";

function spawnBeet(
  itemId: string,
  command: string,
  additionalArgs: string[] = [],
): void {
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

  const result = spawnSync(binary, args);

  if (result.stdout) {
    const stdout = result.stdout.toString("utf8");
    console.log(stdout);
  }

  if (result.stderr) {
    const stderr = result.stderr.toString("utf8");
    console.error(stderr);
    if (stderr.trim()) {
      logs(itemId, `⚠️ [BEETS] ${stderr.trim()}`);
    }
  }

  if (result.status === 0) {
    logs(itemId, `✅ [BEETS] ${command} success`);
  }
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

      spawnBeet(item.id, "import", ["-qC", itemProcessingPath]);

      // Run beet write after import
      logs(item.id, "🕖 [BEETS] Writing tags ...", { skipConsole: true });
      console.log("--------------------");
      console.log("🏷️  BEETS WRITE      ");
      console.log("--------------------");

      spawnBeet(item.id, "write", [itemProcessingPath]);
    }
  } catch (err: unknown) {
    logs(
      item.id,
      `❌ [BEETS] Error during Beets processing :\r\n${(err as Error).message}`,
    );
  }
}
