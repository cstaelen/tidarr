import { ChildProcess, ChildProcessWithoutNullStreams } from "child_process";

export type QualityType = "low" | "normal" | "high" | "max";
export type ContentType =
  | "album"
  | "track"
  | "playlist"
  | "artist"
  | "video"
  | "favorite_albums"
  | "favorite_tracks"
  | "favorite_playlists"
  | "favorite_videos"
  | "favorite_artists"
  | "artist_videos"
  | "mix";

export type ProcessingItemType = {
  id: string;
  artist: string;
  title: string;
  type: ContentType;
  status: "queue" | "finished" | "processing" | "error" | "no_download";
  quality: QualityType;
  url: string;
  loading: boolean;
  error: boolean;
  process?: ChildProcess;
};

export type TiddlConfig = {
  enable_cache?: boolean;
  debug?: boolean;
  templates: {
    default?: string;
    track?: string;
    video?: string;
    album?: string;
    playlist?: string;
    mix?: string;
  };
  download: {
    track_quality?: QualityType;
    video_quality?: string; // "sd" | "hd" | "fhd"
    skip_existing?: boolean;
    download_path?: string;
    scan_path?: string;
    threads_count?: number;
    singles_filter?: string; // "none" | "only" | "include"
    videos_filter?: string; // "none" | "only" | "allow"
    update_mtime?: boolean;
    rewrite_metadata?: boolean;
  };
  metadata?: {
    enable?: boolean;
    embed_lyrics?: boolean;
    cover?: boolean;
  };
  cover?: {
    save?: boolean;
    size?: number;
    allowed?: string[];
    templates?: {
      track?: string;
      album?: string;
      playlist?: string;
    };
  };
  m3u?: {
    save?: boolean;
    allowed?: string[];
    templates?: {
      album?: string;
      playlist?: string;
      mix?: string;
    };
  };
  auth: {
    token: string;
    refresh_token: string;
    expires: number;
    expires_at?: number; // Unix timestamp when token expires (used for refresh logic)
    user_id: string;
    country_code: string;
  };
};

export type LogType = {
  output: string;
  output_history: string[];
  link: string;
  process?: ChildProcessWithoutNullStreams;
  status?: "finished" | "error" | "auth" | undefined;
  loading?: boolean;
  error?: boolean;
};

// SYNC LIST

export type SyncItemType = {
  id: string;
  title: string;
  url: string;
  artist?: string;
  lastUpdate?: string;
  quality: QualityType;
  type: ContentType;
};

// API RESPONSES

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Authentication responses
 */
export interface AuthResponse {
  status: "ok" | "error";
  token?: string;
  error?: string;
}

export interface IsAuthActiveResponse {
  isAuthActive: boolean;
  authType: "password" | "oidc" | null;
}

/**
 * Configuration responses
 */
export interface SettingsResponse {
  output: string;
  parameters: {
    ENABLE_BEETS?: string;
    PLEX_URL?: string;
    PLEX_LIBRARY?: string;
    PLEX_TOKEN?: string;
    PLEX_PATH?: string;
    NAVIDROME_URL?: string;
    NAVIDROME_USER?: string;
    NAVIDROME_PASSWORD?: string;
    GOTIFY_URL?: string;
    GOTIFY_TOKEN?: string;
    PUID?: string;
    PGID?: string;
    UMASK?: string;
    TIDARR_VERSION?: string;
    APPRISE_API_ENDPOINT?: string;
    APPRISE_API_TAG?: string;
    PUSH_OVER_URL?: string;
    LOCK_QUALITY?: string;
    ENABLE_TIDAL_PROXY?: string;
    SYNC_CRON_EXPRESSION?: string;
    ENABLE_HISTORY?: string;
  };
  noToken: boolean;
  tiddl_config?: TiddlConfig;
  configErrors?: string[];
}

/**
 * Custom CSS responses
 */
export interface CustomCSSResponse {
  css: string;
}

export interface CustomCSSSaveResponse {
  success: boolean;
  message: string;
}

/**
 * Tiddl TOML responses
 */
export interface TiddlTomlResponse {
  toml: string;
}

export interface TiddlTomlSaveResponse {
  success: boolean;
  message: string;
}

/**
 * Sync list responses
 */
export type SyncListResponse = SyncItemType[];

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Tidal API search response types (for Lidarr indexer)
 */
export interface TidalAlbum {
  id: number;
  title: string;
  artist?: {
    id: number;
    name: string;
  };
  artists?: Array<{
    id: number;
    name: string;
  }>;
  releaseDate?: string;
  numberOfTracks?: number;
  duration?: number;
  type: string;
  audioQuality: string;
}

export interface TidalSearchResponse {
  albums?: {
    items?: TidalAlbum[];
    totalNumberOfItems?: number;
  };
}
