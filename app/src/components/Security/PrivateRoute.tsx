import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  LOCALSTORAGE_REDIRECT_URL,
  LOCALSTORAGE_TOKEN_KEY,
} from "src/contants";
import { useApiFetcher } from "src/provider/ApiFetcherProvider";

import { useAuth } from "../../provider/AuthProvider";
import { DialogNoAPI } from "../Dialog/DialogNoAPI";

import { Loader } from "./Loader";

export const ROUTE_LOGIN = "/login";

const PrivateRoute = () => {
  const { isAuthActive } = useAuth();
  const { error } = useApiFetcher();
  const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
  const { pathname, search } = useLocation();

  if (error.apiError) return <DialogNoAPI />;
  if (isAuthActive === undefined) return <Loader />;

  if (isAuthActive && !token) {
    localStorage.setItem(LOCALSTORAGE_REDIRECT_URL, `${pathname}${search}`);
    return <Navigate to={ROUTE_LOGIN} />;
  }
  return <Outlet />;
};

export default PrivateRoute;
