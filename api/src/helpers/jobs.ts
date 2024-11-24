import { execSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { ProcessingItemType } from "../types";

export function logs(item: ProcessingItemType, message: string): string {
  console.log(message.toString());
  const last_output =
    item["output_history"]?.[item["output_history"]?.length - 1];

  if (
    (last_output?.includes("threaded download") &&
      message.toString()?.includes("threaded download")) ||
    (last_output?.includes("Single URL") &&
      message.toString()?.includes("Single URL"))
  ) {
    item["output_history"][item["output_history"].length - 1] = message
      .toString()
      .split(",")[0];
  } else {
    if (!item["output_history"]) {
      item["output_history"] = [];
    }
    item["output_history"].push(message);
  }

  item["output"] = [item["output_history"].slice(-500)].join("\r\n");
  return item["output"];
}

export async function moveAndClean(
  id: number,
  app: Express,
): Promise<{ save: boolean }> {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);
  let save = false;

  setPermissions();

  try {
    item["output"] = logs(item, `=== Move processed items ===`);
    const output_move = execSync(
      `cp -rfp ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/download/${item.type}s/ >/dev/null`,
      { encoding: "utf-8" },
    );
    item["output"] = logs(
      item,
      `- Move complete ${item.type}\r\n${output_move}`,
    );
    item["status"] = "finished";
    save = true;
  } catch (e: unknown) {
    item["status"] = "error";
    item["output"] = logs(
      item,
      `- Error moving files:\r\n${(e as Error).message}`,
    );
  } finally {
    const output_clean = cleanFolder();
    item["output"] = [
      item["output"],
      `- Clean folder"\r\n${output_clean}`,
    ].join("\r\n");
    item["output"].substr(item["output"].length - 5000);
    app.settings.processingList.actions.updateItem(item);
  }

  return { save: save };
}

export async function cleanFolder(): Promise<string> {
  const output_clean = execSync(
    `rm -rf ${ROOT_PATH}/download/incomplete/* >/dev/null`,
    {
      encoding: "utf-8",
    },
  );
  console.log("- Clean folder", output_clean);
  return output_clean;
}

async function setPermissions() {
  if (process.env.PUID && process.env.PGID) {
    const output_chmod = execSync(
      `chmod -R 755 ${ROOT_PATH}/download/incomplete/*`,
      {
        encoding: "utf-8",
      },
    );
    console.log("- Chmod: 755", output_chmod);

    const output_chown = execSync(
      `chown -R ${process.env.PUID}:${process.env.PGID} ${ROOT_PATH}/download/incomplete/*`,
      {
        encoding: "utf-8",
      },
    );
    console.log(
      `- Chown: ${process.env.PUID}:${process.env.PGID}`,
      output_chown,
    );
  }
}
