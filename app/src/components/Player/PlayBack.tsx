import { useEffect, useState } from "react";
import { Pause, PlayArrow, Stop } from "@mui/icons-material";
import { Box, IconButton, Slider } from "@mui/material";
import { TrackCoverLink } from "src/components/Cards/Track";
import { usePlayer } from "src/provider/PlayerProvider";
import { TrackType } from "src/types";

interface PlayBackProps {
  track: TrackType;
  audioUrl?: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayBack = ({ track, audioUrl, audioRef }: PlayBackProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { stop, isPlaying, setIsPlaying } = usePlayer();

  useEffect(() => {
    if (!audioRef?.current) return;
    const audio = audioRef.current;

    if (audioUrl) {
      audioRef.current!.src = audioUrl;
      audioRef.current?.load();
      audioRef.current?.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
      });
      setIsPlaying(true);
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, audioUrl, setIsPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: Event, value: number | number[]) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value as number;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      bgcolor="#282828"
      borderRadius={2}
      overflow="hidden"
      boxShadow="0 0 15px 0px black"
    >
      <Box display="flex" alignItems="center">
        <Box flex="0 0 auto">
          <TrackCoverLink
            track={track}
            width={60}
            height={60}
            targetUrl={`/album/${track.album.id}`}
          />
        </Box>
        <Box py={1} px={2} fontSize={13} flex="1 1 0">
          <Box
            component="strong"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-all",
            }}
          >
            {track?.title}
          </Box>
          <Box
            component="i"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-all",
            }}
          >
            {track?.artists?.[0]?.name}
          </Box>
        </Box>
      </Box>
      <Box
        bgcolor="#191919"
        flex={1}
        display="flex"
        alignItems="center"
        gap={1}
        px={1.5}
        py={0.5}
      >
        <IconButton
          onClick={togglePlayPause}
          size="small"
          sx={{ color: "white", p: 0 }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Box fontSize={11} color="text.secondary" minWidth={35}>
          {formatTime(currentTime)}
        </Box>
        <Slider
          size="small"
          value={currentTime}
          max={duration || 100}
          onChange={handleSeek}
          sx={{
            color: "primary.main",
            "& .MuiSlider-thumb": {
              width: 10,
              height: 10,
            },
          }}
        />
        <Box fontSize={11} color="text.secondary">
          {formatTime(duration)}
        </Box>
        <IconButton onClick={stop} size="small" sx={{ color: "white", p: 0 }}>
          <Stop />
        </IconButton>
      </Box>
    </Box>
  );
};

export default PlayBack;
