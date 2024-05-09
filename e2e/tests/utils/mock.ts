import { Page } from "@playwright/test";
// import { ProcessingItemType } from "../../../src/types";
// let mockList: ProcessingItemType[] = [];

export async function mockAPI(page: Page) {
  await page.route("*/**/check", async (route) => {
    const json = {
      noToken: false,
      output: "",
    };
    await route.fulfill({ json });
  });

  // await page.route("*/**/list", async (route) => {
  //   const json = mockList;
  //   await route.fulfill({ json });
  // });

  // await page.route("*/**/remove", async (route) => {
  //   mockList = [];
  //   const json = mockList;
  //   await route.fulfill({ json });
  // });

  // await page.route("*/**/save", async (route) => {
  //   const json: ProcessingItemType = {
  //     id: "77610756",
  //     artist: "Nirvana",
  //     title: "Nevermind",
  //     type: "album",
  //     status: "processing",
  //     loading: true,
  //     error: false,
  //     url: "http://www.tidal.com/album/77610756",
  //     output: "\r\n=== Tidal-DL ===",
  //   };
  //   mockList.push(json);
  //   await route.fulfill({ json });
  // });
}
