import { queueDb } from "../services/db-json";
import { addItemToHistory } from "../services/history";
import { ProcessingItemType } from "../types";

const QUEUE_PATH = "/";

// In-memory cache to avoid disk reads
let queueCache: ProcessingItemType[] | null = null;
let queueCacheMap: Map<string, ProcessingItemType> | null = null;

/**
 * Load queue from file (only on first call, then uses cache)
 */
export async function loadQueueFromFile(): Promise<ProcessingItemType[]> {
  // Return cache if available
  if (queueCache !== null) {
    return queueCache;
  }

  // First load: read from disk
  try {
    const data = await queueDb.getData(QUEUE_PATH);
    queueCache = Array.isArray(data) ? data : [];
    // Build Map for O(1) lookups
    queueCacheMap = new Map(queueCache.map((item) => [item.id, item]));
    return queueCache;
  } catch {
    // Database doesn't exist yet or path not found, initialize with empty array
    await queueDb.push(QUEUE_PATH, []); // auto-saves with saveOnPush=true
    queueCache = [];
    queueCacheMap = new Map();
    return queueCache;
  }
}

export const addItemToFile = async (item: ProcessingItemType) => {
  const saveList = await loadQueueFromFile();
  delete item.process;
  saveList.push(item);

  // Update cache
  queueCache = saveList;
  queueCacheMap?.set(item.id, item);

  // Write to disk (auto-saves with saveOnPush=true)
  await queueDb.push(QUEUE_PATH, saveList);
};

export const removeItemFromFile = async (id: string) => {
  const saveList = await loadQueueFromFile();
  const filteredList = saveList.filter((item) => item.id !== id);

  // Update cache
  queueCache = filteredList;
  queueCacheMap?.delete(id);

  // Write to disk (auto-saves with saveOnPush=true)
  await queueDb.push(QUEUE_PATH, filteredList);
};

export const updateItemInQueueFile = async (item: ProcessingItemType) => {
  const saveList = await loadQueueFromFile();

  // O(1) lookup using Map instead of O(n) findIndex
  if (!queueCacheMap?.has(item.id)) {
    // Item not found - it may have been removed already (e.g., auto-remove finished items)
    // This is not an error, just skip the update
    console.log(
      `[QUEUE] Item ${item.id} not found in queue file - may have been removed already`,
    );
    return;
  }

  const itemIndex = saveList.findIndex((current) => current.id === item.id);

  delete item.process;

  // If item is finished, move it to history
  if (item.status === "finished" && process.env.ENABLE_HISTORY === "true") {
    // Add to history
    await addItemToHistory(item.id);
    console.log(`[QUEUE] Item ${item.id} moved to history`);
  }

  // Keep in queue, just update
  saveList[itemIndex] = { ...item };

  // Update cache
  queueCache = saveList;
  queueCacheMap?.set(item.id, item);

  // Write to disk (auto-saves with saveOnPush=true)
  await queueDb.push(QUEUE_PATH, saveList);
};
