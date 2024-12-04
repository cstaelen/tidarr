import { Navigate, Outlet } from "react-router-dom";

import { LOCALSTORAGE_TOKEN_KEY, useAuth } from "../../provider/AuthProvider";

export const ROUTE_LOGIN = "/login";

const PrivateRoute = () => {
  const { isAuthActive } = useAuth();
  const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);

  if (isAuthActive && !token) return <Navigate to={ROUTE_LOGIN} />;
  return <Outlet />;
};

export default PrivateRoute;
