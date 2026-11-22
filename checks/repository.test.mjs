// What this repository promises about itself: its own CLAUDE.md, the templates, the changelog and the
// workflows.
import assert from "node:assert/strict";
import { test } from "node:test";
import { notesFor, versionsIn } from "../scripts/release-notes.mjs";
import { exists, filesIn, readText } from "./repo.mjs";

const FITS = "## Where this repository fits";

function firstSection(text) {
  return text.split("\n").find((line) => line.startsWith("## "));
}

test("CLAUDE.md and its template both open with where the repository fits", () => {
  assert.equal(firstSection(readText("CLAUDE.md")), FITS);
  assert.equal(firstSection(readText("templates/CLAUDE.md")), FITS);
});

test("CLAUDE.md imports every rule file, so work here follows the rules it ships", () => {
  const claude = readText("CLAUDE.md");
  for (const path of filesIn("rules")) assert.match(claude, new RegExp(`^@${path}$`, "m"), `CLAUDE.md does not import ${path}`);
});

test("the templates and the project instructions exist", () => {
  for (const path of ["templates/CLAUDE.md", "templates/AGENTS.md", "projects/instructions.md"]) {
    assert.ok(exists(path), `${path} is missing`);
  }
});

test("the newest changelog entry is the package version and says something", () => {
  // 0.0.0 means nothing is released yet, so there is no versioned entry to match.
  const changelog = readText("CHANGELOG.md");
  const { version } = JSON.parse(readText("package.json"));
  if (version === "0.0.0") {
    assert.deepEqual(versionsIn(changelog), []);
    return;
  }
  assert.equal(versionsIn(changelog)[0], version);
  assert.ok(notesFor(changelog, version).length > 40);
});

test("unreleased changes sit in one section above the released versions", () => {
  const headings = readText("CHANGELOG.md").split("\n").filter((line) => line.startsWith("## "));
  const unreleased = headings.filter((line) => line === "## Unreleased");
  assert.ok(unreleased.length <= 1, "one Unreleased section at most");
  if (unreleased.length === 1) assert.equal(headings[0], "## Unreleased", "Unreleased comes first");
});

test("release notes are one version's entry, and a missing or empty entry is an error", () => {
  const changelog = "# Changelog\n\n## v0.2.0\n\nSecond.\n\n## v0.1.0\n\nFirst.\n\n## v0.0.1\n\n";
  assert.equal(notesFor(changelog, "0.2.0"), "Second.\n");
  assert.equal(notesFor(changelog, "0.1.0"), "First.\n");
  assert.throws(() => notesFor(changelog, "0.3.0"), /no entry/);
  assert.throws(() => notesFor(changelog, "0.0.1"), /is empty/);
  assert.deepEqual(versionsIn(changelog), ["0.2.0", "0.1.0", "0.0.1"]);
});

test("every workflow drops all permissions at the top and pins each action to a full commit", () => {
  const workflows = filesIn(".github/workflows");
  assert.ok(workflows.length > 0);
  for (const path of workflows) {
    const text = readText(path);
    assert.match(text, /^permissions: \{\}$/m, `${path} does not start from no permissions`);
    for (const [, action] of text.matchAll(/^\s*-?\s*uses: (\S+)/gm)) {
      assert.match(action, /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/, `${path}: ${action} is not pinned to a full commit`);
    }
    assert.ok(!/persist-credentials: true/.test(text), `${path} keeps the checkout token`);
    for (const checkout of text.matchAll(/uses: actions\/checkout@[0-9a-f]{40}[^\n]*\n((?:\s+.*\n){0,3})/g)) {
      assert.match(checkout[1], /persist-credentials: false/, `${path}: a checkout keeps its token`);
    }
  }
});
