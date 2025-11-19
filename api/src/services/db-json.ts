import { Config, JsonDB } from "node-json-db";
import path from "path";

import { CONFIG_PATH } from "../../constants";

// Queue database
const queueDbPath = path.join(CONFIG_PATH, "queue");
export const queueDb = new JsonDB(new Config(queueDbPath, true, false, "/"));

// Sync list database
const syncListDbPath = path.join(CONFIG_PATH, "sync_list");
export const syncListDb = new JsonDB(
  new Config(syncListDbPath, true, false, "/"),
);
