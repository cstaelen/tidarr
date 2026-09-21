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

// Returns a copy with transient fields stripped, without mutating `item`
// (same reference as processing-manager.ts's in-memory data).
function cleanItemBeforeSave(item: ProcessingItemType): ProcessingItemType {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { process, progress, retryCount, networkError, skipped, ...rest } =
    item;

  return rest as ProcessingItemType;
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

export const addItemToFile = (
  item: ProcessingItemType,
  insertAtFront?: boolean,
) => addItemsToFile([item], insertAtFront);

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

export const removeItemFromFile = (id: string) => removeItemsFromFile([id]);

export const updateItemsInQueueFile = async (items: ProcessingItemType[]) => {
  const saveList = await loadQueueFromFile();

  const updatesById = new Map(
    items
      .filter((item) => {
        const exists = queueCacheMap?.has(item.id);
        if (!exists) {
          // Item not found - it may have been removed already (e.g., auto-remove
          // finished items). This is not an error, just skip the update.
          console.log(
            `[QUEUE] Item ${item.id} not found in queue file - may have been removed already`,
          );
        }
        return exists;
      })
      .map((item) => [item.id, cleanItemBeforeSave(item)]),
  );

  if (updatesById.size === 0) return;

  for (let i = 0; i < saveList.length; i++) {
    const update = updatesById.get(saveList[i].id);
    if (update) {
      saveList[i] = { ...update };
      queueCacheMap?.set(update.id, update);
    }
  }

  queueCache = saveList;

  await queueDb.push(QUEUE_PATH, saveList);
};

export const updateItemInQueueFile = (item: ProcessingItemType) =>
  updateItemsInQueueFile([item]);
