import { Page } from "@playwright/test";

import mockAlbum from "../mocks/album.json";
import mockArtist from "../mocks/artist.json";
import mockArtistPager from "../mocks/artist_pager.json";
import mockHome from "../mocks/home.json";
import mockMix from "../mocks/mix.json";
import mockPlaylist from "../mocks/playlist.json";
import mockPlaylistTracks from "../mocks/playlist_tracks.json";
import mockSearch from "../mocks/search.json";
import mockSearchPager from "../mocks/search_pager.json";
import mockTrack from "../mocks/track.json";

export async function mockTidalQueries(page: Page) {
  await page.route(
    "https://api.tidal.com/v1/pages/home?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockHome });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/pages/album?albumId=77610756&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockAlbum });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/playlists/0b5df380-47d3-48fe-ae66-8f0dba90b1ee?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockPlaylist });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/playlists/0b5df380-47d3-48fe-ae66-8f0dba90b1ee/items?limit=18&offset=0&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockPlaylistTracks });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/tracks/77610761?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockTrack });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/pages/mix?mixId=00166fec481604e645532e233b958b&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockMix });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/pages/artist?artistId=19368&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockArtist });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/pages/data/feddf2f1-0ea1-4663-8804-beaf21ace6a2?artistId=19368&limit=15&offset=15&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockArtistPager });
    },
  );
  await page.route(
    "https://api.tidal.com/v1/search?query=Nirvana&type=lossless&limit=18&offset=0&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockSearch });
    },
  );

  [
    "https://api.tidal.com/v1/search?query=Nirvana&type=lossless&limit=18&offset=18&countryCode=FR&deviceType=BROWSER&locale=en_US",
    "https://api.tidal.com/v1/search?query=Nirvana&type=lossless&limit=18&offset=36&countryCode=FR&deviceType=BROWSER&locale=en_US",
    "https://api.tidal.com/v1/search?query=Nirvana&type=lossless&limit=18&offset=54&countryCode=FR&deviceType=BROWSER&locale=en_US",
    "https://api.tidal.com/v1/search?query=Nirvana&type=lossless&limit=18&offset=72&countryCode=FR&deviceType=BROWSER&locale=en_US",
    "https://api.tidal.com/v1/search?query=Nirvana&type=lossless&limit=18&offset=90&countryCode=FR&deviceType=BROWSER&locale=en_US",
  ].forEach(async (url) => {
    await page.route(url, async (route) => {
      await route.fulfill({ json: mockSearchPager });
    });
  });
}

export async function mockRelease(page: Page, version = "0.0.0-testing") {
  await page.route("*/**/releases", async (route) => {
    const json = [
      {
        name: version,
        tag_name: version,
      },
    ];
    await route.fulfill({ json });
  });
}

export async function mockConfigAPI(page: Page) {
  await page.route("**/check", async (route) => {
    if (!process.env.IS_DOCKER) {
      const json = {
        noToken: false,
        output: "",
        parameters: {
          ENABLE_BEETS: "true",
          ENABLE_PLEX_UPDATE: "true",
          PLEX_URL: "http://plex.url",
          PLEX_LIBRARY: "3",
          PLEX_TOKEN: "abc-plex-token-xyz",
          PLEX_PATH: "/fodler/to/plex/music",
          ENABLE_GOTIFY: "true",
          GOTIFY_URL: "http://gotify.url",
          GOTIFY_TOKEN: "abc-gotify-token-xyz",
          TIDARR_VERSION: "0.0.0-testing",
        },
        tiddl_config: {
          auth: {
            country_code: "FR",
          },
        },
      };
      await route.fulfill({ json });
      return;
    }

    const response = await route.fetch();
    let json = await response.json();
    json = {
      ...json,
      noToken: false,
      parameters: { ...json.parameters, TIDARR_VERSION: "0.0.0-testing" },
      tiddl_config: {
        auth: {
          country_code: "FR",
        },
      },
    };
    await route.fulfill({ json });
  });
}

export async function mockAuthAPI(page: Page, token: string) {
  await page.route("*/**/is_auth_active", async (route) => {
    const json = { isAuthActive: true };
    await route.fulfill({ json });
  });

  await page.route("*/**/auth", async (route) => {
    const json = { accessGranted: true, token: token };
    await route.fulfill({ json });
  });

  await page.route("*/**/check", async (route) => {
    const json = { noToken: false };
    await route.fulfill({ json });
  });
}
