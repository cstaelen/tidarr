import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  LOCALSTORAGE_REDIRECT_URL,
  LOCALSTORAGE_TOKEN_KEY,
} from "src/contants";

import { useAuth } from "../../provider/AuthProvider";

import { Loader } from "./Loader";

export const ROUTE_LOGIN = "/login";

const PrivateRoute = () => {
  const { isAuthActive } = useAuth();
  const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
  const { pathname, search } = useLocation();

  if (isAuthActive === undefined) return <Loader />;

  if (isAuthActive && !token) {
    localStorage.setItem(LOCALSTORAGE_REDIRECT_URL, `${pathname}${search}`);
    return <Navigate to={ROUTE_LOGIN} />;
  }
  return <Outlet />;
};

export default PrivateRoute;
