import { useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Terminal } from "@mui/icons-material";
import TerminalIcon from "@mui/icons-material/Terminal";
import { Box, Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import Ansi from "ansi-to-react";
import { ProcessingItemType } from "src/types";

import { useItemOutput } from "../../hooks/useItemOutput";

// Strip OSC 8 hyperlink sequences while preserving ANSI colors
/**
 * Supprime uniquement les séquences OSC 8 et leurs résidus, en préservant les couleurs et styles ANSI.
 * @param text Le texte brut contenant les séquences ANSI/OSC 8.
 * @returns Le texte nettoyé, prêt pour <Ansi>, avec la coloration préservée.
 */
function stripOSC8(text: string): string {
  // eslint-disable-next-line no-control-regex
  let cleaned = text.replace(/\x1b\]8;[^\x07]*(\x07|\x1b\\8;;)/g, "");
  // eslint-disable-next-line no-control-regex
  cleaned = text.replace(/\u001b\]8;|ESC\]8;/g, "");
  cleaned = cleaned.replace(/id=\d+;?|file:\/\/\/[^\s]+/g, "");
  return cleaned.trim();
}

export const TerminalDialog = ({ item }: { item: ProcessingItemType }) => {
  const [openOutput, setOpenOutput] = useState(false);
  const refOutput = useRef<null | HTMLPreElement>(null);
  const { output, connect, disconnect } = useItemOutput(
    openOutput ? item.id.toString() : null,
  );

  // Clean output by stripping OSC 8 hyperlink codes
  const cleanOutput = useMemo(() => stripOSC8(output), [output]);

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
        <DialogTitle id="alert-dialog-title">
          <Box gap={1} alignItems="center" display="flex">
            <Terminal color="primary" />
            Console output
          </Box>
        </DialogTitle>
        <Pre ref={refOutput} style={{ minWidth: "800px", minHeight: "200px" }}>
          <Ansi linkify={false} useClasses={false}>
            {cleanOutput}
          </Ansi>
        </Pre>
        <DialogActions>
          <Button onClick={() => setOpenOutput(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const Pre = styled.pre`
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
  margin: 0 0.5rem 0 0;
  min-width: 0;
  padding: 0;
`;
