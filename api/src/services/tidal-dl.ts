import { spawn } from "child_process";
import { Express } from "express";

import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

const TIDDL_OUTPUT_PATH = "/home/app/standalone/download/incomplete";
const TIDDL_QUALITY = process.env.TIDDL_QUALITY || "high";
const TIDDL_FORMAT = process.env.TIDDL_FORMAT || "{artist}/{album}/{title}";

export function tidalDL(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  item["output"] = logs(item, `=== Tiddl ===`);

  const command = `${item.id} -q ${TIDDL_QUALITY} -p ${TIDDL_OUTPUT_PATH} -o "${TIDDL_FORMAT}" -s`;

  item["output"] = logs(item, `Executing: ${command}`);
  const child = spawn(`tiddl`, [
    item.url,
    "-q",
    TIDDL_QUALITY,
    "-p",
    TIDDL_OUTPUT_PATH,
    "-o",
    TIDDL_FORMAT,
  ]);

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
    if (code === 0) {
      item["status"] = item.output.includes("[ERR]") ? "error" : "downloaded";
      item["error"] = item.output.includes("[ERR]");
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
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
