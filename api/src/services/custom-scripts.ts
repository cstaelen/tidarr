import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { CONFIG_PATH, PROCESSING_PATH } from "../../constants";
import { getAppInstance } from "../helpers/app-instance";
import { logs } from "../processing/utils/logs";
import { ProcessingItemType } from "../types";

const execAsync = promisify(exec);

interface ScriptConfig {
  scriptPath: string;
  cwd: string;
  env: Record<string, string>;
  logPrefix: string;
  scriptName: string;
}

/**
 * Generic script runner that handles chmod, spawn, logging and error handling.
 */
async function runScript(
  item: ProcessingItemType,
  config: ScriptConfig,
): Promise<void> {
  const { scriptPath, cwd, env, logPrefix, scriptName } = config;

  if (!fs.existsSync(scriptPath)) {
    return;
  }

  logs(item.id, `🕖 [TIDARR] Executing ${scriptName}...`);

  return new Promise((resolve) => {
    execAsync(`chmod +x "${scriptPath}"`, {
      encoding: "utf-8",
      shell: "/bin/sh",
    })
      .then(() => {
        const scriptProcess = spawn("sh", [scriptPath], {
          cwd,
          env: { ...process.env, ...env },
        });

        const handleOutput = (data: Buffer) => {
          const output = data.toString().trim();
          if (output) {
            logs(item.id, `🤖 [${logPrefix}] ${output}`);
          }
        };

        scriptProcess.stdout?.on("data", handleOutput);
        scriptProcess.stderr?.on("data", handleOutput);

        scriptProcess.on("close", (code) => {
          if (code === 0) {
            logs(item.id, `✅ [TIDARR] ${scriptName} executed successfully`);
          } else {
            logs(item.id, `⚠️ [TIDARR] ${scriptName} exited with code ${code}`);
          }
          resolve();
        });

        scriptProcess.on("error", (error) => {
          logs(item.id, `❌ [TIDARR] ${scriptName} error: ${error.message}`);
          resolve();
        });
      })
      .catch((error) => {
        logs(
          item.id,
          `❌ [TIDARR] Failed to execute ${scriptName}: ${error instanceof Error ? error.message : String(error)}`,
        );
        resolve();
      });
  });
}

/**
 * Executes custom-script.sh before files are moved to the library.
 *
 * Environment variables available:
 * - PROCESSING_PATH: /shared/.processing/<item-uuid> - Path to the processing directory
 * - ITEM_TYPE: Content type (album, track, playlist, etc.)
 * - ITEM_URL: Tidal URL
 */
export async function executeCustomScript(
  item: ProcessingItemType,
): Promise<void> {
  const itemProcessingPath = `${PROCESSING_PATH}/${item.id}`;

  return runScript(item, {
    scriptPath: path.join(CONFIG_PATH, "custom-script.sh"),
    cwd: itemProcessingPath,
    env: {
      PROCESSING_PATH: itemProcessingPath,
      ITEM_TYPE: item.type,
      ITEM_URL: item.url,
    },
    logPrefix: "CUSTOM SCRIPT",
    scriptName: "custom script",
  });
}

/**
 * Executes custom-post-script.sh after files are moved to the library.
 *
 * Environment variables available:
 * - DESTINATION_PATH: Library path where files were moved
 * - FOLDERS_MOVED: Comma-separated list of moved folders
 * - ITEM_TYPE: Content type (album, track, playlist, etc.)
 * - ITEM_URL: Tidal URL
 */
export async function executePostScript(
  item: ProcessingItemType,
  foldersToScan: string[],
): Promise<void> {
  const app = getAppInstance();
  const libraryPath = app.locals.tiddlConfig.download.download_path;

  return runScript(item, {
    scriptPath: path.join(CONFIG_PATH, "custom-post-script.sh"),
    cwd: libraryPath,
    env: {
      DESTINATION_PATH: libraryPath,
      FOLDERS_MOVED: foldersToScan.join(","),
      ITEM_TYPE: item.type,
      ITEM_URL: item.url,
    },
    logPrefix: "POST SCRIPT",
    scriptName: "custom post-script",
  });
}
