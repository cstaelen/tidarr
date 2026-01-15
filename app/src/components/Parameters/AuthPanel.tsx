import { useEffect, useState } from "react";
import {
  ContentCopy,
  Lock,
  LockOpen,
  Refresh,
  VpnKey,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";
import { useAuth } from "src/provider/AuthProvider";

import { ModuleTitle } from "../TidalModule/Title";

export default function AuthPanel() {
  const { isAuthActive, authType } = useAuth();
  const {
    actions: { get_api_key, regenerate_api_key },
  } = useApiFetcher();

  const [apiKey, setApiKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const authMode = authType || "none";

  // Load API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await get_api_key();

        if (response) {
          setApiKey(response.apiKey);
        }
      } catch (err) {
        setError("Failed to load API key");
        console.error("Error loading API key:", err);
      } finally {
        setLoading(false);
      }
    };

    loadApiKey();
  }, [get_api_key]);

  const handleRegenerate = async () => {
    if (
      !confirm(
        "This will invalidate your current API key. You'll need to update it in all applications (Lidarr, scripts, etc.). Continue?",
      )
    ) {
      return;
    }

    try {
      setRegenerating(true);
      setError("");
      const response = await regenerate_api_key();

      if (response) {
        setApiKey(response.apiKey);
      }
    } catch (err) {
      setError("Failed to regenerate API key");
      console.error("Error regenerating API key:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getAuthModeDisplay = () => {
    switch (authMode) {
      case "oidc":
        return {
          label: "OpenID Connect",
          color: "primary" as const,
          icon: <Lock fontSize="small" />,
        };
      case "password":
        return {
          label: "Password",
          color: "secondary" as const,
          icon: <VpnKey fontSize="small" />,
        };
      case "none":
        return {
          label: "None (Public)",
          color: "default" as const,
          icon: <LockOpen fontSize="small" />,
        };
    }
  };

  const authDisplay = getAuthModeDisplay();

  return (
    <Box>
      <ModuleTitle title="Security" />

      {/* Auth Mode Display */}
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Box component="label" display="block" mb={1} fontWeight="500">
          Current Mode:
        </Box>
        <Chip
          icon={authDisplay.icon}
          label={authDisplay.label}
          color={authDisplay.color}
          variant="outlined"
        />
      </Box>

      {isAuthActive && (
        <>
          {/* API Key Section */}
          <Box component="h3" mt={4} mb={2}>
            API Key
          </Box>

          <Box component="p" mb={2} color="text.secondary" fontSize="0.9rem">
            Use this API key to authenticate with external applications and
            automation scripts.
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" gap={1} alignItems="flex-start">
            <TextField
              fullWidth
              label="API Key"
              value={loading ? "Loading..." : apiKey}
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { fontFamily: "monospace", fontSize: "0.9rem" },
                },
              }}
              disabled={loading}
            />
            <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                color={copied ? "success" : "default"}
                onClick={handleCopy}
                disabled={loading || !apiKey}
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title="Generate new API key">
              <IconButton
                color="primary"
                onClick={handleRegenerate}
                disabled={loading || regenerating}
              >
                {regenerating ? <CircularProgress size={24} /> : <Refresh />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box mt={1} fontSize="0.85rem" color="text.secondary">
            💡 Tip: The API key is automatically generated and stored in{" "}
            <code>/shared/.tidarr-api-key</code>
          </Box>
        </>
      )}
    </Box>
  );
}
