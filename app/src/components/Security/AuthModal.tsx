import { FormEvent, useRef, useState } from "react";
import AlbumIcon from "@mui/icons-material/Album";
import { Alert, Box, Button, Input, Modal, Typography } from "@mui/material";
import { useAuth } from "src/provider/AuthProvider";
import { ApiReturnType } from "src/types";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  maxWidth: "21rem",
  width: "95%",
};

const styleTitle = {
  borderBottom: "2px solid #000",
  px: 4,
  py: 2,
};

const styleContent = {
  p: 4,
};

export const AuthModal = () => {
  const refInput = useRef<HTMLInputElement>(null);
  const [authError, setAuthError] = useState<boolean | string>(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithOIDC, authType } = useAuth();

  async function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(false);
    const data = new FormData(e.currentTarget);
    const response = await login(data.get("password")?.toString() || "");

    if ((response as ApiReturnType)?.message) {
      setAuthError((response as ApiReturnType).message);
    }

    setIsLoading(false);
  }

  return (
    <Modal
      open
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Box sx={styleTitle}>
          <Typography
            variant="h6"
            component="h6"
            alignItems="center"
            display="flex"
            justifyContent="center"
          >
            <AlbumIcon />
            &nbsp;&nbsp;
            <span>{"Tidarr authentication"}</span>
          </Typography>
        </Box>
        {authError && <Alert severity="error">{authError}</Alert>}
        <Box sx={styleContent}>
          {authType === "password" && (
            <form onSubmit={(e) => submitForm(e)} style={{ display: "flex" }}>
              <Input
                ref={refInput}
                id="password"
                name="password"
                type="password"
                placeholder="Password..."
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : "Submit"}
              </Button>
            </form>
          )}
          {authType === "oidc" && (
            <Button variant="contained" onClick={loginWithOIDC} fullWidth>
              Login with OpenID
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
};
