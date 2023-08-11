"use server";

import { spawnSync, spawn } from "child_process";

export async function tidalDL(urlToSave: string) {
  try {
    const binary = process.env.NEXT_PUBLIC_TIDAL_BINARY || '/usr/bin/tidal-dl';
    const command = `${binary} -l ${urlToSave}`;
    console.log(`Executing: ${command}`);

    // const child = spawn(binary, ['-l', urlToSave]);
  
    // child.stdout.on('data', (data) => {
    //   console.log(`child stdout:\n${data}`);
    // });
  
    // child.stderr.on('data', (data) => {
    //   console.error(`child stderr:\n${data}`);
    // });

    const output = spawnSync(binary, ['-l', urlToSave], {encoding: 'utf-8'});
    console.log('output', output);
    return {save: true, output: output}
  } catch {
    return {save: false}
  }
}