"use server"

import { ProcessingItemType } from "../types";

export const getApiUrl = async () => `http://${process.env.HOSTNAME}:${process.env.API_PORT}`;

export async function check() {
  return await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/check`, { cache: "no-cache" })
    .then(function (response) {
      return response.json();
    }).then(function (data) {
      return data;
    });
}

export async function list() {
  return await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/list`, { cache: "no-cache" })
    .then(function (response) {
      return response.json();
    }).then(function (data) {
      return data;
    });
}

export async function save(itemToQueue: ProcessingItemType) {
  return await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ item: itemToQueue })
  })
}

export async function remove(id: number) {
  return await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: id })
  })
}

