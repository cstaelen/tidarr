import { Express } from "express";
import fs from "fs";
import cron from "node-cron";
import path from "path";

import { ROOT_PATH } from "../../constants";
import { ProcessingItemType, SyncItemType } from "../types";

export const addItemToSyncList = (item: SyncItemType) => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");

  const syncList: SyncItemType[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  syncList.push(item);
  fs.writeFileSync(filePath, JSON.stringify(syncList, null, 2));
};

export const removeItemFromSyncList = (id: number) => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");
  let syncList: { id: number; url: string; contentType: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  syncList = syncList.filter((item) => item.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(syncList, null, 2));
};

export const createCronJob = async (app: Express) => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
  const syncList: SyncItemType[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  cron.getTasks().forEach((task) => task.stop());
  syncList.forEach((element) => {
    cron.schedule("* * * * *", () => {
      const itemToQueue: ProcessingItemType = {
        id: element.id,
        artist: "",
        title: element.title,
        type: element.type,
        quality: element.quality,
        status: "queue",
        loading: true,
        error: false,
        url: element.url,
        output: "",
        output_history: [],
      };
      app.settings.processingList.actions.removeItem(itemToQueue);
      app.settings.processingList.actions.addItem(itemToQueue);
    });
  });
};

export const getSyncList = () => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");
  const syncList: { id: number; url: string; contentType: string }[] =
    JSON.parse(fs.readFileSync(filePath, "utf8"));
  return syncList;
};
