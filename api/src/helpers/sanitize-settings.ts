import { SettingsParameters, TiddlConfig } from "../types";

type SettingsPayload = {
  output?: string;
  parameters?: Partial<SettingsParameters>;
  noToken: boolean;
  tiddl_config?: TiddlConfig;
  configErrors?: string[];
};

/**
 * "value": the guest gets the parameter as is.
 * "presence": the UI only checks that the integration is configured, so the
 * guest gets a placeholder instead of the credential itself.
 */
type GuestVisibility = "value" | "presence";

const PLACEHOLDER = "****";

/**
 * What a guest UI needs to search, browse, queue and preview.
 * A whitelist, so a new env var stays hidden from guests until we say
 * otherwise, and keyed on SettingsParameters so a typo cannot compile.
 */
const GUEST_PARAMETERS: Partial<
  Record<keyof SettingsParameters, GuestVisibility>
> = {
  TIDARR_VERSION: "value",
  NO_DOWNLOAD: "value",
  LOCK_QUALITY: "value",
  DOWNLOAD_BATCH_SIZE: "value",
  PLEX_URL: "value",
  PLEX_PUBLIC_URL: "value",
  PLEX_TOKEN: "presence",
  JELLYFIN_URL: "value",
  JELLYFIN_PUBLIC_URL: "value",
  JELLYFIN_API_KEY: "presence",
  NAVIDROME_URL: "value",
  NAVIDROME_PUBLIC_URL: "value",
  NAVIDROME_USER: "presence",
  NAVIDROME_PASSWORD: "presence",
};

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
  const visibilities = Object.entries(GUEST_PARAMETERS) as [
    keyof SettingsParameters,
    GuestVisibility,
  ][];

  const parameters = Object.fromEntries(
    visibilities
      .filter(([key]) => settings.parameters?.[key])
      .map(([key, visibility]) => [
        key,
        visibility === "presence" ? PLACEHOLDER : settings.parameters?.[key],
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
