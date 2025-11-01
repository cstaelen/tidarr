import { Express, Response } from "express";

import { appriseApiPush } from "../services/apprise-api";
import { beets } from "../services/beets";
import { gotifyPush } from "../services/gotify";
import { plexUpdate } from "../services/plex";
import { hookPushOver } from "../services/pushover";
import { tidalDL } from "../services/tiddl";
import { ProcessingItemType, TiddlConfig } from "../types";

import {
  cleanFolder,
  hasFileToMove,
  logs,
  moveAndClean,
  replacePathInM3U,
  setPermissions,
} from "./jobs";
import {
  addItemToFile,
  loadQueueFromFile,
  removeItemFromFile,
} from "./queue_save_file";
import {
  addTracksToPlaylist,
  createNewPlaylist,
  deletePlaylist,
  getTracksByMixId,
} from "./tidal";

export function notifySSEConnections(expressApp: Express) {
  const { processingList, activeListConnections } = expressApp.settings;

  // Data no longer contains output/output_history, send directly
  const data = JSON.stringify(processingList.data);

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
    expressApp.settings.activeItemOutputConnections;
  // Ensure itemId is a string for Map lookup
  const itemIdString = String(itemId);
  const itemConnections = connections.get(itemIdString);

  if (itemConnections && itemConnections.length > 0) {
    const data = JSON.stringify({ id: itemId, output });
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
  const outputs: Map<string, string[]> = new Map(); // Store output history separately

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
    return history.slice(-500).join("\r\n");
  }

  function addOutputLog(id: string, message: string) {
    // Ensure id is a string for Map storage
    const idString = String(id);
    if (!outputs.has(idString)) {
      outputs.set(idString, []);
    }
    outputs.get(idString)?.push(message);

    // Notify connected clients about the output update
    const currentOutput = getItemOutput(idString);
    notifyItemOutput(expressApp, idString, currentOutput);
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

  async function processItem(item: ProcessingItemType) {
    item["status"] = "processing";
    // Initialize empty output history in the Map (ensure string key)
    outputs.set(String(item.id), []);
    expressApp.settings.processingList.actions.updateItem(item);

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

  async function processingMix(item: ProcessingItemType) {
    const config = expressApp.settings.tiddlConfig as TiddlConfig;

    logs(item, `Mix: get track from mix id`, expressApp);
    expressApp.settings.processingList.actions.updateItem(item);
    const tracks = await getTracksByMixId(item.id, config);

    logs(item, `Mix: create new playlist`, expressApp);
    expressApp.settings.processingList.actions.updateItem(item);
    const playlistId = await createNewPlaylist(item.title, config);

    if (tracks) {
      logs(item, `Mix: add track ids to new playlist`, expressApp);
      expressApp.settings.processingList.actions.updateItem(item);
      await addTracksToPlaylist(playlistId, tracks, config);

      item["url"] = `playlist/${playlistId}`;
      logs(item, `Mix: download playlist`, expressApp);
      expressApp.settings.processingList.actions.updateItem(item);

      const child = tidalDL(item.id, expressApp, () => {
        logs(item, `Mix: delete playlist`, expressApp);
        deletePlaylist(playlistId, config);
      });
      if (child) {
        item["process"] = child;
      }

      return;
    }

    deletePlaylist(playlistId, config);
  }

  async function postProcessing(item: ProcessingItemType) {
    const stdout = [];

    const shouldPostProcess = hasFileToMove();

    if (!shouldPostProcess) {
      item["status"] = "finished";
      expressApp.settings.processingList.actions.updateItem(item);
      return;
    }

    logs(item, "---------------------", expressApp);
    logs(item, "⚙️ POST PROCESSING   ", expressApp);
    logs(item, "---------------------", expressApp);

    if (item["type"] === "playlist" || item["type"] === "mix") {
      replacePathInM3U(item, expressApp);
    }

    // Beets process
    await beets(item.id, expressApp);

    // Set permissions
    setPermissions(item, expressApp);

    // Move to output folder
    await moveAndClean(item.id, expressApp);

    if (item["status"] === "finished") {
      // Plex library update
      const responsePlex = await plexUpdate();
      stdout.push(responsePlex?.output);

      // Gotify notification
      const responseGotify = await gotifyPush(
        `${item?.title} - ${item?.artist}`,
        item.type,
      );
      stdout.push(responseGotify?.output);

      // Webhook push over notification
      const responsePushOver = await hookPushOver(
        `${item?.title} - ${item?.artist}`,
        item.type,
      );
      stdout.push(responsePushOver?.output);

      // Apprise API notification
      const responseAppriseApi = await appriseApiPush(
        `${item?.title} - ${item?.artist}`,
        item.type,
      );
      stdout.push(responseAppriseApi?.output);

      logs(item, stdout.join("\r\n"), expressApp);
      expressApp.settings.processingList.actions.updateItem(item);

      removeItemFromFile(item.id);
    }
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
