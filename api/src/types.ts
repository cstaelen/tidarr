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
  process?: ChildProcessWithoutNullStreams;
};
