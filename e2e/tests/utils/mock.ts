import { Page } from "@playwright/test";

import mockAlbum from "../mocks/album.json";
import mockArtist from "../mocks/artist.json";
import mockArtistPager from "../mocks/artist_pager.json";
import mockHome from "../mocks/home.json";
import mockMix from "../mocks/mix.json";
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
    "http://localhost:8484/proxy/v1/pages/home?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockHome });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/pages/album?countryCode=FR&deviceType=BROWSER&locale=en_US&albumId=77610756",
    async (route) => {
      await route.fulfill({ json: mockAlbum });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/playlists/0b5df380-47d3-48fe-ae66-8f0dba90b1ee?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockPlaylist });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/playlists/0b5df380-47d3-48fe-ae66-8f0dba90b1ee/items?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18",
    async (route) => {
      await route.fulfill({ json: mockPlaylistTracks });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/tracks/77610761?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockTrack });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/pages/mix?countryCode=FR&deviceType=BROWSER&locale=en_US&mixId=00166fec481604e645532e233b958b",
    async (route) => {
      await route.fulfill({ json: mockMix });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/pages/artist?artistId=19368&countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockArtist });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/pages/data/feddf2f1-0ea1-4663-8804-beaf21ace6a2?artistId=19368&countryCode=FR&deviceType=BROWSER&locale=en_US&limit=15&offset=15",
    async (route) => {
      await route.fulfill({ json: mockArtistPager });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/pages/my_collection_my_mixes?countryCode=FR&deviceType=BROWSER&locale=en_US",
    async (route) => {
      await route.fulfill({ json: mockMyMixes });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/playlistsAndFavoritePlaylists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyPlaylistsLastCreated });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/playlistsAndFavoritePlaylists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE_UPDATED",
    async (route) => {
      await route.fulfill({ json: mockMyPlaylistsSortUpdate });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/playlistsAndFavoritePlaylists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=ASC&order=NAME",
    async (route) => {
      await route.fulfill({ json: mockMyPlaylistsSortAlphabetical });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/favorites/albums?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteAlbums });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/favorites/artists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteArtists });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/favorites/tracks?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteTracks });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v2/favorites/mixes?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18",
    async (route) => {
      await route.fulfill({ json: mockMyFavoriteMixes });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/users/192283714/favorites/playlists?countryCode=FR&deviceType=BROWSER&locale=en_US&limit=18&orderDirection=DESC&order=DATE",
    async (route) => {
      await route.fulfill({ json: mockMyFavoritePlaylists });
    },
  );
  await page.route(
    "http://localhost:8484/proxy/v1/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&limit=18",
    async (route) => {
      await route.fulfill({ json: mockSearch });
    },
  );

  [
    "http://localhost:8484/proxy/v1/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=18&limit=18",
    "http://localhost:8484/proxy/v1/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=36&limit=18",
    "http://localhost:8484/proxy/v1/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=54&limit=18",
    "http://localhost:8484/proxy/v1/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=72&limit=18",
    "http://localhost:8484/proxy/v1/search?countryCode=FR&deviceType=BROWSER&locale=en_US&query=Nirvana&offset=90&limit=18",
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
        PUID: "",
        PGID: "",
        UMASK: "",
        ENABLE_APPRISE_API: "",
        APPRISE_API_ENDPOINT: "",
        APPRISE_API_TAG: "",
        ENABLE_TIDAL_PROXY: "true",
      },
      tiddl_config: {
        auth: {
          user_id: 192283714,
          country_code: "FR",
        },
        download: {
          quality: "high",
          path: "/home/app/standalone/download/incomplete",
          threads: 4,
          singles_filter: "none",
          embed_lyrics: false,
          download_video: true,
        },
        cover: {
          save: true,
          size: 1280,
          filename: "cover.jpg",
        },
        template: {
          track: "tracks/{artist}/{artist} - {title}",
          video: "videos/{artist}/{artist} - {title}",
          album: "albums/{album_artist}/{year} - {album}/{number:02d}. {title}",
          playlist:
            "playlists/{playlist}/{playlist_number:02d}. {artist} - {title}",
        },
      },
    };
    await route.fulfill({ json });
    return;
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
