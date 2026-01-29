import { Express } from "express";
import cron from "node-cron";

import { SYNC_DEFAULT_CRON } from "../../constants";
import { ProcessingItemType, SyncItemType } from "../types";

import { syncListDb } from "./db-json";

const SYNC_LIST_PATH = "/";

// In-memory cache to avoid disk reads
let syncListCache: SyncItemType[] | null = null;

/**
 * Load sync list from file (only on first call, then uses cache)
 */
const loadSyncList = async (): Promise<SyncItemType[]> => {
  // Return cache if available
  if (syncListCache !== null) {
    return syncListCache;
  }

  // First load: read from disk
  try {
    const data = await syncListDb.getData(SYNC_LIST_PATH);
    syncListCache = Array.isArray(data) ? data : [];
    return syncListCache;
  } catch {
    // Database doesn't exist yet or path not found, initialize with empty array
    await syncListDb.push(SYNC_LIST_PATH, []); // auto-saves with saveOnPush=true
    syncListCache = [];
    return syncListCache;
  }
};

export const addItemToSyncList = async (item: SyncItemType) => {
  const syncList = await loadSyncList();

  // Check if item already exists in the sync list
  const itemExists = syncList.some(
    (existingItem) => existingItem.id === item.id,
  );

  if (itemExists) return;

  syncList.push(item);

  // Update cache
  syncListCache = syncList;

  // Write to disk (auto-saves with saveOnPush=true)
  await syncListDb.push(SYNC_LIST_PATH, syncList);
};

export const removeItemFromSyncList = async (id: number | string) => {
  const syncList = await loadSyncList();
  const idString = id.toString();
  const filteredList = syncList.filter(
    (item) => item.id.toString() !== idString,
  );

  // Update cache
  syncListCache = filteredList;

  // Write to disk (auto-saves with saveOnPush=true)
  await syncListDb.push(SYNC_LIST_PATH, filteredList);
};

export const removeAllFromSyncList = async () => {
  // Update cache
  syncListCache = [];

  // Write to disk (auto-saves with saveOnPush=true)
  await syncListDb.push(SYNC_LIST_PATH, []);
};

const updateSyncItem = async (id: string, update: Partial<SyncItemType>) => {
  const syncList = await loadSyncList();
  const itemIndex = syncList.findIndex((item) => item.id === id.toString());

  if (itemIndex !== -1) {
    syncList[itemIndex] = { ...syncList[itemIndex], ...update };

    // Update cache
    syncListCache = syncList;

    // Write to disk (auto-saves with saveOnPush=true)
    await syncListDb.push(SYNC_LIST_PATH, syncList);
  }
};

export const getSyncList = async () => {
  return await loadSyncList();
};

export const process_sync_list = async (app: Express) => {
  const syncList: SyncItemType[] = await getSyncList();

  if (!syncList || syncList?.length === 0) return;

  // Process each item sequentially
  for (const element of syncList) {
    const item: ProcessingItemType = app.locals.processingStack.actions.getItem(
      element.id,
    );
    if (item && ["processing"].includes(item?.status)) continue;
    if (item && ["finished", "no_download"].includes(item?.status)) {
      await app.locals.processingStack.actions.removeItem(element.id);
    }

    const itemToQueue: ProcessingItemType = {
      id: element.id,
      artist: element.artist || "",
      title: element.title,
      type: element.type,
      quality: element.quality,
      status: "queue_download",
      loading: true,
      error: false,
      url: element.url,
    };

    await app.locals.processingStack.actions.addItem(itemToQueue);
    await updateSyncItem(element.id, {
      lastUpdate: new Date().toISOString(),
    });
  }
};

export const createCronJob = async (app: Express) => {
  // Initialize sync list database if needed
  await loadSyncList();

  // Stop all existing cron tasks
  cron.getTasks().forEach((task) => task.stop());

  // Validate and sanitize cron expression
  // Remove surrounding quotes if present (from Docker env vars like SYNC_CRON_EXPRESSION="* * * * *")
  const rawExpression = process.env.SYNC_CRON_EXPRESSION || SYNC_DEFAULT_CRON;
  const cronExpression = rawExpression.trim().replace(/^["']|["']$/g, "");
  const isValid = cron.validate(cronExpression);

  if (!isValid) {
    console.error(
      `❌ [SYNC] Invalid cron expression: "${cronExpression}". Using default: ${SYNC_DEFAULT_CRON}`,
    );
  }

  const finalExpression = isValid ? cronExpression : SYNC_DEFAULT_CRON;

  // Determine timezone to use: env var TZ or system default
  const timezone = process.env.TZ;
  const cronOptions = timezone ? { timezone } : undefined;

  // Create a single cron job that processes all items sequentially
  try {
    cron.schedule(
      finalExpression,
      async () => {
        try {
          // Read the sync list fresh each time the cron runs
          await process_sync_list(app);
        } catch (callbackError) {
          console.error("❌ [SYNC] Error in cron callback:", callbackError);
        }
      },
      cronOptions,
    );
    console.log(
      `✅ [SYNC] Cron job scheduled successfully with expression: "${finalExpression}" (timezone: ${timezone || "system"})`,
    );
  } catch (error) {
    console.error("❌ [SYNC] Failed to create cron job:", error);
    console.error(
      `❌ [SYNC] Expression used: "${finalExpression}", Timezone: ${timezone || "system"}`,
    );
    console.error(
      "❌ [SYNC] This may be caused by a timezone configuration issue in your system.",
    );
  }
};
