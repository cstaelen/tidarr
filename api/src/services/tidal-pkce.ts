import { createHash, randomBytes } from "crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
} from "fs";
import { mkdir, rename, writeFile } from "fs/promises";

import { CONFIG_PATH } from "../../constants";
import { TidalAuth } from "../types";

const TIDAL_AUTH_URL = "https://auth.tidal.com/v1/oauth2/token";
const TIDAL_LOGIN_URL = "https://login.tidal.com/authorize";
const TIDAL_SESSION_URL = "https://api.tidal.com/v1/sessions";
const TIDAL_PKCE_REDIRECT_URI = "https://tidal.com/android/login/auth";

// Public client credentials used by python-tidal's Hi-Res PKCE flow:
// https://github.com/tamland/python-tidal/blob/main/tidalapi/session.py
export const TIDAL_PKCE_CLIENT_ID = "6BDSRdpK9hqEBTgU";
const TIDAL_PKCE_CLIENT_SECRET = "xeuPmY7nbpZ9IIbLAcQ93shka1VNheUAqN6IcszjTG8=";

const LOGIN_TTL_MS = 15 * 60 * 1000;
const MAX_PENDING_LOGINS = 20;
export const HIRES_TIDDL_PATH = `${CONFIG_PATH}/.tiddl`;
export const ATMOS_TIDDL_PATH = `${CONFIG_PATH}/.tiddl-atmos`;

type PendingLogin = {
  codeVerifier: string;
  clientUniqueKey: string;
  createdAt: number;
};

export type TidalProfile = "hires" | "atmos";

export type TidalProfilePaths = {
  hiresDirectory: string;
  atmosphereDirectory: string;
  authFile: string;
  atmosphereAuthFile: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type SessionResponse = {
  userId: string | number;
  countryCode: string;
};

type RefreshPkceOptions = {
  paths?: TidalProfilePaths;
  request?: (body: URLSearchParams) => Promise<TokenResponse>;
};

const pendingLogins = new Map<string, PendingLogin>();
let refreshPromise: Promise<TidalAuth> | null = null;

export function createTidalProfilePaths(configPath: string): TidalProfilePaths {
  const hiresDirectory = `${configPath}/.tiddl`;
  const atmosphereDirectory = `${configPath}/.tiddl-atmos`;
  return {
    hiresDirectory,
    atmosphereDirectory,
    authFile: `${hiresDirectory}/auth.json`,
    atmosphereAuthFile: `${atmosphereDirectory}/auth.json`,
  };
}

const DEFAULT_PROFILE_PATHS = createTidalProfilePaths(CONFIG_PATH);

function base64Url(value: Buffer): string {
  return value.toString("base64url");
}

function cleanExpiredLogins() {
  const expiresBefore = Date.now() - LOGIN_TTL_MS;
  for (const [id, login] of pendingLogins) {
    if (login.createdAt < expiresBefore) pendingLogins.delete(id);
  }
}

function parseRedirectCode(redirectUrl: string, expectedState: string): string {
  let url: URL;
  try {
    url = new URL(redirectUrl.trim());
  } catch {
    throw new Error("Paste the complete URL from the redirected TIDAL page.");
  }

  const expectedRedirect = new URL(TIDAL_PKCE_REDIRECT_URI);
  if (
    url.origin !== expectedRedirect.origin ||
    url.pathname !== expectedRedirect.pathname
  ) {
    throw new Error(
      "The URL is not the expected TIDAL authentication redirect.",
    );
  }

  if (url.searchParams.get("state") !== expectedState) {
    throw new Error(
      "The TIDAL authentication state is missing or does not match this login request.",
    );
  }

  const code = url.searchParams.get("code");
  if (!code) {
    throw new Error(
      "The redirected TIDAL URL does not contain an authorization code.",
    );
  }
  return code;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      error_description?: string;
      userMessage?: string;
    };
    return (
      data.error_description ||
      data.userMessage ||
      data.error ||
      response.statusText
    );
  } catch {
    return response.statusText;
  }
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(TIDAL_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `TIDAL authentication failed: ${await readError(response)}`,
    );
  }

  const data = (await response.json()) as Partial<TokenResponse>;
  if (!data.access_token || !data.expires_in) {
    throw new Error("TIDAL returned an incomplete authentication response.");
  }
  return data as TokenResponse;
}

async function getSession(accessToken: string): Promise<SessionResponse> {
  const response = await fetch(TIDAL_SESSION_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to read the TIDAL session: ${await readError(response)}`,
    );
  }

  const data = (await response.json()) as Partial<SessionResponse>;
  if (data.userId === undefined || !data.countryCode) {
    throw new Error("TIDAL returned an incomplete session response.");
  }
  return data as SessionResponse;
}

async function saveAuth(
  auth: TidalAuth,
  paths: TidalProfilePaths = DEFAULT_PROFILE_PATHS,
): Promise<void> {
  preserveLegacyAuthForAtmos(paths);
  const temporaryFile = `${paths.authFile}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  await mkdir(paths.hiresDirectory, { recursive: true });
  await writeFile(temporaryFile, JSON.stringify(auth), { mode: 0o600 });
  await rename(temporaryFile, paths.authFile);
}

/**
 * TIDAL exposes Hi-Res stereo and Dolby Atmos through different client
 * profiles. Keep an existing device-login token before replacing it with the
 * PKCE token so Tidarr can select the appropriate profile per download.
 */
export function preserveLegacyAuthForAtmos(
  paths: TidalProfilePaths = DEFAULT_PROFILE_PATHS,
): void {
  if (!existsSync(paths.authFile) || existsSync(paths.atmosphereAuthFile)) {
    return;
  }

  try {
    const auth = JSON.parse(readFileSync(paths.authFile, "utf-8")) as TidalAuth;
    if (!auth?.token || isPkceAuth(auth)) return;

    prepareAtmosProfile(paths);
    copyFileSync(paths.authFile, paths.atmosphereAuthFile);
    chmodSync(paths.atmosphereAuthFile, 0o600);
  } catch (error) {
    console.warn("⚠️ [TIDAL] Could not preserve legacy Atmos token:", error);
  }
}

export function prepareAtmosProfile(
  paths: TidalProfilePaths = DEFAULT_PROFILE_PATHS,
): void {
  mkdirSync(paths.atmosphereDirectory, { recursive: true });

  const sourceConfig = `${paths.hiresDirectory}/config.toml`;
  const targetConfig = `${paths.atmosphereDirectory}/config.toml`;
  if (existsSync(sourceConfig)) {
    const temporaryConfig = `${targetConfig}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    copyFileSync(sourceConfig, temporaryConfig);
    renameSync(temporaryConfig, targetConfig);
  }
}

export function getAtmosAuth(
  paths: TidalProfilePaths = DEFAULT_PROFILE_PATHS,
): TidalAuth | undefined {
  try {
    return JSON.parse(
      readFileSync(paths.atmosphereAuthFile, "utf-8"),
    ) as TidalAuth;
  } catch {
    return undefined;
  }
}

export function hasAtmosAuth(
  paths: TidalProfilePaths = DEFAULT_PROFILE_PATHS,
): boolean {
  return !!getAtmosAuth(paths)?.token;
}

export function startPkceLogin(): { loginId: string; loginUrl: string } {
  cleanExpiredLogins();
  while (pendingLogins.size >= MAX_PENDING_LOGINS) {
    const oldestId = pendingLogins.keys().next().value as string | undefined;
    if (!oldestId) break;
    pendingLogins.delete(oldestId);
  }

  const loginId = randomBytes(18).toString("hex");
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(
    createHash("sha256").update(codeVerifier).digest(),
  );
  const clientUniqueKey = randomBytes(8).toString("hex");

  pendingLogins.set(loginId, {
    codeVerifier,
    clientUniqueKey,
    createdAt: Date.now(),
  });

  const loginUrl = new URL(TIDAL_LOGIN_URL);
  loginUrl.search = new URLSearchParams({
    response_type: "code",
    redirect_uri: TIDAL_PKCE_REDIRECT_URI,
    client_id: TIDAL_PKCE_CLIENT_ID,
    lang: "EN",
    appMode: "android",
    client_unique_key: clientUniqueKey,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    restrict_signup: "true",
    state: loginId,
  }).toString();

  return { loginId, loginUrl: loginUrl.toString() };
}

export async function completePkceLogin(
  loginId: string,
  redirectUrl: string,
): Promise<TidalAuth> {
  cleanExpiredLogins();
  const pending = pendingLogins.get(loginId);
  if (!pending) {
    throw new Error(
      "This login request expired. Start TIDAL authentication again.",
    );
  }

  const code = parseRedirectCode(redirectUrl, loginId);
  const token = await requestToken(
    new URLSearchParams({
      code,
      client_id: TIDAL_PKCE_CLIENT_ID,
      grant_type: "authorization_code",
      redirect_uri: TIDAL_PKCE_REDIRECT_URI,
      scope: "r_usr+w_usr+w_sub",
      code_verifier: pending.codeVerifier,
      client_unique_key: pending.clientUniqueKey,
    }),
  );
  const session = await getSession(token.access_token);

  const auth: TidalAuth = {
    token: token.access_token,
    refresh_token: token.refresh_token || "",
    expires_at: Math.floor(Date.now() / 1000) + token.expires_in,
    user_id: String(session.userId),
    country_code: session.countryCode,
    auth_type: "pkce",
    is_pkce: true,
  };

  if (!auth.refresh_token) {
    throw new Error("TIDAL did not return a refresh token.");
  }

  await saveAuth(auth);
  pendingLogins.delete(loginId);
  return auth;
}

export function isPkceAuth(auth?: Partial<TidalAuth>): boolean {
  return auth?.auth_type === "pkce" || auth?.is_pkce === true;
}

export function selectTidalProfile(
  atmosFilter?: string,
  atmosphereAvailable = hasAtmosAuth(),
): TidalProfile {
  if (
    atmosphereAvailable &&
    (atmosFilter === "only" || atmosFilter === "allow")
  ) {
    return "atmos";
  }
  return "hires";
}

export function needsTokenRefresh(
  auth?: Partial<TidalAuth>,
  nowSeconds = Math.floor(Date.now() / 1000),
  refreshWindowSeconds = 15 * 60,
): boolean {
  return (
    typeof auth?.expires_at === "number" &&
    auth.expires_at <= nowSeconds + refreshWindowSeconds
  );
}

export function getTiddlEnvironment(
  auth?: Partial<TidalAuth>,
  profile: TidalProfile = "hires",
  paths: TidalProfilePaths = DEFAULT_PROFILE_PATHS,
): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.TIDDL_AUTH;

  if (profile === "atmos") {
    prepareAtmosProfile(paths);
    environment.TIDDL_PATH = paths.atmosphereDirectory;
    return environment;
  }

  environment.TIDDL_PATH = paths.hiresDirectory;
  if (isPkceAuth(auth)) {
    environment.TIDDL_AUTH = `${TIDAL_PKCE_CLIENT_ID};${TIDAL_PKCE_CLIENT_SECRET}`;
  }
  return environment;
}

export async function refreshPkceAuth(
  auth: TidalAuth,
  options: RefreshPkceOptions = {},
): Promise<TidalAuth> {
  if (refreshPromise) return refreshPromise;
  if (!auth.refresh_token) throw new Error("TIDAL refresh token is missing.");

  refreshPromise = (async () => {
    const token = await (options.request || requestToken)(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: auth.refresh_token,
        client_id: TIDAL_PKCE_CLIENT_ID,
        client_secret: TIDAL_PKCE_CLIENT_SECRET,
      }),
    );

    const refreshed: TidalAuth = {
      ...auth,
      token: token.access_token,
      refresh_token: token.refresh_token || auth.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + token.expires_in,
      auth_type: "pkce",
      is_pkce: true,
    };
    await saveAuth(refreshed, options.paths);
    return refreshed;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
