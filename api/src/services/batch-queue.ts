import { Express } from "express";
import cron from "node-cron";

import { logs } from "../processing/utils/logs";

/**
 * Batch queue service
 *
 * Handles auto-pause after N completed downloads (DOWNLOAD_BATCH_SIZE)
 * and optional cron-based auto-resume (DOWNLOAD_BATCH_CRON).
 */

export function getBatchSize(): number {
  return parseInt(process.env.DOWNLOAD_BATCH_SIZE || "0", 10);
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
    batchCompletedCount.value = 0;
    logs(itemId, `⏸️ [BATCH] Batch of ${batchSize} completed. Queue paused.`);
    console.log(
      `⏸️ [BATCH] Auto-pausing queue after ${batchSize} completed downloads.`,
    );
    return true;
  }

  return false;
}

export function getBatchCron(): string | null {
  const raw = process.env.DOWNLOAD_BATCH_CRON;
  if (!raw) return null;
  const expression = raw.trim().replace(/^["']|["']$/g, "");
  return cron.validate(expression) ? expression : null;
}

/**
 * Registers the DOWNLOAD_BATCH_CRON job that auto-resumes the queue.
 * Should be called once at server startup, alongside createSyncCronJob.
 */
export function createBatchCronJob(app: Express): void {
  const expression = getBatchCron();

  if (!expression) {
    if (process.env.DOWNLOAD_BATCH_CRON) {
      console.error(
        `❌ [BATCH] Invalid DOWNLOAD_BATCH_CRON expression: "${process.env.DOWNLOAD_BATCH_CRON}". Auto-resume disabled.`,
      );
    }
    return;
  }

  const timezone = process.env.TZ;
  const cronOptions = timezone ? { timezone } : undefined;

  cron.schedule(
    expression,
    () => {
      const { processingStack } = app.locals;
      if (processingStack.actions.getQueueStatus().isPaused) {
        console.log(`▶️ [BATCH] Cron triggered — resuming downloads.`);
        processingStack.actions.resumeQueue();
      }
    },
    cronOptions,
  );

  console.log(
    `✅ [BATCH] Batch cron scheduled: "${expression}" (timezone: ${timezone || "system"})`,
  );
}
