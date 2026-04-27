import { queueDb } from "../services/db-json";
import { ProcessingItemType } from "../types";

const QUEUE_PATH = "/";

export function insertBeforeFirstQueued<T extends { status: string }>(
  list: T[],
  ...items: T[]
): void {
  const firstQueueIndex = list.findIndex((i) => i.status === "queue_download");
  if (firstQueueIndex !== -1) {
    list.splice(firstQueueIndex, 0, ...items);
  } else {
    list.push(...items);
  }
}

function cleanItemBeforeSave(item: ProcessingItemType): ProcessingItemType {
  delete item.process;
  delete item.progress;
  delete item.retryCount;
  delete item.networkError;
  delete item.skipped;

  return item;
}

// In-memory cache to avoid disk reads
let queueCache: ProcessingItemType[] | null = null;
let queueCacheMap: Map<string, ProcessingItemType> | null = null;

/**
 * Load queue from file (only on first call, then uses cache)
 */
export async function loadQueueFromFile(): Promise<ProcessingItemType[]> {
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
    await queueDb.push(QUEUE_PATH, []);
    queueCache = [];
    queueCacheMap = new Map();
    return queueCache;
  }
}

export const addItemToFile = async (
  item: ProcessingItemType,
  insertAtFront?: boolean,
) => {
  const saveList = await loadQueueFromFile();

  // Check if item with this ID already exists
  if (queueCacheMap?.has(item.id)) {
    return;
  }

  item = cleanItemBeforeSave(item);

  if (insertAtFront) {
    insertBeforeFirstQueued(saveList, item);
  } else {
    saveList.push(item);
  }

  queueCache = saveList;
  queueCacheMap?.set(item.id, item);

  // Write to disk (auto-saves with saveOnPush=true)
  await queueDb.push(QUEUE_PATH, saveList);
};

export const addItemsToFile = async (
  items: ProcessingItemType[],
  insertAtFront?: boolean,
) => {
  const saveList = await loadQueueFromFile();

  const newItems = items
    .filter((item) => !queueCacheMap?.has(item.id))
    .map((item) => cleanItemBeforeSave(item));

  if (newItems.length === 0) return;

  if (insertAtFront) {
    insertBeforeFirstQueued(saveList, ...newItems);
  } else {
    saveList.push(...newItems);
  }

  queueCache = saveList;
  for (const item of newItems) {
    queueCacheMap?.set(item.id, item);
  }

  await queueDb.push(QUEUE_PATH, saveList);
};

export const clearQueueFile = async () => {
  queueCache = [];
  queueCacheMap = new Map();
  await queueDb.push(QUEUE_PATH, []);
};

export const removeItemsFromFile = async (ids: string[]) => {
  const saveList = await loadQueueFromFile();
  const idSet = new Set(ids);
  const filteredList = saveList.filter((item) => !idSet.has(item.id));
  queueCache = filteredList;
  for (const id of ids) queueCacheMap?.delete(id);
  await queueDb.push(QUEUE_PATH, filteredList);
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

  item = cleanItemBeforeSave(item);

  // Keep in queue, just update
  saveList[itemIndex] = { ...item };

  // Update cache
  queueCache = saveList;
  queueCacheMap?.set(item.id, item);

  // Write to disk (auto-saves with saveOnPush=true)
  await queueDb.push(QUEUE_PATH, saveList);
};
