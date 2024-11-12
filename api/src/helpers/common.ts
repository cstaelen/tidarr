import { execSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { ProcessingItemType } from "../types";

export function logs(item: ProcessingItemType, message: string): string {
  console.log(message);
  item["output"] = [item["output"], message].join("\r\n");
  return item["output"].substr(item["output"].length - 5000);
}

export async function moveAndClean(
  id: number,
  app: Express,
): Promise<{ save: boolean }> {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);
  let save = false;

  try {
    item["output"] = logs(item, `=== Move processed items ===`);
    const output_move = execSync(
      `cp -rf ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/download/${item.type}s/ >/dev/null`,
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
