// Everything the kit ships is copied into every repository and read by every assistant there. These checks
// keep it to plain text that reads the same everywhere and holds nothing it should not.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { shippedPaths } from "../scripts/shipped.mjs";
import { destinationOf } from "../sync.mjs";
import { readText, root } from "./repo.mjs";

const shipped = shippedPaths();
const bytesOf = (path) => readFileSync(new URL(path, root));

/** Shapes of credentials that must never be committed. A match is a finding even when the value is fake. */
const SECRET_SHAPES = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{24,}/,
];

/** Things only the app repository has. A shared rule that names one is not a shared rule. */
const ONE_REPOSITORY_ONLY = [/\bP\d+\.\d+[a-z]?\b/, /docs\/ai\/book/, /\bADR 0\d{3}\b/];

test("only Markdown and sync.mjs are shipped, and sync.mjs accepts every one of them", () => {
  assert.ok(shipped.includes("sync.mjs"));
  for (const path of shipped) {
    assert.ok(path === "sync.mjs" || path.endsWith(".md"), `${path} is neither Markdown nor sync.mjs`);
    assert.notEqual(destinationOf(path), null, `sync.mjs would refuse ${path}`);
  }
});

test("no two shipped files differ only by letter case", () => {
  const seen = new Map();
  for (const path of shipped) {
    const other = seen.get(path.toLowerCase());
    assert.equal(other, undefined, `${path} and ${other} collide on a file system that ignores case`);
    seen.set(path.toLowerCase(), path);
  }
});

test("shipped files are UTF-8 with LF line endings and end with a newline", () => {
  for (const path of shipped) {
    const bytes = bytesOf(path);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    assert.ok(!text.includes("\r"), `${path} has a carriage return`);
    assert.ok(text.endsWith("\n"), `${path} does not end with a newline`);
    assert.ok(!text.startsWith("﻿"), `${path} starts with a byte order mark`);
  }
});

test("no shipped file is executable", () => {
  for (const path of shipped) {
    assert.equal(statSync(new URL(path, root)).mode & 0o111, 0, `${path} has an executable bit`);
  }
});

test("no shipped file holds something shaped like a secret", () => {
  for (const path of shipped) {
    const text = bytesOf(path).toString("utf8");
    for (const shape of SECRET_SHAPES) assert.ok(!shape.test(text), `${path} matches ${shape}`);
  }
});

test("no rule or skill written here names something only one repository has", () => {
  // The three principles documents are Alex's text, copied unchanged; they are checked by eye, not here.
  const ours = shipped.filter((path) => path.endsWith(".md") && !/^skills\/org-principles\/(?!SKILL\.md$)/.test(path));
  for (const path of ours) {
    const text = bytesOf(path).toString("utf8");
    for (const shape of ONE_REPOSITORY_ONLY) assert.ok(!shape.test(text), `${path} matches ${shape}`);
  }
});

test("no shipped file imports another file into context", () => {
  // Claude Code expands an @path import in a loaded Markdown file into context
  // (https://code.claude.com/docs/en/memory, as read for the pre-release review of 2026-11-22), so one line could
  // pull a consuming repository's file into every session without it showing in this repository's diff. Code
  // spans and blocks are left out here; whether Claude Code skips them too is unverified, and none holds a path.
  for (const path of shipped.filter((file) => file.endsWith(".md"))) {
    const prose = readText(path)
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`\n]*`/g, "");
    // Any @ not inside a word, so "[@x]", "see:@x" and ">@x" are caught as well as " @x".
    assert.doesNotMatch(prose, /(?<!\w)@\S/, `${path} has an @ import`);
  }
});
