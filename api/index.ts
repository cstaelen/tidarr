import apicache from "apicache";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Response } from "express";
import proxy from "express-http-proxy";
import fs from "fs";
import path from "path";

import { setAppInstance } from "./src/app-instance";
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

// Make app instance available globally
setAppInstance(app);

app.use(express.json());
app.use(cors());

// Tidal API proxy
app.use(
  "/proxy/tidal",
  cache("1 minute"),
  proxy(TIDAL_API_URL, {
    proxyReqOptDecorator: function (proxyReqOpts) {
      delete proxyReqOpts.headers["referer"];
      delete proxyReqOpts.headers["origin"];
      return proxyReqOpts;
    },
  }),
);

// Plex API proxy
if (process.env.PLEX_URL && process.env.PLEX_TOKEN) {
  const plexBaseUrl = process.env.PLEX_URL.replace(/\/$/, "");
  app.use(
    "/proxy/plex",
    proxy(plexBaseUrl, {
      proxyReqPathResolver: function (req) {
        // Keep the path and add Plex token
        const url = new URL(req.url, "http://localhost");
        url.searchParams.set("X-Plex-Token", process.env.PLEX_TOKEN || "");
        return url.pathname + url.search;
      },
      proxyReqOptDecorator: function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];
        return proxyReqOpts;
      },
    }),
  );
}

// Navidrome API proxy
if (
  process.env.NAVIDROME_URL &&
  process.env.NAVIDROME_USER &&
  process.env.NAVIDROME_PASSWORD
) {
  const navidromeBaseUrl = process.env.NAVIDROME_URL.replace(/\/$/, "");
  app.use(
    "/proxy/navidrome",
    proxy(navidromeBaseUrl, {
      proxyReqPathResolver: function (req) {
        // Keep the path and add Subsonic auth params
        const url = new URL(req.url, "http://localhost");
        url.searchParams.set("u", process.env.NAVIDROME_USER || "");
        url.searchParams.set("p", process.env.NAVIDROME_PASSWORD || "");
        url.searchParams.set("v", "1.16.1");
        url.searchParams.set("c", "tidarr");
        url.searchParams.set("f", "json");
        return url.pathname + url.search;
      },
      proxyReqOptDecorator: function (proxyReqOpts) {
        delete proxyReqOpts.headers["referer"];
        delete proxyReqOpts.headers["origin"];
        return proxyReqOpts;
      },
    }),
  );
}

const processingList = ProcessingStack(app);
app.locals.processingStack = processingList;
app.locals.addOutputLog = processingList.actions.addOutputLog;
app.locals.activeListConnections = [];
app.locals.activeItemOutputConnections = new Map<string, Response[]>();

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
  app.locals.config = config;

  createCronJob(app);

  app.locals.processingStack.actions.loadDataFromFile();

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
