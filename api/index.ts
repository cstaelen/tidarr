import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import fs from "fs";

import { ensureAccessIsGranted } from "./src/helpers/auth";
import { ProcessingStack } from "./src/helpers/ProcessingStack";
import { ProcessToken, ProcessTokenType } from "./src/helpers/ProcessToken";
import { is_auth_active, proceed_auth } from "./src/services/auth";
import { configureServer } from "./src/services/config";
import { deleteTiddlConfig } from "./src/services/tiddl";
import { ProcessingItemType } from "./src/types";

dotenv.config({ path: "../.env", override: false });

const port = 8484;
const hostname = "0.0.0.0";

const app: Express = express();
app.use(express.json());
app.use(cors());

const processingList = ProcessingStack(app);
const tokenLog = ProcessToken(app);
app.set("processingList", processingList);
app.set("tokenLog", tokenLog);

app.all("*", function (req, res, next) {
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

app.get("/api/list", ensureAccessIsGranted, (req: Request, res: Response) => {
  const clone = [...req.app.settings.processingList.data].map((x) => x);
  const response = clone.map((item: ProcessingItemType) => {
    delete item.process;
    return item;
  });
  res.send(response);
});

// Tidal token endpoints

app.get(
  "/api/run_token",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    req.app.settings.tokenLog.actions.runTidalAuthentication();
    res.sendStatus(201);
  },
);

app.get(
  "/api/token_log",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    const data = req.app.settings.tokenLog.actions.getLogs();
    res.send(data);
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

app.get(
  "/api/kill_token_process",
  ensureAccessIsGranted,
  (req: Request, res: Response) => {
    const tokenLog: ProcessTokenType = req.app.settings.tokenLog;
    tokenLog.actions.stopTokenProcess();
    res.sendStatus(201);
  },
);

// api check config

app.get(
  "/api/check",
  ensureAccessIsGranted,
  async (req: Request, res: Response) => {
    const response = await configureServer();
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
  app.get("/*", (_, res) => {
    res.sendFile(frontendFiles + "/index.html");
  });
}
