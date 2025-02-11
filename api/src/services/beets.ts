import { spawnSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

export async function beets(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      item["output"] = [item["output"], `=== Beets ===`].join("\r\n");

      const response = spawnSync(binary, [
        "-c",
        `${ROOT_PATH}/shared/beets-config.yml`,
        "-l",
        `${ROOT_PATH}/shared/beets/beets-library.blb`,
        "import",
        "-qC",
        `${ROOT_PATH}/download/incomplete`,
      ]);
      if (response.stdout) {
        item["output"] = logs(item, `Beets output:\r\n${response.stdout}`);
      } else if (response.stderr) {
        item["status"] = "error";
        item["output"] = logs(item, `Beets output:\r\n${response.stderr}`);
      }
    }
  } catch (err: unknown) {
    item["status"] = "error";
    item["output"] = logs(
      item,
      `Error during Beets processing :\r\n${(err as Error).message}`,
    );
  }
}
