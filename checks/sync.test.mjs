// sync.mjs is the one piece of code every repository runs, so each refusal has a test that shows it refusing.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  LOCK_PATH,
  SYNC_PATH,
  SyncError,
  check,
  destinationOf,
  install,
  isKitDestination,
  main,
  parseBundle,
  releaseUrl,
  sha256,
} from "../sync.mjs";

const COMMIT = "0123456789abcdef0123456789abcdef01234567";

function file(path, content) {
  return { path, sha256: sha256(Buffer.from(content, "utf8")), content };
}

function bundleText(overrides = {}, files = undefined) {
  const bundle = {
    kit: "unset-sh/agent-kit",
    version: "1.2.3",
    commit: COMMIT,
    files: files ?? [
      file("rules/org.md", "# Rules\n"),
      file("skills/org-release/SKILL.md", "---\nname: org-release\n---\n"),
      file("skills/org-release/notes/more.md", "More.\n"),
      file("sync.mjs", "// the script\n"),
    ],
    ...overrides,
  };
  return JSON.stringify(bundle);
}

/** A throwaway folder that looks like a repository root. Removed when the test ends. */
function repository(t) {
  const root = mkdtempSync(join(tmpdir(), "agent-kit-"));
  mkdirSync(join(root, ".git"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function installed(t) {
  const root = repository(t);
  const text = bundleText();
  install(root, parseBundle(text, "1.2.3"), sha256(Buffer.from(text, "utf8")));
  return root;
}

function refuses(run, pattern) {
  assert.throws(run, (error) => error instanceof SyncError && pattern.test(error.message));
}

test("a kit path lands only under the kit's own names", () => {
  assert.equal(destinationOf("sync.mjs"), ".claude/agent-kit/sync.mjs");
  assert.equal(destinationOf("rules/org.md"), ".claude/rules/org/org.md");
  assert.equal(destinationOf("skills/org-release/SKILL.md"), ".claude/skills/org-release/SKILL.md");
  assert.equal(destinationOf("skills/org-release/notes/more.md"), ".claude/skills/org-release/notes/more.md");
  assert.equal(destinationOf("agents/org-reviewer.md"), ".claude/agents/org-reviewer.md");
});

test("a path outside those names, or one that could leave them, has no destination", () => {
  for (const path of [
    "",
    "README.md",
    "rules/../../etc/passwd",
    "rules/sub/org.md",
    "rules/org.txt",
    "rules/.hidden.md",
    "/rules/org.md",
    "rules//org.md",
    "rules\\org.md",
    "skills/release/SKILL.md",
    "skills/org-release/run.sh",
    "skills/org-release",
    "skills/org-/SKILL.md",
    "agents/reviewer.md",
    "agents/org-reviewer/x.md",
    "settings.json",
    ".claude/settings.json",
    "hooks/hooks.json",
    "rules/con.md",
    "rules/NUL.md",
    "skills/org-release/aux",
    "skills/org-release/com1.txt.md",
    "skills/org-release/notes./more.md",
    `rules/${"a".repeat(200)}.md`,
    null,
    42,
  ]) {
    assert.equal(destinationOf(path), null, String(path));
  }
});

test("a lock may name only paths a release can produce", () => {
  for (const path of [SYNC_PATH, ".claude/rules/org/org.md", ".claude/skills/org-x/SKILL.md", ".claude/agents/org-x.md"]) {
    assert.equal(isKitDestination(path), true, path);
  }
  for (const path of [
    LOCK_PATH,
    ".claude/agent-kit/other.mjs",
    ".claude/rules/org/sub/x.md",
    ".claude/rules/org/x.txt",
    ".claude/agents/org-x/y.md",
    ".claude/skills/org-x/run.sh",
    ".claude/rules/org/con.md",
    ".claude/settings.json",
    ".claude/rules/local.md",
    ".claude/skills/deploy/SKILL.md",
    ".claude/agents/reviewer.md",
    ".claude/rules/org/../x.md",
    "CLAUDE.md",
  ]) {
    assert.equal(isKitDestination(path), false, path);
  }
});

test("a valid bundle is accepted and keeps its version and commit", () => {
  const bundle = parseBundle(bundleText(), "1.2.3");
  assert.equal(bundle.version, "1.2.3");
  assert.equal(bundle.commit, COMMIT);
  assert.deepEqual([...bundle.files.keys()].sort(), [
    ".claude/agent-kit/sync.mjs",
    ".claude/rules/org/org.md",
    ".claude/skills/org-release/SKILL.md",
    ".claude/skills/org-release/notes/more.md",
  ]);
});

test("a bundle is refused when anything about it is off", () => {
  refuses(() => parseBundle("not json", "1.2.3"), /not valid JSON/);
  refuses(() => parseBundle("[]", "1.2.3"), /not a JSON object/);
  refuses(() => parseBundle(bundleText({ kit: "someone/else" }), "1.2.3"), /not from unset-sh\/agent-kit/);
  refuses(() => parseBundle(bundleText({ version: "1.2" }), "1.2"), /no valid version/);
  refuses(() => parseBundle(bundleText(), "1.2.4"), /asked for version 1\.2\.4/);
  refuses(() => parseBundle(bundleText({ commit: "abc" }), "1.2.3"), /no valid commit/);
  refuses(() => parseBundle(bundleText({ files: [] }), "1.2.3"), /no valid file list/);
  refuses(() => parseBundle(bundleText({}, [file("rules/org.md", "x\n")]), "1.2.3"), /does not contain sync\.mjs/);
});

test("a bundle cannot write outside the kit's names", () => {
  for (const path of ["../outside.md", ".claude/settings.json", "rules/../../x.md", "skills/deploy/SKILL.md"]) {
    const files = [file(path, "x\n"), file("sync.mjs", "// s\n")];
    refuses(() => parseBundle(bundleText({}, files), "1.2.3"), /may not ship/);
  }
});

test("a bundle whose content does not match its sha256 is refused", () => {
  const tampered = { ...file("rules/org.md", "# Rules\n"), content: "# Other rules\n" };
  refuses(() => parseBundle(bundleText({}, [tampered, file("sync.mjs", "// s\n")]), "1.2.3"), /does not match its sha256/);
});

test("a bundle that lists one destination twice is refused, whatever the letter case", () => {
  const twice = [file("rules/org.md", "a\n"), file("rules/org.md", "b\n"), file("sync.mjs", "// s\n")];
  refuses(() => parseBundle(bundleText({}, twice), "1.2.3"), /twice/);
  const byCase = [file("rules/org.md", "a\n"), file("rules/ORG.md", "b\n"), file("sync.mjs", "// s\n")];
  refuses(() => parseBundle(bundleText({}, byCase), "1.2.3"), /twice/);
});

test("a bundle whose paths would collide on a file system that ignores case is refused", () => {
  const fileAndFolder = [file("skills/org-x/a.md", "a\n"), file("skills/org-x/a.md/b.md", "b\n"), file("sync.mjs", "// s\n")];
  refuses(() => parseBundle(bundleText({}, fileAndFolder), "1.2.3"), /both a file and a folder/);
  const folderByCase = [file("skills/org-x/Notes/a.md", "a\n"), file("skills/org-x/notes/b.md", "b\n"), file("sync.mjs", "// s\n")];
  refuses(() => parseBundle(bundleText({}, folderByCase), "1.2.3"), /spells one folder two ways/);
});

test("a bundle file that is malformed, unsigned or too large is refused", () => {
  const sync = file("sync.mjs", "// s\n");
  refuses(() => parseBundle(bundleText({}, [null, sync]), "1.2.3"), /not an object/);
  refuses(() => parseBundle(bundleText({}, [{ ...file("rules/org.md", "x\n"), sha256: "abc" }, sync]), "1.2.3"), /no valid sha256/);
  refuses(() => parseBundle(bundleText({}, [{ ...file("rules/org.md", "x\n"), content: 7 }, sync]), "1.2.3"), /no content/);
  refuses(() => parseBundle(bundleText({}, [file("rules/org.md", "x".repeat(1024 * 1024 + 1)), sync]), "1.2.3"), /larger/);
  const many = Array.from({ length: 501 }, (_, index) => file(`rules/r${index}.md`, "x\n"));
  refuses(() => parseBundle(bundleText({}, many), "1.2.3"), /no valid file list/);
});

test("installing writes the files and a lock, and the check then passes", (t) => {
  const root = installed(t);
  assert.equal(readFileSync(join(root, ".claude/rules/org/org.md"), "utf8"), "# Rules\n");
  const lock = JSON.parse(readFileSync(join(root, LOCK_PATH), "utf8"));
  assert.equal(lock.kit, "unset-sh/agent-kit");
  assert.equal(lock.version, "1.2.3");
  assert.equal(lock.commit, COMMIT);
  assert.equal(lock.files[".claude/rules/org/org.md"], sha256(Buffer.from("# Rules\n", "utf8")));
  assert.deepEqual(check(root), { version: "1.2.3", problems: [] });
});

test("the check names a kit file edited by hand", (t) => {
  const root = installed(t);
  writeFileSync(join(root, ".claude/rules/org/org.md"), "# Rules, loosened\n");
  assert.deepEqual(check(root).problems, ["changed: .claude/rules/org/org.md"]);
});

test("the check names a missing kit file", (t) => {
  const root = installed(t);
  rmSync(join(root, ".claude/skills/org-release/SKILL.md"));
  assert.deepEqual(check(root).problems, ["missing: .claude/skills/org-release/SKILL.md"]);
});

test("the check names a file added under the kit's names", (t) => {
  const root = installed(t);
  writeFileSync(join(root, ".claude/rules/org/extra.md"), "# Slipped in\n");
  mkdirSync(join(root, ".claude/skills/org-mine"), { recursive: true });
  writeFileSync(join(root, ".claude/skills/org-mine/SKILL.md"), "x\n");
  mkdirSync(join(root, ".claude/agents"), { recursive: true });
  writeFileSync(join(root, ".claude/agents/org-mine.md"), "x\n");
  assert.deepEqual(check(root).problems, [
    "not part of the kit release, but under the kit's names: .claude/agents/org-mine.md",
    "not part of the kit release, but under the kit's names: .claude/rules/org/extra.md",
    "not part of the kit release, but under the kit's names: .claude/skills/org-mine/SKILL.md",
  ]);
});

test("the check leaves a repository's own rules, skills and subagents alone", (t) => {
  const root = installed(t);
  writeFileSync(join(root, ".claude/rules/local.md"), "# Ours\n");
  mkdirSync(join(root, ".claude/skills/deploy"), { recursive: true });
  writeFileSync(join(root, ".claude/skills/deploy/SKILL.md"), "ours\n");
  writeFileSync(join(root, ".claude/settings.json"), "{}\n");
  assert.deepEqual(check(root).problems, []);
});

test("the check names a kit file replaced by a symbolic link", (t) => {
  const root = installed(t);
  const outside = join(root, "outside.md");
  writeFileSync(outside, "# Rules\n");
  rmSync(join(root, ".claude/rules/org/org.md"));
  symlinkSync(outside, join(root, ".claude/rules/org/org.md"));
  assert.deepEqual(check(root).problems, [
    "reached through a symbolic link (.claude/rules/org/org.md): .claude/rules/org/org.md",
  ]);
});

test("the check names a kit file replaced by a folder", (t) => {
  const root = installed(t);
  rmSync(join(root, ".claude/rules/org/org.md"));
  mkdirSync(join(root, ".claude/rules/org/org.md"));
  assert.deepEqual(check(root).problems, ["not a regular file: .claude/rules/org/org.md"]);
});

test("the check and the install refuse a kit folder that is a link or a file", (t) => {
  for (const [folder, make] of [
    [".claude/rules/org", "link"],
    [".claude/skills", "link"],
    [".claude/agent-kit", "link"],
    [".claude/agents", "file"],
  ]) {
    const root = installed(t);
    const target = join(root, ...folder.split("/"));
    const elsewhere = mkdtempSync(join(tmpdir(), "agent-kit-elsewhere-"));
    t.after(() => rmSync(elsewhere, { recursive: true, force: true }));
    rmSync(target, { recursive: true, force: true });
    if (make === "link") symlinkSync(elsewhere, target);
    else writeFileSync(target, "not a folder\n");
    const pattern = make === "link" ? /is a symbolic link/ : /is not a folder/;
    refuses(() => check(root), pattern);
    const text = bundleText();
    refuses(() => install(root, parseBundle(text, "1.2.3"), sha256(Buffer.from(text, "utf8"))), pattern);
  }
});

test("the check refuses a lock that is missing, broken or lists a path the kit does not own", (t) => {
  const root = installed(t);
  const lockFile = join(root, LOCK_PATH);
  const lock = JSON.parse(readFileSync(lockFile, "utf8"));
  writeFileSync(lockFile, JSON.stringify({ ...lock, files: { ...lock.files, ".claude/settings.json": "0".repeat(64) } }));
  refuses(() => check(root), /does not own/);
  writeFileSync(lockFile, JSON.stringify({ ...lock, files: { ...lock.files, ".claude/agent-kit/extra.mjs": "0".repeat(64) } }));
  refuses(() => check(root), /does not own/);
  writeFileSync(lockFile, JSON.stringify({ ...lock, files: { ...lock.files, [SYNC_PATH]: "0" } }));
  refuses(() => check(root), /no valid sha256/);
  writeFileSync(lockFile, JSON.stringify({ ...lock, version: "latest" }));
  refuses(() => check(root), /does not have the shape/);
  const { [SYNC_PATH]: _dropped, ...withoutSync } = lock.files;
  writeFileSync(lockFile, JSON.stringify({ ...lock, files: withoutSync }));
  refuses(() => check(root), /does not list/);
  writeFileSync(lockFile, "{");
  refuses(() => check(root), /not valid JSON/);
  rmSync(lockFile);
  refuses(() => check(root), /is missing/);
  mkdirSync(lockFile);
  refuses(() => check(root), /not a regular file/);
});

test("installing a newer release removes kit files the release no longer has, and nothing else", (t) => {
  const root = installed(t);
  writeFileSync(join(root, ".claude/rules/local.md"), "# Ours\n");
  const next = bundleText({ version: "1.3.0" }, [file("rules/working.md", "# Working\n"), file("sync.mjs", "// newer\n")]);
  install(root, parseBundle(next, "1.3.0"), sha256(Buffer.from(next, "utf8")));
  assert.deepEqual(check(root), { version: "1.3.0", problems: [] });
  assert.throws(() => readFileSync(join(root, ".claude/rules/org/org.md")), /ENOENT/);
  assert.throws(() => readFileSync(join(root, ".claude/skills/org-release/SKILL.md")), /ENOENT/);
  assert.equal(readFileSync(join(root, ".claude/rules/local.md"), "utf8"), "# Ours\n");
  assert.equal(readFileSync(join(root, SYNC_PATH), "utf8"), "// newer\n");
});

test("a first install refuses files that already use the kit's names, and writes nothing", (t) => {
  const root = repository(t);
  mkdirSync(join(root, ".claude/rules/org"), { recursive: true });
  writeFileSync(join(root, ".claude/rules/org/ours.md"), "# Ours\n");
  const text = bundleText();
  refuses(() => install(root, parseBundle(text, "1.2.3"), sha256(Buffer.from(text, "utf8"))), /no lock yet.*ours\.md/);
  assert.equal(readFileSync(join(root, ".claude/rules/org/ours.md"), "utf8"), "# Ours\n");
  assert.throws(() => readFileSync(join(root, LOCK_PATH)), /ENOENT/);
});

test("installing refuses to write through a symbolic link", (t) => {
  const root = repository(t);
  const elsewhere = mkdtempSync(join(tmpdir(), "agent-kit-elsewhere-"));
  t.after(() => rmSync(elsewhere, { recursive: true, force: true }));
  symlinkSync(elsewhere, join(root, ".claude"));
  const text = bundleText();
  refuses(() => install(root, parseBundle(text, "1.2.3"), sha256(Buffer.from(text, "utf8"))), /symbolic link/);
  assert.throws(() => readFileSync(join(elsewhere, "rules/org/org.md")), /ENOENT/);
});

test("installing and checking refuse a folder that is not a repository root", (t) => {
  const root = mkdtempSync(join(tmpdir(), "agent-kit-plain-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const text = bundleText();
  refuses(() => install(root, parseBundle(text, "1.2.3"), sha256(Buffer.from(text, "utf8"))), /not a repository root/);
  refuses(() => check(root), /not a repository root/);
});

test("the command installs from a file, reports a clean copy as 0 and a changed one as 1", async (t) => {
  const root = repository(t);
  const from = join(root, "agent-kit.json");
  writeFileSync(from, bundleText());
  const printed = [];
  const print = (line) => printed.push(line);
  assert.equal(await main(["1.2.3", "--from", from, "--root", root], print), 0);
  assert.equal(await main(["--check", "--root", root], print), 0);
  writeFileSync(join(root, ".claude/rules/org/org.md"), "changed\n");
  assert.equal(await main(["--check", "--root", root], print), 1);
  assert.match(printed.join("\n"), /changed: \.claude\/rules\/org\/org\.md/);
  writeFileSync(from, bundleText({ version: "1.3.0" }, [file("rules/org.md", "# Rules\n"), file("sync.mjs", "// newer\n")]));
  assert.equal(await main(["1.3.0", "--from", from, "--root", root], print), 0);
  assert.match(printed.join("\n"), /removed, no longer in the kit: \.claude\/skills\/org-release\/SKILL\.md/);
});

test("the copied script runs its check when started by any path, and fails on a changed copy", (t) => {
  // Started as a child process, the way a repository's CI runs it, so a script that silently did nothing
  // (because it did not recognise itself as the entry point) would show here as exit 0.
  const script = readFileSync(fileURLToPath(new URL("../sync.mjs", import.meta.url)), "utf8");
  const root = repository(t);
  const text = bundleText({}, [file("rules/org.md", "# Rules\n"), file("sync.mjs", script)]);
  install(root, parseBundle(text, "1.2.3"), sha256(Buffer.from(text, "utf8")));
  const linked = join(mkdtempSync(join(tmpdir(), "agent-kit-link-")), "repository");
  t.after(() => rmSync(join(linked, ".."), { recursive: true, force: true }));
  symlinkSync(root, linked);
  const run = (base) =>
    spawnSync(process.execPath, [join(base, ...SYNC_PATH.split("/")), "--check", "--root", root], { encoding: "utf8" });
  for (const base of [root, linked]) assert.equal(run(base).status, 0, base);
  writeFileSync(join(root, ".claude/rules/org/org.md"), "# Rules, loosened\n");
  for (const base of [root, linked]) {
    const result = run(base);
    assert.equal(result.status, 1, base);
    assert.match(result.stdout, /changed: \.claude\/rules\/org\/org\.md/);
  }
  assert.equal(execFileSync(process.execPath, ["--check", join(root, ...SYNC_PATH.split("/"))], { encoding: "utf8" }), "");
});

test("the command refuses arguments it does not understand", async () => {
  for (const argv of [[], ["--check", "1.2.3"], ["latest"], ["1.2.3", "--from"], ["--check", "--from", "x"], ["1.2.3", "1.2.4"]]) {
    await assert.rejects(main(argv, () => {}), SyncError, JSON.stringify(argv));
  }
  await assert.rejects(main(["1.2.3", "--from", "/nonexistent/agent-kit.json"], () => {}), /could not read/);
});

test("a release is downloaded from this repository's release page and nowhere else", () => {
  assert.equal(releaseUrl("1.2.3"), "https://github.com/unset-sh/agent-kit/releases/download/v1.2.3/agent-kit.json");
});

test("a download that fails, is refused, breaks off or is too large is a plain refusal", async (t) => {
  // fetch is the one unmanaged dependency here: replaced for this test only, and put back after it.
  const realFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  const answer = (response) => {
    globalThis.fetch = async (url) => {
      assert.equal(url, releaseUrl("1.2.3"));
      if (response instanceof Error) throw response;
      return response;
    };
  };
  const root = repository(t);
  const run = () => main(["1.2.3", "--root", root], () => {});
  answer(new TypeError("fetch failed"));
  await assert.rejects(run(), /could not download .*fetch failed.*--from/);
  answer(new Response("missing", { status: 404 }));
  await assert.rejects(run(), /answered 404/);
  const broken = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("{"));
      controller.error(new Error("connection reset"));
    },
  });
  answer(new Response(broken, { status: 200 }));
  await assert.rejects(run(), /broke off \(connection reset\)/);
  answer(new Response(Buffer.alloc(8 * 1024 * 1024 + 1), { status: 200 }));
  await assert.rejects(run(), /larger than the kit allows/);
  answer(new Response(bundleText(), { status: 200 }));
  assert.equal(await run(), 0);
  assert.deepEqual(check(root), { version: "1.2.3", problems: [] });
});

test("a local bundle that is too large is refused before it is read as JSON", async (t) => {
  const root = repository(t);
  const from = join(root, "agent-kit.json");
  writeFileSync(from, Buffer.alloc(8 * 1024 * 1024 + 1, 0x20));
  await assert.rejects(main(["1.2.3", "--from", from, "--root", root], () => {}), /larger than the kit allows/);
});
