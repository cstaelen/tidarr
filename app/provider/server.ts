"use server";

import { spawnSync } from "child_process";

export async function tidalDL(urlToSave: string) {
  try {
    const binary = process.env.NEXT_PUBLIC_TIDAL_BINARY || '/usr/bin/tidal-dl';
    const command = `${binary} -l ${urlToSave}`;
    console.log(`Executing: ${command}`);

    const output = spawnSync(binary, ['-l', urlToSave], {encoding: 'utf-8'});
    console.log('output', output);
    return {save: true, output: output}
  } catch (err: any) {
    console.log('error', err);
    return {save: false}
  }
}