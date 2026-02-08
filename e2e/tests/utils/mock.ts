import { Page } from "@playwright/test";

import mockAlbum from "../mocks/album.json";
import mockArtist from "../mocks/artist.json";
import mockArtistPager from "../mocks/artist_pager.json";
import mockHome from "../mocks/home.json";
import mockMix from "../mocks/mix.json";
import mockMixVideos from "../mocks/mix_videos.json";
import mockMyFavoriteAlbums from "../mocks/my_favorite_albums.json";
import mockMyFavoriteArtists from "../mocks/my_favorite_artists.json";
import mockMyFavoriteMixes from "../mocks/my_favorite_mixes.json";
import mockMyFavoritePlaylists from "../mocks/my_favorite_playlists.json";
import mockMyFavoriteTracks from "../mocks/my_favorite_tracks.json";
import mockMyMixes from "../mocks/my_mixes.json";
import mockMyPlaylistsSortAlphabetical from "../mocks/my_playlists_alphabetical.json";
import mockMyPlaylistsLastCreated from "../mocks/my_playlists_last_created.json";
import mockMyPlaylistsSortUpdate from "../mocks/my_playlists_last_updated.json";
import mockPlaylist from "../mocks/playlist.json";
import mockPlaylistTracks from "../mocks/playlist_tracks.json";
import mockSearch from "../mocks/search.json";
import mockSearchPager from "../mocks/search_pager.json";
import mockTrack from "../mocks/track.json";

export async function mockTidalQueries(page: Page) {
  await page.route(
    "**/proxy/tidal/v1/pages/home?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockHome });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/home?countryCode=EN&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockHome });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/album?countryCode=FR&deviceType=BROWSER&locale=en_US&albumId=77610756",
    async (route) => {
      await route.fulfill({ json: mockAlbum });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/playlists/0b5df380-47d3-48fe-ae66-8f0dba90b1ee?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockPlaylist });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/playlists/0b5df380-47d3-48fe-ae66-8f0dba90b1ee/items?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18",
    async (route) => {
      await route.fulfill({ json: mockPlaylistTracks });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/tracks/77610761?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockTrack });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/mix?countryCode=FR&deviceType=BROWSER&locale=en_US&mixId=00166fec481604e645532e233b958b",
    async (route) => {
      await route.fulfill({ json: mockMix });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/mix?countryCode=FR&deviceType=BROWSER&locale=en_US&mixId=0041ea97471dd336fde017d66d76cb",
    async (route) => {
      await route.fulfill({ json: mockMixVideos });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/artist?artistId=19368&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockArtist });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/data/feddf2f1-0ea1-4663-8804-beaf21ace6a2?artistId=19368&countryCode=FR&deviceType=BROWSER&locale=en_US&limit=15&offset=15",
    async (route) => {
      await route.fulfill({ json: mockArtistPager });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/pages/my_collection_my_mixes?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockMyMixes });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/playlistsAndFavoritePlaylists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyPlaylistsLastCreated });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/playlistsAndFavoritePlaylists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE_UPDATED",
    async (route) => {
      await route.fulfill({ json: mockMyPlaylistsSortUpdate });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/playlistsAndFavoritePlaylists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=ASC&order=NAME",
    async (route) => {
      await route.fulfill({ json: mockMyPlaylistsSortAlphabetical });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/favorites/albums?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteAlbums });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/favorites/artists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteArtists });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/favorites/tracks?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteTracks });
    },
  );
  await page.route(
    "**/proxy/tidal/v2/favorites/mixes?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteMixes });
    },
  );
  await page.route(
    "**/proxy/tidal/v1/users/192283714/favorites/playlists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyFavoritePlaylists });
    },
  );
  await page.route(
    "**/proxy/tidal/v2/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&limit=18",
    async (route) => {
      await route.fulfill({ json: mockSearch });
    },
  );

  [
    "**/proxy/tidal/v2/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=18&limit=18",
    "**/proxy/tidal/v2/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=36&limit=18",
    "**/proxy/tidal/v2/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=54&limit=18",
    "**/proxy/tidal/v2/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=72&limit=18",
    "**/proxy/tidal/v2/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=90&limit=18",
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

export async function mockConfigAPI(
  page: Page,
  customSettings?: Record<string, object | string | boolean>,
) {
  await page.unroute("**/settings");
  await page.route("**/settings", async (route) => {
    // Fetch real config from the container
    const realResponse = await route.fetch();
    const realConfig = await realResponse.json();

    const json = {
      ...realConfig,
      noToken: false,
      ...customSettings,
      parameters: {
        ...realConfig?.parameters,
        ...(customSettings?.parameters as object),
      },
      tiddl_config: {
        ...realConfig?.tiddl_config,
        ...(customSettings?.tiddl_config as object),
        auth: {
          token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_at: 1234567890,
          user_id: "192283714",
          country_code: "FR",
        },
      },
    };
    await route.fulfill({ json });
    return;
  });
}

export async function mockItemOutputSSE(page: Page, quality = "high") {
  await page.route("**/stream-item-output/*", async (route) => {
    const itemId = route.request().url().split("/").pop();
    const mockOutput = `=== Tiddl ===\r\nExecuting: tiddl url download -q ${quality}\r\nDownload completed successfully`;

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: `data: ${JSON.stringify({ id: itemId, output: mockOutput })}\n\n`,
    });
  });
}
