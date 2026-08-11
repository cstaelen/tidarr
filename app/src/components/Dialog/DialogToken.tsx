import { useEffect, useRef, useState } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useConfigProvider } from "src/provider/ConfigProvider";

import { DialogHandler } from ".";

export const DialogToken = () => {
  const { requiresPkceAuth, tokenMissing } = useConfigProvider();
  const authenticationRequired = tokenMissing || requiresPkceAuth;
  const {
    actions: { complete_pkce_login, start_pkce_login },
  } = useApiFetcher();
  const [loginId, setLoginId] = useState<string>();
  const [loginUrl, setLoginUrl] = useState<string>();
  const [redirectUrl, setRedirectUrl] = useState("");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [forceClose, setForceClose] = useState<boolean>(false);
  const started = useRef(false);

  useEffect(() => {
    if (!authenticationRequired || started.current) return;
    started.current = true;
    setLoading(true);
    start_pkce_login()
      .then((login) => {
        setLoginId(login?.loginId);
        setLoginUrl(login?.loginUrl);
        if (!login) setMessage("Unable to start TIDAL authentication.");
      })
      .finally(() => setLoading(false));
  }, [authenticationRequired, start_pkce_login]);

  const completeLogin = async () => {
    if (!loginId || !redirectUrl.trim()) return;
    setLoading(true);
    setMessage(undefined);
    const result = await complete_pkce_login(loginId, redirectUrl);
    setLoading(false);
    if (result?.success) {
      setMessage("Authenticated!");
      window.location.reload();
      return;
    }
    setMessage(result?.message || "Unable to complete TIDAL authentication.");
  };

  return (
    <DialogHandler
      title={
        requiresPkceAuth
          ? "Upgrade TIDAL authentication"
          : "Tidal token not found !"
      }
      icon={<WarningIcon color="error" />}
      onClose={() => {
        setForceClose(true);
      }}
      open={authenticationRequired && !forceClose}
    >
      <p>Open this link and sign in to TIDAL:</p>
      <Paper
        elevation={0}
        sx={{
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          lineHeight: "1",
        }}
      >
        <Link href={loginUrl} target="_blank" rel="noreferrer">
          {loginUrl || "Preparing secure login…"}
        </Link>
        {loading && <CircularProgress size={16} sx={{ mx: 2 }} />}
      </Paper>
      <Typography
        sx={{
          fontStyle: "italic",
          fontSize: 14,
          py: 1,
        }}
      >
        After login, TIDAL redirects to an “Oops” page. Copy its complete URL
        from the browser address bar and paste it below. This Hi-Res login is
        required for stereo fallback and MAX-quality FLAC.
      </Typography>
      <TextField
        fullWidth
        label="Redirected TIDAL URL"
        placeholder="https://tidal.com/android/login/auth?code=…"
        value={redirectUrl}
        onChange={(event) => setRedirectUrl(event.target.value)}
        error={!!message && message !== "Authenticated!"}
        helperText={message}
        sx={{ mt: 1 }}
      />
      <Button
        variant="contained"
        disabled={loading || !loginId || !redirectUrl.trim()}
        onClick={completeLogin}
        sx={{ mt: 2 }}
      >
        Complete authentication
      </Button>
    </DialogHandler>
  );
};
