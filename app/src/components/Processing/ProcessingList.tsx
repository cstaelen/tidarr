import { useState } from "react";
import { ClearAll, DeleteSweep } from "@mui/icons-material";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ProcessingPauseButton } from "src/components/Processing/PauseButton";
import { ProcessingItem } from "src/components/Processing/ProcessingItem";
import { ModuleTitle } from "src/components/TidalModule/Title";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

export default function ProcessingList() {
  const [isRemoving, setIsRemoving] = useState(false);
  const { actions: apiActions } = useApiFetcher();
  const { processingList } = useProcessingProvider();
  const { config } = useConfigProvider();

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
                startIcon={<ClearAll />}
                onClick={handleRemoveFinished}
                disabled={
                  isRemoving ||
                  !processingList?.some((item) =>
                    ["finished", "error"].includes(item.status),
                  )
                }
              >
                Clear finished
              </Button>
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
      <Paper>
        <TableContainer>
          <Table aria-label="Processing table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Processing list</strong>
                </TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quality</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processingList?.map((item, index) => (
                <ProcessingItem item={item} key={`processing-index-${index}`} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
