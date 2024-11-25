import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, is_auth_active } from "src/server/queryApi";
import { ApiReturnType, AuthType, CheckAuthType } from "src/types";

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
  const isAccessGranted = useMemo(
    () => !!localStorage.getItem(LOCALSTORAGE_TOKEN_KEY),
    [localStorage],
  );

  const check = async () => {
    const response = await is_auth_active();
    setIsAuthActive(response && (response as CheckAuthType).isAuthActive);
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
      window.location.replace("/");

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
