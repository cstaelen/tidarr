import { ArtTrack, ViewModule } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function DisplayButton() {
  const { actions, display } = useConfigProvider();

  return (
    <Tooltip title="Display mode">
      <IconButton
        onClick={() =>
          actions.setDisplay(display === "small" ? "large" : "small")
        }
        aria-label="Display mode"
        size={window.innerWidth > 1024 ? "large" : "small"}
      >
        {display === "small" ? <ArtTrack /> : <ViewModule />}
      </IconButton>
    </Tooltip>
  );
}
