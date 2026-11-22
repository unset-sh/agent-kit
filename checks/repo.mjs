// Shared by the checks: where the repository is and how to read it.
import { readFileSync, readdirSync, statSync } from "node:fs";

export const root = new URL("../", import.meta.url);

export function exists(path) {
  return statSync(new URL(path, root), { throwIfNoEntry: false }) !== undefined;
}

export function readText(path) {
  return readFileSync(new URL(path, root), "utf8");
}

/** Repository-relative paths of every file under a folder, sorted. A missing folder holds nothing. */
export function filesIn(folder) {
  if (!exists(`${folder}/`)) return [];
  return readdirSync(new URL(`${folder}/`, root), { recursive: true })
    .map((name) => `${folder}/${String(name).replaceAll("\\", "/")}`)
    .filter((path) => statSync(new URL(path, root)).isFile())
    .sort();
}

/**
 * The front matter of a skill or subagent file: the `key: value` lines between the two `---` lines at the top.
 * One value per line and nothing nested, so a file that needs more than that fails here and gets looked at.
 */
export function frontMatter(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") throw new Error("the file does not start with a front matter block");
  const end = lines.indexOf("---", 1);
  if (end === -1) throw new Error("the front matter block is not closed");
  const fields = {};
  for (const line of lines.slice(1, end)) {
    const match = /^([a-z][a-z-]*): (\S.*)$/.exec(line);
    if (match === null) throw new Error(`front matter line is not "key: value": ${line}`);
    if (Object.hasOwn(fields, match[1])) throw new Error(`front matter repeats ${match[1]}`);
    fields[match[1]] = match[2];
  }
  return { fields, body: lines.slice(end + 1).join("\n") };
}
