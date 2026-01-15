import { ChildProcess, exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

import {
  CONFIG_PATH,
  NZB_DOWNLOAD_PATH,
  PROCESSING_PATH,
} from "../../../constants";
import { getAppInstance } from "../../helpers/app-instance";
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

  const itemProcessingPath = `${PROCESSING_PATH}/${item.id}`;
  const libraryPath = app.locals.tiddlConfig.download.download_path;

  try {
    logs(item.id, "🕖 [TIDARR] Move processed items ...");

    // Check if there are files to move
    if (!hasFileToMove(itemProcessingPath)) {
      logs(item.id, "⚠️ [TIDARR] No files to move (empty download folder)");
      return { status: "finished" };
    }

    let args = "-rf";

    if (process.env.PUID && process.env.PGID) {
      args = "-rfp";
    }

    const cmd = `cp ${args} "${itemProcessingPath}"/* "${libraryPath}" >/dev/null`;
    console.log(`🕖 [TIDARR] Command: ${cmd}`);
    await execAsync(cmd, { encoding: "utf-8", shell: "/bin/sh" });
    logs(item.id, `✅ [TIDARR] Move complete (${item.type})`);
    status = "finished";
  } catch (e: unknown) {
    status = "error";
    logs(item.id, `❌ [TIDARR] Error moving files:\r\n${(e as Error).message}`);
  } finally {
    const cleaningStatus = await cleanFolder(item.id);
    if (cleaningStatus === "error") {
      status = "error";
    }
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

  const targetPath = itemId
    ? `${processingPath}/${itemId}`
    : `${processingPath}/*`;

  // Check if target exists before attempting to remove
  if (itemId) {
    // For specific item, check if directory exists
    if (!fs.existsSync(targetPath)) {
      return "finished";
    }
  } else {
    // For wildcard cleanup, check if processing folder exists
    if (!fs.existsSync(processingPath)) {
      return "finished";
    }
  }

  try {
    await execAsync(`rm -rf ${targetPath}`, {
      encoding: "utf-8",
      shell: "/bin/sh",
    });
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

  // Check if path exists first
  if (!fs.existsSync(targetPath)) {
    console.log(`ℹ️ [TIDARR] Path does not exist: ${targetPath}`);
    return false;
  }

  try {
    const { stdout } = await execAsync(`ls "${targetPath}"`, {
      encoding: "utf-8",
      shell: "/bin/sh",
    });
    const filesToCopy = stdout
      .trim()
      .split("\n")
      .filter((file: string) => file);

    return filesToCopy.length > 0;
  } catch (error) {
    // Directory might be empty or not accessible
    console.error("❌ [TIDARR] Error checking files to move:", error);
    return false;
  }
}

export async function replacePathInM3U(
  item: ProcessingItemType,
): Promise<void> {
  if (item["type"] !== "playlist" && item["type"] !== "mix") return;

  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";
  const downloadDir = `${PROCESSING_PATH}/${item.id}`;
  const app = getAppInstance();
  const libraryPath = app.locals.tiddlConfig.download.download_path;

  logs(item.id, `🕖 [TIDARR] Update track path in M3U file ...`);

  try {
    const { stdout } = await execAsync(`find "${downloadDir}" -name "*.m3u"`, {
      encoding: "utf-8",
    });
    const m3uFilePath = stdout.trim();

    if (!m3uFilePath) {
      logs(item.id, `⚠️ [TIDARR] No M3U file found`);
      return;
    }

    // Use fs.readFileSync instead of shell `cat` to avoid issues with special characters
    let m3uContent = fs.readFileSync(m3uFilePath, "utf-8");

    // Replace paths in two steps:
    // 1. Replace processing path: /music/.processing/{item.id}/ -> ./
    m3uContent = m3uContent.replace(new RegExp(downloadDir, "g"), basePath);
    // 2. Replace library path: /music/ -> ./
    m3uContent = m3uContent.replace(new RegExp(libraryPath, "g"), basePath);

    // Use fs.writeFileSync instead of shell `echo` to preserve $ characters in artist names
    fs.writeFileSync(m3uFilePath, m3uContent, "utf-8");
    logs(item.id, `✅ [TIDARR] M3U file updated with base path : ${basePath}`);
  } catch (e) {
    logs(
      item.id,
      `❌ [TIDARR] Error replacing path in m3u file: ${(e as Error).message}`,
    );
  }
}

export async function setPermissions(item: ProcessingItemType) {
  const itemProcessingPath = `${PROCESSING_PATH}/${item.id}`;

  if (process.env.PUID && process.env.PGID) {
    try {
      const { stdout } = await execAsync(
        `chown -R ${process.env.PUID}:${process.env.PGID} "${itemProcessingPath}"`,
        {
          encoding: "utf-8",
          shell: "/bin/sh",
        },
      );
      logs(
        item.id,
        `🔑 [TIDARR] Chown PUID:PGID: ${process.env.PUID}:${process.env.PGID} - ${stdout}`,
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
      await execAsync(
        `find "${itemProcessingPath}" -type f -exec chmod ${fileMode} {} +`,
        {
          encoding: "utf-8",
          shell: "/bin/sh",
        },
      );

      // Apply directory permissions to directories
      await execAsync(
        `find "${itemProcessingPath}" -type d -exec chmod ${dirMode} {} +`,
        {
          encoding: "utf-8",
          shell: "/bin/sh",
        },
      );

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
  const foldersToScan: string[] = [];
  const itemProcessingPath = `${PROCESSING_PATH}/${itemId}`;

  try {
    // Find all files (not directories) in the item's processing directory
    const { stdout } = await execAsync(
      `find "${itemProcessingPath}" -type f 2>/dev/null || true`,
      { encoding: "utf-8", shell: "/bin/sh" },
    );
    const allFiles = stdout
      .trim()
      .split("\n")
      .filter((file: string) => file);

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

      // Get relative path from item's processing path
      const relativePath = path.relative(itemProcessingPath, fileDir);

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

/**
 * Executes a custom user script if it exists in the shared directory.
 * The script is executed in the item's .processing directory context.
 * @param item - The processing item
 * @returns Promise that resolves when the script completes or if no script exists
 */
export async function executeCustomScript(
  item: ProcessingItemType,
): Promise<void> {
  const customScriptPath = path.join(CONFIG_PATH, "custom-script.sh");
  const itemProcessingPath = `${PROCESSING_PATH}/${item.id}`;

  // Check if the custom script exists
  if (!fs.existsSync(customScriptPath)) {
    // Script is optional, don't log if missing
    return;
  }

  logs(item.id, "🕖 [TIDARR] Executing custom script...");

  return new Promise((resolve) => {
    // Make script executable first
    execAsync(`chmod +x "${customScriptPath}"`, {
      encoding: "utf-8",
      shell: "/bin/sh",
    })
      .then(() => {
        // Execute script in item's .processing directory
        const scriptProcess = spawn("sh", [customScriptPath], {
          cwd: itemProcessingPath,
          env: {
            ...process.env,
            PROCESSING_PATH: itemProcessingPath,
            ITEM_TYPE: item.type,
            ITEM_URL: item.url,
          },
        });

        // Capture stdout
        scriptProcess.stdout?.on("data", (data: Buffer) => {
          const output = data.toString().trim();
          if (output) {
            logs(item.id, `🤖 [CUSTOM SCRIPT] ${output}`);
          }
        });

        // Capture stderr
        scriptProcess.stderr?.on("data", (data: Buffer) => {
          const output = data.toString().trim();
          if (output) {
            logs(item.id, `🤖 [CUSTOM SCRIPT] ${output}`);
          }
        });

        // Handle script completion
        scriptProcess.on("close", (code) => {
          if (code === 0) {
            logs(item.id, "✅ [TIDARR] Custom script executed successfully");
            resolve();
          } else {
            logs(item.id, `⚠️ [TIDARR] Custom script exited with code ${code}`);
            resolve(); // Don't reject to avoid breaking the processing pipeline
          }
        });

        // Handle errors
        scriptProcess.on("error", (error) => {
          logs(item.id, `❌ [TIDARR] Custom script error: ${error.message}`);
          resolve(); // Don't reject to avoid breaking the processing pipeline
        });
      })
      .catch((error) => {
        logs(
          item.id,
          `❌ [TIDARR] Failed to execute custom script: ${error instanceof Error ? error.message : String(error)}`,
        );
        resolve(); // Don't reject to avoid breaking the processing pipeline
      });
  });
}
