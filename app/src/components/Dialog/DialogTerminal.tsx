import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Cancel, Replay, Terminal } from "@mui/icons-material";
import TerminalIcon from "@mui/icons-material/Terminal";
import { Box, Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import Ansi from "ansi-to-react";
import { useProcessingProvider } from "src/provider/ProcessingProvider";
import { ProcessingItemType } from "src/types";

import { useItemOutput } from "../../hooks/useItemOutput";

export const DialogTerminal = ({ item }: { item: ProcessingItemType }) => {
  const [openOutput, setOpenOutput] = useState(false);
  const { output, connect, disconnect } = useItemOutput(
    openOutput ? item.id.toString() : null,
  );
  const { actions } = useProcessingProvider();

  async function retry() {
    await actions.retryItem(item);
  }

  // Connect to SSE when dialog opens, disconnect when closes
  useEffect(() => {
    if (openOutput) {
      connect();
    } else {
      disconnect();
    }
  }, [openOutput, connect, disconnect]);

  return (
    <div>
      <TerminalButton
        onClick={() => setOpenOutput(true)}
        data-testid="btn-console"
      >
        <TerminalIcon />
      </TerminalButton>
      <Dialog
        open={openOutput}
        onClose={() => setOpenOutput(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        style={{ zIndex: 9999 }}
        maxWidth="md"
      >
        <DialogTitle id="alert-dialog-title">
          <Box gap={1} alignItems="center" display="flex">
            <Terminal color="primary" />
            Console output
          </Box>
        </DialogTitle>
        <Pre style={{ maxWidth: "800px", width: "800px", height: "420px" }}>
          <Ansi linkify={false} useClasses={false}>
            {output}
          </Ansi>
        </Pre>
        <DialogActions>
          <Box flex="1 1 0" gap={2} display="flex">
            <Button
              variant="outlined"
              color={item.status === "processing" ? "error" : "primary"}
              startIcon={<Cancel />}
              onClick={() => {
                setOpenOutput(false);
                actions.removeItem(item.id);
              }}
            >
              {item.status === "processing" ? "Cancel" : "Remove"}
            </Button>
            {item.status === "error" && (
              <Button
                startIcon={<Replay />}
                variant="outlined"
                onClick={() => retry()}
              >
                Retry
              </Button>
            )}
          </Box>
          <Button variant="outlined" onClick={() => setOpenOutput(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const Pre = styled.pre`
  display: flex;
  flex-direction: column-reverse;
  background-color: #272822;
  color: #f8f8f2;
  font-size: 0.68rem;
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;

  span[style*="color: rgb(187, 0, 0)"] {
    color: #f92672 !important;
  }

  span[style*="color: rgb(0, 187, 0)"] {
    color: #a6e22e !important;
  }

  span[style*="color: rgb(0, 0, 187)"] {
    color: #66d9ef !important;
  }
`;

const TerminalButton = styled(Button)`
  min-width: 0;
  padding: 0;
`;
