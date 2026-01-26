import { useNavigate } from "react-router-dom";
import { Settings } from "@mui/icons-material";
import { Badge, IconButton, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function SettingsButton() {
  const { isUpdateAvailable } = useConfigProvider();
  const navigate = useNavigate();
  const ROUTE = "/parameters#updates";
  console.log(window.location.pathname);
  const isActive = window.location.pathname === ROUTE;

  return (
    <Tooltip
      title={`Tidarr settings ${isUpdateAvailable ? "(update available)" : ""}`}
    >
      <IconButton
        onClick={() => navigate(ROUTE)}
        aria-label="Tidarr settings"
        size={window.innerWidth > 1024 ? "large" : "small"}
        color={isActive ? "primary" : "default"}
      >
        <Badge color="warning" variant="dot" invisible={!isUpdateAvailable}>
          <Settings />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
