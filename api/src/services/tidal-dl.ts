import { spawn } from "child_process";
import { Express } from "express";

import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

const TIDDL_OUTPUT_PATH = "/home/app/standalone/download/incomplete";
const TIDDL_QUALITY = process.env.TIDDL_QUALITY || "high";
const TIDDL_FORMAT = process.env.TIDDL_FORMAT || "{artist}/{album}/{title}";
const TIDDL_FORCE_EXT = process.env.TIDDL_FORCE_EXT;

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
    TIDDL_FORMAT,
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
    item["output"] = logs(item, `Tiddl process exited with code ${code}`);
    item["status"] = code === 1 ? "error" : "downloaded";
    item["error"] = code === 1;
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
