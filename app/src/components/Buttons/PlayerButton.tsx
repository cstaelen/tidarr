import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { IconButton } from "@mui/material";
import { usePlayer } from "src/provider/PlayerProvider";
import { useTrackList } from "src/provider/TrackListProvider";
import { TrackType } from "src/types";

interface PlayerButtonProps {
  track: TrackType;
}

export const PlayerButton = ({ track }: PlayerButtonProps) => {
  const { playingTrack, streamUrl, play, playQueue, stop } = usePlayer();
  const trackList = useTrackList();
  const isPlaying = streamUrl && playingTrack?.id === track.id;

  const handlePlay = () => {
    if (isPlaying) {
      stop();
      return;
    }

    // Inside a track-list view (playlist, album, mix, ...), pressing play
    // starts continuous playback of the whole list at the chosen track.
    const index = trackList
      ? trackList.tracks.findIndex((t) => t.id === track.id)
      : -1;
    if (trackList && index >= 0) {
      void playQueue(trackList.tracks, index);
    } else {
      void play(track);
    }
  };

  return (
    <IconButton
      onClick={handlePlay}
      size="small"
      color={isPlaying ? "warning" : "default"}
      sx={{
        border: "1px solid gray",
      }}
      aria-label={isPlaying ? "Stop track" : "Play track"}
    >
      {isPlaying ? (
        <StopIcon fontSize="small" />
      ) : (
        <PlayArrowIcon fontSize="small" />
      )}
    </IconButton>
  );
};
