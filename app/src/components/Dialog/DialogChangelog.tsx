import { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Box, Button, Link, Paper } from "@mui/material";
import Markdown from "markdown-to-jsx";
import { LOCALSTORAGE_LAST_SEEN_VERSION, TIDARR_REPO_URL } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

const markdownSx = {
  "& a": { color: "rgb(144, 202, 249)" },
  "& ul": { pl: 2, pb: 2 },
  mb: 2,
};

export const DialogChangelog = () => {
  const {
    config,
    unseenReleases,
    actions: { markVersionAsSeen },
  } = useConfigProvider();

  const [dismissed, setDismissed] = useState(false);
  const isOpen = !dismissed && unseenReleases.length > 0;
  const lastSeenVersion = localStorage.getItem(LOCALSTORAGE_LAST_SEEN_VERSION);

  return (
    <DialogHandler
      open={isOpen}
      onClose={() => setDismissed(true)}
      title={`What's new in Tidarr ${config?.TIDARR_VERSION}`}
      icon={<AutoAwesomeIcon color="primary" />}
      maxWidth="md"
      buttons={
        <Button onClick={markVersionAsSeen} variant="contained">
          Got it, don't show again.
        </Button>
      }
    >
      <Box
        sx={{
          width: 800,
          maxWidth: "100%",
          maxHeight: 400,
          overflow: "auto",
          fontSize: 14,
        }}
      >
        <p>
          {lastSeenVersion
            ? `Updated from ${lastSeenVersion} to ${config?.TIDARR_VERSION}`
            : `Welcome to Tidarr ${config?.TIDARR_VERSION}`}
        </p>
        {unseenReleases.map((release) => (
          <Box key={release.tag_name} sx={markdownSx}>
            <Paper sx={{ py: 1, px: 2 }}>
              <code>
                <Markdown options={{ wrapper: "article" }}>
                  {release.body}
                </Markdown>
              </code>
            </Paper>
          </Box>
        ))}
      </Box>
      <Link
        target="_blank"
        href={`https://github.com/${TIDARR_REPO_URL}/releases`}
        sx={{ mt: 2, display: "block" }}
      >
        See all releases
      </Link>
    </DialogHandler>
  );
};
