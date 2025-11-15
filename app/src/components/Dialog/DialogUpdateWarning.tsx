import { useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningIcon from "@mui/icons-material/Warning";
import { Box, Button, Link } from "@mui/material";
import Markdown from "markdown-to-jsx";
import { LOCALSTORAGE_UPDATE_WARNING } from "src/contants";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

const VERSION_CONCERNED = "1.0.1";

const MESSAGE = `
#### Tiddl 3.0 Migration

- **Re-authentication required**: All users must re-authenticate with Tidal after upgrading
- **Quality naming change**: "master" quality renamed to "max" (24-bit 192kHz)
- **Configuration format**: Migrated from JSON to TOML format
  - Old: **\`config/tiddl.json\`**
  - New: **\`config/.tiddl/config.toml\`** + **\`config/.tiddl/auth.json\`**
- **Path templates changed**: Review and adjust your previous settings (quality, paths, templates)
- **Favorites download disabled**: Download/sync all favorite albums/tracks/playlists is disabled and will reimplemented in time by Tiddl team.
`;

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
      title={"Breaking changes !"}
      icon={<WarningIcon color="warning" />}
      maxWidth="md"
      buttons={
        <Button onClick={persistClose} variant="outlined">
          Don't show again
        </Button>
      }
    >
      <Markdown>{MESSAGE}</Markdown>
      <Box gap={2} display="flex">
        <Link
          href="https://github.com/cstaelen/tidarr/blob/main/settings/config.toml"
          target="_blank"
        >
          Config file sample{` `}
          <OpenInNewIcon sx={{ fontSize: 15, verticalAlign: "middle" }} />
        </Link>
        <Link
          href="https://github.com/oskvr37/tiddl/blob/main/docs/templating.md"
          target="_blank"
        >
          File path templating (tiddl){` `}
          <OpenInNewIcon sx={{ fontSize: 15, verticalAlign: "middle" }} />
        </Link>
      </Box>
    </DialogHandler>
  );
};
