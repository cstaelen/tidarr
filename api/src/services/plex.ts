// PLEX API
// https://www.plexopedia.com/plex-media-server/api/library/scan-partial/

export async function plexUpdate() {
  let output;

  try {
    if (process.env.ENABLE_PLEX_UPDATE === "true" && process.env.PLEX_URL && process.env.PLEX_TOKEN && process.env.PLEX_LIBRARY) {
      console.log(`=== Plex update ===`);

      const url = `${process.env.PLEX_URL}/library/sections/${process.env.PLEX_LIBRARY}/refresh?${process.env.PLEX_PATH ? `path=${encodeURIComponent(process.env.PLEX_PATH)}&`: ''}X-Plex-Token=${process.env.PLEX_TOKEN}`;
      console.log('URL:', url);

      const response = await fetch(url);

      let message = "=> Plex updated !"
      if (response.status !== 200) {
        message = `=> Plex update Error code: ${response.status} using url: ${url}`
        
      }
      return { error: response.status !== 200, output: message};
    } 
  } catch (err: any) {
    console.log("Error during Plex update : ", err.message);
    return { error: true, output: `Plex update error:\r\n${err.message}` };
  }
}
