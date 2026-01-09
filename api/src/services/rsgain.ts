import { spawn } from "child_process";

import { getAppInstance } from "../helpers/app-instance";
import { logs } from "../processing/logs";

/**
 * Apply ReplayGain tags to audio files using rsgain
 * @param itemId - Processing item ID for logging
 * @param folderPath - Path to folder containing audio files
 */
export async function applyReplayGain(
  itemId: string,
  folderPath: string,
): Promise<void> {
  const isEnabled = process.env.REPLAY_GAIN === "true";
  const app = getAppInstance();

  if (!isEnabled) {
    return;
  }

  logs(itemId, `🕖 [RSGAIN] Analyzing and tagging files in: ${folderPath}`);
  app.locals.processingStack.actions.updateItem(itemId);

  return new Promise((resolve) => {
    try {
      // Run rsgain easy mode (automatically handles album mode with recursive scan)
      const rsgainProcess = spawn(
        "rsgain",
        ["easy", "-S", "-m", "4", folderPath],
        {
          shell: "/bin/sh",
        },
      );

      let errorOutput = "";

      // Capture stderr for error messages
      rsgainProcess.stderr?.on("data", (data: Buffer) => {
        errorOutput += data.toString();
      });

      // Handle process completion
      rsgainProcess.on("close", (code) => {
        if (code === 0) {
          logs(itemId, "✅ [RSGAIN] ReplayGain tags applied successfully");
          resolve();
        } else {
          logs(
            itemId,
            `⚠️ [RSGAIN] Failed to apply ReplayGain (exit code: ${code})${errorOutput ? `: ${errorOutput}` : ""}`,
          );
          // Don't reject - ReplayGain failure shouldn't stop the pipeline
          resolve();
        }
      });

      // Handle errors
      rsgainProcess.on("error", (error) => {
        logs(
          itemId,
          `⚠️ [RSGAIN] Failed to apply ReplayGain: ${error.message}`,
        );
        // Don't reject - ReplayGain failure shouldn't stop the pipeline
        resolve();
      });
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || String(error);
      logs(itemId, `⚠️ [RSGAIN] Failed to apply ReplayGain: ${errorMessage}`);
      // Don't reject - ReplayGain failure shouldn't stop the pipeline
      resolve();
    }
  });
}
