import { getAppInstance } from "../app-instance";
import { historyDb } from "../services/db-json";

const QUEUE_PATH = "/";

export async function loadHistoryFromFile(): Promise<string[]> {
  if (process.env.ENABLE_HISTORY !== "true") {
    return [];
  }

  try {
    const data = await historyDb.getData(QUEUE_PATH);
    console.log("✅ [HISTORY] Processing history loaded.");
    return Array.isArray(data) ? data : [];
  } catch {
    // Database doesn't exist yet or path not found, initialize with empty array
    await historyDb.push(QUEUE_PATH, []);
    return [];
  }
}

export async function addItemToHistory(itemId: string) {
  if (process.env.ENABLE_HISTORY !== "true") {
    return;
  }

  const app = getAppInstance();
  const id = itemId.toString();

  // If existing in history -> skip
  if (app.locals.history.includes(id)) {
    return;
  }

  app.locals.history.push(id);

  // Write only the new item at the end of the array (more efficient than rewriting entire file)
  const newIndex = app.locals.history.length - 1;
  await historyDb.push(`/${newIndex}`, id, false);
  console.log(`✅ [HISTORY] Item "${id}" added to history.`);
}

export async function flushHistory() {
  if (process.env.ENABLE_HISTORY !== "true") {
    return;
  }

  const app = getAppInstance();
  app.locals.history = [];

  await historyDb.push(QUEUE_PATH, []);

  console.log("🚽 [HISTORY] History has been flushed.");
}
