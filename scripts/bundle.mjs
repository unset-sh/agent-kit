// Builds the release bundle: one JSON file holding every file the kit ships, each with its sha256.
//
//   node scripts/bundle.mjs --commit <full sha> [--out dist/agent-kit.json]
//
// The bundle is the same for the same commit: files are sorted and nothing but their content, the version in
// package.json and the commit goes in. sync.mjs reads it; see parseBundle there for what it must satisfy.

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { KIT, destinationOf, sha256 } from "../sync.mjs";

/** Folders whose every file is shipped, plus sync.mjs itself. A folder that does not exist yet ships nothing. */
export const SHIPPED_FOLDERS = ["rules", "skills", "agents"];

const root = new URL("../", import.meta.url);

/** Repository-relative paths of every file the kit ships, sorted. */
export function shippedPaths(base = root) {
  const paths = ["sync.mjs"];
  for (const folder of SHIPPED_FOLDERS) {
    const url = new URL(`${folder}/`, base);
    if (statSync(url, { throwIfNoEntry: false }) === undefined) continue;
    for (const name of readdirSync(url, { recursive: true })) {
      const path = `${folder}/${String(name).replaceAll("\\", "/")}`;
      if (statSync(new URL(path, base)).isFile()) paths.push(path);
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

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const out = value("--out") ?? fileURLToPath(new URL("dist/agent-kit.json", root));
  const text = serialise(buildBundle({ commit: value("--commit") ?? "" }));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`${out}  sha256 ${sha256(Buffer.from(text, "utf8"))}`);
}
