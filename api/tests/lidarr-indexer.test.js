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

function tidalAlbum(id, title, artistName = "Daft Punk", overrides = {}) {
  return {
    id,
    title,
    artist: { name: artistName },
    releaseDate: "2013-05-17",
    numberOfTracks: 13,
    audioQuality: "LOSSLESS",
    type: "album",
    ...overrides,
  };
}

function countItems(xml) {
  return (xml.match(/<item>/g) || []).length;
}

function countOccurrences(xml, value) {
  return xml.split(value).length - 1;
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
  assert.match(res.body, /<newznab:response offset="0" total="3"\/>/);
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

  assert.match(res.body, /<newznab:response offset="4" total="9"\/>/);
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

  assert.match(res.body, /<newznab:response offset="12" total="6"\/>/);
  assert.equal(countItems(res.body), 0);
});

test("lossless category returns only Tidal-hinted lossless variants per album", async (t) => {
  t.mock.method(tidalSearchAlbums, "searchTidalForLidarr", async () => [
    tidalAlbum("1", "Lossless Album"),
    tidalAlbum("2", "Hi Res Album", "Daft Punk", {
      mediaMetadata: { tags: ["LOSSLESS", "HIRES_LOSSLESS"] },
    }),
    tidalAlbum("3", "High Album", "Daft Punk", {
      audioQuality: "HIGH",
    }),
  ]);

  t.mock.method(
    tidalSearchAlbums,
    "fetchAlbumTrackQualitySummary",
    async () => ({ trackCount: 13, hiResTrackCount: 13 }),
  );

  const res = createResponse();

  await handleSearchRequest(createRequest({ cat: "3040" }), res, {
    searchType: "music",
    artist: "Daft Punk",
    album: "Discovery",
  });

  assert.match(res.body, /<newznab:response offset="0" total="3"\/>/);
  assert.equal(countItems(res.body), 3);
  assert.equal(countOccurrences(res.body, "Lossless Album"), 3);
  assert.equal(countOccurrences(res.body, "Hi Res Album"), 6);
  assert.doesNotMatch(res.body, /High Album/);
  assert.match(res.body, /Hi Res Album.*FLAC 24bit/);
  assert.match(res.body, /\/api\/lidarr\/download\/2\/max/);
});

test("FLAC 24bit results require all album tracks to carry hi-res hints", async (t) => {
  t.mock.method(tidalSearchAlbums, "searchTidalForLidarr", async () => [
    tidalAlbum("1", "Mixed Max Album", "Daft Punk", {
      mediaMetadata: { tags: ["LOSSLESS", "HIRES_LOSSLESS"] },
    }),
    tidalAlbum("2", "Full Max Album", "Daft Punk", {
      mediaMetadata: { tags: ["LOSSLESS", "HIRES_LOSSLESS"] },
    }),
  ]);

  t.mock.method(
    tidalSearchAlbums,
    "fetchAlbumTrackQualitySummary",
    async (albumId) =>
      albumId === "1"
        ? { trackCount: 2, hiResTrackCount: 1 }
        : { trackCount: 2, hiResTrackCount: 2 },
  );

  const res = createResponse();

  await handleSearchRequest(createRequest({ cat: "3040" }), res, {
    searchType: "music",
    artist: "Daft Punk",
    album: "Discovery",
  });

  assert.match(res.body, /<newznab:response offset="0" total="3"\/>/);
  assert.equal(countItems(res.body), 3);
  assert.match(res.body, /Mixed Max Album.*FLAC/);
  assert.doesNotMatch(res.body, /Mixed Max Album.*FLAC 24bit/);
  assert.doesNotMatch(res.body, /\/api\/lidarr\/download\/1\/max/);
  assert.match(res.body, /Full Max Album.*FLAC 24bit/);
  assert.match(res.body, /\/api\/lidarr\/download\/2\/max/);
});

test("LIDARR_DISABLE_MAX_RESULTS suppresses FLAC 24bit search results", async (t) => {
  const originalDisableMaxResults = process.env.LIDARR_DISABLE_MAX_RESULTS;
  process.env.LIDARR_DISABLE_MAX_RESULTS = "true";
  t.after(() => {
    if (originalDisableMaxResults === undefined) {
      delete process.env.LIDARR_DISABLE_MAX_RESULTS;
    } else {
      process.env.LIDARR_DISABLE_MAX_RESULTS = originalDisableMaxResults;
    }
  });

  t.mock.method(tidalSearchAlbums, "searchTidalForLidarr", async () => [
    tidalAlbum("1", "Hi Res Album", "Daft Punk", {
      mediaMetadata: { tags: ["LOSSLESS", "HIRES_LOSSLESS"] },
    }),
  ]);
  t.mock.method(tidalSearchAlbums, "fetchAlbumTrackQualitySummary", async () => {
    throw new Error("track quality summary should not be fetched");
  });

  const res = createResponse();

  await handleSearchRequest(createRequest({ cat: "3040" }), res, {
    searchType: "music",
    artist: "Daft Punk",
    album: "Discovery",
  });

  assert.match(res.body, /<newznab:response offset="0" total="1"\/>/);
  assert.equal(countItems(res.body), 1);
  assert.match(res.body, /Hi Res Album.*FLAC/);
  assert.doesNotMatch(res.body, /FLAC 24bit/);
  assert.doesNotMatch(res.body, /\/api\/lidarr\/download\/1\/max/);
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
