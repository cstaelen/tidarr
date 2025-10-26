import { spawn, spawnSync } from "child_process";
import { Express, Request, Response } from "express";

import { ROOT_PATH } from "../../constants";
import { logs } from "../helpers/jobs";
import { ProcessingItemType } from "../types";

export function tidalDL(id: string, app: Express, onFinish?: () => void) {
  const item: ProcessingItemType =
    app.settings.processingList.actions.getItem(id);

  if (!item) {
    console.error(`tidalDL: Item with id ${id} not found in processing list`);
    if (onFinish) onFinish();
    return;
  }

  logs(item, `=== Tiddl ===`, app);

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

  logs(
    item,
    `Executing: TIDDL_PATH=${ROOT_PATH}/shared ${binary} ${args.join(" ")}`,
    app,
  );

  const child = spawn(binary, args, {
    env: { ...process.env, TIDDL_PATH: `${ROOT_PATH}/shared` },
  });

  const signal = child.signalCode || undefined;
  child.stdout?.setEncoding("utf8");
  child.stdout?.on("data", (data: string) => {
    logs(item, data.replace(/[\r\n]+/gm, ""), app);
    item["process"] = child;
    if (data.includes("ERROR") && !data.includes("Can not add metadata to")) {
      child.emit("error", new Error(data));
      child.kill(signal);
    }
    app.settings.processingList.actions.updateItem(item);
  });

  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (data) => {
    logs(item, `Tiddl: ${data}`, app);
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.on("close", (code) => {
    const currentOutput = app.settings.processingList.actions.getItemOutput(
      item.id,
    );

    if (
      currentOutput.includes(`User does not have a valid session`) ||
      currentOutput.includes(`"token": token["access_token"]`)
    ) {
      console.log("LOGOUT");
      code = 401;
      deleteTiddlConfig();
    }

    const isDownloaded =
      currentOutput.includes("can't save playlist m3u file") || code === 0;

    logs(item, `Tiddl process exited with code  ${code}`, app);
    item["status"] = isDownloaded ? "downloaded" : "error";
    item["loading"] = false;
    app.settings.processingList.actions.updateItem(item);
    if (onFinish) onFinish();
  });

  child.on("error", (err) => {
    if (err) {
      logs(item, `Tiddl Error: ${err}`, app);
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
