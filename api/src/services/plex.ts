// PLEX API
// https://www.plexopedia.com/plex-media-server/api/library/scan-partial/

export async function plexUpdate() {
  try {
    if (
      process.env.ENABLE_PLEX_UPDATE === "true" &&
      process.env.PLEX_URL &&
      process.env.PLEX_TOKEN &&
      process.env.PLEX_LIBRARY
    ) {
      console.log(`-------------------`);
      console.log(`🔄 Plex update     `);
      console.log(`-------------------`);

      const url = `${process.env.PLEX_URL}/library/sections/${process.env.PLEX_LIBRARY}/refresh?${process.env.PLEX_PATH ? `path=${encodeURIComponent(process.env.PLEX_PATH)}&` : ""}X-Plex-Token=${process.env.PLEX_TOKEN}`;
      console.log("URL:", url);

      const response = await fetch(url);

      let message = "✅ [PLEX] Library updated !";
      if (response.status !== 200) {
        message = `❌ [PLEX] Update Error code: ${response.status} using url: ${url}`;
      }
      return { error: response.status !== 200, output: message };
    }
  } catch (err: unknown) {
    console.log(
      "❌ [PLEX] Error during Plex update : ",
      (err as Error).message,
    );
    return {
      error: true,
      output: `❌ [PLEX] Update error:\r\n${(err as Error).message}`,
    };
  }
}
