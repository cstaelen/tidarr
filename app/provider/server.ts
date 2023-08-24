"use server";

import { spawnSync, execSync } from "child_process";

export async function tidalDL(urlToSave: string) {
  try {
    const binary = '/usr/bin/tidal-dl';
    const command = `${binary} -l ${urlToSave}`;
    console.log(`=== Tidal-DL ===`);
    console.log(`Executing: ${command}`);

    const output = spawnSync(binary, ['-l', urlToSave], {encoding: 'utf-8'});
    console.log('output', output);
    return {save: true, output: output}
  } catch (err: any) {
    console.log('Error using Tidal DL : ', err);
    return {save: false}
  }
}

export async function beets() {
  try {

    if (process.env.ENABLE_BEETS === "true") {
      const binary = `beet`;
      console.log(`=== Beets ===`);
      console.log(`Executing: ${binary}`);

      const output = spawnSync(binary, [
        '-c', "./settings/beets-config.yml",
        "-l", "./settings/beets/beets-library.blb" ,
        "-d", "./download/albums" ,
        "import", "-qC" , "./download/incomplete"
      ], {encoding: 'utf-8'});
      console.log('Beets output:\r\n', output);
      return {save: true, output: output}  
    } else {
      const output_move = execSync("cp -rf ./download/incomplete/* ./download/albums/", {encoding: "utf-8"});
      console.log('- Move complete album', output_move);
      const output_clean = execSync("rm -rf ./download/incomplete/*", {encoding: "utf-8"});
      console.log('- Clean folder', output_clean);
      return {save: true, output: output_move}
    }
    
  } catch (err: any) {
    console.log('Error during beets tagging : ', err);
    return {save: false, output: err}
  } finally {
    const output_clean = execSync("rm -rf ./download/incomplete/*", {encoding: "utf-8"});
    console.log('- Clean folder', output_clean);
  }
}

export async function moveSingleton() {
  try {
    console.log(`=== Move track ===`);

    const output_move = execSync("cp -rf ./download/incomplete/* ./download/tracks/", {encoding: "utf-8"});
    console.log('- Move tracks', output_move);
    const output_clean = execSync("rm -rf ./download/incomplete/*", {encoding: "utf-8"});
    console.log('- Clean folder', output_clean);
    
    return {save: true, output: output_move}
  } catch (err: any) {
    console.log('Error track moving : ', err);
    return {save: false}
  }
}

