import { spawn, execSync } from "child_process";
import { Express } from "express"
import { ProcessingItemType } from "../type";

export function tidalDL(id: number, app: Express) {
  const item: ProcessingItemType = app.settings.processingList.actions.getItem(id);
  item["output"] = [item["output"], `=== Tidal-DL ===`].join("\r\n");

  const command = `/usr/bin/tidal-dl -l ${item.url}`;
  console.log(`Executing: ${command}`);
  const child = spawn('/usr/bin/tidal-dl', ['-l', item.url]);

  child.stdout.on('data', (data) => {
    console.log(`Tidal-DL stdout:\n${data}`);
    item["output"] = [item["output"], data].join("\r\n");
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.stderr.on('data', (data) => {
    console.error(`Tidal-DL stderr:\n${data}`);
    item["output"] = [item["output"], data].join("\r\n");
    item["status"] = "error";
    item["process"] = child;
    app.settings.processingList.actions.updateItem(item);
  });

  child.on('close', (code) => {
    console.log(`Tidal-DL process exited with code ${code}`);
    if (code === 0) {
      item["status"] = item.output.includes("[ERR]") ? "error" : "downloaded";
      app.settings.processingList.actions.updateItem(item);
    }
  });

  child.on('error', (err) => {
    if (err) {
      console.error(`Tidal-DL Error:\n${err}`);
      item["output"] = [item["output"], err].join("\r\n");
      item["status"] = "error";
      app.settings.processingList.actions.updateItem(item);
    }
  });

  return child;
};

export async function moveSingleton() {
  try {
    console.log(`=== Move track ===`);

    const output_move = execSync("cp -rf ./download/incomplete/* ./download/tracks/", { encoding: "utf-8" });
    console.log('- Move tracks', output_move);
    const output_clean = execSync("rm -rf ./download/incomplete/*", { encoding: "utf-8" });
    console.log('- Cleanup', output_clean);

    return { save: true, output: output_move }
  } catch (err: any) {
    console.log('Error track moving : ', err.message);
    return { save: false, output: `Error track moving : ${err.message}` }
  }
}
