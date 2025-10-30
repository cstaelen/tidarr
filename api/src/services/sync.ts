import { Express } from "express";
import fs from "fs";
import cron from "node-cron";
import path from "path";

import { ROOT_PATH, SYNC_DEFAULT_CRON } from "../../constants";
import { ProcessingItemType, SyncItemType } from "../types";

export const addItemToSyncList = (item: SyncItemType) => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");

  const syncList: SyncItemType[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  // Check if item already exists in the sync list
  const itemExists = syncList.some(
    (existingItem) => existingItem.id === item.id,
  );

  if (itemExists) return;

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

export const updateSyncItem = (id: string, update: Partial<SyncItemType>) => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");
  const syncList: SyncItemType[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  const itemIndex = syncList.findIndex((item) => item.id === id.toString());
  if (itemIndex !== -1) {
    syncList[itemIndex] = { ...syncList[itemIndex], ...update };
    fs.writeFileSync(filePath, JSON.stringify(syncList, null, 2));
  }
};

export const createCronJob = async (app: Express) => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }

  // Stop all existing cron tasks
  cron.getTasks().forEach((task) => task.stop());

  // Validate and sanitize cron expression
  // Remove surrounding quotes if present (from Docker env vars like SYNC_CRON_EXPRESSION="* * * * *")
  const rawExpression = process.env.SYNC_CRON_EXPRESSION || SYNC_DEFAULT_CRON;
  const cronExpression = rawExpression.trim().replace(/^["']|["']$/g, "");
  const isValid = cron.validate(cronExpression);

  if (!isValid) {
    console.error(
      `[SYNC] Invalid cron expression: "${cronExpression}". Using default: ${SYNC_DEFAULT_CRON}`,
    );
  }

  const finalExpression = isValid ? cronExpression : SYNC_DEFAULT_CRON;

  // Create a single cron job that processes all items sequentially
  try {
    cron.schedule(
      finalExpression,
      () => {
        try {
          // Read the sync list fresh each time the cron runs
          const syncList: SyncItemType[] = JSON.parse(
            fs.readFileSync(filePath, "utf8"),
          );

          if (!syncList || syncList?.length === 0) return;

          // Process each item sequentially
          syncList.forEach((element) => {
            const item: ProcessingItemType =
              app.settings.processingList.actions.getItem(element.id);
            if (item && ["processing"].includes(item?.status)) return;
            if (item && ["finished", "downloaded"].includes(item?.status)) {
              app.settings.processingList.actions.removeItem(element.id);
            }

            const itemToQueue: ProcessingItemType = {
              id: element.id,
              artist: element.artist || "",
              title: element.title,
              type: element.type,
              quality: element.quality,
              status: "queue",
              loading: true,
              error: false,
              url: element.url,
            };

            app.settings.processingList.actions.addItem(itemToQueue);
            updateSyncItem(element.id, {
              lastUpdate: new Date().toISOString(),
            });
          });
        } catch (callbackError) {
          console.error("[SYNC] Error in cron callback:", callbackError);
        }
      },
      {
        timezone: "Etc/UTC",
      },
    );
    console.log(
      `[SYNC] Cron job scheduled successfully with expression: "${finalExpression}" (timezone: Etc/UTC)`,
    );
  } catch (error) {
    console.error("[SYNC] Failed to create cron job:", error);
    console.error(
      `[SYNC] Expression used: "${finalExpression}", Timezone: Etc/UTC`,
    );
    console.error(
      "[SYNC] This may be caused by a timezone configuration issue in your system.",
    );
  }
};

export const getSyncList = () => {
  const filePath = path.join(`${ROOT_PATH}/shared`, "sync_list.json");
  const syncList: { id: number; url: string; contentType: string }[] =
    JSON.parse(fs.readFileSync(filePath, "utf8"));
  return syncList;
};
