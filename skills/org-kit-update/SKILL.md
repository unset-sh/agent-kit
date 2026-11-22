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
2. Download the release's `agent-kit.json` into a folder outside the repository, for example with
   `gh release download v<version> --repo unset-sh/agent-kit --pattern agent-kit.json --dir <folder>`.
3. Verify it before installing anything. It must have been made by the kit's release workflow on `main`:
   `gh attestation verify <folder>/agent-kit.json --repo unset-sh/agent-kit --signer-workflow
   unset-sh/agent-kit/.github/workflows/release.yml --source-ref refs/heads/main`.
   `--repo` alone is not enough: it accepts any workflow of the repository on any branch, and a workflow on a
   pushed branch can publish a release without the owner's approval. If verification fails, stop and tell the
   owner. If you cannot run it, stop and say so in the pull request; do not install an unverified release.
4. On your own branch, from the repository root, run
   `node .claude/agent-kit/sync.mjs <version> --from <folder>/agent-kit.json`. It checks every file against its
   sha256, replaces the kit's files and rewrites `lock.json`. It touches nothing else. Then run
   `node .claude/agent-kit/sync.mjs --check`; it must print that the copy matches.
5. Read the diff. If a changed rule conflicts with the repository's own `CLAUDE.md`, say so in the pull
   request and do not resolve it silently.
6. Open a pull request titled `Update agent-kit to v<version>`. Say which rules and skills changed, in one
   line each. It is reviewed and merged like code and never qualifies for a docs-only merge.

## First adoption

1. Download `sync.mjs` and `agent-kit.json` from the release's assets into a folder outside the repository,
   and verify both as in step 3 above (the same command, once for each file). Do not run an unverified
   `sync.mjs`.
2. From the repository root run `node <folder>/sync.mjs <version> --from <folder>/agent-kit.json`. It installs
   the kit's files, its own copy at `.claude/agent-kit/sync.mjs`, and `lock.json`.
3. Add `node .claude/agent-kit/sync.mjs --check` to the repository's CI check.
4. Make sure the repository's `CLAUDE.md` starts with "Where this repository fits" and that `AGENTS.md`
   exists, both from the kit's `templates/`. Remove rules from `CLAUDE.md` that the kit's rules now state.
5. In the same piece of work, record in `repos.json` (`unset-sh/.github`) that the repository uses
   `agent-kit`.

## Formatters and line endings

The copies must stay byte for byte as released. Keep the repository's formatter off `.claude/rules/org/`,
`.claude/skills/org-*/`, `.claude/agents/org-*` and `.claude/agent-kit/`, and make sure Git does not rewrite
their line endings (for example with `core.autocrlf` on Windows; a `.gitattributes` line
`.claude/** -text` keeps them as committed). Otherwise `--check` fails on files nobody edited.

## When the check fails

`sync.mjs --check` names each problem: a changed file, a missing file, or a file under the kit's names that
the lock does not list. Restore the copy by running step 2 with the version already in `lock.json`. A new
rule or skill of the repository's own must not use an `org` name or live under `.claude/rules/org/`.
