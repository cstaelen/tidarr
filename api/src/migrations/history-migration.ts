import fs from "fs";
import path from "path";

import { CONFIG_PATH } from "../../constants";
import { HistoryItem } from "../types";

const historyFilePath = path.join(CONFIG_PATH, "history.json");
const backupFilePath = path.join(CONFIG_PATH, "history.json.bak");

export async function migrateHistory(): Promise<void> {
  if (!fs.existsSync(historyFilePath)) {
    return;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
  } catch {
    console.warn("[MIGRATION] history.json unreadable, skipping migration.");
    return;
  }

  if (
    !Array.isArray(raw) ||
    raw.length === 0 ||
    !(typeof raw[0] === "string" || typeof raw[0] === "number")
  ) {
    return;
  }

  const legacyIds = raw as (string | number)[];

  console.log(
    `[MIGRATION] Legacy history detected (${legacyIds.length} IDs). Migrating...`,
  );

  // Backup before migration
  fs.copyFileSync(historyFilePath, backupFilePath);
  console.log(`[MIGRATION] Backup saved to ${backupFilePath}`);

  const migrated: HistoryItem[] = legacyIds.map((id) => ({
    id: String(id),
    type: "album",
    title: String(id),
    artist: "",
  }));

  try {
    fs.writeFileSync(
      historyFilePath,
      JSON.stringify(migrated, null, 2),
      "utf-8",
    );
    console.log(
      `[MIGRATION] History migrated successfully (${migrated.length} items). Backup kept at ${backupFilePath} — you can delete it once you've verified your history is correct.`,
    );
  } catch (error) {
    console.error(
      `[MIGRATION] Failed to write migrated history. Backup kept at ${backupFilePath}.`,
      error,
    );
  }
}
