import { execSync } from "child_process";
import { Express } from "express";

import { PROCESSING_PATH, ROOT_PATH } from "../../constants";
import { LogType, ProcessingItemType } from "../types";

import { stripAnsiCodes } from "./ansi_parse";

export function logs(
  item: ProcessingItemType | LogType,
  message: string,
  expressApp?: Express,
  replaceLast?: boolean,
) {
  if (!replaceLast) console.log(message);
  if (!item) return message;
  if (!message) return "";

  // Strip ANSI codes before sending to output
  const cleanMessage = stripAnsiCodes(message);

  if (expressApp && "id" in item) {
    const addOutputLog = expressApp.settings.addOutputLog;
    if (addOutputLog) {
      addOutputLog(item.id, cleanMessage, replaceLast);
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
    logs(item, "🕖 [TIDARR] Move processed items ...", app);

    // Check if there are files to move
    if (!hasFileToMove()) {
      logs(item, "⚠️ [TIDARR] No files to move (empty download folder)", app);
      item["status"] = "finished";
      save = true;
      return { save };
    }

    let args = "-rf";

    if (process.env.PUID && process.env.PGID) {
      args = "-rfp";
    }

    const cmd = `cp ${args} ${PROCESSING_PATH}/* ${ROOT_PATH}/library >/dev/null`;
    console.log(`🕖 [TIDARR] Command: ${cmd}`);
    execSync(cmd, { encoding: "utf-8" });
    logs(item, `✅ [TIDARR] Move complete (${item.type})`, app);
    item["status"] = "finished";
    save = true;
  } catch (e: unknown) {
    item["status"] = "error";
    logs(
      item,
      `❌ [TIDARR] Error moving files:\r\n${(e as Error).message}`,
      app,
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
    const output_clean = execSync(`rm -rf ${PROCESSING_PATH}/* >/dev/null`, {
      encoding: "utf-8",
    });
    console.log("🧹 [TIDARR] Clean folder", output_clean);
    return "finished";
  } catch (e) {
    console.log("❌ [TIDARR] Error Clean folder", e);
    return "error";
  }
}

export function hasFileToMove(): boolean {
  const filesToCopy = execSync(`ls ${PROCESSING_PATH}`, { encoding: "utf-8" })
    .trim()
    .split("\n")
    .filter((file) => file);

  return filesToCopy.length > 0;
}

export function replacePathInM3U(item: ProcessingItemType, app: Express): void {
  const basePath = process.env.M3U_BASEPATH_FILE || "./";
  const downloadDir = PROCESSING_PATH;

  logs(item, `🕖 [TIDARR] Update track path in M3U file ...`, app);

  const m3uFilePath = execSync(`find "${downloadDir}" -name "*.m3u"`, {
    encoding: "utf-8",
  }).trim();

  if (!m3uFilePath) {
    logs(item, `⚠️ [TIDARR] No M3U file found`, app);
    return;
  }

  try {
    let m3uContent = execSync(`cat "${m3uFilePath}"`, {
      encoding: "utf-8",
    });

    m3uContent = m3uContent.replace(new RegExp(downloadDir, "g"), basePath);
    execSync(`echo "${m3uContent}" > "${m3uFilePath}"`);
    logs(
      item,
      `✅ [TIDARR] M3U file updated with base path : ${basePath} !`,
      app,
    );
  } catch (e) {
    logs(
      item,
      `❌ [TIDARR] Error replacing path in m3u file: ${(e as Error).message}`,
      app,
    );
  }
}

export async function setPermissions(item: ProcessingItemType, app: Express) {
  if (process.env.PUID && process.env.PGID) {
    try {
      const output_chown = execSync(
        `chown -R ${process.env.PUID}:${process.env.PGID} ${PROCESSING_PATH}/*`,
        {
          encoding: "utf-8",
        },
      );
      logs(
        item,
        `🔑 [TIDARR] Chown PUID:PGID: ${process.env.PUID}:${process.env.PGID} - ${output_chown}`,
        app,
      );
    } catch {
      // Ignore error if directory is empty
      logs(
        item,
        `⚠️ [TIDARR] Chown skipped (no files in download folder)`,
        app,
      );
    }
  }
}
