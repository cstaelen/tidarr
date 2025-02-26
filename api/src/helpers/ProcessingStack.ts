import { Express, Request, Response } from "express";

import { beets } from "../services/beets";
import { gotifyPush } from "../services/gotify";
import { plexUpdate } from "../services/plex";
import { tidalDL } from "../services/tiddl";
import { ProcessingItemType } from "../types";

import { cleanFolder, logs, moveAndClean } from "./jobs";

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

  async function removeItem(id: number) {
    const item = getItem(id);
    await item?.process?.kill("SIGSTOP");
    await item?.process?.kill("SIGTERM");
    await item?.process?.kill("SIGKILL");
    await item?.process?.stdin?.end();

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

  function getItem(id: number): ProcessingItemType {
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

  function processItem(item: ProcessingItemType) {
    item["status"] = "processing";
    expressApp.settings.processingList.actions.updateItem(item);

    tidalDL(item.id, expressApp);
  }

  async function postProcessing(item: ProcessingItemType) {
    const stdout = [];

    await beets(item.id, expressApp);
    await moveAndClean(item.id, expressApp);

    if (item["status"] === "finished") {
      const responsePlex = await plexUpdate();
      stdout.push(responsePlex?.output);

      const responseGotify = await gotifyPush(
        `${item?.title} - ${item?.artist}`,
        item.type,
      );
      stdout.push(responseGotify?.output);

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
