# agent-kit

Shared rules, skills and templates for AI assistants working on unset.sh.

Every unset.sh repository is worked on by AI assistants. This repository holds what all of them need to know,
whatever repository they are in, and gets it to them as a pinned copy that each repository's CI checks.

## What is in it

| Folder | What it holds | In a repository it becomes |
| --- | --- | --- |
| [`rules/`](rules/) | The organisation's rules, how to work, and the engineering principles in short. Loaded at the start of every session, so kept to 150 lines in total | `.claude/rules/org/` |
| [`skills/`](skills/) | Procedures for jobs that repeat across repositories, read only when the job comes up. The organisation's decision records are the skill [`org-decisions`](skills/org-decisions/SKILL.md) | `.claude/skills/org-*/` |
| [`sync.mjs`](sync.mjs) | Installs a release in a repository and checks the copy. Node built-ins only | `.claude/agent-kit/sync.mjs` |
| [`templates/`](templates/) | The `CLAUDE.md` and `AGENTS.md` a new repository starts from | Copied once, then owned by the repository |
| [`projects/`](projects/) | The text of the instructions for Claude projects | Pasted into a project's settings by hand |

What belongs here and what does not is in [`CLAUDE.md`](CLAUDE.md).

## How a repository uses it

A repository commits a copy of one release under `.claude/`. The file `.claude/agent-kit/lock.json` records
the release, its commit and a sha256 for every copied file.

A committed copy is used because it is the only form every kind of session loads. Claude Code loads a
repository's `CLAUDE.md`, `.claude/rules/` and `.claude/skills/` from the clone, in cloud and local sessions
alike. It does not install plugins a repository declares in a cloud session, and a plugin cannot carry rules
that are always loaded. (Claude Code documentation, read 2026-11-21:
[what cloud sessions carry over](https://code.claude.com/docs/en/cloud-environments#what-carries-over-from-your-setup),
[what project threads pick up](https://code.claude.com/docs/en/claude-projects#what-threads-pick-up-from-your-repositories),
[plugin reference](https://code.claude.com/docs/en/plugins-reference).)

**Adopt it** (once per repository): download `sync.mjs` and `agent-kit.json` from a
[release](https://github.com/unset-sh/agent-kit/releases) into a folder outside the repository, verify both
against the release workflow on `main`, then install from the file:

```sh
gh attestation verify agent-kit.json --repo unset-sh/agent-kit \
  --signer-workflow unset-sh/agent-kit/.github/workflows/release.yml --source-ref refs/heads/main
node /path/to/downloaded/sync.mjs 0.1.0 --from /path/to/downloaded/agent-kit.json
```

**Check the copy** in the repository's CI. It needs no network and fails when a kit file was edited by hand,
is missing, or when a file was added under the kit's names. It compares the copy with the lock beside it, so it
catches accidents, not intent: someone who edits a kit file and its lock together passes it. Catching that
needs a check outside the repository that compares each copy with the published release:

```sh
node .claude/agent-kit/sync.mjs --check
```

**Take a newer release** on a branch, then open a pull request. It is reviewed and merged like code. Download
and verify `agent-kit.json` the same way first, then:

```sh
node .claude/agent-kit/sync.mjs 0.2.0 --from /path/to/downloaded/agent-kit.json
```

Without `--from`, `sync.mjs` downloads the bundle itself, unverified; the skill `org-kit-update` does not do
that. The full steps are in that skill.

To change a rule or a skill, change it here. The copy in a repository is never edited.

## What `sync.mjs` will and will not do

- It writes only under `.claude/rules/org/`, `.claude/skills/org-*/`, `.claude/agents/org-*.md` and
  `.claude/agent-kit/`. Where a file lands is decided by fixed rules in the script, never by the release.
- It refuses a release whose name or version is wrong, whose commit is not a full sha, or whose files do not
  match the sha256 the release itself states, and any path outside those names. Those hashes catch corruption,
  not a forged release: for that, verify the release's attestation against the release workflow on `main`
  before installing (skill `org-kit-update`).
- It refuses to read or write through a symbolic link.
- It never touches a repository's own `CLAUDE.md`, rules, skills, subagents or settings.

## Releases

A release is a tag `v<version>` on a commit of `main`. The workflow builds `agent-kit.json` once, waits for
the owner's approval in the `release` environment, attests the files and publishes them on the release page
with the changelog entry of that version. Whoever can change this repository can steer every assistant in
every unset.sh repository, so a release goes through two approvals before it reaches a repository: the
owner's on the release, and a reviewed pull request in the repository that takes it.

## Working on this repository

```sh
npm run check
```

Node 26 (see `.nvmrc`), no dependencies.

## Licence

AGPL-3.0-only. See [`LICENSE`](LICENSE). Copyright (c) 2026 Alex (Undefined6799).
