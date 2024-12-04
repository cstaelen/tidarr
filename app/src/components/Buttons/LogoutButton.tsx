import { PowerSettingsNew } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useAuth } from "src/provider/AuthProvider";

export default function LogoutButton() {
  const { logout, isAuthActive } = useAuth();

  if (!isAuthActive) return null;

  return (
    <Tooltip title="Logout">
      <IconButton
        onClick={() => logout()}
        aria-label="Logout"
        size={window.innerWidth > 1024 ? "large" : "small"}
      >
        <PowerSettingsNew />
      </IconButton>
    </Tooltip>
  );
}
