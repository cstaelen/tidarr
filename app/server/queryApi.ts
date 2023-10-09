"use server"

import { ApiReturnType, ProcessingItemType } from "../types";

export const getApiUrl = async () => `http://${process.env.HOSTNAME}:${process.env.API_PORT}`;

export async function check() {
  try {
    const data = await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/check`, { cache: "no-cache" })
      .then(function (response) {
        return response.json();
      }).then(function (data) {
        return data;
      });

    return data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

export async function list() {
  try {
    const data = await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/list`, { cache: "no-cache" })
      .then(function (response) {
        return response.json();
      }).then(function (data) {
        return data;
      });

    return data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

export async function save(itemToQueue: ProcessingItemType) {
  try {
    const data = await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ item: itemToQueue })
    })
    return data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

export async function remove(id: number) {
  try {
    const data = await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: id })
    })

    return data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

