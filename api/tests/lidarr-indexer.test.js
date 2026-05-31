const assert = require("node:assert/strict");
const test = require("node:test");

const tidalSearchAlbums = require("../dist/src/lidarr/utils/tidal-search-albums.js");
const {
  buildLidarrCapsXml,
  handleSearchRequest,
  resolveNewznabPagination,
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

function countItems(xml) {
  return (xml.match(/<item>/g) || []).length;
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

test("Newznab pagination defaults and clamps request params", () => {
  assert.deepEqual(resolveNewznabPagination({}), {
    offset: 0,
    limit: 50,
  });
  assert.deepEqual(resolveNewznabPagination({ offset: "4", limit: "5" }), {
    offset: 4,
    limit: 5,
  });
  assert.deepEqual(resolveNewznabPagination({ offset: "-1", limit: "500" }), {
    offset: 0,
    limit: 100,
  });
  assert.deepEqual(resolveNewznabPagination({ offset: "1.5", limit: "0" }), {
    offset: 0,
    limit: 100,
  });
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

test("search responses honor Newznab offset and limit", async (t) => {
  t.mock.method(tidalSearchAlbums, "searchTidalForLidarr", async () => [
    tidalAlbum("1", "Homework"),
    tidalAlbum("2", "Discovery"),
    tidalAlbum("3", "Random Access Memories"),
  ]);

  const res = createResponse();

  await handleSearchRequest(createRequest({ offset: "4", limit: "5" }), res, {
    searchType: "music",
    artist: "Daft Punk",
    album: "Discovery",
  });

  assert.match(res.body, /<newznab:response offset="4" total="12"\/>/);
  assert.equal(countItems(res.body), 5);
  assert.doesNotMatch(res.body, /Homework/);
  assert.match(res.body, /Discovery/);
  assert.match(res.body, /Random Access Memories/);
});

test("search responses keep total count when offset is past the final item", async (t) => {
  t.mock.method(tidalSearchAlbums, "searchTidalForLidarr", async () => [
    tidalAlbum("1", "Homework"),
    tidalAlbum("2", "Discovery"),
  ]);

  const res = createResponse();

  await handleSearchRequest(createRequest({ offset: "12", limit: "5" }), res, {
    searchType: "music",
    artist: "Daft Punk",
    album: "Discovery",
  });

  assert.match(res.body, /<newznab:response offset="12" total="8"\/>/);
  assert.equal(countItems(res.body), 0);
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
