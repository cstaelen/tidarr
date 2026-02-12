import { ChildProcess } from "child_process";

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
  status:
    | "queue_download"
    | "download"
    | "queue_processing"
    | "processing"
    | "queue" // legacy
    | "finished"
    | "error"
    | "no_download";
  quality: QualityType;
  url: string;
  loading: boolean;
  error: boolean;
  process?: ChildProcess;
  retryCount?: number;
  source?: "lidarr" | "tidarr";
  progress?: {
    current: number;
    total: number;
  };
};

export type ProcessingItemWithPlaylist = ProcessingItemType & {
  playlistId?: string;
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
  explicit?: boolean;
}

export interface TidalSearchResponse {
  albums?: {
    items?: TidalAlbum[];
    totalNumberOfItems?: number;
  };
}

// PLEX

export type PlexNotification = {
  NotificationContainer: {
    type: string;
    size: number;
    ActivityNotification?: Array<{
      event: string;
      uuid: string;
      Activity: {
        uuid: string;
        type: string;
        cancellable: boolean;
        userID: number;
        title: string;
        subtitle?: string;
        progress: number;
        Context?: {
          key?: string;
        };
      };
    }>;
  };
};

export type PendingPlaylist = {
  itemId: string;
  item: ProcessingItemType;
  foldersToScan: string[];
  pendingFolders: Set<string>;
  createdAt: number;
};
