import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { TrackType } from "src/types";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

interface PlayerContextType {
  playingTrackId: string | null;
  streamUrl: string | null;
  play: (track: TrackType) => Promise<void>;
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { actions } = useApiFetcher();

  const play = async (track: TrackType) => {
    setPlayingTrackId(track.id);
    const data = await actions.sign(track.id); // backend return { url }
    if (data?.url) {
      setStreamUrl(data.url);
    } else {
      console.warn("No signed URL returned", data);
    }
  };

  const stop = () => {
    setPlayingTrackId(null);
    setStreamUrl(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
  };

  useEffect(() => {
    if (streamUrl && audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.warn("Autoplay blocked:", err);
      });
    }
  }, [streamUrl]);

  return (
    <PlayerContext.Provider value={{ playingTrackId, streamUrl, play, stop }}>
      {children}
      {streamUrl && (
        <audio
          ref={audioRef}
          controls
          autoPlay
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            zIndex: 9999,
            backgroundColor: "#111",
          }}
        />
      )}
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
