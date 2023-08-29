"use server";

import { execSync } from "child_process";

export async function configureServer() {
    console.log(`=== Set config files ===`);
    console.log(`Executing: entrypoint.sh`);

    const output_config = await execSync("sh ./settings/entrypoint.sh", {encoding: "utf-8"});
    console.log('Tidarr configuration :', output_config);

    return {
        noToken: output_config?.includes('Token not found'),
        output: output_config,
    }
};