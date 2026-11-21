// Skills and subagents are text the assistant reads. These checks keep them to text: no granted tools, no
// model changes, no hooks and no line that runs a shell command when the skill loads.
// Fields and the "!" syntax: https://code.claude.com/docs/en/skills (frontmatter reference, read 2026-11-21).
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";
import { exists, filesIn, frontMatter, readText, root } from "./repo.mjs";

const NAME = /^org-[a-z0-9]+(-[a-z0-9]+)*$/;
const SKILL_FIELDS = ["name", "description", "license"];
const AGENT_FIELDS = ["name", "description", "model", "effort"];
/** Our own bounds: long enough to say when to use it, short enough to be read in a list. */
const DESCRIPTION = { min: 40, max: 600 };

const skills = readdirSync(new URL("skills/", root), { withFileTypes: true });
const agents = filesIn("agents");

function describes(fields, where) {
  const { description } = fields;
  assert.equal(typeof description, "string", `${where} has no description`);
  assert.ok(
    description.length >= DESCRIPTION.min && description.length <= DESCRIPTION.max,
    `${where}: the description is ${description.length} characters; keep it between ${DESCRIPTION.min} and ${DESCRIPTION.max}`,
  );
  // The front matter is YAML and the value is written without quotes, so it must be a safe plain scalar.
  assert.ok(!/: | #|^[-?:,[\]{}#&*!|>'"%@`]/.test(description), `${where}: the description needs YAML quoting; reword it`);
}

test("skills/ holds only folders named org-<something>, each with a SKILL.md", () => {
  assert.ok(skills.length > 0);
  for (const entry of skills) {
    assert.ok(entry.isDirectory(), `skills/${entry.name} is not a folder`);
    assert.match(entry.name, NAME, `skills/${entry.name}`);
    assert.ok(exists(`skills/${entry.name}/SKILL.md`), `skills/${entry.name} has no SKILL.md`);
  }
});

test("a skill's front matter is its own name, a description and nothing that grants power", () => {
  for (const { name } of skills) {
    const where = `skills/${name}/SKILL.md`;
    const { fields } = frontMatter(readText(where));
    for (const field of Object.keys(fields)) assert.ok(SKILL_FIELDS.includes(field), `${where}: field ${field} is not allowed`);
    assert.equal(fields.name, name, `${where}: name must equal the folder name`);
    describes(fields, where);
  }
});

test("no skill file runs a shell command when it loads", () => {
  for (const path of filesIn("skills")) {
    const text = readText(path);
    assert.ok(!text.includes("!`"), `${path} has a "!\`command\`" line`);
    assert.ok(!/^\s*```!/m.test(text), `${path} has a "\`\`\`!" block`);
  }
});

test("every file a skill links to exists", () => {
  for (const { name } of skills) {
    const text = readText(`skills/${name}/SKILL.md`);
    for (const [, target] of text.matchAll(/\]\(([^)#]+)\)/g)) {
      if (/^[a-z]+:/.test(target)) continue;
      assert.ok(exists(`skills/${name}/${target}`), `skills/${name}/SKILL.md links to a missing file: ${target}`);
    }
  }
});

test("a subagent is agents/org-<something>.md with a name, a description and no tools of its own", () => {
  for (const path of agents) {
    assert.match(path, /^agents\/org-[a-z0-9-]+\.md$/, path);
    const { fields } = frontMatter(readText(path));
    for (const field of Object.keys(fields)) assert.ok(AGENT_FIELDS.includes(field), `${path}: field ${field} is not allowed`);
    assert.equal(`agents/${fields.name}.md`, path, `${path}: name must equal the file name`);
    describes(fields, path);
  }
});
