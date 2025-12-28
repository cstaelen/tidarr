import { execSync } from "child_process";

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

  try {
    // Run rsgain easy mode (automatically handles album mode with recursive scan)
    const cmd = `rsgain easy -S -m 4 "${folderPath}"`;

    execSync(cmd, {
      encoding: "utf-8",
      shell: "/bin/sh",
      stdio: "pipe",
    });

    logs(itemId, "✅ [RSGAIN] ReplayGain tags applied successfully");
  } catch (error: unknown) {
    const errorMessage = (error as Error).message || String(error);
    logs(itemId, `⚠️ [RSGAIN] Failed to apply ReplayGain: ${errorMessage}`);
    // Don't throw - ReplayGain failure shouldn't stop the pipeline
  }
}
