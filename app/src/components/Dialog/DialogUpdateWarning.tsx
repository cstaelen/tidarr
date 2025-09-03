import { useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningIcon from "@mui/icons-material/Warning";
import { Box, Button, Link } from "@mui/material";
import { LOCALSTORAGE_UPDATE_WARNING } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

const VERSION_CONCERNED = "0.3.1";

export const DialogUpdateWarning = () => {
  const { config } = useConfigProvider();
  const [show, setShow] = useState(
    localStorage.getItem(LOCALSTORAGE_UPDATE_WARNING) !== VERSION_CONCERNED,
  );

  function persistClose() {
    setShow(false);
    localStorage.setItem(LOCALSTORAGE_UPDATE_WARNING, VERSION_CONCERNED);
  }

  return (
    <DialogHandler
      open={show && !!config?.TIDARR_VERSION?.includes(VERSION_CONCERNED)}
      onClose={() => setShow(false)}
      title={"Folder configuration has changed !"}
      icon={<WarningIcon color="error" />}
      maxWidth="sm"
      buttons={
        <Button onClick={persistClose} variant="outlined">
          Don't show again
        </Button>
      }
    >
      <p>
        Since the latest update, the folder configuration has changed. There is
        now only a single Docker volume for the music library (destination).
      </p>
      <p>
        To define the subfolders and the destination format for tracks, albums,
        playlists, etc., you will need to edit the "template" section of the{" "}
        <strong>
          <i>tiddl.json</i>
        </strong>{" "}
        file.
      </p>
      <Box gap={2} display="flex">
        <Link
          href="https://github.com/cstaelen/tidarr?tab=readme-ov-file#getting-started"
          target="_blank"
        >
          Read more on Github{` `}
          <OpenInNewIcon sx={{ fontSize: 15, verticalAlign: "middle" }} />
        </Link>
        <Link
          href="https://github.com/oskvr37/tiddl/wiki/Template-formatting"
          target="_blank"
        >
          Template formatting (tiddl){` `}
          <OpenInNewIcon sx={{ fontSize: 15, verticalAlign: "middle" }} />
        </Link>
      </Box>
    </DialogHandler>
  );
};
