import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, test } from "node:test";

import { TidalAuth } from "../types";

import {
  completePkceLogin,
  createTidalProfilePaths,
  getAtmosAuth,
  getTiddlEnvironment,
  isPkceAuth,
  needsTokenRefresh,
  preserveLegacyAuthForAtmos,
  refreshPkceAuth,
  selectTidalProfile,
  startPkceLogin,
  TIDAL_PKCE_CLIENT_ID,
} from "./tidal-pkce";

const temporaryDirectories: string[] = [];

function createTemporaryProfile() {
  const root = mkdtempSync(join(tmpdir(), "tidarr-pkce-test-"));
  temporaryDirectories.push(root);
  return createTidalProfilePaths(root);
}

function createAuth(overrides: Partial<TidalAuth> = {}): TidalAuth {
  return {
    token: "access-token",
    refresh_token: "refresh-token",
    expires_at: 2_000,
    user_id: "123",
    country_code: "IT",
    ...overrides,
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("PKCE login", () => {
  test("binds the authorization request to its returned OAuth state", () => {
    const { loginId, loginUrl } = startPkceLogin();
    const url = new URL(loginUrl);

    assert.equal(url.origin, "https://login.tidal.com");
    assert.equal(url.searchParams.get("state"), loginId);
    assert.equal(url.searchParams.get("client_id"), TIDAL_PKCE_CLIENT_ID);
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.ok(url.searchParams.get("code_challenge"));
  });

  test("rejects a missing or mismatched state before exchanging a code", async () => {
    const { loginId } = startPkceLogin();

    await assert.rejects(
      completePkceLogin(
        loginId,
        "https://tidal.com/android/login/auth?code=test-code",
      ),
      /state is missing or does not match/,
    );
    await assert.rejects(
      completePkceLogin(
        loginId,
        "https://tidal.com/android/login/auth?code=test-code&state=wrong",
      ),
      /state is missing or does not match/,
    );
  });

  test("rejects authorization codes pasted from another redirect target", async () => {
    const { loginId } = startPkceLogin();

    await assert.rejects(
      completePkceLogin(
        loginId,
        `https://example.com/android/login/auth?code=test-code&state=${loginId}`,
      ),
      /not the expected TIDAL authentication redirect/,
    );
  });
});

describe("TIDAL profile migration", () => {
  test("preserves a legacy token and config as the Atmos profile", () => {
    const paths = createTemporaryProfile();
    const legacyAuth = createAuth();
    mkdirSync(paths.hiresDirectory, { recursive: true });
    writeFileSync(paths.authFile, JSON.stringify(legacyAuth));
    writeFileSync(`${paths.hiresDirectory}/config.toml`, "[download]\n");

    preserveLegacyAuthForAtmos(paths);

    assert.deepEqual(getAtmosAuth(paths), legacyAuth);
    assert.equal(
      readFileSync(`${paths.atmosphereDirectory}/config.toml`, "utf-8"),
      "[download]\n",
    );
    assert.equal(statSync(paths.atmosphereAuthFile).mode & 0o777, 0o600);
  });

  test("does not overwrite an existing Atmos token", () => {
    const paths = createTemporaryProfile();
    const existingAtmosAuth = createAuth({ token: "existing-atmos-token" });
    mkdirSync(paths.hiresDirectory, { recursive: true });
    mkdirSync(paths.atmosphereDirectory, { recursive: true });
    writeFileSync(paths.authFile, JSON.stringify(createAuth()));
    writeFileSync(paths.atmosphereAuthFile, JSON.stringify(existingAtmosAuth));
    chmodSync(paths.atmosphereAuthFile, 0o600);

    preserveLegacyAuthForAtmos(paths);

    assert.deepEqual(getAtmosAuth(paths), existingAtmosAuth);
  });

  test("does not copy a PKCE token into the Atmos profile", () => {
    const paths = createTemporaryProfile();
    mkdirSync(paths.hiresDirectory, { recursive: true });
    writeFileSync(
      paths.authFile,
      JSON.stringify(createAuth({ auth_type: "pkce", is_pkce: true })),
    );

    preserveLegacyAuthForAtmos(paths);

    assert.equal(getAtmosAuth(paths), undefined);
  });
});

describe("TIDAL profile selection and refresh", () => {
  test("selects the correct profile for every Atmos filter", () => {
    assert.equal(selectTidalProfile("none", true), "hires");
    assert.equal(selectTidalProfile("only", true), "atmos");
    assert.equal(selectTidalProfile("allow", true), "atmos");
    assert.equal(selectTidalProfile("only", false), "hires");
    assert.equal(selectTidalProfile("allow", false), "hires");
  });

  test("refreshes expired and soon-expiring tokens only", () => {
    assert.equal(needsTokenRefresh(undefined, 1_000), false);
    assert.equal(needsTokenRefresh(createAuth({ expires_at: 0 }), 1_000), true);
    assert.equal(
      needsTokenRefresh(createAuth({ expires_at: 1_900 }), 1_000),
      true,
    );
    assert.equal(
      needsTokenRefresh(createAuth({ expires_at: 1_901 }), 1_000),
      false,
    );
  });

  test("refreshes PKCE tokens with the original client identity", async () => {
    const paths = createTemporaryProfile();
    const auth = createAuth({ auth_type: "pkce", is_pkce: true });
    mkdirSync(paths.hiresDirectory, { recursive: true });
    writeFileSync(paths.authFile, JSON.stringify(auth));
    let requestBody: URLSearchParams | undefined;

    const refreshed = await refreshPkceAuth(auth, {
      paths,
      request: async (body) => {
        requestBody = body;
        return {
          access_token: "refreshed-access-token",
          expires_in: 3_600,
        };
      },
    });

    assert.equal(requestBody?.get("grant_type"), "refresh_token");
    assert.equal(requestBody?.get("refresh_token"), auth.refresh_token);
    assert.equal(requestBody?.get("client_id"), TIDAL_PKCE_CLIENT_ID);
    assert.ok(requestBody?.get("client_secret"));
    assert.equal(refreshed.token, "refreshed-access-token");
    assert.equal(refreshed.refresh_token, auth.refresh_token);
    assert.equal(
      JSON.parse(readFileSync(paths.authFile, "utf-8")).token,
      "refreshed-access-token",
    );
    assert.equal(statSync(paths.authFile).mode & 0o777, 0o600);
  });

  test("keeps PKCE credentials out of the Atmos environment", () => {
    const paths = createTemporaryProfile();
    const pkceAuth = createAuth({ auth_type: "pkce", is_pkce: true });
    const hiresEnvironment = getTiddlEnvironment(pkceAuth, "hires", paths);
    const atmosphereEnvironment = getTiddlEnvironment(pkceAuth, "atmos", paths);

    const pkceCredentials = hiresEnvironment.TIDDL_AUTH?.split(";");
    assert.equal(pkceCredentials?.[0], TIDAL_PKCE_CLIENT_ID);
    assert.equal(pkceCredentials?.length, 2);
    assert.ok(pkceCredentials?.[1]);
    assert.equal(hiresEnvironment.TIDDL_PATH, paths.hiresDirectory);
    assert.equal(atmosphereEnvironment.TIDDL_AUTH, undefined);
    assert.equal(atmosphereEnvironment.TIDDL_PATH, paths.atmosphereDirectory);
    assert.equal(isPkceAuth(pkceAuth), true);
  });
});
