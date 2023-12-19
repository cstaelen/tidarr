import { spawnSync, execSync } from "child_process";
import { Express } from "express"
import { ProcessingItemType } from "../types";
import { ROOT_PATH } from "../../constants";

export async function beets(id: number, app: Express) {
  const item: ProcessingItemType = app.settings.processingList.actions.getItem(id);
  let save = false;


  try {
    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      item["output"] = [item["output"], `=== Beets ===`].join("\r\n");

      const response = spawnSync(
        binary,
        [
          "-c",
          `${ROOT_PATH}/shared/beets-config.yml`,
          "-l",
          `${ROOT_PATH}/shared/beets/beets-library.blb`,
          "import",
          "-qC",
          `${ROOT_PATH}/download/incomplete`,
        ],
        { encoding: "utf-8" }
      );
      if (response.stdout) {
        console.log(`Beets output:\r\n${response.stdout}`);
        item["output"] = [item["output"], `Beets output:\r\n${response.stdout}`].join("\r\n");
        item['output'].substr(item['output'].length - 5000);

      } else if (response.stderr) {
        console.log(`Beets error:\r\n${response.stderr}`);
        item['status'] = 'error';
        item["output"] = [item["output"], `Beets output:\r\n${response.stderr}`].join("\r\n");
        item['output'].substr(item['output'].length - 5000);
      }
    }

    // MOVE FINISHED
    try {
      console.log(`=== Move processed items ===`);
      item["output"] = [item["output"], `=== Move processed items ===`].join("\r\n");
      item['output'].substr(item['output'].length - 5000);
      const output_move = execSync(
        `cp -rf ${ROOT_PATH}/download/incomplete/* ${ROOT_PATH}/download/albums/ >/dev/null`,
        { encoding: "utf-8" }
      );
      console.log(`- Move complete album\r\n${output_move}`);
      item["output"] = [item["output"], `- Move complete album\r\n${output_move}`].join("\r\n");
      item['output'].substr(item['output'].length - 5000);
      item['status'] = 'finished';
      save = true;
    } catch (e: any) {
      console.log(`- Error moving files:\r\n${e.message}`);
      item['status'] = 'error';
      item["output"] = [item["output"], `- Error moving files:\r\n${e.message}`].join("\r\n");
      item['output'].substr(item['output'].length - 5000);
    }
  } catch (err: any) {
    console.log(`Error during post processing :\r\n${err.message}`);
    item['status'] = 'error';
    item["output"] = [item["output"], `Error during post processing :\r\n${err.message}`].join("\r\n");
    item['output'].substr(item['output'].length - 5000);
    save = false;
  } finally {
    const output_clean = execSync(`rm -rf ${ROOT_PATH}/download/incomplete/* >/dev/null`, {
      encoding: "utf-8",
    });
    console.log("- Clean folder", output_clean);
    item["output"] = [item["output"], `- Clean folder"\r\n${output_clean}`].join("\r\n");
    item['output'].substr(item['output'].length - 5000);
    app.settings.processingList.actions.updateItem(item);
    return { save: save };
  }
}

export async function cleanFolder() {
  const output_clean = execSync(`rm -rf ${ROOT_PATH}/download/incomplete/* >/dev/null`, {
    encoding: "utf-8",
  });
  console.log("- Clean folder", output_clean);
}