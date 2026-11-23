// The release bundle is what repositories install. It must hold every shipped file, be the same for the same
// commit, and install into a copy that passes its own check.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { buildBundle, serialise, shippedPaths } from "../scripts/bundle.mjs";
import { check, install, parseBundle, sha256 } from "../sync.mjs";
import { readText, root } from "./repo.mjs";

const COMMIT = "89abcdef0123456789abcdef0123456789abcdef";
const version = JSON.parse(readText("package.json")).version;

test("the bundle lists every shipped file once, sorted, with the package version and the commit", () => {
  const bundle = buildBundle({ commit: COMMIT });
  assert.equal(bundle.kit, "unset-sh/agent-kit");
  assert.equal(bundle.version, version);
  assert.equal(bundle.commit, COMMIT);
  assert.deepEqual(
    bundle.files.map((file) => file.path),
    shippedPaths(),
  );
});

test("the same commit gives the same bundle, byte for byte", () => {
  assert.equal(serialise(buildBundle({ commit: COMMIT })), serialise(buildBundle({ commit: COMMIT })));
});

test("the bundle refuses a commit that is not a full sha", () => {
  assert.throws(() => buildBundle({ commit: "89abcde" }), /full 40-character/);
});

test("the bundle installs into a repository whose copy then passes the check, byte for byte", (t) => {
  const repository = mkdtempSync(join(tmpdir(), "agent-kit-bundle-"));
  mkdirSync(join(repository, ".git"));
  t.after(() => rmSync(repository, { recursive: true, force: true }));
  const text = serialise(buildBundle({ commit: COMMIT }));
  install(repository, parseBundle(text, version), sha256(Buffer.from(text, "utf8")));
  assert.deepEqual(check(repository), { version, problems: [] });
  assert.deepEqual(
    readFileSync(join(repository, ".claude/agent-kit/sync.mjs")),
    readFileSync(new URL("sync.mjs", root)),
  );
  assert.deepEqual(
    readFileSync(join(repository, ".claude/rules/org/org.md")),
    readFileSync(new URL("rules/org.md", root)),
  );
});

test("the bundle refuses a symbolic link in a shipped folder", (t) => {
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
