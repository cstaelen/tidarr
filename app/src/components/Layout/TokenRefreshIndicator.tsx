import { Autorenew } from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

/**
 * Global indicator shown whenever the backend auto-renews the Tidal token
 * while handling an in-flight /proxy/tidal request (search, album, track,
 * artist, playlist, mix, home...). Mounted once in MainLayout so it shows
 * up regardless of which page triggered the renew.
 */
export const TokenRefreshIndicator = () => {
  const { isRefreshingToken } = useApiFetcher();

  if (!isRefreshingToken) return null;

  return (
    <Tooltip title="Tidal session expired, renewing token...">
      <Chip
        icon={<Autorenew sx={{ animation: "spin 1.5s linear infinite" }} />}
        label="Renewing Tidal token"
        size="small"
        color="info"
        variant="outlined"
        sx={{
          position: "fixed",
          bottom: 116,
          right: 16,
          zIndex: "2000",
          bgcolor: "background.paper",
          "@keyframes spin": {
            from: { transform: "rotate(0deg)" },
            to: { transform: "rotate(360deg)" },
          },
        }}
      />
    </Tooltip>
  );
};
