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
    get_settings: () => Promise<ConfigType | undefined>;
    list_sse: (setData: (data: ProcessingItemType[]) => void) => {
      eventSource: EventSourcePlus;
      controller: EventSourceController;
    };
    save: (body: string) => Promise<unknown>;
    remove: (body: string) => Promise<unknown>;
    remove_all: () => Promise<unknown>;
    remove_finished: () => Promise<unknown>;
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
    remove_sync_all_items: () => Promise<unknown>;
    get_sync_list: () => Promise<ProcessingItemType[] | undefined>;
    sync_now: () => Promise<void>;
    get_custom_css: () => Promise<string | undefined>;
    set_custom_css: (
      css: string,
    ) => Promise<{ success: boolean; message: string } | undefined>;
    get_tiddl_toml: () => Promise<string | undefined>;
    set_tiddl_toml: (
      toml: string,
    ) => Promise<{ success: boolean; message: string } | undefined>;
    stream_item_output: (
      itemId: string,
      onData: (data: { id: string; output: string }) => void,
    ) => {
      eventSource: EventSourcePlus;
      controller: EventSourceController;
    };
    pause_queue: () => Promise<void>;
    resume_queue: () => Promise<void>;
    get_queue_status: () => Promise<{ isPaused: boolean } | undefined>;
    get_list_history: () => Promise<string[] | undefined>;
    flush_history: () => Promise<unknown>;
    signStream: (id: string) => Promise<{ url: string } | undefined>;
  };
};

const ApiFetcherContext = React.createContext<ApiFetcherContextType>(
  {} as ApiFetcherContextType,
);

export function APIFetcherProvider({ children }: { children: ReactNode }) {
  const [apiError, setApiError] = useState<Response>();

  const apiUrl = TIDARR_API_URL;

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
      setApiError(undefined);

      await fetch(url, { ...options, cache: "no-cache" }).then(
        function (response) {
          if (response.status === 200) {
            output = response.json().then<T>(function (data) {
              return data;
            }) as T;

            return;
          }

          if (response.status === 401) {
            // Unauthorized - redirect to login
            if (localStorage.getItem(LOCALSTORAGE_TOKEN_KEY)) {
              localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
            }
            // window.location.href = "/login";
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

  async function get_settings() {
    return await queryExpressJS<ConfigType>(`${apiUrl}/settings`);
  }

  // List processing

  function list_sse(setData: (data: ProcessingItemType[]) => void): {
    eventSource: EventSourcePlus;
    controller: EventSourceController;
  } {
    return streamExpressJS(`${apiUrl}/stream-processing`, (message) => {
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
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  async function remove_all() {
    return await queryExpressJS(`${apiUrl}/remove-all`, {
      method: "DELETE",
    });
  }
  async function remove_finished() {
    return await queryExpressJS(`${apiUrl}/remove-finished`, {
      method: "DELETE",
    });
  }

  // Authentication

  async function auth(body?: string): Promise<AuthType | undefined> {
    return await queryExpressJS<AuthType>(`${apiUrl}/auth`, {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function is_auth_active(): Promise<CheckAuthType | undefined> {
    return await queryExpressJS<CheckAuthType>(`${apiUrl}/is-auth-active`);
  }

  // Tidal token

  function get_token_sse(
    setOutput: React.Dispatch<React.SetStateAction<string | undefined>>,
  ): {
    eventSource: EventSourcePlus;
    controller: EventSourceController;
  } {
    const { eventSource, controller } = streamExpressJS(
      `${apiUrl}/run-token`,
      (message) => {
        if (message.data?.length === 0) return;

        const url = message.data
          .match(/https?:\/\/[^\s]+/)?.[0]
          .replace("'", "");
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
    return await queryExpressJS<LogType>(`${apiUrl}/token`, {
      method: "DELETE",
    });
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
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
  }

  async function remove_sync_all_items() {
    return await queryExpressJS(`${apiUrl}/sync/remove-all`, {
      method: "DELETE",
    });
  }

  async function sync_now(): Promise<void> {
    await queryExpressJS<ProcessingItemType[]>(`${apiUrl}/sync/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Custom CSS

  async function get_custom_css() {
    const response = await queryExpressJS<{ css: string }>(
      `${apiUrl}/custom-css`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response?.css;
  }

  async function set_custom_css(css: string) {
    return await queryExpressJS<{ success: boolean; message: string }>(
      `${apiUrl}/custom-css`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ css }),
      },
    );
  }

  // Tiddl TOML config

  async function get_tiddl_toml() {
    const response = await queryExpressJS<{ toml: string }>(
      `${apiUrl}/tiddl/config`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response?.toml;
  }

  async function set_tiddl_toml(toml: string) {
    return await queryExpressJS<{ success: boolean; message: string }>(
      `${apiUrl}/tiddl/config`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toml }),
      },
    );
  }

  // SSE Terminal output

  function stream_item_output(
    itemId: string,
    onData: (data: { id: string; output: string }) => void,
  ): {
    eventSource: EventSourcePlus;
    controller: EventSourceController;
  } {
    return streamExpressJS(
      `${apiUrl}/stream-item-output/${itemId}`,
      (message) => {
        try {
          const data = JSON.parse(message.data) as {
            id: string;
            output: string;
          };
          onData(data);
        } catch (error) {
          console.error("Failed to parse item output SSE data:", error);
        }
      },
    );
  }

  // Queue control

  async function pause_queue(): Promise<void> {
    await queryExpressJS(`${apiUrl}/queue/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function resume_queue(): Promise<void> {
    await queryExpressJS(`${apiUrl}/queue/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function get_queue_status() {
    return await queryExpressJS<{ isPaused: boolean }>(
      `${apiUrl}/queue/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Queue History

  async function get_list_history() {
    return await queryExpressJS<string[]>(`${apiUrl}/history/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function flush_history() {
    return await queryExpressJS(`${apiUrl}/history/list`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Play track

  async function signStream(id: string) {
    return await queryExpressJS<{ url: string }>(
      `${apiUrl}/stream/sign/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const value = {
    apiUrl,
    error: {
      apiError,
      setApiError,
    },
    actions: {
      get_settings,
      list_sse,
      save,
      remove,
      remove_finished,
      remove_all,
      auth,
      is_auth_active,
      get_token_sse,
      delete_token,
      get_sync_list,
      add_sync_item,
      remove_sync_item,
      remove_sync_all_items,
      sync_now,
      get_custom_css,
      set_custom_css,
      stream_item_output,
      get_tiddl_toml,
      set_tiddl_toml,
      pause_queue,
      resume_queue,
      get_queue_status,
      get_list_history,
      flush_history,
      signStream,
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
