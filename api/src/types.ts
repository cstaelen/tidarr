import { ChildProcess, ChildProcessWithoutNullStreams } from "child_process";

export type QualityType = "low" | "normal" | "high" | "master";
export type ContentType =
  | "album"
  | "track"
  | "playlist"
  | "artist"
  | "video"
  | "favorite_albums"
  | "favorite_tracks"
  | "favorite_playlists"
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
  template: {
    track: string;
    video: string;
    album: string;
    playlist: string;
  };
  download: {
    quality: QualityType;
    path: string;
    threads: number;
    singles_filter: string;
    embed_lyrics: boolean;
    download_video: boolean;
    scan_path: string;
    save_playlist_m3u: boolean;
  };
  cover: {
    save: boolean;
    size: number;
    filename: string;
  };
  auth: {
    token: string;
    refresh_token: string;
    expires: number;
    user_id: string;
    country_code: string;
  };
  omit_cache: boolean;
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
  lastUpdate?: string;
  quality: QualityType;
  type: ContentType;
};
