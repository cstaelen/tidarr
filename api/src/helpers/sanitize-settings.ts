import { TiddlConfig } from "../types";

type SettingsPayload = {
  output?: string;
  parameters?: Record<string, string | undefined>;
  noToken: boolean;
  tiddl_config?: TiddlConfig;
  configErrors?: string[];
};

// Credentials a guest UI only checks for presence: it gets the flag, not the value
const SENSITIVE_PARAMETERS = [
  "PLEX_TOKEN",
  "JELLYFIN_API_KEY",
  "NAVIDROME_USER",
  "NAVIDROME_PASSWORD",
  "GOTIFY_TOKEN",
  "NTFY_TOKEN",
  // Both carry their token in the URL itself
  "PUSH_OVER_URL",
  "APPRISE_API_ENDPOINT",
];

// What a guest UI needs to search, browse, queue and preview.
// A whitelist, so a new env var stays hidden from guests until we say otherwise.
const GUEST_PARAMETERS = [
  "TIDARR_VERSION",
  "NO_DOWNLOAD",
  "LOCK_QUALITY",
  "DOWNLOAD_BATCH_SIZE",
  "PLEX_URL",
  "PLEX_PUBLIC_URL",
  "PLEX_TOKEN",
  "JELLYFIN_URL",
  "JELLYFIN_PUBLIC_URL",
  "JELLYFIN_API_KEY",
  "NAVIDROME_URL",
  "NAVIDROME_PUBLIC_URL",
  "NAVIDROME_USER",
  "NAVIDROME_PASSWORD",
];

/**
 * Replaces credential values with a placeholder, keeping the key so the UI
 * still knows the integration is configured.
 */
function maskSensitiveParameters(
  parameters?: Record<string, string | undefined>,
) {
  return Object.fromEntries(
    Object.entries(parameters ?? {}).map(([key, value]) => [
      key,
      value && SENSITIVE_PARAMETERS.includes(key) ? "****" : value,
    ]),
  );
}

/**
 * The Tidal token stays on the server: the front only needs to know whether
 * one exists, which /settings already reports as noToken.
 */
export function stripTidalTokens(config?: TiddlConfig) {
  if (!config?.auth) return config;

  const { user_id, country_code, expires, expires_at } = config.auth;

  return {
    ...config,
    auth: { user_id, country_code, expires, expires_at },
  } as TiddlConfig;
}

/**
 * Guests get the bare minimum: no server paths, no download templates and
 * none of the keys the settings page needs.
 */
export function sanitizeSettingsForGuest(
  settings: SettingsPayload,
): SettingsPayload {
  const masked = maskSensitiveParameters(settings.parameters);
  const parameters = Object.fromEntries(
    GUEST_PARAMETERS.filter((key) => masked[key]).map((key) => [
      key,
      masked[key],
    ]),
  );

  return {
    output: "",
    parameters,
    noToken: settings.noToken,
    tiddl_config:
      settings.tiddl_config &&
      ({
        download: {
          track_quality: settings.tiddl_config.download?.track_quality,
          video_quality: settings.tiddl_config.download?.video_quality,
          atmos_filter: settings.tiddl_config.download?.atmos_filter,
        },
        auth: {
          user_id: settings.tiddl_config.auth?.user_id,
          country_code: settings.tiddl_config.auth?.country_code,
        },
      } as TiddlConfig),
  };
}
