import { Express, Response } from "express";

import { getAppInstance } from "../../helpers/app-instance";
import {
  addItemToFile,
  loadQueueFromFile,
  removeItemFromFile,
  updateItemInQueueFile,
} from "../../helpers/queue_save_file";
import { addItemToHistory } from "../../services/history";
import { ProcessingItemType } from "../../types";
import { cleanFolder, killProcess } from "../utils/jobs";

import { QueueManager } from "./queue-manager";

export function notifySSEConnections(app: Express) {
  const { processingStack, activeListConnections } = app.locals;

  // Data no longer contains output/output_history, send directly
  const data = JSON.stringify(processingStack.data);

  activeListConnections.forEach((conn: Response) => {
    conn.write(`data: ${data}\n\n`);
  });
}

export function notifyItemOutput(app: Express, itemId: string, output: string) {
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
  );

  async function loadDataFromFile() {
    const records = await loadQueueFromFile();
    records.forEach((record) => {
      // Reset any items that were in-progress during a crash back to appropriate state
      if (record.status === "download") {
        record.status = "queue_download";
      }
      if (record.status === "processing") {
        record.status = "queue_processing";
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

  async function addItem(item: ProcessingItemType) {
    const noDownloadMode = process.env?.NO_DOWNLOAD === "true";

    // O(1) lookup using Map instead of O(n) findIndex
    if (dataMap.has(item.id)) {
      await removeItem(item.id);
    }

    await addItemToFile(item);

    if (noDownloadMode) {
      item["status"] = "no_download";
      item["loading"] = false;
    }

    data.push(item);
    dataMap.set(item.id, item);

    if (!noDownloadMode) {
      queueManager.processQueue();
    }

    notifySSEConnections(app);
  }

  async function removeItem(id: string) {
    // O(1) lookup using Map
    const item = dataMap.get(id);

    if (!item) {
      console.warn(`removeItem: Item ${id} not found in processing list`);
      return;
    }

    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );

    // Remove in queue file
    await removeItemFromFile(id);

    // Kill the process if it exists and is running
    killProcess(item?.process, id);

    delete data[foundIndex];
    data.splice(foundIndex, 1);
    dataMap.delete(id);

    // Clean up output history for this item (ensure string key)
    outputs.delete(String(id));
    cleanFolder(item.id);

    queueManager.processQueue();

    notifySSEConnections(app);
  }

  async function removeAllItems() {
    const itemsToRemove = [...data]; // Copie immutable
    for (const item of itemsToRemove) {
      try {
        await removeItem(item.id);
      } catch (error) {
        console.error(`Failed to remove item ${item.id}:`, error);
      }
    }
  }

  async function removeFinishedItems() {
    const itemsToRemove = data.filter((item) =>
      ["finished", "error"].includes(item.status),
    );
    for (const item of itemsToRemove) {
      try {
        await removeItem(item.id);
      } catch (error) {
        console.error(`Failed to remove item ${item.id}:`, error);
      }
    }
  }

  function updateItem(item: ProcessingItemType) {
    if (item?.status === "finished" || item?.status === "error") {
      // Add item to history (if enabled)
      addItemToHistory(item.id);

      queueManager.processQueue();
    }

    // Notify list connections about status changes (without output data)
    notifySSEConnections(app);

    // Notify item-specific output connections with the latest output
    const currentOutput = getItemOutput(item.id);
    if (currentOutput) {
      notifyItemOutput(app, item.id, currentOutput);
    }
  }

  function getItem(id: string): ProcessingItemType {
    // O(1) lookup using Map instead of O(n) findIndex
    return dataMap.get(id) as ProcessingItemType;
  }

  async function pauseQueue() {
    queueManager.setPaused(true);

    const downloadingItem = data.find((item) => item.status === "download");

    if (downloadingItem) {
      await killProcess(downloadingItem.process, downloadingItem.id);
      downloadingItem.status = "queue_download";
      delete downloadingItem.process;

      outputs.set(String(downloadingItem.id), []);

      await Promise.all([
        updateItemInQueueFile(downloadingItem),
        cleanFolder(downloadingItem.id),
      ]);

      updateItem(downloadingItem);
    }

    notifySSEConnections(app);
  }

  function resumeQueue() {
    queueManager.setPaused(false);
    queueManager.processQueue(); // Restart the queue
    notifySSEConnections(app);
  }

  function getQueueStatus() {
    return { isPaused: queueManager.isPausedState() };
  }

  // Expose addOutputLog for use by services
  app.locals.addOutputLog = addOutputLog;

  return {
    data,
    actions: {
      addItem,
      removeItem,
      removeAllItems,
      removeFinishedItems,
      updateItem,
      getItem,
      processQueue: () => queueManager.processQueue(),
      loadDataFromFile,
      getItemOutput,
      addOutputLog,
      pauseQueue,
      resumeQueue,
      getQueueStatus,
    },
  };
};
