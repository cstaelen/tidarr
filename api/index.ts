import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import proxy from "express-http-proxy";
import fs from "fs";

import { ensureAccessIsGranted } from "./src/helpers/auth";
import { ProcessingStack, sendSSEUpdate } from "./src/helpers/ProcessingStack";
import { is_auth_active, proceed_auth } from "./src/services/auth";
import { configureServer } from "./src/services/config";
import { deleteTiddlConfig, tidalToken } from "./src/services/tiddl";
import { TIDAL_API_URL } from "./constants";

dotenv.config({ path: "../.env", override: false });

const port = 8484;
const hostname = "0.0.0.0";

const app: Express = express();

app.use(express.json());
app.use(cors());
app.use(
  "/proxy",
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

app.set("activeListConnections", []);

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

app.post(
  "/api/remove",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    req.app.settings.processingList.actions.removeItem(req.body.id);
    res.sendStatus(201);
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

    sendSSEUpdate(req, res);
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

app.get(
  "/api/check",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    const response = await configureServer();

    app.set("tiddlConfig", response?.tiddl_config);

    res.send(response);
  },
);

app.listen(port, () => {
  configureServer();
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
