// Prints the changelog entry of one version, for the release page.
//
//   node scripts/release-notes.mjs 0.1.0
//
// An entry starts at a line "## v<version>" in CHANGELOG.md and runs to the next "## " line. A release with no
// entry fails here, so no release goes out without saying what changes for the repositories that take it.

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function notesFor(changelog, version) {
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## v${version}`);
  if (start === -1) throw new Error(`CHANGELOG.md has no entry "## v${version}"`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  if (body === "") throw new Error(`the CHANGELOG.md entry for v${version} is empty`);
  return `${body}\n`;
}

/** The versions that have an entry, newest first as written. */
export function versionsIn(changelog) {
  return changelog
    .split("\n")
    .filter((line) => /^## v\d/.test(line))
    .map((line) => line.trim().slice(4));
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
  const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  process.stdout.write(notesFor(changelog, process.argv[2] ?? ""));
}
