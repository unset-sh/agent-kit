// The rule files are loaded at the start of every session in every repository. These checks keep them few,
// short and unconditional.
import assert from "node:assert/strict";
import { test } from "node:test";
import { filesIn, readText } from "./repo.mjs";

/** Lines the rule files may use in total. Raising it is a decision, not a tidy-up: see CLAUDE.md. */
const LINE_BUDGET = 150;

const rules = filesIn("rules");

test("there are rule files, all Markdown, all directly in rules/", () => {
  assert.ok(rules.length > 0);
  for (const path of rules) assert.match(path, /^rules\/[a-z][a-z0-9-]*\.md$/, path);
});

test(`the rule files stay within ${LINE_BUDGET} lines in total`, () => {
  const lines = rules.map((path) => readText(path).split("\n").length - 1);
  const total = lines.reduce((sum, count) => sum + count, 0);
  assert.ok(total <= LINE_BUDGET, `rules/ has ${total} lines; the budget is ${LINE_BUDGET}`);
});

test("every rule file starts with a title and says where to change it", () => {
  for (const path of rules) {
    const text = readText(path);
    assert.match(text, /^# \S/, `${path} does not start with a title`);
    assert.match(text, /unset-sh\/agent-kit/, `${path} does not name unset-sh/agent-kit as the place to change it`);
  }
});

test("no rule file has front matter, so every rule loads in every session", () => {
  for (const path of rules) assert.ok(!readText(path).startsWith("---"), `${path} has front matter`);
});
