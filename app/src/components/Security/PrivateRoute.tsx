import { Navigate, Outlet } from "react-router-dom";

import { LOCALSTORAGE_TOKEN_KEY, useAuth } from "../../provider/AuthProvider";

const PrivateRoute = () => {
  const { isAuthActive } = useAuth();
  const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);

  console.log(isAuthActive);

  if (isAuthActive && !token) return <Navigate to="/login" />;
  return <Outlet />;
};

export default PrivateRoute;
