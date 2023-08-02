// @TODO : should be remove later
import { spawn } from "child_process";
// const util = require('node:util');
// const spawn = util.promisify(require('child_process').spawn);

export default async function handler(req: Request, res: any) {
  const url = (req.body as any).url;
  const binary = process.env.NEXT_PUBLIC_TIDAL_BINARY || '/usr/bin/tidal-dl';
  const command = `${binary} -l ${url}`;
  console.log(`Executing: ${command}`);

  try {
    const child = spawn(binary, ['-l', url]);

    child.stdout.on('data', (data) => {
      console.log(`child stdout:\n${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`child stderr:\n${data}`);
    });

    console.log('returning');
    return {save: true}
  } catch {
    return {save: false}
  }
}