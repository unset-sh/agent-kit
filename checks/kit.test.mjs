// What a repository installs is the shipped files of one commit of main. These checks keep this checkout's
// shipped files installable, byte for byte, into a copy that then passes its own check.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { shippedPaths } from "../scripts/shipped.mjs";
import { check, install, kitFromTree } from "../sync.mjs";
import { root } from "./repo.mjs";

const COMMIT = "89abcdef0123456789abcdef0123456789abcdef";

/** This checkout's shipped files, in the shape sync.mjs reads from a commit's tree. */
function checkoutTree() {
  return shippedPaths().map((path) => {
    const bytes = readFileSync(new URL(path, root));
    return { path, mode: "100644", size: bytes.length, read: () => bytes };
  });
}

test("every shipped file of this checkout is installed, and nothing else", () => {
  const kit = kitFromTree(COMMIT, checkoutTree());
  assert.equal(kit.files.size, shippedPaths().length);
});

test("the shipped files install into a repository whose copy then passes the check, byte for byte", (t) => {
  const repository = mkdtempSync(join(tmpdir(), "agent-kit-install-"));
  mkdirSync(join(repository, ".git"));
  t.after(() => rmSync(repository, { recursive: true, force: true }));
  install(repository, kitFromTree(COMMIT, checkoutTree()));
  assert.deepEqual(check(repository), { commit: COMMIT, problems: [] });
  assert.deepEqual(readFileSync(join(repository, ".claude/agent-kit/sync.mjs")), readFileSync(new URL("sync.mjs", root)));
  assert.deepEqual(readFileSync(join(repository, ".claude/rules/org/org.md")), readFileSync(new URL("rules/org.md", root)));
});

test("a symbolic link in a shipped folder is refused", (t) => {
  const base = mkdtempSync(join(tmpdir(), "agent-kit-links-"));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  mkdirSync(join(base, "rules"));
  writeFileSync(join(base, "sync.mjs"), "// s\n");
  writeFileSync(join(base, "outside.md"), "# Outside\n");
  symlinkSync(join(base, "outside.md"), join(base, "rules/org.md"));
  assert.throws(() => shippedPaths(pathToFileURL(`${base}/`)), /rules\/org\.md is a symbolic link/);
  rmSync(join(base, "rules"), { recursive: true });
  symlinkSync(base, join(base, "rules"));
  assert.throws(() => shippedPaths(pathToFileURL(`${base}/`)), /rules must be a folder/);
  rmSync(join(base, "rules"));
  rmSync(join(base, "sync.mjs"));
  symlinkSync(join(base, "outside.md"), join(base, "sync.mjs"));
  assert.throws(() => shippedPaths(pathToFileURL(`${base}/`)), /sync\.mjs must be a regular file/);
});
