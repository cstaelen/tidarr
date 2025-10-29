import { useEffect, useState } from "react";
import { ClearAll, DeleteSweep } from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Paper,
  SpeedDial,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";
import { useProcessingProvider } from "src/provider/ProcessingProvider";

import { ProcessingItem } from "./ProcessingItem";

export const ProcessingList = () => {
  const { processingList } = useProcessingProvider();
  const { actions } = useConfigProvider();
  const { actions: apiActions } = useApiFetcher();
  const [open, setOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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

  const isLoading = processingList
    ? processingList?.filter((item) => item?.loading === true)?.length > 0
    : false;
  const hasError = processingList
    ? processingList?.filter((item) => item?.status === "error")?.length > 0
    : false;

  const buttonColor = hasError ? "error" : !isLoading ? "success" : "primary";

  const processingButton = (
    <>
      {isLoading && (
        <CircularProgress
          size={68}
          sx={{
            color: blue[500],
            position: "absolute",
            top: -6,
            left: -6,
            zIndex: 1,
          }}
        />
      )}
      <strong>
        {processingList?.filter((item) => item?.status === "finished")?.length}/
        {processingList?.length || 0}
      </strong>
    </>
  );

  useEffect(() => {
    if (hasError) {
      actions.checkAPI();
    }
  }, [hasError]);

  if (!processingList || processingList?.length === 0) return null;

  return (
    <SpeedDial
      ariaLabel="Show processing list"
      sx={{ position: "fixed", bottom: 50, right: 16, zIndex: "2000" }}
      icon={processingButton}
      FabProps={{
        color: buttonColor,
      }}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      <Backdrop onClick={handleClose} open={open} />
      <Box
        sx={{
          maxWidth: {
            xs: "90vw",
            md: "750px",
          },
          maxHeight: "80vh",
          padding: "20px",
          opacity: open ? 1 : 0,
          position: "absolute",
          overflow: "auto",
          right: 0,
          visibility: open ? "visible" : "hidden",
        }}
      >
        <Paper>
          <TableContainer sx={{ minWidth: "700px" }}>
            <Table size="small" aria-label="Processing table">
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
                  <ProcessingItem
                    item={item}
                    key={`processing-index-${index}`}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            display="flex"
            gap={2}
            p={1}
            bgcolor="background.default"
            justifyContent="end"
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearAll />}
              onClick={handleRemoveFinished}
              disabled={
                isRemoving ||
                !processingList?.some((item) =>
                  ["finished", "downloaded", "error"].includes(item.status),
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
        </Paper>
      </Box>
    </SpeedDial>
  );
};
