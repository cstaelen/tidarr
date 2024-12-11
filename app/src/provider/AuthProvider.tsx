import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTE_LOGIN } from "src/components/Security/PrivateRoute";
import { auth, is_auth_active } from "src/server/queryApi";
import { ApiReturnType, AuthType, CheckAuthType } from "src/types";

import { useConfigProvider } from "./ConfigProvider";

export const LOCALSTORAGE_TOKEN_KEY = "tidarr-token";

type AuthContextType = {
  isAuthActive: boolean | undefined;
  isAccessGranted: boolean;
  login: (password: string) => Promise<ApiReturnType | AuthType | void>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthActive, setIsAuthActive] = useState<boolean>();
  const { pathname } = useLocation();
  const {
    actions: { setApiError },
  } = useConfigProvider();
  const navigate = useNavigate();

  const isAccessGranted = useMemo(
    () => !!localStorage.getItem(LOCALSTORAGE_TOKEN_KEY),
    [localStorage],
  );

  const check = async () => {
    setApiError(undefined);

    const response = await is_auth_active();

    if ((response as ApiReturnType).error) {
      setApiError(response as ApiReturnType);
      return;
    }

    setIsAuthActive(response && (response as CheckAuthType).isAuthActive);
    if (pathname === ROUTE_LOGIN) navigate("/");
  };

  const login = async (password: string) => {
    const response = await auth(JSON.stringify({ password: password }));

    if ((response as ApiReturnType).status === 500) {
      setApiError(response as ApiReturnType);
      return;
    }

    if ((response as AuthType)?.accessGranted) {
      if (typeof (response as AuthType)?.token === "string") {
        localStorage.setItem(
          LOCALSTORAGE_TOKEN_KEY,
          (response as AuthType)?.token || "",
        );
      }
      navigate("/");

      return;
    }

    return response;
  };

  const logout = () => {
    localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
    window.location.reload();
  };

  useEffect(() => {
    if (isAuthActive === undefined) {
      check();
    }
  }, []);

  const value = {
    isAuthActive,
    isAccessGranted,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
