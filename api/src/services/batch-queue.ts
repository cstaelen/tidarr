import { logs } from "../processing/utils/logs";

/**
 * Batch queue service
 *
 * Handles auto-pause after N completed downloads (DOWNLOAD_BATCH_SIZE)
 * and delay-based auto-resume (DOWNLOAD_BATCH_DELAY in minutes).
 */

export function getBatchSize(): number {
  return parseInt(process.env.DOWNLOAD_BATCH_SIZE || "0", 10);
}

/**
 * Returns the batch resume delay in milliseconds from DOWNLOAD_BATCH_DELAY (minutes).
 * Returns null if not set.
 */
export function getBatchDelayMs(): number | null {
  const delay = process.env.DOWNLOAD_BATCH_DELAY;
  if (!delay) return null;
  const minutes = parseFloat(delay);
  return !isNaN(minutes) && minutes > 0 ? minutes * 60 * 1000 : null;
}

/**
 * Increments batch counter and returns whether the download slot should be paused.
 * Called at the end of each download (before post-processing).
 * Returns true if DOWNLOAD_BATCH_SIZE is reached.
 */
export function checkBatchPause(
  itemId: string,
  batchCompletedCount: { value: number },
): boolean {
  if (!process.env.DOWNLOAD_BATCH_SIZE) return false;

  const batchSize = getBatchSize();
  if (batchSize <= 0) return false;

  batchCompletedCount.value++;
  if (batchCompletedCount.value >= batchSize) {
    logs(itemId, `⏸️ [BATCH] Batch of ${batchSize} completed. Queue paused.`);
    console.log(
      `⏸️ [BATCH] Auto-pausing queue after ${batchSize} completed downloads.`,
    );
    return true;
  }

  return false;
}
