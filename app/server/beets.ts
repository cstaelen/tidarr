"use server";

import { spawnSync, execSync } from "child_process";

export async function beets() {
  let output;

  try {
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;
      console.log(`=== Beets ===`);
      console.log(`Executing: ${binary}`);

      const response = spawnSync(
        binary,
        [
          "-c",
          "./shared/beets-config.yml",
          "-l",
          "./shared/beets/beets-library.blb",
          "import",
          "-qC",
          "./download/incomplete",
        ],
        { encoding: "utf-8" }
      );
      console.log("Beets output:\r\n", response);
      output = response;
    } 

    const output_move = execSync(
      "cp -rf ./download/incomplete/* ./download/albums/",
      { encoding: "utf-8" }
    );
    console.log("- Move complete album", output_move);

    return { save: true, output: `${output}\r\n${output_move}` };

  } catch (err: any) {
    console.log("Error during beets tagging : ", err);
    return { save: false, output: err };
  } finally {
    const output_clean = execSync("rm -rf ./download/incomplete/*", {
      encoding: "utf-8",
    });
    console.log("- Clean folder", output_clean);
  }
}
