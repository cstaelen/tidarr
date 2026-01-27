import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Response } from "express";
import fs from "fs";
import path from "path";

import { setAppInstance } from "./src/helpers/app-instance";
import { get_tiddl_config } from "./src/helpers/get_tiddl_config";
import { gracefulShutdown } from "./src/helpers/gracefull_shutdown";
import { ProcessingStack } from "./src/processing/core/processing-manager";
import { cleanFolder } from "./src/processing/utils/jobs";
import { setupProxies } from "./src/proxies";
// Import routers
import apiKeyRouter from "./src/routes/api-key";
import authRouter from "./src/routes/auth";
import configRouter from "./src/routes/config";
import historyRouter from "./src/routes/history";
import lidarrRouter from "./src/routes/lidarr";
import oidcRouter from "./src/routes/oidc";
import playRouter from "./src/routes/playback";
import processingRouter from "./src/routes/processing";
import sseRouter from "./src/routes/sse";
import syncRouter from "./src/routes/sync";
import tiddlTomlRouter from "./src/routes/tiddl-toml";
import { getOrCreateApiKey } from "./src/services/api-key";
import { configureServer } from "./src/services/config";
import { loadHistoryFromFile } from "./src/services/history";
import { createCronJob } from "./src/services/sync";
import { startTokenRefreshInterval } from "./src/services/token-refresh";

import customCssRouter from "./src/routes/custom-css";

dotenv.config({
  path: path.join(__dirname, "../.env"),
  override: false,
  quiet: true,
});

const port = 8484;
const hostname = "0.0.0.0";

const app: Express = express();

// Make app instance available globally
setAppInstance(app);

app.use(express.json());
app.use(cors());

// Setup all API proxies (Tidal, Plex, Navidrome)
setupProxies(app);

const processingList = ProcessingStack();
app.locals.processingStack = processingList;
app.locals.addOutputLog = processingList.actions.addOutputLog;
app.locals.activeListConnections = [];
app.locals.activeItemOutputConnections = new Map<string, Response[]>();
app.locals.history = [];
app.locals.historySet = new Set<string>();

app.all("/{*any}", function (_req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );

  next();
});

// Register routers
app.use("/api", authRouter);
app.use("/api", oidcRouter);
app.use("/api", processingRouter);
app.use("/api", sseRouter);
app.use("/api", configRouter);
app.use("/api", syncRouter);
app.use("/api", customCssRouter);
app.use("/api", tiddlTomlRouter);
app.use("/api", historyRouter);
app.use("/api", playRouter);
app.use("/api", apiKeyRouter);
app.use("/api", lidarrRouter);

// Run

const server = app.listen(port, async () => {
  const config = await configureServer();
  app.locals.config = config;

  // Load tiddl config on startup
  const { config: tiddlConfig } = get_tiddl_config();
  app.locals.tiddlConfig = tiddlConfig;

  // Generate or load API key on startup
  const apiKey = getOrCreateApiKey();
  console.log(`🔑 [API KEY] API key ready (${apiKey.substring(0, 8)}...)`);

  // Load download history
  const history = await loadHistoryFromFile();
  app.locals.history = history;
  app.locals.historySet = new Set(history);

  // Start token refresh interval (checks every 15 minutes)
  startTokenRefreshInterval(app);

  // Clean up all processing folders (safe because loadDataFromFile resets "processing" to "queue")
  await cleanFolder();

  // Load queue file on startup
  await app.locals.processingStack.actions.loadDataFromFile();
  console.log(`✅ [QUEUE] Queue file loaded.`);

  // Initiate processing cron job
  await createCronJob(app);

  console.log(`⚡️ [SERVER]: Server is running at http://${hostname}:${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", app, server));
process.on("SIGINT", () => gracefulShutdown("SIGINT", app, server));

// fallback load app

const frontendFiles = "/tidarr/app/build";
if (fs.existsSync(frontendFiles)) {
  app.use(express.static(frontendFiles));
  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(frontendFiles, "index.html"));
  });
}
