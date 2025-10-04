import { execSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { LogType, ProcessingItemType } from "../types";

export function logs(
  item: ProcessingItemType | LogType,
  message: string,
): string {
  console.log(message);
  if (!message) return item["output"];

  if (item && !item?.["output_history"]) {
    item["output_history"] = [];
  }

  item["output_history"].push(message);

  item["output"] = item["output_history"].slice(-500).join("\r\n");
  return item["output"];
}

export async function moveAndClean(
  id: string,
  app: Express,
): Promise<{ save: boolean }> {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);
  let save = false;

  if (!item) return { save: false };

  try {
    item["output"] = logs(item, `=== Move processed items ===`);

    let args = "-rf";

    if (process.env.PUID && process.env.PGID) {
      args = "-rfp";
    }

    const cmd = `cp ${args} ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/library >/dev/null`;
    item["output"] = logs(item, cmd);
    const output_move = execSync(cmd, { encoding: "utf-8" });
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

export function hasFileToMove(): boolean {
  const sourceDir = `${ROOT_PATH}/download/incomplete/`;
  const filesToCopy = execSync(`ls ${sourceDir}`, { encoding: "utf-8" })
    .trim()
    .split("\n")
    .filter((file) => file);

  return filesToCopy.length > 0;
}

export function replacePathInM3U(): void {
  const basePath = process.env.M3U_BASEPATH_FILE || "./";
  const incompleteDir = `${ROOT_PATH}/download/incomplete/`;

  const m3uFilePath = execSync(`find "${incompleteDir}" -name "*.m3u"`, {
    encoding: "utf-8",
  }).trim();

  if (!m3uFilePath) {
    console.log(`No m3u file found:. ${incompleteDir}`);
    return;
  }

  try {
    let m3uContent = execSync(`cat "${m3uFilePath}"`, {
      encoding: "utf-8",
    });

    m3uContent = m3uContent.replace(new RegExp(incompleteDir, "g"), basePath);
    execSync(`echo "${m3uContent}" > "${m3uFilePath}"`);
    console.log(`M3u file updated with custom url !`);
  } catch (e) {
    console.error(`Error replacing path in m3u file: ${(e as Error).message}`);
  }
}

export async function setPermissions() {
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
