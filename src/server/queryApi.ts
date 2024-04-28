import { ApiReturnType } from "../types";

async function queryExpressJS(url: string, options?: RequestInit) {
  try {
    const data = await fetch(url, { ...options, cache: "no-cache" })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        return data;
      });

    return data;
  } catch (e: unknown) {
    return { error: true, message: (e as Error).message } as ApiReturnType;
  }
}
console.log(window._env_);
console.log(process.env);
export const apiUrl = `http://${window._env_.API_HOSTNAME}:${window._env_.API_PORT}/api`;

export async function check() {
  return await queryExpressJS(`${apiUrl}/check`);
}

export async function list() {
  return await queryExpressJS(`${apiUrl}/list`);
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
