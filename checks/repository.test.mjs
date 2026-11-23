// What this repository promises about itself: its own CLAUDE.md, the templates, the changelog and the
// workflows.
import assert from "node:assert/strict";
import { test } from "node:test";
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

test("the changelog has one dated section per merge day, newest first, none empty", () => {
  const sections = readText("CHANGELOG.md").split(/^## /m).slice(1);
  assert.ok(sections.length > 0);
  const dates = sections.map((section) => section.slice(0, section.indexOf("\n")));
  for (const date of dates) assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `"## ${date}" is not a date`);
  assert.deepEqual(dates, [...new Set(dates)].sort().reverse(), "dates are unique and newest first");
  for (const section of sections) assert.ok(section.trim().length > 40, `## ${section.slice(0, 10)} says nothing`);
});

test("the kit has no release workflow", () => {
  assert.ok(!exists(".github/workflows/release.yml"));
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
