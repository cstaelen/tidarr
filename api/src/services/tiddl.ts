import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";

import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

export function tidalDL(id: string, app: Express, onFinish?: () => void) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  item["output"] = logs(item, `=== Tiddl ===`);

  const binary = "tiddl";
  const args: string[] = ["url", item.url, "download"];
  if (
    item.type !== "video" &&
    item.quality &&
    item.quality.toString() !== "null"
  ) {
    args.push("-q");
    args.push(item.quality);
  }

  if (item.type === "video") {
    args.push("-V");
  }

  item["output"] = logs(item, `Executing: ${binary} ${args.join(" ")}`);
  const child = spawn(binary, args);
  const signal = child.signalCode || undefined;
  child.stdout?.setEncoding("utf8");
  child.stdout?.on("data", (data: string) => {
    item["output"] = logs(item, data.replace(/[\r\n]+/gm, ""));
    item["process"] = child;
    if (data.includes("ERROR")) {
      child.emit("error", new Error(data));
      child.kill(signal);
    }
    app.settings.processingList.actions.updateItem(item);
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
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
    item["loading"] = false;
    app.settings.processingList.actions.updateItem(item);
    if (onFinish) onFinish();
  });

  child.on("error", (err) => {
    if (err) {
      item["output"] = logs(item, `Tiddl Error: ${err}`);
      item["status"] = "error";
      item["loading"] = false;
      app.settings.processingList.actions.updateItem(item);
      if (onFinish) onFinish();
    }
  });

  return child;
}

export function tidalToken(req: Request, res: Response) {
  const pythonProcess = spawn("tiddl", ["auth", "login"]);

  pythonProcess.stdout.on("data", (data) => {
    res.write(`data: ${data.toString()}\n\n`);
  });

  pythonProcess.stderr.on("data", (data) => {
    res.write(`data: ${data.toString()}\n\n`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      spawn("cp", [
        "-rf",
        "/root/tiddl.json",
        "/home/app/standalone/shared/tiddl.json",
      ]);
      res.write(`data: Authenticated!\n\n`);
    } else {
      res.write(`data: closing ${code}\n\n`);
    }
    console.log(`Python script exited with code ${code}`);
    res.end();
  });

  req.on("close", () => {
    pythonProcess.kill();
  });
}

export function deleteTiddlConfig() {
  try {
    spawnSync("tiddl", ["auth", "logout"]);
    spawnSync("cp", [
      "-rf",
      "/root/tiddl.json",
      "/home/app/standalone/shared/tiddl.json",
    ]);
  } catch (e) {
    console.log("delete tiddl config error:", e);
  }
}
