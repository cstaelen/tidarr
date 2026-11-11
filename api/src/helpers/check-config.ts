export function checkConfig() {
  if (process.env.GUEST_PASSWORD && !process.env.ADMIN_PASSWORD) {
    console.error(
      "❌ [CONFIG] GUEST_PASSWORD requires ADMIN_PASSWORD, otherwise Tidarr stays fully public. Guest access is disabled.",
    );
  }

  if (process.env.DOWNLOAD_BATCH_CRON) {
    console.error(
      "❌ [CONFIG] DOWNLOAD_BATCH_CRON is no longer supported. Please use DOWNLOAD_BATCH_DELAY (delay in minutes) instead.",
    );
    process.exit(1);
  }
}
