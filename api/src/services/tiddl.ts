import { spawn, spawnSync } from "child_process";
import { Express } from "express";

import { logs } from "../helpers/jobs";
import { LogType, ProcessingItemType } from "../types";

export function tidalDL(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  item["output"] = logs(item, `=== Tiddl ===`);

  const binary = "tiddl";
  const args: string[] = ["url", item.url, "download"];

  item["output"] = logs(item, `Executing: ${binary} ${args.join(" ")}\r\n`);
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
    if (
      item["output"].includes(`User does not have a valid session`) ||
      item["output"].includes(`"token": token["access_token"]`)
    ) {
      console.log("LOGOUT");
      code = 401;
      deleteTiddlConfig();
    }

    item["output"] = logs(item, `Tiddl process exited with code  ${code}`);
    item["status"] = code === 0 ? "downloaded" : "error";
    item["error"] = code !== 0;
    item["loading"] = false;
    app.settings.processingList.actions.updateItem(item);
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

  const child = spawn("tiddl", ["auth", "login"]);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (data) => {
    log["loading"] = true;
    log["process"] = child;

    const url = data.match(/https?:\/\/[^\s]+/)?.[0];
    if (url) {
      log["link"] = url;
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

    if (code === 0) {
      log["is_athenticated"] = true;
      spawn("cp", [
        "-rf",
        "/root/tiddl.json",
        "/home/app/standalone/shared/tiddl.json",
      ]);
    }

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
    spawnSync("tiddl", ["auth", "logout"]);
    spawn("cp", [
      "-rf",
      "/root/tiddl.json",
      "/home/app/standalone/shared/tiddl.json",
    ]);
  } catch (e) {
    console.log("delete tiddl config error:", e);
  }
}
