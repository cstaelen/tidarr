import { Config, JsonDB } from "node-json-db";
import path from "path";

import { CONFIG_PATH } from "../../constants";

// Queue database
const queueDbPath = path.join(CONFIG_PATH, "queue");
export const queueDb = new JsonDB(new Config(queueDbPath, true, false, "/"));

// History database (indexing disabled to preserve array type at root)
const historyDbPath = path.join(CONFIG_PATH, "history");
export const historyDb = new JsonDB(
  new Config(historyDbPath, true, false, "/"),
);

// Sync list database
const syncListDbPath = path.join(CONFIG_PATH, "sync_list");
export const syncListDb = new JsonDB(
  new Config(syncListDbPath, true, false, "/"),
);
