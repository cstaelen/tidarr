import { ChildProcess, execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

import { CONFIG_PATH } from "../../constants";
import { getAppInstance } from "../helpers/app-instance";
import { ProcessingItemType } from "../types";

import { logs } from "./logs";

/**
 * Process and move a single track file immediately after download
 * This allows playlist downloads to save tracks incrementally
 */
export async function processSingleTrack(
  itemId: string,
  trackFilename: string,
): Promise<boolean> {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(itemId);

  if (!item) {
    console.error(`[TRACK PROCESS] Item ${itemId} not found`);
    return false;
  }

  const processingPath = getProcessingPath();
  const itemProcessingPath = path.join(processingPath, String(item.id));
  const libraryPath = app.locals.tiddlConfig.download.scan_path;

  try {
    // Find the track file in the processing folder structure
    const trackPath = findFileInDirectory(itemProcessingPath, trackFilename);

    if (!trackPath) {
      console.log(
        `⚠️ [TRACK PROCESS] File not found: ${trackFilename}, may have been moved already`,
      );
      return false;
    }

    // Get the relative path from itemProcessingPath to maintain folder structure
    const relativePath = path.relative(itemProcessingPath, trackPath);
    const relativeDir = path.dirname(relativePath);

    // Build destination path maintaining folder structure
    const destDir = path.join(libraryPath, relativeDir);
    const destPath = path.join(libraryPath, relativePath);

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy the file
    fs.copyFileSync(trackPath, destPath);

    // Set permissions if PUID/PGID are set
    if (process.env.PUID && process.env.PGID) {
      try {
        execSync(
          `chown ${process.env.PUID}:${process.env.PGID} "${destPath}"`,
          { encoding: "utf-8", shell: "/bin/sh" },
        );
      } catch (error) {
        console.log(
          `⚠️ [TRACK PROCESS] Chown failed for ${trackFilename}. Error: ${error.message}`,
        );
      }
    }

    // Apply UMASK permissions
    if (process.env.UMASK) {
      try {
        const umaskValue = parseInt(process.env.UMASK, 8);
        const filePerms = (0o666 & ~umaskValue).toString(8);
        execSync(`chmod ${filePerms} "${destPath}"`, {
          encoding: "utf-8",
          shell: "/bin/sh",
        });
      } catch (error) {
        console.log(
          `⚠️ [TRACK PROCESS] Chmod failed for ${trackFilename}. Error: ${error.message}`,
        );
      }
    }

    console.log(`✅ [TRACK PROCESS] Copied: ${trackFilename} → ${destPath}`);

    // Don't delete source file yet - tiddl may still need it for post-processing
    // The processing folder will be cleaned up after the entire download completes

    return true;
  } catch (error) {
    console.error(
      `❌ [TRACK PROCESS] Error processing ${trackFilename}:`,
      error,
    );
    return false;
  }
}

/**
 * Recursively find a file in a directory by filename
 */
function findFileInDirectory(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const found = findFileInDirectory(fullPath, filename);
      if (found) return found;
    } else if (entry.name === filename) {
      return fullPath;
    }
  }

  return null;
}

export function getProcessingPath(): string {
  const app = getAppInstance();
  const downloadPath = app.locals.tiddlConfig?.download.download_path;
  // Remove trailing slash if present to avoid double slashes
  return downloadPath?.replace(/\/+$/, "");
}

export async function moveAndClean(id: string): Promise<{
  status: "finished" | "error" | undefined;
}> {
  const app = getAppInstance();
  const item: ProcessingItemType =
    app.locals.processingStack.actions.getItem(id);
  const processingPath = getProcessingPath();
  let status: "finished" | "error" | undefined;

  if (!item) return { status: "finished" };

  const itemProcessingPath = `${processingPath}/${item.id}`;
  const libraryPath = app.locals.tiddlConfig.download.scan_path;

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
    execSync(cmd, { encoding: "utf-8", shell: "/bin/sh" });
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
  const processingPath = getProcessingPath();

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
    execSync(`rm -rf ${targetPath}`, {
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

export function hasFileToMove(pathArg?: string): boolean {
  const processingPath = getProcessingPath();

  const targetPath = pathArg || processingPath;

  // Check if path exists first
  if (!fs.existsSync(targetPath)) {
    console.log(`ℹ️ [TIDARR] Path does not exist: ${targetPath}`);
    return false;
  }

  try {
    const filesToCopy = execSync(`ls "${targetPath}"`, {
      encoding: "utf-8",
      shell: "/bin/sh",
    })
      .trim()
      .split("\n")
      .filter((file) => file);

    return filesToCopy.length > 0;
  } catch (error) {
    // Directory might be empty or not accessible
    console.error("❌ [TIDARR] Error checking files to move:", error);
    return false;
  }
}

export function replacePathInM3U(item: ProcessingItemType): void {
  if (item["type"] !== "playlist" && item["type"] !== "mix") return;

  const processingPath = getProcessingPath();
  const basePath = process.env.M3U_BASEPATH_FILE?.replaceAll('"', "") || ".";
  const downloadDir = `${processingPath}/${item.id}`;
  const app = getAppInstance();
  const libraryPath = app.locals.tiddlConfig.download.scan_path;

  logs(item.id, `🕖 [TIDARR] Update track path in M3U file ...`);

  try {
    const m3uFilePath = execSync(`find "${downloadDir}" -name "*.m3u"`, {
      encoding: "utf-8",
    }).trim();

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
  const processingPath = getProcessingPath();

  const itemProcessingPath = `${processingPath}/${item.id}`;

  if (process.env.PUID && process.env.PGID) {
    try {
      const output_chown = execSync(
        `chown -R ${process.env.PUID}:${process.env.PGID} "${itemProcessingPath}"`,
        {
          encoding: "utf-8",
          shell: "/bin/sh",
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
      execSync(
        `find "${itemProcessingPath}" -type f -exec chmod ${fileMode} {} +`,
        {
          encoding: "utf-8",
          shell: "/bin/sh",
        },
      );

      // Apply directory permissions to directories
      execSync(
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
export function getFolderToScan(itemId: string): string[] {
  const processingPath = getProcessingPath();

  const foldersToScan: string[] = [];
  const itemProcessingPath = `${processingPath}/${itemId}`;

  try {
    // Find all files (not directories) in the item's processing directory
    const allFiles = execSync(
      `find "${itemProcessingPath}" -type f 2>/dev/null || true`,
      { encoding: "utf-8", shell: "/bin/sh" },
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
  const processingPath = getProcessingPath();
  const customScriptPath = path.join(CONFIG_PATH, "custom-script.sh");
  const itemProcessingPath = `${processingPath}/${item.id}`;

  // Check if the custom script exists
  if (!fs.existsSync(customScriptPath)) {
    // Script is optional, don't log if missing
    return;
  }

  logs(item.id, "🕖 [TIDARR] Executing custom script...");

  return new Promise((resolve) => {
    try {
      // Make script executable
      execSync(`chmod +x "${customScriptPath}"`, {
        encoding: "utf-8",
        shell: "/bin/sh",
      });

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
    } catch (error) {
      logs(
        item.id,
        `❌ [TIDARR] Failed to execute custom script: ${error instanceof Error ? error.message : String(error)}`,
      );
      resolve(); // Don't reject to avoid breaking the processing pipeline
    }
  });
}
