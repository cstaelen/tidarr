import React, { ReactNode, useContext, useState } from "react";
import {
  EventSourceController,
  EventSourcePlus,
  SseMessage,
} from "event-source-plus";
import { LOCALSTORAGE_TOKEN_KEY, TIDARR_API_URL } from "src/contants";

import {
  AuthType,
  CheckAuthType,
  ConfigType,
  LogType,
  ProcessingItemType,
} from "../types";

type ApiFetcherContextType = {
  apiUrl: string | undefined;
  error: {
    apiError: Response | undefined;
    setApiError: (res: Response | undefined) => void;
  };
  actions: {
    check: () => Promise<ConfigType | undefined>;
    list_sse: (setData: (data: ProcessingItemType[]) => void) => {
      eventSource: EventSourcePlus;
      controller: EventSourceController;
    };
    save: (body: string) => Promise<unknown>;
    remove: (body: string) => Promise<unknown>;
    auth: (body: string) => Promise<AuthType | undefined>;
    is_auth_active: () => Promise<CheckAuthType | undefined>;
    get_token_sse: (
      setOutput: React.Dispatch<React.SetStateAction<string | undefined>>,
    ) => {
      eventSource: EventSourcePlus;
      controller: EventSourceController;
    };
    delete_token: () => void;
    add_sync_item: (body: string) => void;
    remove_sync_item: (body: string) => void;
    get_sync_list: () => Promise<ProcessingItemType[] | undefined>;
  };
};

const ApiFetcherContext = React.createContext<ApiFetcherContextType>(
  {} as ApiFetcherContextType,
);

export function APIFetcherProvider({ children }: { children: ReactNode }) {
  const [apiError, setApiError] = useState<Response>();

  let apiUrl = TIDARR_API_URL;

  if (import.meta.env.MODE !== "development") {
    apiUrl = apiUrl.replace("http://localhost:8484", "");
  }

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
          if (response.status === 200 || response.status === 401) {
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

  function streamExpressJS(
    url: string,
    onMessage: (message: SseMessage) => void,
  ) {
    const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);

    let headers = {};
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }

    const eventSource = new EventSourcePlus(url, {
      headers: headers,
    });

    const controller = eventSource.listen({
      onMessage(message) {
        onMessage(message);
      },
      onResponseError({ response }) {
        console.log(`EventSource close : ${response}`);
        controller.abort();
      },
    });

    return {
      controller,
      eventSource,
    };
  }

  // Config

  async function check() {
    return await queryExpressJS<ConfigType>(`${apiUrl}/check`);
  }

  // List processing

  function list_sse(setData: (data: ProcessingItemType[]) => void): {
    eventSource: EventSourcePlus;
    controller: EventSourceController;
  } {
    return streamExpressJS(`${apiUrl}/stream_processing`, (message) => {
      setData(JSON.parse(message.data) as ProcessingItemType[]);
    });
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

  // Authentication

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

  // Tidal token

  function get_token_sse(
    setOutput: React.Dispatch<React.SetStateAction<string | undefined>>,
  ): {
    eventSource: EventSourcePlus;
    controller: EventSourceController;
  } {
    const { eventSource, controller } = streamExpressJS(
      `${apiUrl}/run_token`,
      (message) => {
        if (message.data?.length === 0) return;

        const url = message.data.match(/https?:\/\/[^\s]+/)?.[0];
        if (url) {
          setOutput(url);
        } else {
          setOutput(message.data);
        }
      },
    );

    return { eventSource, controller };
  }

  async function delete_token() {
    return await queryExpressJS<LogType>(`${apiUrl}/delete_token`);
  }

  // Sync list

  async function get_sync_list() {
    return await queryExpressJS<ProcessingItemType[]>(`${apiUrl}/sync/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function add_sync_item(body: string) {
    return await queryExpressJS(`${apiUrl}/sync/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  async function remove_sync_item(body: string) {
    return await queryExpressJS(`${apiUrl}/sync/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  const value = {
    apiUrl,
    error: {
      apiError,
      setApiError,
    },
    actions: {
      check,
      list_sse,
      save,
      remove,
      auth,
      is_auth_active,
      get_token_sse,
      delete_token,
      get_sync_list,
      add_sync_item,
      remove_sync_item,
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
