import { Express, Response } from "express";

import { logs } from "../helpers/logs";
import {
  addItemToFile,
  loadQueueFromFile,
  removeItemFromFile,
} from "../helpers/queue_save_file";
import { appriseApiPush } from "../services/apprise-api";
import { beets } from "../services/beets";
import { gotifyPush } from "../services/gotify";
import { plexUpdate } from "../services/plex";
import { hookPushOver } from "../services/pushover";
import { tidalDL } from "../services/tiddl";
import { ProcessingItemType, TiddlConfig } from "../types";

import {
  cleanFolder,
  getFolderToScan,
  hasFileToMove,
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

  function loadDataFromFile() {
    const records = loadQueueFromFile();
    records.forEach((record) => {
      // Initialize empty output history for each loaded item (ensure string key)
      outputs.set(String(record.id), []);
      data.push(record);
    });
    processQueue();
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

  function addItem(item: ProcessingItemType) {
    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );
    if (foundIndex !== -1) return;

    data.push(item);

    addItemToFile(item);
    processQueue();

    notifySSEConnections(expressApp);
  }

  async function removeItem(id: string) {
    const item = getItem(id);

    // Kill the process if it exists and is running
    if (item?.process && !item.process.killed) {
      try {
        // Try graceful termination first
        item.process.kill("SIGTERM");

        // Wait a bit, then force kill if still running
        setTimeout(() => {
          if (item.process && !item.process.killed) {
            item.process.kill("SIGKILL");
          }
        }, 1000);
      } catch (error) {
        console.error(`Failed to kill process for item ${id}:`, error);
      }
    }

    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );

    if (foundIndex === -1) {
      console.warn(`removeItem: Item ${id} not found in processing list`);
      return;
    }

    delete data[foundIndex];
    data.splice(foundIndex, 1);

    // Clean up output history for this item (ensure string key)
    outputs.delete(String(id));

    await cleanFolder();

    removeItemFromFile(id);
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
      postProcessing(item);
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

  async function processingMix(item: ProcessingItemType) {
    const config = expressApp.locals.tiddlConfig as TiddlConfig;

    logs(item.id, `🕖 [MIX]: Get track from mix id`);
    const tracks = await getTracksByMixId(item.id, config);
    logs(item.id, `✅ [MIX]: Done.`);

    logs(item.id, `🕖 [MIX]: Create new playlist`);
    const playlistId = await createNewPlaylist(item.title, config);
    logs(item.id, `✅ [MIX]: Done.`);

    if (tracks) {
      logs(item.id, `🕖 [MIX]: Add track ids to new playlist`);
      await addTracksToPlaylist(playlistId, tracks, config);
      logs(item.id, `✅ [MIX]: Done.`);

      item["url"] = `playlist/${playlistId}`;
      logs(item.id, `🕖 [MIX]: Download temporary playlist`);

      const child = tidalDL(item.id, expressApp, () => {
        logs(item.id, `🕖 [MIX]: Delete temporary playlist`);
        deletePlaylist(playlistId, config);
        logs(item.id, `✅ [MIX]: Done.`);
      });
      if (child) {
        item["process"] = child;
      }

      return;
    }

    deletePlaylist(playlistId, config);
  }

  async function processItem(item: ProcessingItemType) {
    item["status"] = "processing";
    // Initialize empty output history in the Map (ensure string key)
    outputs.set(String(item.id), []);
    updateItem(item);

    await cleanFolder();

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
    const shouldPostProcess = hasFileToMove();

    logs(item.id, "---------------------");
    logs(item.id, "⚙️ POST PROCESSING   ");
    logs(item.id, "---------------------");

    if (!shouldPostProcess) {
      item["status"] = "finished";
      updateItem(item);
      logs(item.id, "✅ [TIDARR] No file to process.");

      // Remove item from persistant queue file
      removeItemFromFile(item.id);

      return;
    }

    if (item["type"] === "playlist" || item["type"] === "mix") {
      replacePathInM3U(item);
    }

    // Beets process
    await beets(item.id);

    // Set permissions
    setPermissions(item);

    // Keep trace of folders processed
    const foldersToScan = getFolderToScan();

    // Move to output folder
    await moveAndClean(item.id);

    if (item["status"] !== "error") {
      // Plex library update with specific paths
      await plexUpdate(item, foldersToScan);

      // Gotify notification
      await gotifyPush(item);

      // Webhook push over notification
      await hookPushOver(item);

      // Apprise API notification
      await appriseApiPush(item);

      logs(item.id, "---------------------");
      logs(item.id, "✅ [TIDARR] Post processing complete.");
      item["status"] = "finished";
    }

    // Remove item from persistant queue file
    removeItemFromFile(item.id);

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
    },
  };
};
