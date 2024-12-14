import { ChildProcessWithoutNullStreams } from "child_process";

export type ProcessingItemType = {
  id: number;
  artist: string;
  title: string;
  type: "album" | "track" | "playlist";
  status: "queue" | "finished" | "downloaded" | "processing" | "error";
  url: string;
  loading: boolean;
  error: boolean;
  output: string;
  output_history: string[];
  process?: ChildProcessWithoutNullStreams;
};

export type TiddlConfig = {
  token: string;
  refresh_token: string;
  token_expires_at: number;
  settings: {
    download_path: string;
    track_quality: "master" | "high";
    track_template: string;
    album_template: string;
    playlist_template: string;
    file_extension: string;
  };
  user: {
    user_id: string;
    country_code: string;
  };
};

export type LogType = {
  output: string;
  output_history: string[];
  link: string;
  is_athenticated: boolean;
  process?: ChildProcessWithoutNullStreams;
  status?: "finished" | "error" | "auth" | undefined;
  loading?: boolean;
  error?: boolean;
};
