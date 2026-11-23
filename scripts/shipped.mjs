// Lists the files of this checkout that the kit ships, so the checks can hold them to what every repository
// may receive. sync.mjs installs the same files from a commit's tree (see kitFromTree there); the checks in
// checks/kit.test.mjs keep the two in step.

import { lstatSync, readdirSync } from "node:fs";

/** Folders whose every file is shipped, plus sync.mjs itself. A folder that does not exist yet ships nothing. */
export const SHIPPED_FOLDERS = ["rules", "skills", "agents"];

const root = new URL("../", import.meta.url);

/**
 * Repository-relative paths of every file the kit ships, sorted. A symbolic link is refused: what it points to
 * could change after review, and sync.mjs never writes one.
 */
export function shippedPaths(base = root) {
  const script = lstatSync(new URL("sync.mjs", base), { throwIfNoEntry: false });
  if (script === undefined || !script.isFile()) throw new Error("sync.mjs must be a regular file, not a link");
  const paths = ["sync.mjs"];
  for (const folder of SHIPPED_FOLDERS) {
    const url = new URL(`${folder}/`, base);
    // Without the trailing slash, so lstat sees a link itself rather than the folder it points to.
    const folderStat = lstatSync(new URL(folder, base), { throwIfNoEntry: false });
    if (folderStat === undefined) continue;
    if (!folderStat.isDirectory()) throw new Error(`${folder} must be a folder, not a link or a file`);
    for (const name of readdirSync(url, { recursive: true })) {
      const path = `${folder}/${String(name).replaceAll("\\", "/")}`;
      const stat = lstatSync(new URL(path, base));
      if (stat.isSymbolicLink()) throw new Error(`${path} is a symbolic link; the kit ships only regular files`);
      if (stat.isFile()) paths.push(path);
    }
  }
  return paths.sort();
}
