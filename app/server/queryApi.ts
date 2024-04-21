"use server";

import { ApiReturnType } from "../types";

async function queryExpressJS(url: string, options?: RequestInit) {
  console.log("==>", url);
  try {
    const data = await fetch(url, { ...options, cache: "no-cache" })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        return data;
      });

    console.log("==>", data);
    console.log("====================================");
    return data;
  } catch (e: unknown) {
    return { error: true, message: (e as Error).message } as ApiReturnType;
  }
}

export const getApiUrl = async () =>
  `http://${process.env.HOSTNAME}:${process.env.API_PORT}`;

export async function check() {
  return await queryExpressJS(
    `http://${process.env.HOSTNAME}:${process.env.API_PORT}/check`,
  );
}

export async function list() {
  return await queryExpressJS(
    `http://${process.env.HOSTNAME}:${process.env.API_PORT}/list`,
  );
}

export async function save(body: string) {
  return await queryExpressJS(
    `http://${process.env.HOSTNAME}:${process.env.API_PORT}/save`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    },
  );
}

export async function remove(body: string) {
  return await queryExpressJS(
    `http://${process.env.HOSTNAME}:${process.env.API_PORT}/remove`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    },
  );
}
