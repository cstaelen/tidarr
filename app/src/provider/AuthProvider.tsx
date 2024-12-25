import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTE_LOGIN } from "src/components/Security/PrivateRoute";
import { ApiReturnType, AuthType, CheckAuthType } from "src/types";

import { useApiFetcher } from "./ApiFetcherProvider";

export const LOCALSTORAGE_TOKEN_KEY = "tidarr-token";
export const LOCALSTORAGE_REDIRECT_URL = "tidarr-redirect";

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
    actions: { auth, is_auth_active },
  } = useApiFetcher();
  const navigate = useNavigate();

  const isAccessGranted = useMemo(
    () => !!localStorage.getItem(LOCALSTORAGE_TOKEN_KEY),
    [localStorage],
  );

  function redirectAfterLogin() {
    const redirect = localStorage.getItem(LOCALSTORAGE_REDIRECT_URL);
    if (redirect) {
      localStorage.removeItem(LOCALSTORAGE_REDIRECT_URL);
      return navigate(redirect);
    }
    return navigate("/");
  }

  const check = async () => {
    const response = await is_auth_active();

    setIsAuthActive(response && (response as CheckAuthType).isAuthActive);
    if (pathname === ROUTE_LOGIN) redirectAfterLogin();
  };

  const login = async (password: string) => {
    const response = await auth(JSON.stringify({ password: password }));

    if ((response as AuthType)?.accessGranted) {
      if (typeof (response as AuthType)?.token === "string") {
        localStorage.setItem(
          LOCALSTORAGE_TOKEN_KEY,
          (response as AuthType)?.token || "",
        );
      }
      redirectAfterLogin();

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
