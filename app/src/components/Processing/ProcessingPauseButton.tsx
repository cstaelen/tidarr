import { useCallback, useEffect, useState } from "react";
import { Pause, PlayArrow } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

export const ProcessingPauseButton = () => {
  const { actions: apiActions } = useApiFetcher();
  const {
    isPaused,
    actions: { setIsPaused },
  } = useProcessingProvider();
  const [isLoading, setIsLoading] = useState(false);

  const loadQueueStatus = useCallback(async () => {
    try {
      const status = await apiActions.get_queue_status();
      if (status) {
        setIsPaused(status.isPaused);
      }
    } catch (error) {
      console.error("Failed to load queue status:", error);
    }
  }, [apiActions, setIsPaused]);

  const handleTogglePause = async () => {
    setIsLoading(true);
    try {
      if (isPaused) {
        await apiActions.resume_queue();
        setIsPaused(false);
      } else {
        await apiActions.pause_queue();
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Failed to toggle queue pause:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueueStatus();
  }, [loadQueueStatus]);

  return (
    <Tooltip title={isPaused ? "Resume queue" : "Pause queue"}>
      <IconButton
        onClick={handleTogglePause}
        disabled={isLoading}
        color={isPaused ? "warning" : "primary"}
        aria-label={isPaused ? "Resume" : "Pause"}
        size="small"
      >
        {isPaused ? <PlayArrow /> : <Pause />}
      </IconButton>
    </Tooltip>
  );
};
