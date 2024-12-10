import { spawn } from "child_process";
import { Express } from "express";

import { logs } from "../helpers/jobs";
import { LogType, ProcessingItemType } from "../types";

const TIDDL_OUTPUT_PATH = "/home/app/standalone/download/incomplete";
const TIDDL_QUALITY = process.env.TIDDL_QUALITY || "high";
const TIDDL_FORMAT = process.env.TIDDL_FORMAT || "{artist}/{album}/{title}";
const TIDDL_FORCE_EXT = process.env.TIDDL_FORCE_EXT;
const TIDDL_PLAYLIST_FORMAT =
  process.env.TIDDL_PLAYLIST_FORMAT ||
  "{playlist}/{playlist_number}-{artist}-{title}";

export function tidalDL(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  item["output"] = logs(item, `=== Tiddl ===`);

  const binary = "tiddl";
  const args: string[] = [
    item.url,
    "-q",
    TIDDL_QUALITY,
    "-p",
    TIDDL_OUTPUT_PATH,
    "-o",
    item["type"] === "playlist" ? TIDDL_PLAYLIST_FORMAT : TIDDL_FORMAT,
    "-s",
  ];

  if (TIDDL_FORCE_EXT) {
    args.push(...["-e", TIDDL_FORCE_EXT]);
  }

  const command = `${binary} ${args.join(" ")}`;

  item["output"] = logs(item, `Executing: ${command}`);
  const child = spawn(binary, args);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (data) => {
    item["output"] = logs(item, data);
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (data) => {
    item["output"] = logs(item, `Tiddl: ${data}`);
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.on("close", (code) => {
    item["output"] = logs(item, `Tiddl process exited with code  ${code}`);
    item["status"] = code === 0 ? "downloaded" : "error";
    item["error"] = code !== 0;
    item["loading"] = false;
    app.settings.processingList.actions.updateItem(item);

    if (item["output"].includes(`logger.info(f"album: {album['title']}")`)) {
      deleteTiddlConfig();
    }
  });

  child.on("error", (err) => {
    if (err) {
      item["output"] = logs(item, `Tiddl Error: ${err}`);
      item["status"] = "error";
      item["error"] = true;
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
    }
  });

  return child;
}

export function tidalToken(app: Express) {
  const log: LogType = app.settings.tokenLog.actions.getLogs();

  const command = "tiddl";
  const child = spawn(command);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (data) => {
    log["loading"] = true;
    log["process"] = child;

    const url = data.match(/https?:\/\/[^\s]+/)?.[0];
    if (url) {
      log["link"] = url;
    }

    if (data?.includes("authenticated!")) {
      log["is_athenticated"] = true;
    }

    app.settings.tokenLog.actions.updateLog(log);
  });

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (data) => {
    log["output"] = logs(log, data);
    log["process"] = child;
    log["loading"] = true;

    app.settings.tokenLog.actions.updateLog(log);
  });

  child.on("close", (code) => {
    log["output"] = logs(log, `Tiddl process exited with code  ${code}`);
    log["status"] = code === 0 ? "auth" : "error";
    log["error"] = code !== 0;
    log["loading"] = false;

    app.settings.tokenLog.actions.updateLog(log);
  });

  child.on("error", (err) => {
    if (err) {
      log["output"] = [log["output"], `Tiddl Error: ${err}`].join("\r\n");
      log["status"] = "error";
      log["error"] = true;
      log["loading"] = false;
      app.settings.tokenLog.actions.updateLog(log);
    }
  });

  return child;
}

export function deleteTiddlConfig() {
  try {
    spawn("rm", ["-rf", "/root/.tiddl_config.json"]);
    spawn("rm", ["-rf", "/home/app/standalone/shared/.tiddl_config.json"]);
  } catch (e) {
    console.log("delete tiddl config error:", e);
  }
}
