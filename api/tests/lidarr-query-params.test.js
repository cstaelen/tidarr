const assert = require("node:assert/strict");
const test = require("node:test");

const { getLidarrQueryParam } = require("../dist/src/routes/lidarr.js");

test("Lidarr route query params keep plain strings", () => {
  assert.equal(getLidarrQueryParam("Label Selects"), "Label Selects");
});

test("Lidarr route query params use the first string from arrays", () => {
  assert.equal(
    getLidarrQueryParam(["Radiohead", "Thom Yorke"]),
    "Radiohead",
  );
});

test("Lidarr route query params ignore object values", () => {
  assert.equal(getLidarrQueryParam({ nested: "value" }), undefined);
});
