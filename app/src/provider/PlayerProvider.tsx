import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Stop } from "@mui/icons-material";
import { Box, SpeedDial } from "@mui/material";
import { TrackCoverLink } from "src/components/Cards/Track";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { TrackType } from "src/types";

// Animated Equalizer Component
function AnimatedEqualizer() {
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
            backgroundColor: "currentColor",
            borderRadius: "2px 2px 0 0",
            animation: `equalizerBounce${i % 2} 0.6s ease-in-out infinite`,
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
  playingTrackId: string | null;
  streamUrl: string | null;
  play: (track: TrackType) => Promise<void>;
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<TrackType | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { actions } = useApiFetcher();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const play = async (track: TrackType) => {
    setPlayingTrackId(track.id);
    const data = await actions.signStream(track.id); // backend return { url }
    if (data?.url) {
      setStreamUrl(data.url);
      setCurrentItem(track);
    } else {
      console.warn("No signed URL returned", data);
    }
  };

  const stop = () => {
    setPlayingTrackId(null);
    setStreamUrl(null);
    setCurrentItem(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
  };

  useEffect(() => {
    function init() {
      setOpen(true);
      setTimeout(() => setOpen(false), 3000);
    }

    if (streamUrl && audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
      });
    }
    init();
  }, [streamUrl]);

  return (
    <PlayerContext.Provider value={{ playingTrackId, streamUrl, play, stop }}>
      {children}
      <SpeedDial
        ariaLabel="SpeedDial playground example"
        hidden={!streamUrl}
        onClick={() => (open ? setStreamUrl(null) : null)}
        icon={!open ? <AnimatedEqualizer /> : <Stop />}
        FabProps={{
          color: "warning",
        }}
        direction="right"
        sx={{ position: "fixed", bottom: 50, left: 16, zIndex: "2000" }}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
      >
        {streamUrl && currentItem && (
          <>
            <Box
              display={open ? "flex" : "none"}
              bgcolor="#282828"
              alignItems="center"
              borderRadius={2}
              overflow="hidden"
              boxShadow="0 0 15px 0px black"
            >
              <Box flex="auto">
                <TrackCoverLink track={currentItem} width={60} height={60} />
              </Box>
              <Box py={1} px={2} fontSize={13}>
                <Box
                  component="strong"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: 200,
                  }}
                >
                  {currentItem?.title}
                </Box>
                <Box
                  component="i"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: 200,
                  }}
                >
                  {currentItem?.artists[0].name}
                </Box>
              </Box>
            </Box>
            <audio
              style={{ opacity: 0, position: "absolute", zIndex: -1 }}
              ref={audioRef}
              controls
              autoPlay
            />
          </>
        )}
      </SpeedDial>
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
