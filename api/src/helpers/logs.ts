import { Express } from "express";

import { LogType, ProcessingItemType } from "../types";

import { stripAnsiCodes } from "./ansi_parse";

export function logs(
  item: ProcessingItemType | LogType,
  message: string,
  expressApp?: Express,
  replaceLast?: boolean,
  noConsoleLog?: boolean,
) {
  if (!item) return message;
  if (!message) return "";

  // Strip ANSI codes before sending to output
  const cleanMessage = stripAnsiCodes(message);

  // Only console.log non-replaceLast messages (and cleaned)
  if (!noConsoleLog) console.log(cleanMessage);

  if (expressApp && "id" in item) {
    const addOutputLog = expressApp.settings.addOutputLog;
    if (addOutputLog) {
      addOutputLog(item.id, cleanMessage, replaceLast);
    }
  }
}
