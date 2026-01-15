import { getAppInstance } from "../../helpers/app-instance";

import { stripAnsiCodes } from "./ansi-parse";

/**
 * Logs a message for a processing item.
 * - Strips ANSI codes from the message
 * - Logs to console (unless skipConsole is true)
 * - Sends to SSE output connections via app.locals.addOutputLog
 *
 * @param itemId - The processing item ID
 * @param message - The message to log
 * @param options - Optional configuration
 * @param options.replaceLast - Replace the last log entry instead of appending
 * @param options.skipConsole - Skip console.log output
 */
export function logs(
  itemId: string,
  message: string,
  options?: {
    replaceLast?: boolean;
    skipConsole?: boolean;
  },
) {
  if (!itemId || !message) return;

  // Strip ANSI codes before sending to output
  const cleanMessage = stripAnsiCodes(message);

  // Log to console unless explicitly skipped
  if (!options?.skipConsole) {
    console.log(cleanMessage);
  }

  // Send to SSE output connections
  try {
    const app = getAppInstance();
    const addOutputLog = app.locals.addOutputLog;
    if (addOutputLog) {
      addOutputLog(itemId, cleanMessage, options?.replaceLast);
    }
  } catch {
    // App instance not yet initialized (can happen during startup)
    // Just skip SSE output in this case
  }
}
