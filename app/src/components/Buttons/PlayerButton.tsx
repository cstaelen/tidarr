import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { IconButton } from "@mui/material";
import { usePlayer } from "src/provider/PlayerProvider";
import { TrackType } from "src/types";

interface PlayerButtonProps {
  track: TrackType;
}

export const PlayerButton = ({ track }: PlayerButtonProps) => {
  const { playingTrackId, streamUrl, play, stop } = usePlayer();
  const isPlaying = streamUrl && playingTrackId === track.id;

  return (
    <IconButton
      onClick={() => (isPlaying ? stop() : play(track))}
      size="small"
      color={isPlaying ? "warning" : "default"}
      sx={{
        border: "1px solid gray",
      }}
    >
      {isPlaying ? (
        <StopIcon fontSize="small" />
      ) : (
        <PlayArrowIcon fontSize="small" />
      )}
    </IconButton>
  );
};
