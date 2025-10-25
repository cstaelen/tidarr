import { spawnSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

export async function beets(id: string, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  if (!item) return;

  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      logs(item, `=== Beets ===`, app);

      const response = spawnSync(
        binary,
        [
          "-c",
          `${ROOT_PATH}/shared/beets-config.yml`,
          "-l",
          `${ROOT_PATH}/shared/beets/beets-library.blb`,
          "import",
          "-qC",
          `${ROOT_PATH}/download/incomplete`,
        ],
        {
          encoding: "utf8",
        },
      );
      if (response.stdout) {
        logs(item, `Beets output:\r\n${response.stdout}`, app);
      } else if (response.stderr) {
        item["status"] = "error";
        logs(item, `Beets output:\r\n${response.stderr}`, app);
      }
    }
  } catch (err: unknown) {
    item["status"] = "error";
    logs(
      item,
      `Error during Beets processing :\r\n${(err as Error).message}`,
      app,
    );
  }
}
