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

function parseCronDuration(cron: string): string {
  const parts = cron
    .trim()
    .replace(/^["']|["']$/g, "")
    .split(/\s+/);
  if (parts.length !== 5) return cron;
  const [minute, hour] = parts;

  const minuteMatch = minute.match(/^\*\/(\d+)$/);
  if (minuteMatch && hour === "*") {
    const m = parseInt(minuteMatch[1]);
    return m === 1 ? "1 minute" : `${m} minutes`;
  }

  const hourMatch = hour.match(/^\*\/(\d+)$/);
  if (hourMatch && minute === "0") {
    const h = parseInt(hourMatch[1]);
    return h === 1 ? "1 hour" : `${h} hours`;
  }

  if (minute !== "*" && hour === "0") return `${minute}min`;
  if (minute === "0" && hour !== "*") return `${hour}h`;

  return cron;
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
  const batchCron = config?.DOWNLOAD_BATCH_CRON;
  const batchLabel = useMemo(
    () =>
      batchSize && batchCron
        ? `Batch download active: ${batchCount ?? 0}/${batchSize} downloads — pauses for ${parseCronDuration(batchCron)} every ${batchSize} items`
        : undefined,
    [batchSize, batchCron, batchCount],
  );

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
