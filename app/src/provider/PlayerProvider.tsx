import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { TrackType } from "src/types";

interface PlayerContextType {
  playingTrack: TrackType | null;
  streamUrl: string | null;
  /** Whether the current play was started by a user action (as opposed to
   * automatic advancement to the next track of the queue). */
  userInitiated: boolean;
  play: (track: TrackType) => Promise<void>;
  playQueue: (tracks: TrackType[], startIndex: number) => Promise<void>;
  playNext: () => Promise<boolean>;
  playPrevious: () => Promise<boolean>;
  hasPrevious: boolean;
  hasNext: boolean;
  stop: () => void;
  isPlaying: boolean | null;
  setIsPlaying: (isPlaying: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playingTrack, setPlayingTrack] = useState<TrackType | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [queue, setQueue] = useState<TrackType[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [userInitiated, setUserInitiated] = useState(true);

  const { actions } = useApiFetcher();

  const playTrack = useCallback(
    async (track: TrackType) => {
      const data = await actions.signStream(track.id);
      if (!data?.url) {
        console.warn("No signed URL returned", data);
        return false;
      }
      setStreamUrl(data.url);
      setPlayingTrack(track);
      return true;
    },
    [actions],
  );

  const play = useCallback(
    async (track: TrackType) => {
      // Single-track play: outside of any list context.
      if (await playTrack(track)) {
        setQueue([]);
        setQueueIndex(-1);
        setUserInitiated(true);
      }
    },
    [playTrack],
  );

  const playQueue = useCallback(
    async (tracks: TrackType[], startIndex: number) => {
      if (!tracks.length || startIndex < 0 || startIndex >= tracks.length) {
        return;
      }
      // Defensive copy: the queue must not alias a caller-owned array.
      const queueCopy = [...tracks];
      const start = queueCopy[startIndex];
      if (await playTrack(start)) {
        setQueue(queueCopy);
        setQueueIndex(startIndex);
        setUserInitiated(true);
      }
    },
    [playTrack],
  );

  // Try to sign and play the next track of the queue; if it cannot be
  // signed (e.g. not streamable), keep trying the following ones. The
  // queue index only moves once a track actually plays, so it always
  // reflects what is audible.
  const playNext = useCallback(async () => {
    for (let i = queueIndex + 1; i < queue.length; i++) {
      if (await playTrack(queue[i])) {
        setQueueIndex(i);
        setUserInitiated(false);
        return true;
      }
    }
    return false;
  }, [playTrack, queue, queueIndex]);

  const playPrevious = useCallback(async () => {
    for (let i = queueIndex - 1; i >= 0; i--) {
      if (await playTrack(queue[i])) {
        setQueueIndex(i);
        setUserInitiated(false);
        return true;
      }
    }
    return false;
  }, [playTrack, queue, queueIndex]);

  const stop = useCallback(() => {
    setPlayingTrack(null);
    setStreamUrl(null);
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        playingTrack,
        streamUrl,
        userInitiated,
        play,
        playQueue,
        playNext,
        playPrevious,
        hasPrevious: queueIndex > 0,
        hasNext: queueIndex >= 0 && queueIndex < queue.length - 1,
        stop,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
