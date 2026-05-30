const assert = require("node:assert/strict");
const test = require("node:test");

const {
  resolveLidarrTidalSearchLimit,
} = require("../dist/src/lidarr/utils/tidal-search-albums.js");

test("uses the default Lidarr Tidal search limit when unset", () => {
  assert.equal(resolveLidarrTidalSearchLimit(), 20);
});

test("uses valid Lidarr Tidal search limit overrides", () => {
  assert.equal(resolveLidarrTidalSearchLimit("50"), 50);
});

test("treats zero Lidarr Tidal search limit as the maximum", () => {
  assert.equal(resolveLidarrTidalSearchLimit("0"), 100);
});

test("clamps large Lidarr Tidal search limits to one hundred", () => {
  assert.equal(resolveLidarrTidalSearchLimit("500"), 100);
});

test("falls back for empty, decimal, text, and negative values", () => {
  assert.equal(resolveLidarrTidalSearchLimit(""), 20);
  assert.equal(resolveLidarrTidalSearchLimit("20.5"), 20);
  assert.equal(resolveLidarrTidalSearchLimit("many"), 20);
  assert.equal(resolveLidarrTidalSearchLimit("-1"), 20);
});
