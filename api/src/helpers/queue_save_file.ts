import { queueDb } from "../services/db-json";
import { ProcessingItemType } from "../types";

const QUEUE_PATH = "/";

export async function loadQueueFromFile(): Promise<ProcessingItemType[]> {
  try {
    const data = await queueDb.getData(QUEUE_PATH);
    return Array.isArray(data) ? data : [];
  } catch {
    // Database doesn't exist yet or path not found, initialize with empty array
    await queueDb.push(QUEUE_PATH, []);
    return [];
  }
}

export const addItemToFile = async (item: ProcessingItemType) => {
  const saveList = await loadQueueFromFile();
  saveList.push(item);
  await queueDb.push(QUEUE_PATH, saveList);
};

export const removeItemFromFile = async (id: string) => {
  const saveList = await loadQueueFromFile();
  const filteredList = saveList.filter((item) => item.id !== id);
  await queueDb.push(QUEUE_PATH, filteredList);
};

export const updateItemInQueueFile = async (item: ProcessingItemType) => {
  const saveList = await loadQueueFromFile();
  const itemIndex = saveList.findIndex((current) => current.id === item.id);

  if (itemIndex === -1) {
    throw new Error(`Item with id ${item.id} not found in queue`);
  }

  delete item.process;
  saveList[itemIndex] = { ...item };
  await queueDb.push(QUEUE_PATH, saveList);
};
