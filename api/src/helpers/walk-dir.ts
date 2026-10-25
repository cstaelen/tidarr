import fs from "fs/promises";
import path from "path";

/**
 * Recursively lists files and directories under a path, as absolute paths.
 *
 * Walks level by level so an unreadable subfolder only costs its own subtree: a
 * single recursive readdir would throw and lose the whole listing.
 *
 * @param dir - Directory to walk
 * @returns Files and directories found, both empty if the path itself can't be read
 */
export async function walkDir(
  dir: string,
): Promise<{ files: string[]; dirs: string[] }> {
  const files: string[] = [];
  const dirs: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries;

    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      // A missing folder has nothing to list, anything else is worth knowing
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`❌ [TIDARR] Error reading ${current}:`, error);
      }
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        dirs.push(fullPath);
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);

  return { files, dirs };
}
