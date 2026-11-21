---
name: org-kit-update
description: Adopt unset-sh/agent-kit in a repository or move a repository to a newer agent-kit release. Use when the daily organisation check reports a repository behind, when a kit release should be taken, when CI fails on `sync.mjs --check`, or when someone wants to change a file under `.claude/rules/org/`, `.claude/skills/org-*` or `.claude/agent-kit/`.
---

# Update a repository's copy of agent-kit

A repository carries a copy of one agent-kit release. `.claude/agent-kit/lock.json` records the release, its
commit and a sha256 for every copied file. The copy is never edited by hand.

## Someone wants a rule or skill changed

Do not edit the copy. Open a pull request on `unset-sh/agent-kit` with the change. It reaches repositories
after the owner approves the next kit release, through the steps below.

## Move to a newer release

1. Read the release notes of every version between the one in `lock.json` and the target, at
   <https://github.com/unset-sh/agent-kit/releases>. They say what changes in behaviour.
2. On your own branch, from the repository root, run `node .claude/agent-kit/sync.mjs <version>`, for example
   `node .claude/agent-kit/sync.mjs 0.2.0`. It downloads that release's `agent-kit.json`, checks every file
   against its sha256, replaces the kit's files and rewrites `lock.json`. It touches nothing else.
3. If the download is blocked where you work, download `agent-kit.json` from the release page another way and
   run `node .claude/agent-kit/sync.mjs <version> --from <path to agent-kit.json>`.
4. Run `node .claude/agent-kit/sync.mjs --check`. It must print that the copy matches.
5. Read the diff. If a changed rule conflicts with the repository's own `CLAUDE.md`, say so in the pull
   request and do not resolve it silently.
6. Open a pull request titled `Update agent-kit to v<version>`. Say which rules and skills changed, in one
   line each. It is reviewed and merged like code and never qualifies for a docs-only merge.

## First adoption

1. Download `sync.mjs` from the release's assets into a temporary folder outside the repository.
2. From the repository root run `node <temporary folder>/sync.mjs <version>`. It installs the kit's files,
   its own copy at `.claude/agent-kit/sync.mjs`, and `lock.json`.
3. Add `node .claude/agent-kit/sync.mjs --check` to the repository's CI check.
4. Make sure the repository's `CLAUDE.md` starts with "Where this repository fits" and that `AGENTS.md`
   exists, both from the kit's `templates/`. Remove rules from `CLAUDE.md` that the kit's rules now state.
5. In the same piece of work, record in `repos.json` (`unset-sh/.github`) that the repository uses
   `agent-kit`.

## When the check fails

`sync.mjs --check` names each problem: a changed file, a missing file, or a file under the kit's names that
the lock does not list. Restore the copy by running step 2 with the version already in `lock.json`. A new
rule or skill of the repository's own must not use an `org` name or live under `.claude/rules/org/`.
