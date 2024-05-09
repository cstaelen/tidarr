import { spawn, execSync } from "child_process";
import { Express } from "express";
import { ProcessingItemType } from "../types";
import { ROOT_PATH } from "../../constants";

export function tidalDL(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);
  item["output"] = [item["output"], `=== Tidal-DL ===`].join("\r\n");

  const command = `tidal-dl -l ${item.url}`;
  console.log(`Executing: ${command}`);
  const child = spawn("tidal-dl", ["-l", item.url]);

  child.stdout.on("data", (data) => {
    console.log(`Tidal-DL stdout:\n${data}`);
    item["output"] = [item["output"], data].join("\r\n");
    item["output"].substr(item["output"].length - 5000);
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.stderr.on("data", (data) => {
    console.error(`Tidal-DL stderr:\n${data}`);
    item["output"] = [item["output"], data].join("\r\n");
    item["output"].substr(item["output"].length - 5000);
    item["status"] = "error";
    item["error"] = true;
    item["loading"] = false;
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.on("close", (code) => {
    console.log(`Tidal-DL process exited with code ${code}`);
    if (code === 0) {
      item["status"] = item.output.includes("[ERR]") ? "error" : "downloaded";
      item["error"] = item.output.includes("[ERR]");
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
    }
  });

  child.on("error", (err) => {
    if (err) {
      console.error(`Tidal-DL Error:\n${err}`);
      item["output"] = [item["output"], `Tidal-DL Error:\n${err}`].join("\r\n");
      item["output"].substr(item["output"].length - 5000);
      item["status"] = "error";
      item["error"] = true;
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
    }
  });

  return child;
}

export async function moveSingleton(id: number, app: Express) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);
  try {
    console.log(`=== Move track ===`);

    const output_move = execSync(
      `cp -rf ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/download/tracks/`,
      { encoding: "utf-8" },
    );
    console.log("- Move tracks", output_move);
    item["output"] = [
      item["output"],
      `- Move tracks : \r\n${output_move}`,
    ].join("\r\n");
    item["output"].substr(item["output"].length - 5000);

    const output_clean = execSync(`rm -rf ${ROOT_PATH}/download/incomplete/*`, {
      encoding: "utf-8",
    });
    console.log("- Cleanup", output_clean);
    item["output"] = [item["output"], `- Cleanup : \r\n${output_clean}`].join(
      "\r\n",
    );
    item["output"].substr(item["output"].length - 5000);
    item["status"] = "finished";

    app.settings.processingList.actions.updateItem(item);
    return { save: true };
  } catch (err: unknown) {
    console.log("Error track moving : ", (err as Error).message);
    return { save: false };
  }
}
