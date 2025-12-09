import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Backdrop, Box, SpeedDial } from "@mui/material";
import PlayBack from "src/components/Player/PlayBack";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { TrackType } from "src/types";
import { getApiUrl } from "src/utils/helpers";

// Animated Equalizer Component
function AnimatedEqualizer({ animated }: { animated?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: "3px",
        height: "24px",
        justifyContent: "center",
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            width: "4px",
            height: `${i % 2 ? (i + 2) * 3 : (i + 2) * 5}px`,
            backgroundColor: "currentColor",
            borderRadius: "2px 2px 0 0",
            animation: animated
              ? `equalizerBounce${i % 2} 0.6s ease-in-out infinite`
              : null,
            animationDelay: `${i * 0.05}s`,
            "@keyframes equalizerBounce0": {
              "0%, 100%": {
                height: "6px",
              },
              "50%": {
                height: "18px",
              },
            },
            "@keyframes equalizerBounce1": {
              "0%, 100%": {
                height: "18px",
              },
              "50%": {
                height: "6px",
              },
            },
          }}
        />
      ))}
    </Box>
  );
}

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
  const [open, setOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const { actions } = useApiFetcher();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const play = async (track: TrackType) => {
    const data = await actions.signStream(track.id); // backend return { url }
    if (data?.url) {
      const url = getApiUrl(data.url);
      setStreamUrl(url);
      setPlayingTrack(track);
    } else {
      console.warn("No signed URL returned", data);
    }
  };

  const stop = () => {
    setPlayingTrack(null);
    setStreamUrl(null);
  };

  useEffect(() => {
    if (!streamUrl) return;

    function init() {
      setOpen(true);
      setTimeout(() => setOpen(false), 2000);
    }
    init();
  }, [streamUrl]);

  return (
    <PlayerContext.Provider
      value={{
        playingTrack: playingTrack ? playingTrack : null,
        streamUrl,
        play,
        stop,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
      {streamUrl !== null && (
        <SpeedDial
          ariaLabel="Track audio player"
          hidden={!streamUrl}
          icon={<AnimatedEqualizer animated={isPlaying} />}
          FabProps={{
            color: "warning",
          }}
          direction="up"
          sx={{ position: "fixed", bottom: 50, left: 16, zIndex: "2000" }}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
        >
          <Backdrop onClick={handleClose} open={open} />
          <Box
            sx={{
              width: {
                xs: 280,
                md: 360,
              },
              opacity: open ? 1 : 0,
              position: "absolute",
              overflow: "auto",
              left: 0,
              visibility: open ? "visible" : "hidden",
            }}
            onClick={(e) => e.preventDefault()}
          >
            {streamUrl && playingTrack && (
              <>
                <PlayBack
                  track={playingTrack}
                  audioUrl={streamUrl}
                  audioRef={audioRef}
                />

                <audio
                  style={{
                    opacity: 0,
                    position: "absolute",
                    zIndex: -1,
                    width: 0,
                  }}
                  ref={audioRef}
                  controls
                  autoPlay
                />
              </>
            )}
          </Box>
        </SpeedDial>
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
