import { getAppInstance } from "../helpers/app-instance";
import { historyDb } from "../services/db-json";
import { HistoryItem, ProcessingItemType } from "../types";

const QUEUE_PATH = "/";

export async function loadHistoryFromFile(): Promise<HistoryItem[]> {
  if (process.env.ENABLE_HISTORY !== "true") {
    return [];
  }

  try {
    const data = await historyDb.getData(QUEUE_PATH);
    console.log("✅ [HISTORY] Processing history loaded.");
    // Convert numeric-keyed object to array of values
    return Array.isArray(data) ? data : Object.values(data);
  } catch {
    // Database doesn't exist yet or path not found, initialize with empty array
    await historyDb.push(QUEUE_PATH, []);
    return [];
  }
}

export async function addItemToHistory(item: ProcessingItemType) {
  if (process.env.ENABLE_HISTORY !== "true") {
    return;
  }

  const app = getAppInstance();
  const id = String(item.id);

  if (app.locals.historySet.has(id)) {
    return;
  }

  const historyItem: HistoryItem = {
    id,
    type: item.type,
    title: item.title,
    artist: item.artist,
  };

  app.locals.history.push(historyItem);
  app.locals.historySet.add(id);

  const newIndex = app.locals.history.length - 1;
  await historyDb.push(`/${newIndex}`, historyItem, false);
  console.log(`✅ [HISTORY] Item "${id}" added to history.`);
}

export async function flushHistory() {
  if (process.env.ENABLE_HISTORY !== "true") {
    return;
  }

  const app = getAppInstance();
  app.locals.history = [];
  app.locals.historySet.clear();

  await historyDb.push(QUEUE_PATH, []);

  console.log("🚽 [HISTORY] History has been flushed.");
}
