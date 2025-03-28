import { execSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { LogType, ProcessingItemType } from "../types";

export function logs(
  item: ProcessingItemType | LogType,
  message: string,
): string {
  if (!message) return item["output"];

  if (!item["output_history"]) {
    item["output_history"] = [];
  }

  item["output_history"].push(message);

  item["output"] = item["output_history"].slice(-500).join("\r\n");
  return item["output"];
}

export async function moveAndClean(
  id: number,
  app: Express,
): Promise<{ save: boolean }> {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);
  let save = false;

  if (!item) return { save: false };

  setPermissions();

  try {
    const folder = item.type === "artist" ? "album" : item.type;
    item["output"] = logs(item, `=== Move processed items ===`);
    const output_move = execSync(
      `cp -rfp ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/download/${folder}s/ >/dev/null`,
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
    const cleaningStatus = await cleanFolder();
    if (cleaningStatus === "error") {
      item["status"] = "error";
    }
    app.settings.processingList.actions.updateItem(item);
  }

  return { save: save };
}

export async function cleanFolder(): Promise<"finished" | "error"> {
  try {
    const output_clean = execSync(
      `rm -rf ${ROOT_PATH}/download/incomplete/* >/dev/null`,
      {
        encoding: "utf-8",
      },
    );
    console.log("- Clean folder", output_clean);
    return "finished";
  } catch (e) {
    console.log("- Error Clean folder", e);
    return "error";
  }
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
