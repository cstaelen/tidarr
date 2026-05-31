const assert = require("node:assert/strict");
const test = require("node:test");

const {
  filterLidarrIndexerQualitiesForAlbum,
  generateNewznabItem,
  mapQualityToTiddl,
  resolveLidarrIndexerQualities,
} = require("../dist/src/lidarr/utils/lidarr.js");

const ALL_QUALITIES = ["hires_lossless", "lossless", "high", "low"];

test("returns all Lidarr indexer qualities when no category is requested", () => {
  assert.deepEqual(resolveLidarrIndexerQualities(), [
    "hires_lossless",
    "lossless",
    "high",
    "low",
  ]);
});

test("does not narrow when Lidarr requests the parent audio category only", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3000"), [
    "hires_lossless",
    "lossless",
    "high",
    "low",
  ]);
});

test("infers AAC-320 from the MP3 category", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3010"), ["high"]);
});

test("infers lossless variants from the lossless category", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3040"), [
    "hires_lossless",
    "lossless",
  ]);
});

test("infers AAC-96 from the other audio category", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3050"), ["low"]);
});

test("supports comma-separated category query parameters", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3010,3050"), [
    "high",
    "low",
  ]);
});

test("supports repeated category query parameters", () => {
  assert.deepEqual(resolveLidarrIndexerQualities(["3040", "3050"]), [
    "hires_lossless",
    "lossless",
    "low",
  ]);
});

test("parent audio category returns all qualities even with a specific category", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3000,3040"), [
    "hires_lossless",
    "lossless",
    "high",
    "low",
  ]);
});

test("unknown audio subcategories do not silently suppress all results", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("3020"), [
    "hires_lossless",
    "lossless",
    "high",
    "low",
  ]);
});

test("ignores unsupported non-audio categories", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("2000"), [
    "hires_lossless",
    "lossless",
    "high",
    "low",
  ]);
});

test("ignores non-audio categories when audio categories are also present", () => {
  assert.deepEqual(resolveLidarrIndexerQualities("2000,3040"), [
    "hires_lossless",
    "lossless",
  ]);
});

test("keeps direct download Tiddl qualities unchanged", () => {
  assert.equal(mapQualityToTiddl("max"), "max");
  assert.equal(mapQualityToTiddl("high"), "high");
  assert.equal(mapQualityToTiddl("normal"), "normal");
  assert.equal(mapQualityToTiddl("low"), "low");
});

test("maps non-conflicting legacy indexer quality tokens to Tiddl qualities", () => {
  assert.equal(mapQualityToTiddl("hires_lossless"), "max");
  assert.equal(mapQualityToTiddl("lossless"), "high");
});

test("keeps unknown direct download quality compatible with previous fallback", () => {
  assert.equal(mapQualityToTiddl("unknown"), "high");
});

test("quality hints allow hi-res lossless when Tidal tags include HIRES_LOSSLESS", () => {
  assert.deepEqual(
    filterLidarrIndexerQualitiesForAlbum(
      {
        audioQuality: "LOSSLESS",
        mediaMetadata: { tags: ["LOSSLESS", "HIRES_LOSSLESS"] },
      },
      ALL_QUALITIES,
    ),
    ["hires_lossless", "lossless", "high", "low"],
  );
});

test("quality hints keep FLAC but exclude 24-bit without hi-res tags", () => {
  assert.deepEqual(
    filterLidarrIndexerQualitiesForAlbum(
      { audioQuality: "LOSSLESS" },
      ALL_QUALITIES,
    ),
    ["lossless", "high", "low"],
  );
});

test("quality hints exclude FLAC variants for high-only albums", () => {
  assert.deepEqual(
    filterLidarrIndexerQualitiesForAlbum(
      { audioQuality: "HIGH" },
      ALL_QUALITIES,
    ),
    ["high", "low"],
  );
});

test("unknown or missing quality hints do not advertise 24-bit", () => {
  assert.deepEqual(
    filterLidarrIndexerQualitiesForAlbum(
      { audioQuality: "surprise" },
      ALL_QUALITIES,
    ),
    ["high", "low"],
  );
  assert.deepEqual(filterLidarrIndexerQualitiesForAlbum({}, ALL_QUALITIES), [
    "high",
    "low",
  ]);
});

test("generated Newznab download URLs use Tiddl quality values", () => {
  const req = {
    protocol: "http",
    get: () => "localhost:8484",
    query: {},
    headers: {},
  };
  const album = {
    id: "123",
    title: "Example Album",
    artist: { name: "Example Artist" },
    releaseDate: "2024-01-01",
    numberOfTracks: 1,
    audioQuality: "LOSSLESS",
    type: "album",
  };

  const hiresItem = generateNewznabItem(album, req, "hires_lossless");
  assert.match(hiresItem, /\/api\/lidarr\/download\/123\/max/);
  assert.match(hiresItem, /FLAC 24bit/);

  const highItem = generateNewznabItem(album, req, "high");
  assert.match(highItem, /\/api\/lidarr\/download\/123\/normal/);
  assert.match(highItem, /AAC-320/);
});

test("generated Newznab items without quality hints fall back to AAC-320", () => {
  const req = {
    protocol: "http",
    get: () => "localhost:8484",
    query: {},
    headers: {},
  };
  const album = {
    id: "123",
    title: "Example Album",
    artist: { name: "Example Artist" },
    releaseDate: "2024-01-01",
    numberOfTracks: 1,
    type: "album",
  };

  const item = generateNewznabItem(album, req);

  assert.match(item, /\/api\/lidarr\/download\/123\/normal/);
  assert.match(item, /AAC-320/);
  assert.doesNotMatch(item, /FLAC/);
});
