import { execSync } from "child_process";

export async function appriseApiPush(title: string, type: string) {
  if (
    process.env.ENABLE_APPRISE_API !== "true" ||
    !process.env.APPRISE_API_ENDPOINT
  ) {
    return;
  }

  console.log(`=== Apprise API push ===`);

  try {
    const url = process.env.APPRISE_API_ENDPOINT;
    const pushTitle = `New ${type} added`;
    const message = `${title} added to music library`;
    const response = await execSync(
      `curl -d '{"body":"${message}", "title":"${pushTitle}","tag":"tidarr"}' -H "Content-Type: application/json" ${url}`,
      { encoding: "utf-8" },
    );

    return {
      error: false,
      output: `=> Apprise API success output:\r\n${response}`,
    };
  } catch (e: unknown) {
    return {
      error: true,
      output: `=> Apprise API Error:\r\n${(e as Error).message}`,
    };
  }
}
