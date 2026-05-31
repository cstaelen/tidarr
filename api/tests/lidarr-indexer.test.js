const assert = require("node:assert/strict");
const test = require("node:test");

const tidalSearchAlbums = require("../dist/src/lidarr/utils/tidal-search-albums.js");
const {
  buildLidarrCapsXml,
  handleSearchRequest,
} = require("../dist/src/lidarr/indexer.js");

function createRequest(query = {}) {
  return {
    protocol: "http",
    get: () => "localhost:8484",
    query,
    headers: {},
  };
}

function createResponse() {
  return {
    body: "",
    headers: {},
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

function tidalAlbum(id, title, artistName = "Daft Punk") {
  return {
    id,
    title,
    artist: { name: artistName },
    releaseDate: "2013-05-17",
    numberOfTracks: 13,
    audioQuality: "LOSSLESS",
    type: "album",
  };
}

test("Lidarr caps advertise raw audio search without generic search fallback", () => {
  const caps = buildLidarrCapsXml("http://localhost:8484");

  assert.match(
    caps,
    /<audio-search available="yes" supportedParams="q,artist,album,cat" searchEngine="raw"\/>/,
  );
  assert.doesNotMatch(caps, /<search\b/);
  assert.doesNotMatch(caps, /<music-search\b/);
});

test("music searches synthesize a query and preserve artist album context", async (t) => {
  const calls = [];

  t.mock.method(
    tidalSearchAlbums,
    "searchTidalForLidarr",
    async (query, context) => {
      calls.push({ query, context });
      return [tidalAlbum("34277251", "Random Access Memories")];
    },
  );

  const res = createResponse();

  await handleSearchRequest(createRequest(), res, {
    searchType: "music",
    artist: "Daft Punk",
    album: "Random Access Memories",
  });

  assert.deepEqual(calls, [
    {
      query: "Daft Punk Random Access Memories",
      context: {
        artist: "Daft Punk",
        album: "Random Access Memories",
      },
    },
  ]);
  assert.match(res.body, /<newznab:response offset="0" total="4"\/>/);
  assert.match(res.body, /Random Access Memories/);
});

test("generic search remains available as a compatibility path", async (t) => {
  const calls = [];

  t.mock.method(
    tidalSearchAlbums,
    "searchTidalForLidarr",
    async (query, context) => {
      calls.push({ query, context });
      return [tidalAlbum("1", "Discovery")];
    },
  );

  const res = createResponse();

  await handleSearchRequest(createRequest(), res, {
    searchType: "search",
    q: "Daft Punk",
  });

  assert.deepEqual(calls, [
    {
      query: "Daft Punk",
      context: {
        artist: undefined,
        album: undefined,
      },
    },
  ]);
  assert.match(res.body, /Discovery/);
});

test("missing query and artist album context preserves empty response behavior", async (t) => {
  t.mock.method(tidalSearchAlbums, "searchTidalForLidarr", async () => {
    throw new Error("search should not be called without a query");
  });

  const res = createResponse();

  await handleSearchRequest(createRequest(), res, {
    searchType: "music",
  });

  assert.match(res.body, /<newznab:response offset="0" total="1"\/>/);
  assert.match(res.body, /<title>test<\/title>/);
});
