import { createContext, ReactNode, useContext, useState } from "react";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { TrackType } from "src/types";

interface PlayerContextType {
  playingTrack: TrackType | null;
  streamUrl: string | null;
  play: (track: TrackType) => Promise<void>;
  stop: () => void;
  isPlaying: boolean | null;
  setIsPlaying: (isPlaying: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playingTrack, setPlayingTrack] = useState<TrackType | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const { actions } = useApiFetcher();

  const play = async (track: TrackType) => {
    const data = await actions.signStream(track.id);
    if (data?.url) {
      setStreamUrl(data.url);
      setPlayingTrack(track);
    } else {
      console.warn("No signed URL returned", data);
    }
  };

  const stop = () => {
    setPlayingTrack(null);
    setStreamUrl(null);
  };

  return (
    <PlayerContext.Provider
      value={{ playingTrack, streamUrl, play, stop, isPlaying, setIsPlaying }}
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
