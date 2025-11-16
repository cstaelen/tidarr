import { Link } from "react-router-dom";
import styled from "@emotion/styled";
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
} from "@mui/material";
import { useProcessingProvider } from "src/provider/ProcessingProvider";
import { ProcessingItemType } from "src/types";

import { DialogTerminal } from "../Dialog/DialogTerminal";

export const ProcessingItem = ({ item }: { item: ProcessingItemType }) => {
  const step = item?.status;
  const { actions } = useProcessingProvider();

  if (!item?.status) return null;

  async function run() {
    await actions.retryItem(item);
  }

  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      <TableCell>
        <Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}>
          <RemoveButton onClick={() => actions.removeItem(item.id)}>
            <ClearIcon />
          </RemoveButton>
          {step === "finished" ? (
            <CheckIcon color="success" />
          ) : step === "error" ? (
            <WarningIcon color="error" />
          ) : step === "queue" ? (
            <AccessTimeIcon />
          ) : (
            <CircularProgress size={20} />
          )}
          {step === "error" ? (
            <>
              &nbsp;&nbsp;
              <Button variant="outlined" size="small" onClick={() => run()}>
                Retry
              </Button>
            </>
          ) : null}
          &nbsp;&nbsp;
          {item.status !== "queue" && <DialogTerminal item={item} />}
          {step}
        </Box>
      </TableCell>
      <TableCell scope="row">
        {item.id ? (
          <Link to={`${item.type}/${item.id}`} style={{ color: "white" }}>
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
