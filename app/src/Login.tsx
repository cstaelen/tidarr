import { Navigate } from "react-router-dom";

import { DialogAuth } from "./components/Dialog/DialogAuth";
import { DialogNoAPI } from "./components/Dialog/DialogNoAPI";
import { useAuth } from "./provider/AuthProvider";

export default function Login() {
  const { isAccessGranted } = useAuth();

  if (isAccessGranted) return <Navigate to="/" />;

  return (
    <>
      <DialogAuth />
      <DialogNoAPI />
    </>
  );
}
