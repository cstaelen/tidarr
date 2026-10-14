import { useLocation, useNavigate } from "react-router-dom";
import { Settings } from "@mui/icons-material";
import { Badge, IconButton, Tooltip } from "@mui/material";
import { useConfigProvider } from "src/provider/ConfigProvider";

export default function SettingsButton() {
  const { isUpdateAvailable } = useConfigProvider();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ROUTE = "/parameters#updates";
  // useLocation is relative to the router basename (URL_BASE)
  const isActive = pathname === "/parameters";

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
