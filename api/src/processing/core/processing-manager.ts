import { Express, Response } from "express";

import { getAppInstance } from "../../helpers/app-instance";
import {
  addItemsToFile,
  addItemToFile,
  clearQueueFile,
  insertBeforeFirstQueued,
  loadQueueFromFile,
  removeItemFromFile,
  removeItemsFromFile,
  updateItemInQueueFile,
} from "../../helpers/queue_save_file";
import { addItemToHistory } from "../../services/history";
import { ProcessingItemType, ProcessingItemWithPlaylist } from "../../types";
import { cleanFolder, killProcess } from "../utils/jobs";
import { deletePlaylist } from "../utils/mix-to-playlist";

import { QueueManager } from "./queue-manager";

/**
 * Strip internal fields (like process handles) before sending to clients.
 * Exported so it can be reused in SSE routes.
 */
export function sanitizeProcessingData(
  data: (ProcessingItemType & { process?: unknown })[],
): ProcessingItemType[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return data.map(({ process, ...rest }) => rest);
}

function notifySSEConnections(
  app: Express,
  isPaused: boolean,
  batchCount: number,
  batchResumeAt: number | null,
) {
  const { processingStack, activeListConnections } = app.locals;

  const payload = JSON.stringify({
    items: sanitizeProcessingData(processingStack.data),
    isPaused,
    batchCount,
    batchResumeAt,
  });

  activeListConnections.forEach((conn: Response) => {
    conn.write(`data: ${payload}\n\n`);
  });
}

function notifyItemOutput(app: Express, itemId: string, output: string) {
  const connections: Map<string, Response[]> =
    app.locals.activeItemOutputConnections;
  // Ensure itemId is a string for Map lookup
  const itemIdString = String(itemId);
  const itemConnections = connections.get(itemIdString);

  if (itemConnections && itemConnections.length > 0) {
    const data = JSON.stringify({ id: itemIdString, output });
    itemConnections.forEach((conn: Response) => {
      try {
        conn.write(`data: ${data}\n\n`);
      } catch (error) {
        // Connection might be closed, will be cleaned up on 'close' event
        console.error(
          `Failed to send output to connection for item ${itemId}:`,
          error,
        );
      }
    });
  }
}

export const ProcessingStack = () => {
  const app: Express = getAppInstance();
  const data: ProcessingItemType[] = [];
  const dataMap: Map<string, ProcessingItemType> = new Map(); // O(1) item lookups
  const outputs: Map<string, string[]> = new Map(); // Store terminal output as array of lines

  // Create queue manager for handling parallel download/post-processing
  const queueManager = new QueueManager(
    data,
    app,
    outputs,
    updateItem,
    updateItemInQueueFile,
    () => notifySSE(),
  );

  function notifySSE() {
    notifySSEConnections(
      app,
      queueManager.isPausedState(),
      queueManager.getBatchCount(),
      queueManager.getBatchResumeAt(),
    );
  }

  async function loadDataFromFile() {
    if (process.env.NO_DOWNLOAD === "true") {
      queueManager.setPaused(true);
    }

    const records = await loadQueueFromFile();
    records.forEach((record) => {
      // Reset any items that were in-progress during a crash back to appropriate state
      if (
        record.status === "download" ||
        record.status === "queue" ||
        record.status === "processing" ||
        record.status === "queue_processing" ||
        (record.status as string) === "no_download"
      ) {
        record.status = "queue_download";
      }

      addItem(record);
    });

    if (!queueManager.isPausedState()) {
      queueManager.processQueue();
    }
  }

  function getItemOutput(id: string): string {
    // Ensure id is a string for Map lookup
    const idString = String(id);
    const history = outputs.get(idString) || [];
    return history.slice(-500).join("\n");
  }

  function addOutputLog(id: string, message: string, replaceLast?: boolean) {
    const idString = String(id);

    if (!outputs.has(idString)) {
      outputs.set(idString, []);
    }

    const outputArray = outputs.get(idString)!;

    if (replaceLast && outputArray.length > 0) {
      outputArray[outputArray.length - 1] = message;
    } else {
      outputArray.push(message);
    }

    notifyItemOutput(app, idString, getItemOutput(idString));
  }

  async function addItem(item: ProcessingItemType, insertAtFront?: boolean) {
    if (dataMap.has(item.id)) {
      await removeItem(item.id);
    }

    await addItemToFile(item, insertAtFront);

    if (insertAtFront) {
      insertBeforeFirstQueued(data, item);
    } else {
      data.push(item);
    }
    dataMap.set(item.id, item);

    queueManager.processQueue();

    notifySSE();
  }

  async function addItems(
    items: ProcessingItemType[],
    insertAtFront?: boolean,
  ) {
    const newItems = items.filter((item) => !dataMap.has(item.id));
    if (newItems.length === 0) return;

    await addItemsToFile(newItems, insertAtFront);

    if (insertAtFront) {
      insertBeforeFirstQueued(data, ...newItems);
    } else {
      data.push(...newItems);
    }
    for (const item of newItems) {
      dataMap.set(item.id, item);
    }

    queueManager.processQueue();
    notifySSE();
  }

  async function removeItem(id: string) {
    const item = dataMap.get(id);

    if (!item) {
      console.warn(`removeItem: Item ${id} not found in processing list`);
      return;
    }

    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );

    await removeItemFromFile(id);
    killProcess(item?.process, id);

    const playlistId = (item as ProcessingItemWithPlaylist).playlistId;
    if (playlistId) {
      deletePlaylist(playlistId, id);
    }

    delete data[foundIndex];
    data.splice(foundIndex, 1);
    dataMap.delete(id);

    outputs.delete(String(id));
    cleanFolder(item.id);

    queueManager.processQueue();

    notifySSE();
  }

  async function removeAllItems() {
    for (const item of [...data]) {
      killProcess(item?.process, item.id);
      const playlistId = (item as ProcessingItemWithPlaylist).playlistId;
      if (playlistId) deletePlaylist(playlistId, item.id);
      outputs.delete(String(item.id));
      cleanFolder(item.id);
    }
    data.length = 0;
    dataMap.clear();
    await clearQueueFile();
    notifySSE();
  }

  async function removeFinishedItems() {
    const itemsToRemove = data.filter((item) =>
      ["finished", "error"].includes(item.status),
    );
    const removeIds = new Set(itemsToRemove.map((item) => item.id));
    for (const item of itemsToRemove) {
      outputs.delete(String(item.id));
      dataMap.delete(item.id);
    }
    data.splice(
      0,
      data.length,
      ...data.filter((item) => !removeIds.has(item.id)),
    );
    await removeItemsFromFile([...removeIds]);
    notifySSE();
  }

  function updateItem(item: ProcessingItemType) {
    if (item?.status === "finished" || item?.status === "error") {
      // Add item to history (if enabled)
      addItemToHistory(item.id);

      queueManager.processQueue();
    }

    notifySSE();

    const currentOutput = getItemOutput(item.id);
    if (currentOutput) {
      notifyItemOutput(app, item.id, currentOutput);
    }
  }

  function getItem(id: string): ProcessingItemType {
    // O(1) lookup using Map instead of O(n) findIndex
    return dataMap.get(id) as ProcessingItemType;
  }

  async function singleDownload(id: string) {
    const item = dataMap.get(id);

    if (
      !item ||
      !["queue_download", "error", "finished"].includes(item.status)
    ) {
      throw new Error(`Item ${id} cannot be individually downloaded`);
    }

    item.status = "queue_download";
    await updateItemInQueueFile(item);
    await queueManager.prepareDownload(item);
    queueManager.startDownload(item);

    notifySSE();
  }

  async function pauseQueue() {
    queueManager.setPaused(true);

    const downloadingItem = data.find((item) => item.status === "download");

    if (downloadingItem) {
      await killProcess(downloadingItem.process, downloadingItem.id);

      // Clean up temporary playlist — will be recreated on resume
      const playlistId = (downloadingItem as ProcessingItemWithPlaylist)
        .playlistId;
      if (playlistId) {
        deletePlaylist(playlistId, downloadingItem.id);
        delete (downloadingItem as ProcessingItemWithPlaylist).playlistId;
      }

      downloadingItem.status = "queue_download";
      delete downloadingItem.process;

      outputs.set(String(downloadingItem.id), []);

      await Promise.all([
        updateItemInQueueFile(downloadingItem),
        cleanFolder(downloadingItem.id),
      ]);

      updateItem(downloadingItem);
    }

    notifySSE();
  }

  function resumeQueue() {
    if (process.env.NO_DOWNLOAD === "true") return;
    queueManager.setPaused(false);
    queueManager.processQueue();
    queueManager.resetBatchCount();
    notifySSE();
  }

  function resetBatchCount() {
    queueManager.resetBatchCount();
    notifySSE();
  }

  function getQueueStatus() {
    return {
      isPaused: queueManager.isPausedState(),
      batchCount: queueManager.getBatchCount(),
      batchResumeAt: queueManager.getBatchResumeAt(),
    };
  }

  // Expose addOutputLog for use by services
  app.locals.addOutputLog = addOutputLog;

  return {
    data,
    actions: {
      addItem,
      addItems,
      removeItem,
      removeAllItems,
      removeFinishedItems,
      updateItem,
      getItem,
      processQueue: () => queueManager.processQueue(),
      loadDataFromFile,
      getItemOutput,
      addOutputLog,
      singleDownload,
      pauseQueue,
      resumeQueue,
      getQueueStatus,
      resetBatchCount,
    },
  };
};
