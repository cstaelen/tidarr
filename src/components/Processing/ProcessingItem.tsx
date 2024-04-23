import { TableRow, TableCell, Button, CircularProgress } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import WarningIcon from "@mui/icons-material/Warning";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ClearIcon from "@mui/icons-material/Clear";
import styled from "@emotion/styled";
import { useProcessingProvider } from "src/provider/ProcessingProvider";
import { ProcessingItemType } from "src/types";
import { TerminalDialog } from "./TerminalDialog";
import { Link } from "react-router-dom";

export const ProcessingItem = ({ item }: { item: ProcessingItemType }) => {
  const step = item?.status;
  const { actions } = useProcessingProvider();

  if (!item?.status) return null;

  async function run() {
    await actions.retryItem(item);
  }

  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      <TableCell
        style={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}
      >
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
        {item.output && <TerminalDialog item={item} />}
        {step}
      </TableCell>
      <TableCell scope="row">
        <Link to={item.url} target="_blank" style={{ color: "white" }}>
          {item.title}
        </Link>
      </TableCell>
      <TableCell scope="row">{item.artist}</TableCell>
      <TableCell scope="row">{item.type}</TableCell>
    </TableRow>
  );
};

const RemoveButton = styled(Button)`
  margin: 0 0.5rem 0 0;
  min-width: 0;
  padding: 0;
`;
