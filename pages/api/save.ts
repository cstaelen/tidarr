import { spawn } from "child_process";
// const util = require('node:util');
// const spawn = util.promisify(require('child_process').spawn);

export default async function handler(req: Request, res: any) {
  const url = (req.body as any).url;
  // const binary = `/usr/bin/tidal-dl`;
  const binary = `/opt/homebrew/bin/tidal-dl`;
  const command = `${binary} -l ${url}`;
  console.log(`Executing: ${command}`);
  const child = spawn(binary, ['-l', url]);

  child.stdout.on('data', (data) => {
    console.log(`child stdout:\n${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`child stderr:\n${data}`);
  });

  console.log('returning');
  return {'save': true}
}