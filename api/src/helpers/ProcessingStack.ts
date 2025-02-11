import { Express } from "express";

import { beets } from "../services/beets";
import { gotifyPush } from "../services/gotify";
import { plexUpdate } from "../services/plex";
import { tidalDL } from "../services/tiddl";
import { ProcessingItemType } from "../types";

import { cleanFolder, moveAndClean } from "./jobs";

export const ProcessingStack = (expressApp: Express) => {
  const data: ProcessingItemType[] = [];

  function addItem(item: ProcessingItemType) {
    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );
    if (foundIndex !== -1) return;
    data.push(item);
    processQueue();
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
  }

  function updateItem(item: ProcessingItemType) {
    const foundIndex = data.findIndex(
      (listItem: ProcessingItemType) => listItem?.id === item?.id,
    );
    data[foundIndex] = item;
    if (item.status === "downloaded") {
      postProcessing(item);
    }
    if (item.status === "finished" || item.status === "error") {
      processQueue();
    }
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
    if (item.type === "album") {
      await beets(item.id, expressApp);
    }

    await moveAndClean(item.id, expressApp);

    if (item["status"] === "finished") {
      const responsePlex = await plexUpdate();
      stdout.push(responsePlex?.output);

      const responseGotify = await gotifyPush(
        `${item?.title} - ${item?.artist}`,
        item.type,
      );
      stdout.push(responseGotify?.output);

      item["output"] = [item["output"], ...stdout].join("\n");
      item["output"].substr(item["output"].length - 5000);
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
