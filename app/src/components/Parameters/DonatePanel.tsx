import { useState } from "react";
import { Check, ContentCopy, Favorite } from "@mui/icons-material";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";

import { ModuleTitle } from "../TidalModule/Title";

const ADDRESS = "0xC168EA5e2A03792B8fA08153882A5691b6C90De6";

export default function DonatePanel() {
  const [copied, setCopied] = useState<boolean>();
  async function copyToClipboard(text: string): Promise<void> {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        return;
      } catch (err) {
        console.warn(
          "Modern Clipboard API failed, attempting fallback...",
          err,
        );
      }
    }

    // Fallback for older browsers or non-secure contexts
    return new Promise<void>((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed"; // Hide the element
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const success = document.execCommand("copy");
        if (success) {
          resolve();
          setCopied(true);
        } else {
          throw new Error("Copy failed.");
        }
      } catch {
        reject(new Error("Unable to copy text to clipboard."));
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  return (
    <>
      <ModuleTitle
        title={
          <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
            I knew you had some love to give!
            <Favorite color="error" />
          </Box>
        }
      />
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="body1">
          If you would like to support this project, please do not hesitate to
          make a donation.
        </Typography>
        <Typography variant="body1">
          It contributes a lot to :
          <ul>
            <li>Motivation – Keeping the project alive and evolving.</li>
            <li>Energy – Sustaining long-term maintenance and improvements.</li>
            <li>Feature development – Implementing user-requested features</li>
            <li>Community support – Addressing user questions and feedback.</li>
          </ul>
        </Typography>
        <a href="https://www.buymeacoffee.com/clst" target="_blank">
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            style={{ height: "50px" }}
          />
        </a>
        <Typography variant="h2">or BTC/ETH: </Typography>
        <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Box flex="1 1 0" fontFamily="monospace">
            {ADDRESS}
          </Box>
          <Tooltip title="Copy address in clipboard">
            <IconButton onClick={() => copyToClipboard(ADDRESS)}>
              {copied ? <Check color="success" /> : <ContentCopy />}
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>
    </>
  );
}
