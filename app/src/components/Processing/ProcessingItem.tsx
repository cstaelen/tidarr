import { ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "@emotion/styled";
import { Block, CoffeeMaker, MoreHoriz } from "@mui/icons-material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  Button,
  CircularProgress,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useProcessingProvider } from "src/provider/ProcessingProvider";
import { ProcessingItemType } from "src/types";

import { DialogTerminal } from "../Dialog/DialogTerminal";

import { CircularProgressWithLabel } from "./CircularProgressWithLabel";

const STATUS_ICONS: Record<string, ReactElement> = {
  finished: <CheckIcon color="success" />,
  error: <WarningIcon color="error" />,
  queue_download: <AccessTimeIcon />,
  queue_processing: <MoreHoriz />,
  processing: <CoffeeMaker />,
  no_download: <Block color="disabled" />,
};

export const ProcessingItem = ({ item }: { item: ProcessingItemType }) => {
  const status = item?.status;
  const { actions } = useProcessingProvider();

  if (!item?.status) return null;

  const url = item.type.includes("favorite_")
    ? `/#my-favorites`
    : `/${item.type}/${item.id}`;

  const renderStatusIcon = () => {
    if (status === "download" && item.progress) {
      return (
        <CircularProgressWithLabel
          current={item.progress.current}
          total={item.progress.total}
        />
      );
    }

    const icon = STATUS_ICONS[status] ?? <CircularProgress size={24} />;
    return <Tooltip title={status}>{icon}</Tooltip>;
  };

  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      <TableCell width="6rem">
        <Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}>
          <RemoveButton onClick={() => actions.removeItem(item.id)}>
            <ClearIcon />
          </RemoveButton>
          {renderStatusIcon()}
          {status === "error" && (
            <>
              &nbsp;&nbsp;
              <Button
                variant="outlined"
                size="small"
                onClick={() => actions.retryItem(item)}
              >
                Retry
              </Button>
            </>
          )}
          &nbsp;&nbsp;
          {item.status !== "queue_download" &&
            item.status !== "no_download" && <DialogTerminal item={item} />}
        </Box>
      </TableCell>
      <TableCell scope="row">
        {item.id ? (
          <Link to={url} style={{ color: "white" }}>
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </TableCell>
      <TableCell>{item.artist}</TableCell>
      <TableCell scope="row">{item.type}</TableCell>
      <TableCell scope="row">
        {item.type !== "video" ? item.quality : ""}
      </TableCell>
    </TableRow>
  );
};

const RemoveButton = styled(Button)`
  margin: 0 0.5rem 0 0;
  min-width: 0;
  padding: 0;
`;
