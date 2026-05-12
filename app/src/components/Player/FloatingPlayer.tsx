import { useEffect, useRef, useState } from "react";
import { Box, Fab } from "@mui/material";
import PlayBack from "src/components/Player/PlayBack";
import { usePlayer } from "src/provider/PlayerProvider";

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
              "0%, 100%": { height: "6px" },
              "50%": { height: "18px" },
            },
            "@keyframes equalizerBounce1": {
              "0%, 100%": { height: "18px" },
              "50%": { height: "6px" },
            },
          }}
        />
      ))}
    </Box>
  );
}

export function FloatingPlayer() {
  const { playingTrack, streamUrl, isPlaying } = usePlayer();
  const [open, setOpen] = useState(false);
  const [lastStreamUrl, setLastStreamUrl] = useState(streamUrl);
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  if (streamUrl !== lastStreamUrl) {
    setLastStreamUrl(streamUrl);
    if (streamUrl) setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!streamUrl) return null;

  return (
    <Box
      ref={panelRef}
      sx={{ position: "fixed", bottom: 16, left: 16, zIndex: 2000 }}
    >
      <Box
        data-testid="floating-player-panel"
        sx={{
          position: "absolute",
          bottom: 56,
          left: 0,
          width: { xs: 280, md: 360 },
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: "opacity 0.2s ease",
          pb: 1,
        }}
      >
        {playingTrack && (
          <>
            <PlayBack
              track={playingTrack}
              audioUrl={streamUrl}
              audioRef={audioRef}
            />
            <audio
              style={{ opacity: 0, position: "absolute", zIndex: -1, width: 0 }}
              ref={audioRef}
              controls
              autoPlay
            />
          </>
        )}
      </Box>
      <Fab
        color="warning"
        aria-label="Toggle player"
        onClick={() => setOpen((o) => !o)}
        size="medium"
      >
        <AnimatedEqualizer animated={isPlaying ?? false} />
      </Fab>
    </Box>
  );
}
