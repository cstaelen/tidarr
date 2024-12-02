import { Settings } from "@mui/icons-material";
import { Badge, IconButton, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function SettingsButton() {
  const { actions, isUpdateAvailable } = useConfigProvider();

  return (
    <Tooltip
      title={`Settings ${isUpdateAvailable ? "(update available)" : ""}`}
    >
      <IconButton
        onClick={() => actions.toggleModal(true)}
        aria-label="Settings"
        size={window.innerWidth > 1024 ? "large" : "small"}
      >
        <Badge color="warning" variant="dot" invisible={!isUpdateAvailable}>
          <Settings />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
