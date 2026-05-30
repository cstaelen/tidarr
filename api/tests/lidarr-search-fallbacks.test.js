const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildLidarrTidalSearchQueries,
  hasExactLidarrAlbumMatch,
  searchTidalAlbumsWithFallbacks,
} = require("../dist/src/lidarr/utils/lidarr-search.js");

function album(id, title, artistName = "Steve Singsalot") {
  return {
    id,
    title,
    artist: { name: artistName },
    audioQuality: "LOSSLESS",
    type: "album",
  };
}

test("builds Lidarr Tidal fallbacks for volume shorthand and comma-truncated albums", () => {
  const queries = buildLidarrTidalSearchQueries(
    "Steve Singsalot Label Selects, V.2",
    { artist: "Steve Singsalot", album: "Label Selects, V.2" },
  );

  assert.deepEqual(queries, [
    "Steve Singsalot Label Selects, V.2",
    "Steve Singsalot Label Selects, Vol. 2",
    "Steve Singsalot Label Selects",
  ]);
});

test("exact album and artist matches skip fallback fetches", async () => {
  const calls = [];
  const results = await searchTidalAlbumsWithFallbacks(
    "Steve Singsalot Label Selects, V.2",
    { artist: "Steve Singsalot", album: "Label Selects, V.2" },
    async (query) => {
      calls.push(query);
      return [album(1, "Label Selects, Vol. 2")];
    },
  );

  assert.deepEqual(calls, ["Steve Singsalot Label Selects, V.2"]);
  assert.deepEqual(results.map((result) => result.id), [1]);
});

test("artist mismatches prevent the exact-match gate", async () => {
  const calls = [];
  const resultsByQuery = new Map([
    [
      "Steve Singsalot Label Selects, V.2",
      [album(1, "Label Selects, Vol. 2", "Someone Else")],
    ],
  ]);

  assert.equal(
    hasExactLidarrAlbumMatch(
      resultsByQuery.get("Steve Singsalot Label Selects, V.2"),
      {
        artist: "Steve Singsalot",
        album: "Label Selects, V.2",
      },
    ),
    false,
  );

  await searchTidalAlbumsWithFallbacks(
    "Steve Singsalot Label Selects, V.2",
    { artist: "Steve Singsalot", album: "Label Selects, V.2" },
    async (query) => {
      calls.push(query);
      return resultsByQuery.get(query) || [];
    },
  );

  assert.deepEqual(calls, [
    "Steve Singsalot Label Selects, V.2",
    "Steve Singsalot Label Selects, Vol. 2",
    "Steve Singsalot Label Selects",
  ]);
});

test("stops fallback searches after a fallback returns an exact match", async () => {
  const calls = [];
  const resultsByQuery = new Map([
    ["Steve Singsalot Label Selects, V.2", [album(1, "Loose Result")]],
    [
      "Steve Singsalot Label Selects, Vol. 2",
      [album(2, "Label Selects, Vol. 2")],
    ],
  ]);

  const results = await searchTidalAlbumsWithFallbacks(
    "Steve Singsalot Label Selects, V.2",
    { artist: "Steve Singsalot", album: "Label Selects, V.2" },
    async (query) => {
      calls.push(query);
      return resultsByQuery.get(query) || [];
    },
  );

  assert.deepEqual(calls, [
    "Steve Singsalot Label Selects, V.2",
    "Steve Singsalot Label Selects, Vol. 2",
  ]);
  assert.deepEqual(
    results.map((result) => result.id),
    [1, 2],
  );
});

test("fallback fetch errors preserve already fetched albums", async () => {
  const calls = [];
  const results = await searchTidalAlbumsWithFallbacks(
    "Steve Singsalot Label Selects, V.2",
    { artist: "Steve Singsalot", album: "Label Selects, V.2" },
    async (query) => {
      calls.push(query);

      if (query !== "Steve Singsalot Label Selects, V.2") {
        throw new Error("rate limited");
      }

      return [album(1, "Loose Result")];
    },
  );

  assert.deepEqual(calls, [
    "Steve Singsalot Label Selects, V.2",
    "Steve Singsalot Label Selects, Vol. 2",
  ]);
  assert.deepEqual(results.map((result) => result.id), [1]);
});

test("fallback results merge duplicate album IDs once in first-seen order", async () => {
  const resultsByQuery = new Map([
    ["Steve Singsalot Label Selects, V.2", [album(1, "Loose Result")]],
    [
      "Steve Singsalot Label Selects, Vol. 2",
      [album(1, "Duplicate Result"), album(2, "Normalized Result")],
    ],
    [
      "Steve Singsalot Label Selects",
      [album(2, "Duplicate Fallback"), album(3, "Truncated Result")],
    ],
  ]);

  const results = await searchTidalAlbumsWithFallbacks(
    "Steve Singsalot Label Selects, V.2",
    { artist: "Steve Singsalot", album: "Label Selects, V.2" },
    async (query) => resultsByQuery.get(query) || [],
  );

  assert.deepEqual(
    results.map((result) => result.id),
    [1, 2, 3],
  );
  assert.equal(results[0].title, "Loose Result");
});

test("non-comma albums do not add comma-truncation queries", () => {
  const queries = buildLidarrTidalSearchQueries("Steve Singsalot Collection V.2", {
    artist: "Steve Singsalot",
    album: "Collection V.2",
  });

  assert.deepEqual(queries, [
    "Steve Singsalot Collection V.2",
    "Steve Singsalot Collection Vol. 2",
  ]);
});

test("comma truncation uses album context instead of the freeform query", () => {
  const queries = buildLidarrTidalSearchQueries(
    "Beethoven, Ludwig - Symphonies",
    { artist: "Beethoven, Ludwig", album: "Symphonies, Vol. 3" },
  );

  assert.deepEqual(queries, [
    "Beethoven, Ludwig - Symphonies",
    "Beethoven, Ludwig Symphonies",
  ]);
});
