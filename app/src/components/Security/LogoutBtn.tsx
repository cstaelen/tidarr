import styled from "@emotion/styled";
import { Logout } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useAuth } from "src/provider/AuthProvider";

export default function LogoutBtn() {
  const { logout, isAuthActive } = useAuth();

  if (!isAuthActive) return null;

  return (
    <ButtonStyled onClick={() => logout()} startIcon={<Logout />}>
      Logout
    </ButtonStyled>
  );
}

const ButtonStyled = styled(Button)`
  bottom: 3rem;
  position: fixed;
  right: 1rem;
  z-index: 2000;
`;
