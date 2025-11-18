import { ChildProcess, execSync } from "child_process";
import path from "path";

import { PROCESSING_PATH, ROOT_PATH } from "../../constants";
import { getAppInstance } from "../app-instance";
import { logs } from "../helpers/logs";
import { ProcessingItemType } from "../types";

export async function moveAndClean(id: string): Promise<{
  status: "finished" | "error" | undefined;
}> {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);

  let status: "finished" | "error" | undefined;

  if (!item) return { status: "finished" };

  try {
    logs(item.id, "🕖 [TIDARR] Move processed items ...");

    // Check if there are files to move
    if (!hasFileToMove()) {
      logs(item.id, "⚠️ [TIDARR] No files to move (empty download folder)");
      return { status: "finished" };
    }

    let args = "-rf";

    if (process.env.PUID && process.env.PGID) {
      args = "-rfp";
    }

    const cmd = `cp ${args} ${PROCESSING_PATH}/* ${ROOT_PATH}/library >/dev/null`;
    console.log(`🕖 [TIDARR] Command: ${cmd}`);
    execSync(cmd, { encoding: "utf-8" });
    logs(item.id, `✅ [TIDARR] Move complete (${item.type})`);
    status = "finished";
  } catch (e: unknown) {
    status = "error";
    logs(item.id, `❌ [TIDARR] Error moving files:\r\n${(e as Error).message}`);
  } finally {
    const cleaningStatus = await cleanFolder();
    if (cleaningStatus === "error") {
      status = "error";
    }
  }

  return {
    status: status,
  };
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

export function replacePathInM3U(item: ProcessingItemType): void {
  const basePath = process.env.M3U_BASEPATH_FILE || "./";
  const downloadDir = PROCESSING_PATH;

  logs(item.id, `🕖 [TIDARR] Update track path in M3U file ...`);

  const m3uFilePath = execSync(`find "${downloadDir}" -name "*.m3u"`, {
    encoding: "utf-8",
  }).trim();

  if (!m3uFilePath) {
    logs(item.id, `⚠️ [TIDARR] No M3U file found`);
    return;
  }

  try {
    let m3uContent = execSync(`cat "${m3uFilePath}"`, {
      encoding: "utf-8",
    });

    m3uContent = m3uContent.replace(new RegExp(downloadDir, "g"), basePath);
    execSync(`echo "${m3uContent}" > "${m3uFilePath}"`);
    logs(
      item.id,
      `✅ [TIDARR] M3U file updated with base path : ${basePath} !`,
    );
  } catch (e) {
    logs(
      item.id,
      `❌ [TIDARR] Error replacing path in m3u file: ${(e as Error).message}`,
    );
  }
}

export async function setPermissions(item: ProcessingItemType) {
  if (process.env.PUID && process.env.PGID) {
    try {
      const output_chown = execSync(
        `chown -R ${process.env.PUID}:${process.env.PGID} ${PROCESSING_PATH}/*`,
        {
          encoding: "utf-8",
        },
      );
      logs(
        item.id,
        `🔑 [TIDARR] Chown PUID:PGID: ${process.env.PUID}:${process.env.PGID} - ${output_chown}`,
      );
    } catch {
      // Ignore error if directory is empty
      logs(item.id, `⚠️ [TIDARR] Chown skipped (no files in download folder)`);
    }
  }

  // Apply chmod based on UMASK to fix file permissions
  // UMASK defines which permissions to REMOVE, so we need to invert it
  if (process.env.UMASK) {
    try {
      const umaskValue = parseInt(process.env.UMASK, 8);
      // Default file permissions are 666 (rw-rw-rw-), directory permissions are 777 (rwxrwxrwx)
      const fileMode = (0o666 & ~umaskValue).toString(8);
      const dirMode = (0o777 & ~umaskValue).toString(8);

      // Apply file permissions to regular files
      execSync(`find ${PROCESSING_PATH} -type f -exec chmod ${fileMode} {} +`, {
        encoding: "utf-8",
      });

      // Apply directory permissions to directories
      execSync(`find ${PROCESSING_PATH} -type d -exec chmod ${dirMode} {} +`, {
        encoding: "utf-8",
      });

      logs(
        item.id,
        `🔑 [TIDARR] Chmod applied - Files: ${fileMode}, Directories: ${dirMode} (UMASK: ${process.env.UMASK})`,
      );
    } catch (error) {
      logs(
        item.id,
        `⚠️ [TIDARR] Chmod failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/**
 * Scans the .processing folder to find all folders containing files and returns their parent paths.
 * This function analyzes the structure based on tiddl templates:
 * - albums: albums/{album_artist}/{year} - {album}/
 * - tracks: tracks/{artist}/
 * - videos: videos/{artist}/
 * - playlists: playlists/{playlist}/
 * - mix: playlists/{playlist}/ (or custom template)
 *
 * @returns Array of parent folder paths relative to PROCESSING_PATH that contain files to scan
 */
export function getFolderToScan(): string[] {
  const foldersToScan: string[] = [];

  try {
    // Find all files (not directories) in the processing directory
    const allFiles = execSync(
      `find "${PROCESSING_PATH}" -type f 2>/dev/null || true`,
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter((file) => file);

    if (allFiles.length === 0) {
      console.log("📁 [TIDARR] No files found in processing folder");
      return foldersToScan;
    }

    console.log(
      `📁 [TIDARR] Found ${allFiles.length} file(s) in processing folder`,
    );

    // Extract unique parent directories that contain files
    const uniqueFolders = new Set<string>();

    for (const file of allFiles) {
      // Get the directory containing the file
      const fileDir = path.dirname(file);

      // Get relative path from PROCESSING_PATH
      const relativePath = path.relative(PROCESSING_PATH, fileDir);

      if (relativePath && relativePath !== ".") {
        uniqueFolders.add(relativePath);
      }
    }

    // Convert Set to Array
    foldersToScan.push(...Array.from(uniqueFolders));
  } catch (e) {
    console.error(
      `❌ [TIDARR] Error scanning processing folder: ${(e as Error).message}`,
    );
  }

  return foldersToScan;
}

/**
 * Kills a child process gracefully with SIGTERM, then force kills with SIGKILL if still running after 1 second.
 * Removes all event listeners before killing to prevent race conditions with event handlers.
 * @param process - The child process to kill
 * @param itemId - Optional item ID for error logging context
 * @returns Promise that resolves when the process is killed
 */
export async function killProcess(
  process: ChildProcess | undefined,
  itemId?: string,
): Promise<void> {
  if (!process || process.killed) {
    return;
  }

  try {
    // Remove all event listeners to prevent them from firing during kill
    process.removeAllListeners("close");
    process.removeAllListeners("exit");
    process.removeAllListeners("error");
    process.stdout?.removeAllListeners();
    process.stderr?.removeAllListeners();

    // Try graceful termination first
    process.kill("SIGTERM");

    // Wait 1 second, then force kill if still running
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        if (process && !process.killed) {
          process.kill("SIGKILL");
        }
        resolve();
      }, 1000);
    });
  } catch (error) {
    const context = itemId ? ` for item ${itemId}` : "";
    console.error(`Failed to kill process${context}:`, error);
  }
}
