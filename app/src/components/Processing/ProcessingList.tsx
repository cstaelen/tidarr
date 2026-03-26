import { useMemo, useState } from "react";
import { ClearAll, DeleteSweep, VisibilityOff, Visibility } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { ProcessingPauseButton } from "src/components/Processing/PauseButton";
import { ProcessingTable } from "src/components/Processing/ProcessingTable";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

import BackButton from "../Buttons/BackButton";

export default function ProcessingList() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const { actions: apiActions } = useApiFetcher();
  const { processingList } = useProcessingProvider();
  const { config } = useConfigProvider();

  const reversedProcessingList = useMemo(
    () => processingList?.slice().reverse(),
    [processingList],
  );

  const activeList = useMemo(
    () => reversedProcessingList?.filter((item) => item.status !== "finished"),
    [reversedProcessingList],
  );

  const finishedList = useMemo(
    () => reversedProcessingList?.filter((item) => item.status === "finished"),
    [reversedProcessingList],
  );

  const handleRemoveAll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all items from the queue?",
      )
    ) {
      return;
    }

    setIsRemoving(true);
    try {
      await apiActions.remove_all();
    } catch (error) {
      console.error("Failed to remove all items:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRemoveFinished = async () => {
    setIsRemoving(true);
    try {
      await apiActions.remove_finished();
    } catch (error) {
      console.error("Failed to remove finished items:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <ModuleTitle
        title="Download queue"
        total={processingList?.length}
        leftBlock={<BackButton />}
        rightBlock={
          <Box
            display="flex"
            gap={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <div>
              {config?.NO_DOWNLOAD !== "true" ? (
                <ProcessingPauseButton />
              ) : (
                <Typography color="warning">
                  No download mode is active
                </Typography>
              )}
            </div>
            <Box display="flex" gap={2}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteSweep />}
                onClick={handleRemoveAll}
                disabled={isRemoving || !processingList?.length}
              >
                {isRemoving ? "Clearing..." : "Clear all"}
              </Button>
            </Box>
          </Box>
        }
      />
      <ProcessingTable
        items={activeList ?? []}
        ariaLabel="Processing table"
        emptyMessage="Nothing to process."
      />
      {finishedList && finishedList.length > 0 && (
        <>
          <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={2}>
            <Button
              size="small"
              variant="outlined"
              startIcon={showFinished ? <VisibilityOff /> : <Visibility />}
              onClick={() => setShowFinished((v) => !v)}
            >
              {showFinished ? "Hide finished" : `Show finished (${finishedList.length})`}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearAll />}
              onClick={handleRemoveFinished}
              disabled={isRemoving}
            >
              Clear finished
            </Button>
          </Box>
          {showFinished && (
            <Box mt={1}>
              <ProcessingTable
                items={finishedList}
                ariaLabel="Finished table"
              />
            </Box>
          )}
        </>
      )}
    </>
  );
}
