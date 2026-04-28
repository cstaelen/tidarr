export function checkConfig() {
  if (process.env.DOWNLOAD_BATCH_CRON) {
    console.error(
      "❌ [CONFIG] DOWNLOAD_BATCH_CRON is no longer supported. Please use DOWNLOAD_BATCH_DELAY (delay in minutes) instead.",
    );
    process.exit(1);
  }
}
