import React, { ReactNode, useContext, useState } from "react";
import { LOCALSTORAGE_TOKEN_KEY } from "src/provider/AuthProvider";

import {
  AuthType,
  CheckAuthType,
  ConfigType,
  LogType,
  ProcessingItemType,
} from "../types";

type ApiFetcherContextType = {
  error: {
    apiError: Response | undefined;
    setApiError: (res: Response | undefined) => void;
  };
  actions: {
    check: () => Promise<ConfigType | undefined>;
    list: () => Promise<ProcessingItemType[] | undefined>;
    save: (body: string) => Promise<unknown>;
    remove: (body: string) => Promise<unknown>;
    auth: (body: string) => Promise<AuthType | undefined>;
    is_auth_active: () => Promise<CheckAuthType | undefined>;
    get_token: () => Promise<unknown>;
    get_token_log: () => Promise<LogType | undefined>;
  };
};

const ApiFetcherContext = React.createContext<ApiFetcherContextType>(
  {} as ApiFetcherContextType,
);

export function APIFetcherProvider({ children }: { children: ReactNode }) {
  const apiUrl = "/api";
  const [apiError, setApiError] = useState<Response>();

  async function queryExpressJS<T>(
    url: string,
    options?: RequestInit,
  ): Promise<T | undefined> {
    const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);

    if (token) {
      options = {
        ...options,
        headers: { ...options?.headers, authorization: `Bearer ${token}` },
      };
    }

    let output!: T;

    try {
      // setApiError(undefined);

      await fetch(url, { ...options, cache: "no-cache" }).then(
        function (response) {
          if (response.status === 200) {
            output = response.json().then<T>(function (data) {
              return data;
            }) as T;

            return;
          }

          if (response.status === 403) {
            if (localStorage.getItem(LOCALSTORAGE_TOKEN_KEY)) {
              localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
              window.location.reload();
            }
            return;
          }

          if (response.status >= 500) {
            setApiError(response);
            return;
          }
        },
      );
    } catch (e: unknown) {
      console.log((e as Error).message);
      setApiError({ statusText: (e as Error).message } as Response);
      return;
      //throw new Error((e as Error).message);
    }

    return output;
  }

  async function check() {
    return await queryExpressJS<ConfigType>(`${apiUrl}/check`);
  }

  async function list() {
    return await queryExpressJS<ProcessingItemType[]>(`${apiUrl}/list`);
  }

  async function save(body: string) {
    return await queryExpressJS(`${apiUrl}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  async function remove(body: string) {
    return await queryExpressJS(`${apiUrl}/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  async function auth(body?: string): Promise<AuthType | undefined> {
    return await queryExpressJS<AuthType>(`${apiUrl}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  async function is_auth_active(): Promise<CheckAuthType | undefined> {
    return await queryExpressJS<CheckAuthType>(`${apiUrl}/is_auth_active`);
  }

  async function get_token() {
    await queryExpressJS(`${apiUrl}/run_token`);
  }

  async function get_token_log(): Promise<LogType | undefined> {
    return await queryExpressJS<LogType>(`${apiUrl}/token_log`);
  }

  const value = {
    error: {
      apiError,
      setApiError,
    },
    actions: {
      check,
      list,
      save,
      remove,
      auth,
      is_auth_active,
      get_token,
      get_token_log,
    },
  };

  return (
    <ApiFetcherContext.Provider value={value}>
      {children}
    </ApiFetcherContext.Provider>
  );
}

export const useApiFetcher = () => {
  return useContext(ApiFetcherContext);
};
