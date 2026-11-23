// Builds the release bundle: one JSON file holding every file the kit ships, each with its sha256.
//
//   node scripts/bundle.mjs --commit <full sha> [--out dist/agent-kit.json]
//
// The bundle is the same for the same commit: files are sorted and nothing but their content, the version in
// package.json and the commit goes in. sync.mjs reads it; see parseBundle there for what it must satisfy.

import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KIT, destinationOf, sha256 } from "../sync.mjs";

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

/** Text exactly as stored, or an error naming why the kit cannot ship the file. */
function shippedText(path, base) {
  const bytes = readFileSync(new URL(path, base));
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${path} is not valid UTF-8`);
  }
  if (!Buffer.from(text, "utf8").equals(bytes)) throw new Error(`${path} does not survive a UTF-8 round trip`);
  return { text, bytes };
}

export function buildBundle({ commit, base = root }) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error("--commit must be a full 40-character commit sha");
  const { version } = JSON.parse(readFileSync(new URL("package.json", base), "utf8"));
  const files = shippedPaths(base).map((path) => {
    if (destinationOf(path) === null) throw new Error(`${path} is in a shipped folder but sync.mjs would refuse it`);
    const { text, bytes } = shippedText(path, base);
    return { path, sha256: sha256(bytes), content: text };
  });
  return { kit: KIT, version, commit, files };
}

export function serialise(bundle) {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

function startedAsScript() {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (startedAsScript()) {
  const args = process.argv.slice(2);
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const out = value("--out") ?? fileURLToPath(new URL("dist/agent-kit.json", root));
  const text = serialise(buildBundle({ commit: value("--commit") ?? "" }));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`${out}  sha256 ${sha256(Buffer.from(text, "utf8"))}`);
}
