import { spawnSync, execSync } from "child_process";

export async function beets() {
  const output = [];
  let save = false;

  try {

    // BEETS
    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;

      output.push(`=== Beets ===`);

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
      if (response.stdout) {
        output.push(`Beets output:\r\n${response.stdout}`);
      } else if (response.stderr) {
        output.push(`Beets error:\r\n${response.stderr}`);
      }
    } 

    // MOVE FINISHED
    try {
      output.push(`=== Move processed items ===`);
      const output_move = execSync(
        "cp -rf ./download/incomplete/* ./download/albums/ >/dev/null",
        { encoding: "utf-8" }
      );
      output.push(`- Move complete album\r\n${output_move}`);
    } catch(e: any) {
      output.push(`- Error moving files:\r\n${e.message}`);
    }

    save = true;

    return { save: true, output: `${output.join("\r\n")}` };
  
  } catch (err: any) {
    output.push(`Error during beets tagging :\r\n${err.message}`);
    save = false;
  } finally {
    const output_clean = execSync("rm -rf ./download/incomplete/* >/dev/null", {
      encoding: "utf-8",
    });
    console.log("- Clean folder", output_clean);

    return { save: save, output: `${output.join("\r\n")}` };
  }
}
