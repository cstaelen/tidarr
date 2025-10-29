import apicache from "apicache";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import proxy from "express-http-proxy";
import fs from "fs";

import { ensureAccessIsGranted } from "./src/helpers/auth";
import { get_tiddl_config } from "./src/helpers/get_tiddl_config";
import { ProcessingStack } from "./src/helpers/ProcessingStack";
import { is_auth_active, proceed_auth } from "./src/services/auth";
import { configureServer, refreshTidalToken } from "./src/services/config";
import {
  addItemToSyncList,
  createCronJob,
  getSyncList,
  removeItemFromSyncList,
} from "./src/services/sync";
import { deleteTiddlConfig, tidalToken } from "./src/services/tiddl";
import { TIDAL_API_URL } from "./constants";

import { getCustomCSS, setCustomCSS } from "./src/services/custom-css";

dotenv.config({ path: "../.env", override: false, quiet: true });

const port = 8484;
const hostname = "0.0.0.0";

const app: Express = express();
const cache = apicache.middleware;

app.use(express.json());
app.use(cors());
app.use(
  "/proxy",
  cache("1 minute"),
  proxy(TIDAL_API_URL, {
    proxyReqOptDecorator: function (proxyReqOpts) {
      delete proxyReqOpts.headers["referer"];
      delete proxyReqOpts.headers["origin"];
      return proxyReqOpts;
    },
  }),
);

const processingList = ProcessingStack(app);
app.set("processingList", processingList);
app.set("addOutputLog", processingList.actions.addOutputLog);

app.set("activeListConnections", []);
app.set("activeItemOutputConnections", new Map());

app.all("/{*any}", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );

  next();
});

// Tidarr authentication endpoints

app.post("/api/auth", async (req: Request, res: Response) => {
  await proceed_auth(req.body.password, res);
});

app.get("/api/is_auth_active", (req: Request, res: Response) => {
  const response = is_auth_active();
  res.status(200).json({ isAuthActive: response });
});

// Tidarr download process endpoints

app.post(
  "/api/save",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    req.app.settings.processingList.actions.addItem(req.body.item);
    res.sendStatus(201);
  },
);

app.delete(
  "/api/remove",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    await req.app.settings.processingList.actions.removeItem(req.body.id);
    res.sendStatus(204);
  },
);

app.delete(
  "/api/remove_all",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    await req.app.settings.processingList.actions.removeAllItems();
    res.sendStatus(204);
  },
);

app.delete(
  "/api/remove_finished",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    await req.app.settings.processingList.actions.removeFinishedItems();
    res.sendStatus(204);
  },
);

app.get(
  "/api/stream_processing",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Add the new connection to the list
    req.app.settings.activeListConnections.push(res);

    // Remove the connection from the list when it closes
    req.on("close", () => {
      req.app.settings.activeListConnections =
        req.app.settings.activeListConnections.filter(
          (conn: Response) => conn !== res,
        );
    });

    // Send initial state to the new client
    const data = JSON.stringify(req.app.settings.processingList.data);
    res.write(`data: ${data}\n\n`);
  },
);

app.get(
  "/api/stream_item_output/:id",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    const itemId = req.params.id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Get or create the connections array for this item
    const connections: Map<string, Response[]> =
      req.app.settings.activeItemOutputConnections;
    if (!connections.has(itemId)) {
      connections.set(itemId, []);
    }
    connections.get(itemId)?.push(res);

    // Remove the connection when it closes
    req.on("close", () => {
      const itemConnections = connections.get(itemId);
      if (itemConnections) {
        const filtered = itemConnections.filter((conn) => conn !== res);
        if (filtered.length === 0) {
          connections.delete(itemId);
        } else {
          connections.set(itemId, filtered);
        }
      }
    });

    // Send initial output for this item
    const output =
      req.app.settings.processingList.actions.getItemOutput(itemId) || "";
    res.write(`data: ${JSON.stringify({ id: itemId, output })}\n\n`);
  },
);

// Tidal token endpoints

app.get(
  "/api/run_token",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    await tidalToken(req, res);
  },
);

app.get(
  "/api/delete_token",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    deleteTiddlConfig();
    res.sendStatus(201);
  },
);

// api check config

app.get("/api/check", ensureAccessIsGranted, (_req: Request, res: Response) => {
  refreshTidalToken();
  const tiddl_config = get_tiddl_config();
  app.set("tiddlConfig", tiddl_config);

  res.status(200).json({
    ...app.settings.config,
    noToken: tiddl_config?.auth?.token.length === 0,
    tiddl_config: tiddl_config,
  });
});

// Custom CSS endpoints

app.get(
  "/api/custom-css",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    try {
      const cssContent = getCustomCSS();
      res.status(200).json({ css: cssContent });
    } catch {
      res.status(500).json({ error: "Failed to read custom CSS" });
    }
  },
);

app.post(
  "/api/custom-css",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    try {
      const { css } = req.body;

      if (typeof css !== "string") {
        res.status(400).json({ error: "CSS content must be a string" });
        return;
      }

      setCustomCSS(css);
      res
        .status(200)
        .json({ success: true, message: "Custom CSS saved successfully" });
    } catch {
      res.status(500).json({ error: "Failed to save custom CSS" });
    }
  },
);

// api sync playlist

app.get(
  "/api/sync/list",
  ensureAccessIsGranted,
  (_req: Request, res: Response) => {
    const list = getSyncList();
    res.status(200).json(list);
  },
);

app.post(
  "/api/sync/save",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    addItemToSyncList(req.body.item);
    createCronJob(app);

    res.sendStatus(201);
  },
);

app.post(
  "/api/sync/remove",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    removeItemFromSyncList(req.body.id);
    createCronJob(app);

    res.sendStatus(201);
  },
);

// Run

app.listen(port, async () => {
  const config = await configureServer();
  app.set("config", config);

  createCronJob(app);

  app.settings.processingList.actions.loadDataFromFile();

  console.log(`⚡️[server]: Server is running at http://${hostname}:${port}`);
});

// fallback load app

const frontendFiles = "/home/app/standalone/app/build";
if (fs.existsSync(frontendFiles)) {
  app.use(express.static(frontendFiles));
  app.get("/{*any}", (_, res) => {
    res.sendFile(frontendFiles + "/index.html");
  });
}
