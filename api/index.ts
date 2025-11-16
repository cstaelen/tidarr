import apicache from "apicache";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Response } from "express";
import proxy from "express-http-proxy";
import fs from "fs";
import path from "path";

import { gracefulShutdown } from "./src/helpers/gracefull_shutdown";
import { ProcessingStack } from "./src/processing/ProcessingStack";
// Import routers
import authRouter from "./src/routes/auth";
import configRouter from "./src/routes/config";
import processingRouter from "./src/routes/processing";
import sseRouter from "./src/routes/sse";
import syncRouter from "./src/routes/sync";
import tiddlTomlRouter from "./src/routes/tiddl-toml";
import { configureServer } from "./src/services/config";
import { createCronJob } from "./src/services/sync";
import { TIDAL_API_URL } from "./constants";

import customCssRouter from "./src/routes/custom-css";

dotenv.config({
  path: path.join(__dirname, "../.env"),
  override: false,
  quiet: true,
});

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
app.set("activeItemOutputConnections", new Map<string, Response[]>());

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
app.use("/api", processingRouter);
app.use("/api", sseRouter);
app.use("/api", configRouter);
app.use("/api", syncRouter);
app.use("/api", customCssRouter);
app.use("/api", tiddlTomlRouter);

// Run

const server = app.listen(port, async () => {
  const config = await configureServer();
  app.set("config", config);

  createCronJob(app);

  app.settings.processingList.actions.loadDataFromFile();

  console.log(`⚡️ [SERVER]: Server is running at http://${hostname}:${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", app, server));
process.on("SIGINT", () => gracefulShutdown("SIGINT", app, server));

// fallback load app

const frontendFiles = "/home/app/standalone/app/build";
if (fs.existsSync(frontendFiles)) {
  app.use(express.static(frontendFiles));
  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(frontendFiles, "index.html"));
  });
}
