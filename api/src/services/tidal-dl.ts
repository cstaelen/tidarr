import { spawn } from "child_process";
import { Express } from "express";

import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

export function tidalDL(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  item["output"] = logs(item, `=== Tidal-DL ===`);

  const command = `${item.id} -q master -p /home/app/standalone/download/incomplete -s`;

  item["output"] = logs(item, `Executing: ${command}`);
  const child = spawn(`tiddl`, [
    item.url,
    "-q",
    "master",
    "-p",
    "/home/app/standalone/download/incomplete",
    "-s",
  ]);

  child.stdout.on("data", (data) => {
    item["output"] = logs(item, data);
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.stderr.on("data", (data) => {
    item["output"] = logs(item, `Tidal-DL stderr: ${data}`);
    item["status"] = "error";
    item["error"] = true;
    item["loading"] = false;
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.on("close", (code) => {
    item["output"] = logs(item, `Tidal-DL process exited with code ${code}`);
    if (code === 0) {
      item["status"] = item.output.includes("[ERR]") ? "error" : "downloaded";
      item["error"] = item.output.includes("[ERR]");
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
    }
  });

  child.on("error", (err) => {
    if (err) {
      item["output"] = logs(item, `Tidal-DL Error: ${err}`);
      item["status"] = "error";
      item["error"] = true;
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
    }
  });

  return child;
}
