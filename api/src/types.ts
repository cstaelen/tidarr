import { ChildProcess, ChildProcessWithoutNullStreams } from "child_process";

export type ProcessingItemType = {
  id: number;
  artist: string;
  title: string;
  type: "album" | "track" | "playlist" | "artist" | "video";
  status: "queue" | "finished" | "downloaded" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
  output: string;
  output_history: string[];
  process?: ChildProcess;
};

export type TiddlConfig = {
  auth: {
    token: string;
    refresh_token: string;
    token_expires_at: number;
    user_id: string;
    country_code: string;
  };
  template: {
    track: string;
    video: string;
    album: string;
    playlist: string;
  };
  download: {
    quality: "master" | "high";
    path: string;
    threads: number;
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
