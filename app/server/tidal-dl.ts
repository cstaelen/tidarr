"use server";

import { spawnSync, execSync } from "child_process";

export async function tidalDL(urlToSave: string) {
  const output = [];
  output.push(`=== Tidal-DL ===`);

  try {
    const binary = '/usr/bin/tidal-dl';
    const command = `${binary} -l ${urlToSave}`;
    output.push(`Executing: ${command}`);

    const response = spawnSync(binary, ['-l', urlToSave], {encoding: 'utf-8'});

    if (response.stdout) {
      console.log("Tidal-DL output:\r\n", response.stdout);
      output.push(`Tidal-DL output:\r\n"${response.stdout}`);
    }
    if (response.stderr) {
      console.log("Tidal-DL error:\r\n", response.stderr);
      output.push(`Tidal-DL error:\r\n"${response.stderr}`);
    }
    return {save: true, output: output.join("\r\n")}
  } catch (err: any) {
    console.log('Error using Tidal DL : ', err.message);
    output.push(`Tidal-DL error:\r\n"${err.message}`);
    return {save: false, output: output.join("\r\n")}
  }
}

export async function moveSingleton() {
    try {
      console.log(`=== Move track ===`);
  
      const output_move = execSync("cp -rf ./download/incomplete/* ./download/tracks/", {encoding: "utf-8"});
      console.log('- Move tracks', output_move);
      const output_clean = execSync("rm -rf ./download/incomplete/*", {encoding: "utf-8"});
      console.log('- Cleanup', output_clean);
      
      return {save: true, output: output_move}
    } catch (err: any) {
      console.log('Error track moving : ', err.message);
      return {save: false, output: `Error track moving : ${err.message}`}
    }
  }
  