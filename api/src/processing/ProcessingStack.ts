import { Express, Response } from "express";

import { PROCESSING_PATH } from "../../constants";
import { logs } from "../helpers/logs";
import {
  addItemToFile,
  loadQueueFromFile,
  removeItemFromFile,
  updateItemInQueueFile,
} from "../helpers/queue_save_file";
import { appriseApiPush } from "../services/apprise-api";
import { beets } from "../services/beets";
import { gotifyPush } from "../services/gotify";
import { jellyfinUpdate } from "../services/jellyfin";
import { plexUpdate } from "../services/plex";
import { hookPushOver } from "../services/pushover";
import { tidalDL } from "../services/tiddl";
import { ProcessingItemType, TiddlConfig } from "../types";

import {
  cleanFolder,
  executeCustomScript,
  getFolderToScan,
  hasFileToMove,
  killProcess,
  moveAndClean,
  replacePathInM3U,
  setPermissions,
} from "./jobs";
import {
  addTracksToPlaylist,
  createNewPlaylist,
  deletePlaylist,
  getTracksByMixId,
} from "./mix-to-playlist";

export function notifySSEConnections(expressApp: Express) {
  const { processingStack, activeListConnections } = expressApp.locals;

  // Data no longer contains output/output_history, send directly
  const data = JSON.stringify(processingStack.data);

  activeListConnections.forEach((conn: Response) => {
    conn.write(`data: ${data}\n\n`);
  });
}

export function notifyItemOutput(
  expressApp: Express,
  itemId: string,
  output: string,
) {
  const connections: Map<string, Response[]> =
    expressApp.locals.activeItemOutputConnections;
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

export const ProcessingStack = (expressApp: Express) => {
  const data: ProcessingItemType[] = [];
  const outputs: Map<string, string[]> = new Map(); // Store terminal output as array of lines
  let isPaused = false;

  async function loadDataFromFile() {
    const records = await loadQueueFromFile();
    records.forEach((record) => {
      // Reset any items that were "processing" during a crash back to "queue"
      if (record.status === "processing") {
        record.status = "queue";
      }

      // Initialize empty output history for each loaded item (ensure string key)
      outputs.set(String(record.id), []);
      data.push(record);
    });

    if (!isPaused) {
      processQueue();
    }
  }

  function getItemOutput(id: string): string {
    // Ensure id is a string for Map lookup
    const idString = String(id);
    const history = outputs.get(idString) || [];
    return history.slice(-500).join("\n");
  }

  function addOutputLog(id: string, message: string, replaceLast?: boolean) {
    // Ensure id is a string for Map storage
    const idString = String(id);
    if (!outputs.has(idString)) {
      outputs.set(idString, []);
    }

    const outputArray = outputs.get(idString);
    if (outputArray) {
      if (replaceLast && outputArray.length > 0) {
        // Replace the last output instead of pushing
        outputArray[outputArray.length - 1] = message;
      } else {
        // Push new message
        outputArray.push(message);
      }
    }

    // Notify connected clients about the output update
    const currentOutput = getItemOutput(idString);
    notifyItemOutput(expressApp, id, currentOutput);
  }

  async function addItem(item: ProcessingItemType) {
    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );
    if (foundIndex !== -1) return;

    data.push(item);

    await addItemToFile(item);
    processQueue();

    notifySSEConnections(expressApp);
  }

  async function removeItem(id: string) {
    const item = getItem(id);

    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );

    if (foundIndex === -1) {
      console.warn(`removeItem: Item ${id} not found in processing list`);
      return;
    }

    // Kill the process if it exists and is running
    killProcess(item?.process, id);
    delete data[foundIndex];
    data.splice(foundIndex, 1);

    // Clean up output history for this item (ensure string key)
    outputs.delete(String(id));
    cleanFolder(item.id);

    await removeItemFromFile(id);
    processQueue();

    notifySSEConnections(expressApp);
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
      ["finished", "downloaded", "error"].includes(item.status),
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
    if (item?.status === "downloaded") {
      try {
        postProcessing(item);
      } catch (error) {
        // Catch any unhandled errors in postProcessing to prevent silent failures
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logs(
          item.id,
          `❌ [TIDARR] Unexpected error during post-processing: ${errorMessage}`,
        );
        console.error(
          `❌ [TIDARR] Post-processing error for item ${item.id}:`,
          error,
        );
        item["status"] = "error";
        // Update the item in the queue file to reflect error status
        updateItemInQueueFile(item).catch((err) =>
          console.error(
            `❌ [TIDARR] Failed to update queue file for item ${item.id}:`,
            err,
          ),
        );
      }
    }
    if (item?.status === "finished" || item?.status === "error") {
      processQueue();
    }

    // Notify list connections about status changes (without output data)
    notifySSEConnections(expressApp);

    // Notify item-specific output connections with the latest output
    const currentOutput = getItemOutput(item.id);
    if (currentOutput) {
      notifyItemOutput(expressApp, item.id, currentOutput);
    }
  }

  function getItem(id: string): ProcessingItemType {
    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === id,
    );
    return data[foundIndex];
  }

  function processQueue(): void {
    if (isPaused) return;

    const indexCurrent = data.findIndex(
      (item: ProcessingItemType) => item.status === "processing",
    );
    const indexNext = data.findIndex(
      (item: ProcessingItemType) => item.status === "queue",
    );

    if (indexCurrent !== -1) return;
    if (indexNext !== -1) {
      processItem(data[indexNext]);
    }
  }

  async function pauseQueue() {
    isPaused = true;

    // Find the item currently being processed
    const currentItem = data.find((item) => item.status === "processing");

    if (currentItem) {
      // Kill the process if it exists and is running
      await killProcess(currentItem.process, currentItem.id);

      // Clean up files
      cleanFolder(currentItem.id);

      // Clean up outputs
      outputs.delete(String(currentItem.id));
      outputs.set(String(currentItem.id), []);

      // Reset the item to queue status
      currentItem.status = "queue";
      delete currentItem.process;

      updateItem(currentItem);

      // Persist the change to the queue file
      await updateItemInQueueFile(currentItem);

      // Clean the incomplete folder for this item
      await cleanFolder(currentItem.id);
    }

    notifySSEConnections(expressApp);
  }

  function resumeQueue() {
    isPaused = false;
    processQueue(); // Restart the queue
    notifySSEConnections(expressApp);
  }

  function getQueueStatus() {
    return { isPaused };
  }

  async function processingMix(item: ProcessingItemType) {
    const config = expressApp.locals.tiddlConfig as TiddlConfig;

    const tracks = await getTracksByMixId(item, config);
    const playlistId = await createNewPlaylist(item, config);

    if (tracks) {
      await addTracksToPlaylist(playlistId, tracks, config, item.id);

      item["url"] = `playlist/${playlistId}`;
      logs(item.id, `🕖 [MIX]: Download temporary playlist`);

      const child = tidalDL(item.id, expressApp, () => {
        deletePlaylist(playlistId, config, item.id);
      });
      if (child) {
        item["process"] = child;
      }

      return;
    } else {
      logs(item.id, `⚠️ [MIX]: No track found.`);
      item["status"] = "error";
      updateItem(item);
    }

    deletePlaylist(playlistId, config, item.id);
  }

  async function processItem(item: ProcessingItemType) {
    item["status"] = "processing";
    // Initialize empty output history in the Map (ensure string key)
    outputs.set(String(item.id), []);
    updateItem(item);

    await cleanFolder(item.id);

    if (item.type === "mix") {
      processingMix(item);
    } else {
      const child = tidalDL(item.id, expressApp);
      if (child) {
        item["process"] = child;
      }
    }
  }

  async function postProcessing(item: ProcessingItemType) {
    const shouldPostProcess = hasFileToMove(`${PROCESSING_PATH}/${item.id}`);

    logs(item.id, "---------------------");
    logs(item.id, "⚙️ POST PROCESSING   ");
    logs(item.id, "---------------------");

    if (!shouldPostProcess) {
      item["status"] = "finished";
      updateItem(item);
      logs(item.id, "✅ [TIDARR] No file to process.");

      // Remove item from persistant queue file
      await updateItemInQueueFile(item);

      return;
    }

    if (item["status"] === "error") {
      logs(item.id, "⚠️ [TIDDL] An error occured while downloading.");
      return;
    }

    if (item["type"] === "playlist" || item["type"] === "mix") {
      replacePathInM3U(item);
    }

    // Beets process
    await beets(item.id);

    // Set permissions
    await setPermissions(item);

    // Execute custom script if exists
    await executeCustomScript(item);

    // Keep trace of folders processed
    const foldersToScan = getFolderToScan(item.id);

    // Move to output folder
    await moveAndClean(item.id);

    // Plex library update with specific paths
    await plexUpdate(item, foldersToScan);

    // Jellyfin library update
    await jellyfinUpdate(item);

    // Gotify notification
    await gotifyPush(item);

    // Webhook push over notification
    await hookPushOver(item);

    // Apprise API notification
    await appriseApiPush(item);

    logs(item.id, "---------------------");
    logs(item.id, "✅ [TIDARR] Post processing complete.");
    item["status"] = "finished";

    // Remove item from persistant queue file
    await updateItemInQueueFile(item);

    // Update item status
    updateItem(item);
  }

  return {
    data,
    actions: {
      addItem,
      removeItem,
      removeAllItems,
      removeFinishedItems,
      updateItem,
      getItem,
      processQueue,
      loadDataFromFile,
      getItemOutput,
      addOutputLog,
      pauseQueue,
      resumeQueue,
      getQueueStatus,
    },
  };
};
