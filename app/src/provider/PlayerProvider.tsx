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
  playNext: () => boolean;
  playPrevious: () => boolean;
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
      if (data?.url) {
        setStreamUrl(data.url);
        setPlayingTrack(track);
      } else {
        console.warn("No signed URL returned", data);
      }
    },
    [actions],
  );

  const play = useCallback(
    async (track: TrackType) => {
      // Single-track play: outside of any list context.
      setQueue([]);
      setQueueIndex(-1);
      setUserInitiated(true);
      await playTrack(track);
    },
    [playTrack],
  );

  const playQueue = useCallback(
    async (tracks: TrackType[], startIndex: number) => {
      if (!tracks.length || startIndex < 0 || startIndex >= tracks.length) {
        return;
      }
      const start = tracks[startIndex];
      setQueue(tracks);
      setQueueIndex(startIndex);
      setUserInitiated(true);
      await playTrack(start);
    },
    [playTrack],
  );

  const playNext = useCallback(() => {
    if (queueIndex < 0 || queueIndex >= queue.length - 1) return false;
    const nextTrack = queue[queueIndex + 1];
    setQueueIndex(queueIndex + 1);
    setUserInitiated(false);
    void playTrack(nextTrack);
    return true;
  }, [playTrack, queue, queueIndex]);

  const playPrevious = useCallback(() => {
    if (queueIndex <= 0) return false;
    const previousTrack = queue[queueIndex - 1];
    setQueueIndex(queueIndex - 1);
    setUserInitiated(false);
    void playTrack(previousTrack);
    return true;
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
