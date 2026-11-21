// sync.mjs: copies one agent-kit release into a repository, and checks that copy.
//
//   node .claude/agent-kit/sync.mjs --check              the copy matches its lock (no network)
//   node .claude/agent-kit/sync.mjs 0.2.0                install release v0.2.0 from GitHub
//   node .claude/agent-kit/sync.mjs 0.2.0 --from <file>  install it from a downloaded agent-kit.json
//   --root <folder>                                      act on that repository instead of the current folder
//
// Run it from the repository root. It reads and writes only the paths the kit owns:
//   .claude/rules/org/**   .claude/skills/org-*/**   .claude/agents/org-*.md   .claude/agent-kit/**
// Node built-ins only, so adopting the kit adds no dependency. The source is unset-sh/agent-kit; this file
// is one of the copied files and is checked like the others.

import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export const KIT = "unset-sh/agent-kit";
export const LOCK_PATH = ".claude/agent-kit/lock.json";
export const SYNC_PATH = ".claude/agent-kit/sync.mjs";

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ORG_NAME = /^org-[a-z0-9]+(-[a-z0-9]+)*$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const COMMIT = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const MAX_PATH = 200;
const MAX_DEST = 240;
const MAX_FILES = 500;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_BUNDLE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

/** A refusal with a message a person can act on. Anything else that is thrown is a bug. */
export class SyncError extends Error {}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Where a kit file lands in a repository, or null when the kit may not ship that path. The destination is
 * computed here from fixed rules and never read from a release, so a release cannot choose where it writes.
 */
export function destinationOf(path) {
  if (typeof path !== "string" || path.length === 0 || path.length > MAX_PATH) return null;
  const parts = path.split("/");
  if (!parts.every((part) => SEGMENT.test(part))) return null;
  if (path === "sync.mjs") return SYNC_PATH;
  const [area, second] = parts;
  const leaf = parts.at(-1);
  if (area === "rules" && parts.length === 2 && leaf.endsWith(".md")) return `.claude/rules/org/${leaf}`;
  if (area === "agents" && parts.length === 2 && leaf.endsWith(".md") && ORG_NAME.test(leaf.slice(0, -3))) {
    return `.claude/agents/${leaf}`;
  }
  if (area === "skills" && parts.length >= 3 && ORG_NAME.test(second) && leaf.endsWith(".md")) {
    return `.claude/${path}`;
  }
  return null;
}

/** True for a repository path the kit owns. The lock is owned too, but is written here, never copied. */
export function isOwned(dest) {
  if (typeof dest !== "string" || dest.length > MAX_DEST) return false;
  const parts = dest.split("/");
  if (parts[0] !== ".claude" || parts.length < 3 || !parts.slice(1).every((part) => SEGMENT.test(part))) return false;
  if (parts[1] === "agent-kit") return true;
  if (parts[1] === "rules") return parts[2] === "org" && parts.length >= 4;
  if (parts[1] === "skills") return ORG_NAME.test(parts[2]) && parts.length >= 4;
  if (parts[1] === "agents") return parts.length === 3 && parts[2].startsWith("org-");
  return false;
}

/**
 * Read and validate a release bundle. Checks, in order: shape, kit name, version, commit, then for each file
 * its path, its destination, that the destination is not repeated, and that its content has the sha256 the
 * bundle states. Returns only validated values.
 */
export function parseBundle(text, wantedVersion) {
  let bundle;
  try {
    bundle = JSON.parse(text);
  } catch {
    throw new SyncError("the release bundle is not valid JSON");
  }
  if (bundle === null || typeof bundle !== "object" || Array.isArray(bundle)) {
    throw new SyncError("the release bundle is not a JSON object");
  }
  if (bundle.kit !== KIT) throw new SyncError(`the release bundle is not from ${KIT}`);
  if (typeof bundle.version !== "string" || !VERSION.test(bundle.version)) {
    throw new SyncError("the release bundle has no valid version");
  }
  if (bundle.version !== wantedVersion) {
    throw new SyncError(`asked for version ${wantedVersion}, but the bundle is version ${bundle.version}`);
  }
  if (typeof bundle.commit !== "string" || !COMMIT.test(bundle.commit)) {
    throw new SyncError("the release bundle has no valid commit");
  }
  if (!Array.isArray(bundle.files) || bundle.files.length === 0 || bundle.files.length > MAX_FILES) {
    throw new SyncError("the release bundle has no valid file list");
  }
  const files = new Map();
  const seen = new Set();
  for (const file of bundle.files) {
    if (file === null || typeof file !== "object") throw new SyncError("the release bundle lists a file that is not an object");
    const { path, sha256: stated, content } = file;
    const dest = destinationOf(path);
    if (dest === null) throw new SyncError(`the release bundle lists a path the kit may not ship: ${JSON.stringify(path)}`);
    // Compared without case, so two files cannot collide on a file system that ignores case.
    if (seen.has(dest.toLowerCase())) throw new SyncError(`the release bundle lists ${path} twice`);
    seen.add(dest.toLowerCase());
    if (typeof stated !== "string" || !SHA256.test(stated)) throw new SyncError(`${path} has no valid sha256`);
    if (typeof content !== "string") throw new SyncError(`${path} has no content`);
    const bytes = Buffer.from(content, "utf8");
    if (bytes.length > MAX_FILE_BYTES) throw new SyncError(`${path} is larger than the kit allows`);
    if (sha256(bytes) !== stated) throw new SyncError(`${path} does not match its sha256`);
    files.set(dest, { sha256: stated, bytes });
  }
  if (!files.has(SYNC_PATH)) throw new SyncError("the release bundle does not contain sync.mjs");
  return { version: bundle.version, commit: bundle.commit, files };
}

function assertRepositoryRoot(root) {
  if (!existsSync(join(root, ".git"))) {
    throw new SyncError(`${root} is not a repository root (no .git). Run this from the repository root.`);
  }
}

/** The first symbolic link on the way to a path, or null. Nothing here reads or writes through a link. */
function symlinkOnPath(root, dest) {
  const parts = dest.split("/");
  for (let depth = 1; depth <= parts.length; depth += 1) {
    const partial = parts.slice(0, depth).join("/");
    const stat = lstatSync(join(root, ...partial.split("/")), { throwIfNoEntry: false });
    if (stat === undefined) return null;
    if (stat.isSymbolicLink()) return partial;
  }
  return null;
}

function assertNoSymlink(root, dest) {
  const link = symlinkOnPath(root, dest);
  if (link !== null) throw new SyncError(`${link} is a symbolic link; the kit does not write through links`);
}

function walk(root, folder, found) {
  const entries = readdirSync(join(root, ...folder.split("/")), { withFileTypes: true });
  for (const entry of entries) {
    const path = `${folder}/${entry.name}`;
    if (entry.isDirectory()) walk(root, path, found);
    else found.push(path);
  }
}

function namesIn(root, folder) {
  const stat = lstatSync(join(root, ...folder.split("/")), { throwIfNoEntry: false });
  if (stat === undefined || !stat.isDirectory()) return [];
  return readdirSync(join(root, ...folder.split("/")), { withFileTypes: true });
}

/** Every file, link or other entry under the kit's names in a repository, except the lock. Sorted. */
export function ownedEntries(root) {
  const found = [];
  for (const folder of [".claude/rules/org", ".claude/agent-kit"]) {
    const stat = lstatSync(join(root, ...folder.split("/")), { throwIfNoEntry: false });
    if (stat === undefined) continue;
    if (stat.isDirectory()) walk(root, folder, found);
    else found.push(folder);
  }
  for (const entry of namesIn(root, ".claude/skills")) {
    if (!entry.name.startsWith("org-")) continue;
    if (entry.isDirectory()) walk(root, `.claude/skills/${entry.name}`, found);
    else found.push(`.claude/skills/${entry.name}`);
  }
  for (const entry of namesIn(root, ".claude/agents")) {
    if (entry.name.startsWith("org-")) found.push(`.claude/agents/${entry.name}`);
  }
  return found.filter((path) => path !== LOCK_PATH).sort();
}

function readLock(root) {
  const stat = lstatSync(join(root, ...LOCK_PATH.split("/")), { throwIfNoEntry: false });
  if (stat === undefined) throw new SyncError(`${LOCK_PATH} is missing`);
  if (!stat.isFile()) throw new SyncError(`${LOCK_PATH} is not a regular file`);
  let lock;
  try {
    lock = JSON.parse(readFileSync(join(root, ...LOCK_PATH.split("/")), "utf8"));
  } catch {
    throw new SyncError(`${LOCK_PATH} is not valid JSON`);
  }
  const valid =
    lock !== null &&
    typeof lock === "object" &&
    lock.kit === KIT &&
    typeof lock.version === "string" &&
    VERSION.test(lock.version) &&
    typeof lock.commit === "string" &&
    COMMIT.test(lock.commit) &&
    typeof lock.bundleSha256 === "string" &&
    SHA256.test(lock.bundleSha256) &&
    lock.files !== null &&
    typeof lock.files === "object" &&
    !Array.isArray(lock.files);
  if (!valid) throw new SyncError(`${LOCK_PATH} does not have the shape this script writes`);
  for (const [dest, hash] of Object.entries(lock.files)) {
    if (!isOwned(dest) || dest === LOCK_PATH) throw new SyncError(`${LOCK_PATH} lists a path the kit does not own: ${dest}`);
    if (typeof hash !== "string" || !SHA256.test(hash)) throw new SyncError(`${LOCK_PATH} has no valid sha256 for ${dest}`);
  }
  if (!Object.hasOwn(lock.files, SYNC_PATH)) throw new SyncError(`${LOCK_PATH} does not list ${SYNC_PATH}`);
  return lock;
}

/**
 * Compare the copy with its lock. Returns a list of problems in plain words; an empty list means the copy is
 * exactly what the lock records. Reads nothing from the network.
 */
export function check(root) {
  assertRepositoryRoot(root);
  assertNoSymlink(root, LOCK_PATH);
  const lock = readLock(root);
  const problems = [];
  for (const [dest, hash] of Object.entries(lock.files).sort(([a], [b]) => (a < b ? -1 : 1))) {
    const link = symlinkOnPath(root, dest);
    const stat = lstatSync(join(root, ...dest.split("/")), { throwIfNoEntry: false });
    if (link !== null) problems.push(`reached through a symbolic link (${link}): ${dest}`);
    else if (stat === undefined) problems.push(`missing: ${dest}`);
    else if (!stat.isFile()) problems.push(`not a regular file: ${dest}`);
    else if (sha256(readFileSync(join(root, ...dest.split("/")))) !== hash) problems.push(`changed: ${dest}`);
  }
  for (const path of ownedEntries(root)) {
    if (!Object.hasOwn(lock.files, path)) problems.push(`not part of the kit release, but under the kit's names: ${path}`);
  }
  return { version: lock.version, problems };
}

/** Replace the kit's files in a repository with those of a validated bundle, then write the lock. */
export function install(root, bundle, bundleSha256) {
  assertRepositoryRoot(root);
  for (const dest of [...bundle.files.keys(), LOCK_PATH]) assertNoSymlink(root, dest);
  for (const path of ownedEntries(root)) {
    if (!bundle.files.has(path)) rmSync(join(root, ...path.split("/")), { force: true });
  }
  const locked = {};
  for (const dest of [...bundle.files.keys()].sort()) {
    const { sha256: hash, bytes } = bundle.files.get(dest);
    const target = join(root, ...dest.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
    locked[dest] = hash;
  }
  const lock = { kit: KIT, version: bundle.version, commit: bundle.commit, bundleSha256, files: locked };
  mkdirSync(dirname(join(root, ...LOCK_PATH.split("/"))), { recursive: true });
  writeFileSync(join(root, ...LOCK_PATH.split("/")), `${JSON.stringify(lock, null, 2)}\n`);
  return lock;
}

export function releaseUrl(version) {
  return `https://github.com/${KIT}/releases/download/v${version}/agent-kit.json`;
}

async function download(version) {
  const url = releaseUrl(version);
  let response;
  try {
    response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (error) {
    throw new SyncError(`could not download ${url} (${error.message}). Download it another way and pass --from <file>.`);
  }
  if (!response.ok) throw new SyncError(`${url} answered ${response.status}. Is v${version} a published release?`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BUNDLE_BYTES) throw new SyncError("the release bundle is larger than the kit allows");
  return bytes;
}

function readLocalBundle(path) {
  try {
    return readFileSync(path);
  } catch (error) {
    throw new SyncError(`could not read ${path} (${error.code ?? error.message})`);
  }
}

function parseArguments(argv) {
  const options = { check: false, version: null, from: null, root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--from" || argument === "--root") {
      const value = argv[index + 1];
      if (value === undefined) throw new SyncError(`${argument} needs a value`);
      options[argument.slice(2)] = value;
      index += 1;
    } else if (VERSION.test(argument) && options.version === null) options.version = argument;
    else throw new SyncError(`unknown argument: ${argument}`);
  }
  if (options.check === (options.version !== null)) {
    throw new SyncError("usage: sync.mjs --check | sync.mjs <version> [--from <agent-kit.json>]");
  }
  if (options.check && options.from !== null) throw new SyncError("--from has no meaning with --check");
  return options;
}

export async function main(argv, print = console.log) {
  const options = parseArguments(argv);
  if (options.check) {
    const { version, problems } = check(options.root);
    if (problems.length === 0) {
      print(`agent-kit ${version}: the copy matches its lock.`);
      return 0;
    }
    print(`agent-kit ${version}: the copy does not match its lock.`);
    for (const problem of problems) print(`  ${problem}`);
    print("Kit files are never edited here. Change unset-sh/agent-kit, or restore the copy with:");
    print(`  node ${SYNC_PATH} ${version}`);
    return 1;
  }
  const bytes = options.from === null ? await download(options.version) : readLocalBundle(options.from);
  if (bytes.length > MAX_BUNDLE_BYTES) throw new SyncError("the release bundle is larger than the kit allows");
  const bundle = parseBundle(bytes.toString("utf8"), options.version);
  const lock = install(options.root, bundle, sha256(bytes));
  print(`agent-kit ${lock.version} (${lock.commit.slice(0, 7)}): ${Object.keys(lock.files).length} files written.`);
  return 0;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof SyncError)) throw error;
    console.error(`sync.mjs: ${error.message}`);
    process.exitCode = 1;
  }
}
