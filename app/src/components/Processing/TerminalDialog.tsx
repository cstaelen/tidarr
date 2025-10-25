import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import TerminalIcon from "@mui/icons-material/Terminal";
import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { ProcessingItemType } from "src/types";

import { useItemOutput } from "../../hooks/useItemOutput";

export const TerminalDialog = ({ item }: { item: ProcessingItemType }) => {
  const [openOutput, setOpenOutput] = useState(false);
  const refOutput = useRef<null | HTMLPreElement>(null);
  const { output, connect, disconnect } = useItemOutput(
    openOutput ? item.id.toString() : null,
  );

  // Connect to SSE when dialog opens, disconnect when closes
  useEffect(() => {
    if (openOutput) {
      connect();
    } else {
      disconnect();
    }
  }, [openOutput, connect, disconnect]);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    setTimeout(() => {
      if (refOutput.current) {
        refOutput.current.scrollTop = refOutput.current?.scrollHeight;
      }
    }, 100);
  }, [output, openOutput]);

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
        <DialogTitle id="alert-dialog-title">Console output</DialogTitle>
        <Pre ref={refOutput} style={{ minWidth: "800px", minHeight: "200px" }}>
          {output}
        </Pre>
        <DialogActions>
          <Button onClick={() => setOpenOutput(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const Pre = styled.pre`
  background-color: #000;
  font-size: 0.68rem;
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
`;

const TerminalButton = styled(Button)`
  margin: 0 0.5rem 0 0;
  min-width: 0;
  padding: 0;
`;
