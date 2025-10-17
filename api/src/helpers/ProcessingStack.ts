import { Express, Request, Response } from "express";

import { appriseApiPush } from "../services/apprise-api";
import { beets } from "../services/beets";
import { gotifyPush } from "../services/gotify";
import { plexUpdate } from "../services/plex";
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
  addTracksToPlaylist,
  createNewPlaylist,
  deletePlaylist,
  getTracksByMixId,
} from "./tidal";

export function sendSSEUpdate(req: Request, res: Response) {
  res.write(
    `data: ${JSON.stringify(req.app.settings.processingList.data)}\n\n`,
  );
}

export function notifySSEConnections(req: Request) {
  req.app.settings.activeListConnections.forEach((conn: Response) => {
    sendSSEUpdate(req, conn);
  });
}

export const ProcessingStack = (expressApp: Express) => {
  const data: ProcessingItemType[] = [];

  function addItem(item: ProcessingItemType) {
    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );
    if (foundIndex !== -1) return;
    data.push(item);
    processQueue();

    notifySSEConnections(expressApp.request);
  }

  async function removeItem(id: string) {
    const item = getItem(id);
    item?.process?.kill("SIGSTOP");
    item?.process?.kill("SIGTERM");
    item?.process?.kill("SIGKILL");
    item?.process?.stdin?.end();

    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );
    delete data[foundIndex];
    data.splice(foundIndex, 1);
    await cleanFolder();
    processQueue();

    notifySSEConnections(expressApp.request);
  }

  function updateItem(item: ProcessingItemType) {
    if (item?.status === "downloaded") {
      postProcessing(item);
    }
    if (item?.status === "finished" || item?.status === "error") {
      processQueue();
    }

    notifySSEConnections(expressApp.request);
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
    item["output_history"] = [];
    expressApp.settings.processingList.actions.updateItem(item);

    if (item.type === "mix") {
      processingMix(item);
    } else {
      tidalDL(item.id, expressApp);
    }
  }

  async function processingMix(item: ProcessingItemType) {
    const config = expressApp.settings.tiddlConfig as TiddlConfig;

    item["output"] = logs(item, `Mix: get track from mix id`);
    expressApp.settings.processingList.actions.updateItem(item);
    const tracks = await getTracksByMixId(item.id, config);

    item["output"] = logs(item, `Mix: create new playlist`);
    expressApp.settings.processingList.actions.updateItem(item);
    const playlistId = await createNewPlaylist(item.title, config);

    if (tracks) {
      item["output"] = logs(item, `Mix: add track ids to new playlist`);
      expressApp.settings.processingList.actions.updateItem(item);
      await addTracksToPlaylist(playlistId, tracks, config);

      item["url"] = `playlist/${playlistId}`;
      item["output"] = logs(item, `Mix: download playlist`);
      expressApp.settings.processingList.actions.updateItem(item);

      tidalDL(item.id, expressApp, () => {
        item["output"] = logs(item, `Mix: delete playlist`);
        deletePlaylist(playlistId, config);
      });

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

    if (item["type"] === "playlist" || item["type"] === "mix") {
      replacePathInM3U();
    }

    // Beets process
    await beets(item.id, expressApp);

    // Set permissions
    setPermissions();

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

      // Apprise API notification
      const responseAppriseApi = await appriseApiPush(
        `${item?.title} - ${item?.artist}`,
        item.type,
      );
      stdout.push(responseAppriseApi?.output);

      item["output"] = logs(item, stdout.join("\r\n"));
      expressApp.settings.processingList.actions.updateItem(item);
    }
  }

  return {
    data,
    actions: {
      addItem,
      removeItem,
      updateItem,
      getItem,
      processQueue,
    },
  };
};
