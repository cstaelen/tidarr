import { execSync } from "child_process";
import { Express } from "express";

import { ROOT_PATH } from "../../constants";
import { LogType, ProcessingItemType } from "../types";

export function logs(
  item: ProcessingItemType | LogType,
  message: string,
  expressApp?: Express,
) {
  console.log(message);
  if (!item) return message;
  if (!message) return "";

  // Use the new output storage system if expressApp is provided
  if (expressApp && "id" in item) {
    const addOutputLog = expressApp.settings.addOutputLog;
    if (addOutputLog) {
      addOutputLog(item.id, message);
    }
  }
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
    logs(item, `=== Move processed items ===`, app);

    let args = "-rf";

    if (process.env.PUID && process.env.PGID) {
      args = "-rfp";
    }

    const cmd = `cp ${args} ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/library >/dev/null`;
    logs(item, cmd, app);
    const output_move = execSync(cmd, { encoding: "utf-8" });
    logs(item, `- Move complete ${item.type}\r\n${output_move}`, app);
    item["status"] = "finished";
    save = true;
  } catch (e: unknown) {
    item["status"] = "error";
    logs(item, `- Error moving files:\r\n${(e as Error).message}`, app);
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

function setUmask(umask: string) {
  const output_chmod = execSync(
    `chmod -R ${umask} ${ROOT_PATH}/download/incomplete/*`,
    {
      encoding: "utf-8",
    },
  );
  console.log(`- Chmod: ${umask}`, output_chmod);
}

export async function setPermissions() {
  if (process.env.PUID && process.env.PGID) {
    setUmask(process.env.UMASK || "755");

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
    return;
  }

  if (process.env.UMASK) {
    setUmask(process.env.UMASK);
  }
}
