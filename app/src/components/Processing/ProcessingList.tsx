import { useMemo, useState } from "react";
import {
  ClearAll,
  DeleteSweep,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { ProcessingPauseButton } from "src/components/Processing/PauseButton";
import { ProcessingTable } from "src/components/Processing/ProcessingTable";
import { SearchFilter } from "src/components/Processing/SearchFilter";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

import BackButton from "../Buttons/BackButton";

function formatDelay(minutes: number): string {
  if (minutes < 60) return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  const h = Math.round(minutes / 60);
  return h === 1 ? "1 hour" : `${h} hours`;
}

export default function ProcessingList() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const [search, setSearch] = useState("");
  const { actions: apiActions } = useApiFetcher();
  const { processingList, batchCount } = useProcessingProvider();
  const { config } = useConfigProvider();

  const keyword = search.toLowerCase();

  const batchSize = config?.DOWNLOAD_BATCH_SIZE;
  const batchDelay = config?.DOWNLOAD_BATCH_DELAY;
  const batchLabel = useMemo(() => {
    if (!batchSize) return undefined;
    const delayStr = batchDelay
      ? `pauses for ${formatDelay(parseFloat(batchDelay))} every ${batchSize} items`
      : `pauses every ${batchSize} items`;
    return `Batch download active: ${batchCount ?? 0}/${batchSize} downloads — ${delayStr}`;
  }, [batchSize, batchDelay, batchCount]);

  const activeList = useMemo(
    () =>
      processingList?.filter(
        (item) =>
          item.status !== "finished" &&
          (!keyword ||
            item.title?.toLowerCase().includes(keyword) ||
            item.artist?.toLowerCase().includes(keyword)),
      ),
    [processingList, keyword],
  );

  const finishedList = useMemo(
    () =>
      processingList?.filter(
        (item) =>
          item.status === "finished" &&
          (!keyword ||
            item.title?.toLowerCase().includes(keyword) ||
            item.artist?.toLowerCase().includes(keyword)),
      ),
    [processingList, keyword],
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
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ProcessingPauseButton />
            <Box
              sx={{
                display: "flex",
                gap: 2,
              }}
            >
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
      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexFlow: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <SearchFilter value={search} onChange={setSearch} />
        {batchLabel && (
          <Typography variant="caption" color="warning">
            {batchLabel}
          </Typography>
        )}
      </Box>
      <ProcessingTable
        items={activeList ?? []}
        ariaLabel="Processing table"
        emptyMessage="Nothing to process."
      />
      {finishedList && finishedList.length > 0 && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mt: 2,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={showFinished ? <VisibilityOff /> : <Visibility />}
              onClick={() => setShowFinished((v) => !v)}
            >
              {showFinished
                ? "Hide finished"
                : `Show finished (${finishedList.length})`}
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
            <Box
              sx={{
                mt: 1,
              }}
            >
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
