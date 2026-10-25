import { ChildProcess } from "child_process";
import fs from "fs/promises";
import path from "path";

import { NZB_DOWNLOAD_PATH, PROCESSING_PATH } from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
import { walkDir } from "../../helpers/walk-dir";
import { ProcessingItemType } from "../../types";

import { logs } from "./logs";

export async function moveAndClean(id: string): Promise<{
  status: "finished" | "error" | undefined;
}> {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);
  let status: "finished" | "error" | undefined;

  if (!item) return { status: "finished" };

  const itemProcessingPath = path.join(PROCESSING_PATH, String(item.id));
  const libraryPath = app.locals.tiddlConfig?.download?.download_path;

  if (!libraryPath) {
    logs(item.id, "❌ [TIDARR] No library path configured, cannot move files");
    return { status: "error" };
  }

  try {
    logs(item.id, "🕖 [TIDARR] Move processed items ...");

    // ENOENT means nothing was downloaded, which is a normal outcome
    const entries = await fs.readdir(itemProcessingPath).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    });

    if (entries.length === 0) {
      logs(item.id, "⚠️ [TIDARR] No files to move (empty download folder)");
      // Drop the folder now, it would otherwise pile up until the next restart
      await cleanFolder(item.id);
      return { status: "finished" };
    }

    // fs.cp would recreate a missing library in the container layer, where it gets
    // wiped on restart. Only the folders below the root are ours to create.
    const libraryStat = await fs.stat(libraryPath).catch(() => null);

    if (!libraryStat?.isDirectory()) {
      logs(
        item.id,
        `❌ [TIDARR] Library path ${libraryPath} is not an existing folder, is the volume mounted?`,
      );
      logs(
        item.id,
        `ℹ️ [TIDARR] Keeping downloaded files in ${itemProcessingPath} — use "Retry post processing" once the issue is fixed.`,
      );
      return { status: "error" };
    }

    logs(
      item.id,
      `🕖 [TIDARR] Moving ${entries.length} entry(ies) to ${libraryPath}`,
    );

    // Copy the content, not the folder itself, so trees merge into the library.
    // One failing entry must not strand the ones that follow it.
    const copyEntry = (entry: string, preserveTimestamps: boolean) =>
      fs.cp(
        path.join(itemProcessingPath, entry),
        path.join(libraryPath, entry),
        { recursive: true, force: true, preserveTimestamps },
      );

    const { failed, firstError } = await applyToPaths(entries, (entry) =>
      // Mtimes are a bonus: SMB and some FUSE mounts refuse utimes, and fs.cp
      // turns that into a copy failure
      copyEntry(entry, true).catch(() => copyEntry(entry, false)),
    );

    if (failed) {
      logs(
        item.id,
        `❌ [TIDARR] Error moving ${failed}/${entries.length} entry(ies):\r\n${firstError?.message}`,
      );
      logs(
        item.id,
        `ℹ️ [TIDARR] Keeping downloaded files in ${itemProcessingPath} — use "Retry post processing" once the issue is fixed.`,
      );
      return { status: "error" };
    }

    logs(item.id, `✅ [TIDARR] Move complete (${item.type})`);
    status = "finished";
  } catch (e: unknown) {
    status = "error";
    logs(item.id, `❌ [TIDARR] Error moving files:\r\n${(e as Error).message}`);
    logs(
      item.id,
      `ℹ️ [TIDARR] Keeping downloaded files in ${itemProcessingPath} — use "Retry post processing" once the issue is fixed.`,
    );
    return { status };
  }

  // Only clean up on success — files are kept on failure for the retry
  const cleaningStatus = await cleanFolder(item.id);
  if (cleaningStatus === "error") {
    status = "error";
  }

  return {
    status: status,
  };
}

export async function cleanFolder(
  itemId?: string,
): Promise<"finished" | "error"> {
  const app = getAppInstance();
  const item: ProcessingItemType | undefined =
    itemId && app.locals.processingStack.actions.getItem(itemId);

  let processingPath = PROCESSING_PATH;
  if (itemId && item && item.source === "lidarr") {
    processingPath = NZB_DOWNLOAD_PATH;
  }

  try {
    if (itemId) {
      await fs.rm(path.join(processingPath, String(itemId)), {
        recursive: true,
        force: true,
      });
    } else {
      // Startup cleanup: empty the folder but keep it in place.
      // A missing folder is fine on a fresh install, an unreadable one is not
      const entries = await fs.readdir(processingPath).catch((error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw error;
      });

      // One folder we cannot remove must not leave all the others behind
      const { failed, firstError } = await applyToPaths(
        entries.map((entry) => path.join(processingPath, entry)),
        (target) => fs.rm(target, { recursive: true, force: true }),
      );

      if (failed) {
        console.log(
          `❌ [TIDARR] Error cleaning ${failed}/${entries.length} folder(s) in ${processingPath}:`,
          firstError,
        );
        return "error";
      }
    }

    console.log(
      `🧹 [TIDARR] Cleaned up processing folder ${itemId ? ` (item: ${itemId})` : ""}`,
    );
    return "finished";
  } catch (e) {
    console.log(`❌ [TIDARR] Error cleaning folder:`, e);
    return "error";
  }
}

export async function hasFileToMove(pathArg?: string): Promise<boolean> {
  const targetPath = pathArg || PROCESSING_PATH;

  try {
    const entries = await fs.readdir(targetPath);
    return entries.length > 0;
  } catch (error) {
    // A missing folder just means nothing was downloaded
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("❌ [TIDARR] Error checking files to move:", error);
    }
    return false;
  }
}

export async function replacePathInM3U(
  item: ProcessingItemType,
): Promise<void> {
  if (item["type"] !== "playlist" && item["type"] !== "mix") return;

  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";
  const downloadDir = path.join(PROCESSING_PATH, String(item.id));
  const app = getAppInstance();
  const libraryPath = app.locals.tiddlConfig?.download?.download_path;

  if (!libraryPath) {
    logs(
      item.id,
      "❌ [TIDARR] No library path configured, skipping M3U update",
    );
    return;
  }

  logs(item.id, `🕖 [TIDARR] Update track path in M3U file ...`);

  try {
    const { files } = await walkDir(downloadDir);
    // Rewrite them all: a skipped one keeps processing paths that die with the folder
    const m3uFiles = files.filter((file) => file.endsWith(".m3u"));

    if (m3uFiles.length === 0) {
      logs(item.id, `⚠️ [TIDARR] No M3U file found`);
      return;
    }

    for (const m3uFilePath of m3uFiles) {
      const m3uContent = (await fs.readFile(m3uFilePath, "utf-8"))
        // Processing path first: it starts with the library path in some setups
        .replaceAll(downloadDir, basePath)
        .replaceAll(libraryPath, basePath);

      await fs.writeFile(m3uFilePath, m3uContent, "utf-8");
    }

    logs(
      item.id,
      `✅ [TIDARR] ${m3uFiles.length} M3U file(s) updated with base path : ${basePath}`,
    );
  } catch (e) {
    logs(
      item.id,
      `❌ [TIDARR] Error replacing path in m3u file: ${(e as Error).message}`,
    );
  }
}

/**
 * Applies an operation to every path, keeping going on failure.
 * @returns Failure count plus the first error, to report a cause without flooding the logs
 */
async function applyToPaths(
  paths: string[],
  apply: (target: string) => Promise<void>,
): Promise<{ failed: number; firstError?: Error }> {
  let failed = 0;
  let firstError: Error | undefined;

  for (const target of paths) {
    try {
      await apply(target);
    } catch (error) {
      failed++;
      firstError ??= error as Error;
    }
  }

  return { failed, firstError };
}

export async function setPermissions(
  item: ProcessingItemType,
  basePath = PROCESSING_PATH,
) {
  // Ownership and permission bits are POSIX-only
  if (process.platform === "win32") return;

  // Nothing configured to apply: skip the recursive walk entirely
  const hasOwnership = Boolean(process.env.PUID && process.env.PGID);
  if (!hasOwnership && !process.env.UMASK) return;

  const itemProcessingPath = path.join(basePath, String(item.id));
  const { files, dirs } = await walkDir(itemProcessingPath);

  if (process.env.PUID && process.env.PGID) {
    const uid = parseInt(process.env.PUID, 10);
    const gid = parseInt(process.env.PGID, 10);

    const { failed, firstError } = await applyToPaths(
      [itemProcessingPath, ...dirs, ...files],
      (target) => fs.chown(target, uid, gid),
    );

    if (failed) {
      logs(
        item.id,
        `⚠️ [TIDARR] Chown skipped on ${failed} path(s): ${firstError?.message}`,
      );
    } else {
      logs(item.id, `🔑 [TIDARR] Chown PUID:PGID: ${uid}:${gid}`);
    }
  }

  // Apply chmod based on UMASK to fix file permissions
  // UMASK defines which permissions to REMOVE, so we need to invert it
  if (process.env.UMASK) {
    const umaskValue = parseInt(process.env.UMASK, 8);

    // Without this guard, ~NaN is -1 and every file would end up 666 / 777
    if (Number.isNaN(umaskValue)) {
      logs(
        item.id,
        `⚠️ [TIDARR] Invalid UMASK "${process.env.UMASK}", skipping chmod`,
      );
      return;
    }

    // Default file permissions are 666 (rw-rw-rw-), directory permissions are 777 (rwxrwxrwx)
    const fileMode = 0o666 & ~umaskValue;
    const dirMode = 0o777 & ~umaskValue;

    // Files first: a UMASK stripping the dirs' execute bit would block traversal
    const fileResult = await applyToPaths(files, (target) =>
      fs.chmod(target, fileMode),
    );
    const dirResult = await applyToPaths(
      [itemProcessingPath, ...dirs],
      (target) => fs.chmod(target, dirMode),
    );

    const failed = dirResult.failed + fileResult.failed;
    const firstError = dirResult.firstError ?? fileResult.firstError;

    if (failed) {
      logs(
        item.id,
        `⚠️ [TIDARR] Chmod failed on ${failed} path(s): ${firstError?.message}`,
      );
    } else {
      logs(
        item.id,
        `🔑 [TIDARR] Chmod applied - Files: ${fileMode.toString(8)}, Directories: ${dirMode.toString(8)} (UMASK: ${process.env.UMASK})`,
      );
    }
  }
}

/**
 * Scans a specific item's processing folder to find all folders containing files and returns their parent paths.
 * This function analyzes the structure based on tiddl templates:
 * - albums: albums/{album_artist}/{year} - {album}/
 * - tracks: tracks/{artist}/
 * - videos: videos/{artist}/
 * - playlists: playlists/{playlist}/
 * - mix: playlists/{playlist}/ (or custom template)
 *
 * @param itemId - The item ID to scan folders for
 * @returns Array of parent folder paths relative to item's processing path that contain files to scan
 */
export async function getFolderToScan(itemId: string): Promise<string[]> {
  const itemProcessingPath = path.join(PROCESSING_PATH, String(itemId));
  const { files } = await walkDir(itemProcessingPath);

  if (files.length === 0) {
    console.log("📁 [TIDARR] No files found in processing folder");
    return [];
  }

  console.log(`📁 [TIDARR] Found ${files.length} file(s) in processing folder`);

  const uniqueFolders = new Set<string>();

  for (const file of files) {
    const relativePath = path.relative(itemProcessingPath, path.dirname(file));

    if (relativePath && relativePath !== ".") {
      uniqueFolders.add(relativePath);
    }
  }

  return Array.from(uniqueFolders);
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

  const context = itemId ? ` for item ${itemId}` : "";
  console.error(`⏹️ [TIDARR] Kill process ${context}:`);

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
    console.error(`Failed to kill process${context}:`, error);
  }
}
