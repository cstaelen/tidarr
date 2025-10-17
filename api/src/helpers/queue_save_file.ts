import fs from "fs";
import path from "path";

import { ROOT_PATH } from "../../constants";
import { ProcessingItemType } from "../types";

const filePath = path.join(`${ROOT_PATH}/shared`, "processing_items.json");

export function loadQueueFromFile(): ProcessingItemType[] {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  } else {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
}

export const addItemToFile = (item: ProcessingItemType) => {
  const saveList: ProcessingItemType[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  saveList.push(item);
  fs.writeFileSync(filePath, JSON.stringify(saveList, null, 2));
};

export const removeItemFromFile = (id: string) => {
  let saveList: { id: string; url: string; contentType: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  saveList = saveList.filter((item) => item.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(saveList, null, 2));
};
