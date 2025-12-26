import { Express, Response } from "express";

import { getAppInstance } from "../helpers/app-instance";
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
import { ntfyPush } from "../services/ntfy";
import {
  clearPlaylistProgress,
  getCompletedTrackCount,
} from "../services/playlist-progress";
import { plexUpdate } from "../services/plex";
import { hookPushOver } from "../services/pushover";
import { tidalDL } from "../services/tiddl";
import { ProcessingItemType } from "../types";

import {
  cleanFolder,
  executeCustomScript,
  getFolderToScan,
  getProcessingPath,
  hasFileToMove,
  killProcess,
  moveAndClean,
  replacePathInM3U,
  setPermissions,
} from "./jobs";
import { logs } from "./logs";
import {
  addTracksToPlaylist,
  createNewPlaylist,
  deletePlaylist,
  getTracksByMixId,
} from "./mix-to-playlist";

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
  let isPaused = false;

  async function loadDataFromFile() {
    const records = await loadQueueFromFile();
    records.forEach((record) => {
      // Reset any items that were "processing" during a crash back to "queue"
      if (record.status === "processing") {
        record.status = "queue";
      }

      addItem(record);
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
    notifyItemOutput(app, id, currentOutput);
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
      processQueue();
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

    // Clear playlist progress tracking
    if (item.type === "playlist" || item.type === "album") {
      await clearPlaylistProgress(item.id);
    }

    delete data[foundIndex];
    data.splice(foundIndex, 1);
    dataMap.delete(id);

    // Clean up output history for this item (ensure string key)
    outputs.delete(String(id));
    cleanFolder(item.id);

    processQueue();

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
      processQueue();
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

  async function prepareProcessing(item: ProcessingItemType) {
    item["status"] = "processing";
    updateItem(item);

    // Initialize empty output history in the Map (ensure string key)
    outputs.set(String(item.id), []);

    // Check if this is a retry OR if there's existing progress from previous attempt
    const isRetry = (item.retryCount || 0) > 0;
    const hasPartialSuccess = item.downloadedCount && item.downloadedCount > 0;

    // Also check persistent storage for any completed tracks
    const persistedCount = await getCompletedTrackCount(item.id);
    const hasPersistedProgress = persistedCount > 0;

    // Don't clean if we have any progress (retry, partial, or persisted)
    if (isRetry || hasPartialSuccess || hasPersistedProgress) {
      const count = persistedCount || item.downloadedCount || 0;
      logs(
        item.id,
        `🔄 [RESUME] Keeping ${count} already downloaded files, will skip existing`,
      );
    } else {
      await cleanFolder(item.id);
    }
  }

  async function processQueue(): Promise<void> {
    if (isPaused) return;

    const indexCurrent = data.findIndex(
      (item: ProcessingItemType) => item.status === "processing",
    );
    const indexNext = data.findIndex(
      (item: ProcessingItemType) => item.status === "queue",
    );

    if (indexCurrent !== -1) return;
    if (indexNext !== -1) {
      const item = data[indexNext];
      await prepareProcessing(item);
      processItem(item);
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

    notifySSEConnections(app);
  }

  function resumeQueue() {
    isPaused = false;
    processQueue(); // Restart the queue
    notifySSEConnections(app);
  }

  function getQueueStatus() {
    return { isPaused };
  }

  async function prepareMixToPlaylist(
    item: ProcessingItemType,
  ): Promise<string | undefined> {
    const tracks = await getTracksByMixId(item);
    const playlistId = await createNewPlaylist(item);

    if (tracks) {
      await addTracksToPlaylist(playlistId, tracks, item.id);
      return playlistId;
    }

    logs(item.id, `⚠️ [MIX]: No track found.`);
    item["status"] = "error";
    item["loading"] = false;
    updateItem(item);
    deletePlaylist(playlistId, item.id);
  }

  async function processItem(item: ProcessingItemType) {
    let playlistId;
    if (item.type === "mix") {
      const playlistId = await prepareMixToPlaylist(item);
      item["url"] = `playlist/${playlistId}`;
      if (!playlistId) {
        return;
      }
    }

    const child = tidalDL(item.id, app, async () => {
      if (playlistId) deletePlaylist(playlistId, item.id);
      postProcessing(item);
      return;
    });

    if (child) {
      item["process"] = child;
    }
  }

  async function postProcessing(item: ProcessingItemType) {
    logs(item.id, "---------------------");
    logs(item.id, "⚙️ POST PROCESSING   ");
    logs(item.id, "---------------------");

    if (item["status"] === "error") {
      logs(item.id, "⚠️ [TIDDL] An error occured while downloading.");

      // Initialize retry tracking
      const retryCount = item.retryCount || 0;
      const maxRetries = item.maxRetries || 3;
      const hasPartialSuccess = item.downloadedCount && item.downloadedCount > 0;

      // If we have partial success, tiddl's skip_existing will resume
      if (retryCount < maxRetries) {
        logs(
          item.id,
          `🔄 [RETRY] Retrying download (attempt ${retryCount + 1}/${maxRetries})`,
        );

        if (hasPartialSuccess) {
          logs(
            item.id,
            `✅ [RETRY] ${item.downloadedCount}/${item.totalCount} tracks already downloaded, will skip existing`,
          );
        }

        // Increment retry count and reset to queue
        item.retryCount = retryCount + 1;
        item.status = "queue";
        item.error = false;
        item.loading = false;

        // Don't clean the processing folder - keep downloaded files
        // tiddl's skip_existing setting will skip already downloaded tracks

        // Update item in queue file
        await updateItemInQueueFile(item);

        // Trigger queue processing - must call directly since status is "queue"
        updateItem(item);
        processQueue(); // Explicitly trigger queue to process retry

        return;
      } else {
        logs(
          item.id,
          `❌ [RETRY] Max retries (${maxRetries}) reached. Marking as failed.`,
        );

        if (hasPartialSuccess) {
          logs(
            item.id,
            `📊 [RETRY] Final result: ${item.downloadedCount}/${item.totalCount} tracks downloaded`,
          );
          // Don't clean folder - keep what we have
        }

        await updateItemInQueueFile(item);
        return;
      }
    }

    // Stop if there is no file to process (maybe existing)
    const processingPath = getProcessingPath();
    const shouldPostProcess = hasFileToMove(`${processingPath}/${item.id}`);

    if (!shouldPostProcess) {
      item["status"] = "finished";
      updateItem(item);
      logs(item.id, "⚠️ [TIDARR] No file to process.");

      await updateItemInQueueFile(item);

      return;
    }

    // Execute custom script if exists
    await executeCustomScript(item);

    // Update m3u item path
    replacePathInM3U(item);

    // Beets process
    await beets(item.id);

    // Set permissions
    await setPermissions(item);

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

    // Ntfy notification
    await ntfyPush(item);

    // Webhook push over notification
    await hookPushOver(item);

    // Apprise API notification
    await appriseApiPush(item);

    logs(item.id, "---------------------");
    logs(item.id, "✅ [TIDARR] Post processing complete.");
    item["status"] = "finished";

    // Clear playlist progress tracking for completed items
    if (item.type === "playlist" || item.type === "album") {
      await clearPlaylistProgress(item.id);
      logs(item.id, "🧹 [PLAYLIST] Progress tracking cleared");
    }

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
