import { useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import { Button, Link } from "@mui/material";
import { LOCALSTORAGE_UPDATE_WARNING } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogUpdateWarning = () => {
  const { config } = useConfigProvider();
  const [show, setShow] = useState(
    localStorage.getItem(LOCALSTORAGE_UPDATE_WARNING) !== "1",
  );

  function persistClose() {
    setShow(false);
    // Local storage
    localStorage.setItem(LOCALSTORAGE_UPDATE_WARNING, "1");
  }

  return (
    <DialogHandler
      open={show && !!config?.TIDARR_VERSION?.includes("0.3.1")}
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
      <p>
        <Link
          href="https://github.com/cstaelen/tidarr?tab=readme-ov-file#getting-started"
          target="_blank"
        >
          Read more on Github
        </Link>
      </p>
    </DialogHandler>
  );
};
