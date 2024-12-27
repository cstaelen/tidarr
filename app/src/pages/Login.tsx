import { Navigate } from "react-router-dom";

import { DialogNoAPI } from "../components/Dialog/DialogNoAPI";
import { AuthModal } from "../components/Security/AuthModal";
import { useAuth } from "../provider/AuthProvider";

export default function Login() {
  const { isAccessGranted } = useAuth();

  if (isAccessGranted) return <Navigate to="/" />;

  return (
    <>
      <AuthModal />
      <DialogNoAPI />
    </>
  );
}
