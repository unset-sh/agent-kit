// sync.mjs is the one piece of code every repository runs, so each refusal has a test that shows it refusing.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  LOCK_PATH,
  SOURCE,
  SYNC_PATH,
  SyncError,
  check,
  destinationOf,
  fetchKit,
  install,
  isKitDestination,
  kitFromTree,
  main,
  sha256,
} from "../sync.mjs";

const COMMIT = "0123456789abcdef0123456789abcdef01234567";
const NEXT = "89abcdef0123456789abcdef0123456789abcdef";

/** One entry of a commit's tree, as sync.mjs reads it from git. */
function entry(path, content, mode = "100644") {
  const bytes = Buffer.from(content, "utf8");
  return { path, mode, size: bytes.length, read: () => bytes };
}

function treeOf(extra = []) {
  return [
    entry("README.md", "# Not shipped\n"),
    entry("rules/org.md", "# Rules\n"),
    entry("skills/org-release/SKILL.md", "---\nname: org-release\n---\n"),
    entry("skills/org-release/notes/more.md", "More.\n"),
    entry("sync.mjs", "// the script\n"),
    ...extra,
  ];
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
  install(root, kitFromTree(COMMIT, treeOf()));
  return root;
}

function refuses(run, pattern) {
  assert.throws(run, (error) => error instanceof SyncError && pattern.test(error.message));
}

/** A real git repository standing in for agent-kit: `files` committed on main. Returns its path and commit. */
function kitRepository(t, files) {
  const folder = mkdtempSync(join(tmpdir(), "agent-kit-source-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], {
      cwd: folder,
      encoding: "utf8",
    }).trim();
  git("init", "--quiet", "--initial-branch=main");
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(folder, ...path.split("/").slice(0, -1)), { recursive: true });
    writeFileSync(join(folder, ...path.split("/")), content);
  }
  git("add", "--all");
  git("commit", "--quiet", "--message", "kit");
  return { folder, git, commit: git("rev-parse", "HEAD") };
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

test("a lock may name only paths the kit can produce", () => {
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

test("a commit's tree gives the files to install, and what is not the kit's is left out", () => {
  const kit = kitFromTree(COMMIT, treeOf([entry(".claude/settings.json", "{}"), entry("notes/x/plan.md", "x\n")]));
  assert.equal(kit.commit, COMMIT);
  assert.deepEqual([...kit.files.keys()].sort(), [
    ".claude/agent-kit/sync.mjs",
    ".claude/rules/org/org.md",
    ".claude/skills/org-release/SKILL.md",
    ".claude/skills/org-release/notes/more.md",
  ]);
  assert.equal(kit.files.get(".claude/rules/org/org.md").sha256, sha256(Buffer.from("# Rules\n", "utf8")));
});

test("a commit is refused when it is not a full id or has no sync.mjs", () => {
  refuses(() => kitFromTree("abc", treeOf()), /full 40-character commit/);
  refuses(() => kitFromTree(COMMIT.toUpperCase(), treeOf()), /full 40-character commit/);
  refuses(() => kitFromTree(COMMIT, [entry("rules/org.md", "x\n")]), /does not contain sync\.mjs/);
});

test("a file in a shipped folder that the kit may not ship is refused, not skipped", () => {
  for (const path of ["rules/sub/org.md", "rules/org.txt", "skills/deploy/SKILL.md", "skills/org-x/run.sh", "agents/reviewer.md"]) {
    refuses(() => kitFromTree(COMMIT, treeOf([entry(path, "x\n")])), /may not ship/);
  }
});

test("a link or a submodule in a shipped folder is refused", () => {
  refuses(() => kitFromTree(COMMIT, treeOf([entry("rules/link.md", "/etc/passwd", "120000")])), /link or not a regular file/);
  refuses(() => kitFromTree(COMMIT, treeOf([entry("skills/org-x", "", "160000")])), /link or not a regular file/);
  refuses(() => kitFromTree(COMMIT, [entry("rules/org.md", "x\n"), entry("sync.mjs", "x", "120000")]), /link or not a regular file/);
});

test("a tree that lists one destination twice is refused, whatever the letter case", () => {
  refuses(() => kitFromTree(COMMIT, treeOf([entry("rules/org.md", "b\n")])), /twice/);
  refuses(() => kitFromTree(COMMIT, treeOf([entry("rules/ORG.md", "b\n")])), /twice/);
});

test("a tree whose paths would collide on a file system that ignores case is refused", () => {
  refuses(() => kitFromTree(COMMIT, treeOf([entry("skills/org-x/a.md", "a\n"), entry("skills/org-x/a.md/b.md", "b\n")])), /both a file and a folder/);
  refuses(() => kitFromTree(COMMIT, treeOf([entry("skills/org-x/Notes/a.md", "a\n"), entry("skills/org-x/notes/b.md", "b\n")])), /spells one folder two ways/);
});

test("a file that is too large, or a tree with too many files, is refused before it is read", () => {
  const huge = { path: "rules/huge.md", mode: "100644", size: 1024 * 1024 + 1, read: () => assert.fail("read a file that is too large") };
  refuses(() => kitFromTree(COMMIT, treeOf([huge])), /larger/);
  const many = Array.from({ length: 501 }, (_, index) => entry(`rules/r${index}.md`, "x\n"));
  refuses(() => kitFromTree(COMMIT, treeOf(many)), /more files than it allows/);
});

test("installing writes the files and a lock, and the check then passes", (t) => {
  const root = installed(t);
  assert.equal(readFileSync(join(root, ".claude/rules/org/org.md"), "utf8"), "# Rules\n");
  const lock = JSON.parse(readFileSync(join(root, LOCK_PATH), "utf8"));
  assert.deepEqual(Object.keys(lock), ["kit", "commit", "files"]);
  assert.equal(lock.kit, "unset-sh/agent-kit");
  assert.equal(lock.commit, COMMIT);
  assert.equal(lock.files[".claude/rules/org/org.md"], sha256(Buffer.from("# Rules\n", "utf8")));
  assert.deepEqual(check(root), { commit: COMMIT, problems: [] });
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
    "not part of the kit, but under the kit's names: .claude/agents/org-mine.md",
    "not part of the kit, but under the kit's names: .claude/rules/org/extra.md",
    "not part of the kit, but under the kit's names: .claude/skills/org-mine/SKILL.md",
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
    refuses(() => install(root, kitFromTree(COMMIT, treeOf())), pattern);
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
  writeFileSync(lockFile, JSON.stringify({ ...lock, commit: "main" }));
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

test("installing a newer commit removes kit files it no longer has, and nothing else", (t) => {
  const root = installed(t);
  writeFileSync(join(root, ".claude/rules/local.md"), "# Ours\n");
  install(root, kitFromTree(NEXT, [entry("rules/working.md", "# Working\n"), entry("sync.mjs", "// newer\n")]));
  assert.deepEqual(check(root), { commit: NEXT, problems: [] });
  assert.throws(() => readFileSync(join(root, ".claude/rules/org/org.md")), /ENOENT/);
  assert.throws(() => readFileSync(join(root, ".claude/skills/org-release/SKILL.md")), /ENOENT/);
  assert.equal(readFileSync(join(root, ".claude/rules/local.md"), "utf8"), "# Ours\n");
  assert.equal(readFileSync(join(root, SYNC_PATH), "utf8"), "// newer\n");
});

test("a first install refuses files that already use the kit's names, and writes nothing", (t) => {
  const root = repository(t);
  mkdirSync(join(root, ".claude/rules/org"), { recursive: true });
  writeFileSync(join(root, ".claude/rules/org/ours.md"), "# Ours\n");
  refuses(() => install(root, kitFromTree(COMMIT, treeOf())), /no lock yet.*ours\.md/);
  assert.equal(readFileSync(join(root, ".claude/rules/org/ours.md"), "utf8"), "# Ours\n");
  assert.throws(() => readFileSync(join(root, LOCK_PATH)), /ENOENT/);
});

test("installing refuses to write through a symbolic link", (t) => {
  const root = repository(t);
  const elsewhere = mkdtempSync(join(tmpdir(), "agent-kit-elsewhere-"));
  t.after(() => rmSync(elsewhere, { recursive: true, force: true }));
  symlinkSync(elsewhere, join(root, ".claude"));
  refuses(() => install(root, kitFromTree(COMMIT, treeOf())), /symbolic link/);
  assert.throws(() => readFileSync(join(elsewhere, "rules/org/org.md")), /ENOENT/);
});

test("installing and checking refuse a folder that is not a repository root", (t) => {
  const root = mkdtempSync(join(tmpdir(), "agent-kit-plain-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  refuses(() => install(root, kitFromTree(COMMIT, treeOf())), /not a repository root/);
  refuses(() => check(root), /not a repository root/);
});

test("the command installs a commit of main from a git repository, and checks the copy", async (t) => {
  const source = kitRepository(t, { "rules/org.md": "# Rules\n", "skills/org-x/SKILL.md": "x\n", "sync.mjs": "// s\n", "README.md": "r\n" });
  const root = repository(t);
  const printed = [];
  const print = (line) => printed.push(line);
  assert.equal(await main([source.commit, "--from", source.folder, "--root", root], print), 0);
  assert.deepEqual(check(root), { commit: source.commit, problems: [] });
  assert.equal(await main(["--check", "--root", root], print), 0);
  writeFileSync(join(root, ".claude/rules/org/org.md"), "changed\n");
  assert.equal(await main(["--check", "--root", root], print), 1);
  assert.match(printed.join("\n"), /changed: \.claude\/rules\/org\/org\.md/);
  assert.match(printed.join("\n"), new RegExp(`sync\\.mjs ${source.commit}`));
  source.git("rm", "--quiet", "skills/org-x/SKILL.md");
  source.git("commit", "--quiet", "--message", "drop a skill");
  const next = source.git("rev-parse", "HEAD");
  assert.equal(await main([next, "--from", source.folder, "--root", root], print), 0);
  assert.match(printed.join("\n"), /removed, no longer in the kit: \.claude\/skills\/org-x\/SKILL\.md/);
  assert.deepEqual(check(root), { commit: next, problems: [] });
});

test("a commit that is not on the kit's main branch is refused, and nothing is written", (t) => {
  const source = kitRepository(t, { "rules/org.md": "# Rules\n", "sync.mjs": "// s\n" });
  source.git("switch", "--quiet", "--create", "unreviewed");
  writeFileSync(join(source.folder, "rules/org.md"), "# Loosened\n");
  source.git("commit", "--quiet", "--all", "--message", "not on main");
  const side = source.git("rev-parse", "HEAD");
  refuses(() => fetchKit(side, source.folder), /not a commit on the kit's main branch/);
  refuses(() => fetchKit("f".repeat(40), source.folder), /not a commit on the kit's main branch/);
  const tree = source.git("rev-parse", "HEAD^{tree}");
  refuses(() => fetchKit(tree, source.folder), /not a commit on the kit's main branch/);
  assert.equal(fetchKit(source.git("rev-parse", "main"), source.folder).files.size, 2);
});

test("a source that git cannot fetch, or that looks like an option, is a plain refusal", (t) => {
  refuses(() => fetchKit(COMMIT, join(tmpdir(), "agent-kit-no-such-repository")), /fetching main from .* failed/);
  refuses(() => fetchKit(COMMIT, "--upload-pack=touch /tmp/x"), /must name a git repository/);
  refuses(() => fetchKit(COMMIT, ""), /must name a git repository/);
  const empty = repository(t);
  refuses(() => fetchKit(COMMIT, empty), /fetching main from .* failed/);
});

test("git may fetch only over https or from a local path, whatever the environment allows", (t) => {
  const marker = join(mkdtempSync(join(tmpdir(), "agent-kit-ext-")), "ran");
  t.after(() => rmSync(join(marker, ".."), { recursive: true, force: true }));
  const before = process.env.GIT_ALLOW_PROTOCOL;
  process.env.GIT_ALLOW_PROTOCOL = "ext:ssh:file:https";
  t.after(() => (before === undefined ? delete process.env.GIT_ALLOW_PROTOCOL : (process.env.GIT_ALLOW_PROTOCOL = before)));
  refuses(() => fetchKit(COMMIT, `ext::sh -c touch% ${marker}`), /fetching main from the --from repository failed/);
  assert.ok(!existsSync(marker), "the ext:: transport ran a command");
  refuses(() => fetchKit(COMMIT, "ssh://git@127.0.0.1:1/kit.git"), /fetching main from the --from repository failed/);
});

test("a token in a --from URL is not printed", () => {
  refuses(
    () => fetchKit(COMMIT, "https://user:secret-token@127.0.0.1:1/kit.git"),
    /^(?![\s\S]*secret-token)[\s\S]*fetching main from the --from repository failed/,
  );
});

test("the kit is fetched from this repository on GitHub and nowhere else by default", () => {
  assert.equal(SOURCE, "https://github.com/unset-sh/agent-kit.git");
});

test("the copied script runs its check when started by any path, and fails on a changed copy", (t) => {
  // Started as a child process, the way a repository's CI runs it, so a script that silently did nothing
  // (because it did not recognise itself as the entry point) would show here as exit 0.
  const script = readFileSync(fileURLToPath(new URL("../sync.mjs", import.meta.url)), "utf8");
  const root = repository(t);
  install(root, kitFromTree(COMMIT, [entry("rules/org.md", "# Rules\n"), entry("sync.mjs", script)]));
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
  // The copy parses as a module on its own; Bun's transpiler throws on a syntax error. (`bun --check` type
  // checks and then runs the file, so it is no syntax check.)
  assert.doesNotThrow(() => new Bun.Transpiler({ loader: "js" }).transformSync(readFileSync(join(root, ...SYNC_PATH.split("/")), "utf8")));
});

test("the command refuses arguments it does not understand", async () => {
  for (const argv of [[], ["--check", COMMIT], ["latest"], ["0.1.0"], [COMMIT.slice(0, 7)], [COMMIT, "--from"], ["--check", "--from", "x"], [COMMIT, NEXT]]) {
    await assert.rejects(main(argv, () => {}), SyncError, JSON.stringify(argv));
  }
});
