import { execSync } from "child_process";

export async function configureServer() {
  console.log(`=== Set config files ===`);
  console.log(`Executing: init.sh`);

  const output_config = await execSync("sh ./api/scripts/init.sh", { encoding: "utf-8" });
  console.log('Tidarr configuration :', output_config);

  return {
    noToken: output_config?.includes('No token found'),
    output: output_config,
  }
};