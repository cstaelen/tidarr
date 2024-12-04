import { LOCALSTORAGE_TOKEN_KEY } from "src/provider/AuthProvider";

import {
  ApiReturnType,
  AuthType,
  CheckAuthType,
  ConfigType,
  ProcessingItemType,
} from "../types";

async function queryExpressJS<T>(
  url: string,
  options?: RequestInit,
): Promise<T | ApiReturnType> {
  const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);

  if (token) {
    options = {
      ...options,
      headers: { ...options?.headers, authorization: `Bearer ${token}` },
    };
  }

  let output!: T | ApiReturnType;
  try {
    await fetch(url, { ...options, cache: "no-cache" }).then(
      function (response) {
        if (response?.ok) {
          output = response.json().then<T>(function (data) {
            return data;
          }) as T;

          return;
        }

        if (response.status === 403) {
          localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
          window.location.reload();
          return;
        }

        output = {
          error: true,
          message: response.statusText,
        };
      },
    );
  } catch (e: unknown) {
    output = {
      error: true,
      message: (e as Error).message,
    };
  }

  return output;
}

export const apiUrl = "/api";

export async function check() {
  return await queryExpressJS<ApiReturnType | ConfigType>(`${apiUrl}/check`);
}

export async function list() {
  return await queryExpressJS<ProcessingItemType[] | ApiReturnType>(
    `${apiUrl}/list`,
  );
}

export async function save(body: string) {
  return await queryExpressJS(`${apiUrl}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });
}

export async function remove(body: string) {
  return await queryExpressJS(`${apiUrl}/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });
}

export async function auth(body?: string): Promise<AuthType | ApiReturnType> {
  return await queryExpressJS<AuthType | ApiReturnType>(`${apiUrl}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });
}

export async function is_auth_active(): Promise<CheckAuthType | ApiReturnType> {
  return await queryExpressJS<{ isAuthActive: boolean }>(
    `${apiUrl}/is_auth_active`,
  );
}
