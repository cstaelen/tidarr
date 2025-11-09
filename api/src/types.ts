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
  | "artist_videos"
  | "mix";

export type ProcessingItemType = {
  id: string;
  artist: string;
  title: string;
  type: ContentType;
  status: "queue" | "finished" | "downloaded" | "processing" | "error";
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
