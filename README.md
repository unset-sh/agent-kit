# agent-kit

Shared rules, skills and templates for AI assistants working on unset.sh.

Every unset.sh repository is worked on by AI assistants. This repository holds what all of them need to know,
whatever repository they are in, and gets it to them in a way that cannot drift without someone noticing.

## What is in it

| Folder | What it holds | In a repository it becomes |
| --- | --- | --- |
| [`rules/`](rules/) | The organisation's rules, how to work, and the engineering principles in short. Loaded at the start of every session, so kept to 150 lines in total | `.claude/rules/org/` |
| [`skills/`](skills/) | Procedures for jobs that repeat across repositories and organisation decision records, read when needed | `.claude/skills/org-*/` |
| [`sync.mjs`](sync.mjs) | Installs a release in a repository and checks the copy. Node built-ins only | `.claude/agent-kit/sync.mjs` |
| [`templates/`](templates/) | The `CLAUDE.md` and `AGENTS.md` a new repository starts from | Copied once, then owned by the repository |
| [`projects/`](projects/) | The text of the instructions for Claude projects | Pasted into a project's settings by hand |
| `notes/<task>/` | AI plans, working notes, investigations and review reports from organisation work | Stays here; excluded from the kit |
| `artifacts/<task>/` | Supporting AI working artifacts and review evidence | Stays here; excluded from the kit |

What belongs here and what does not is in [`CLAUDE.md`](CLAUDE.md).

The [organisation decisions](skills/org-decisions/SKILL.md) record settled choices and their history. The
current workflow ownership is [org-0006](skills/org-decisions/records/org-0006-developer-tooling-lives-in-tooling.md):
shared CI, release and deployment implementations belong in the public `unset-sh/tooling` repository.
`unset-sh/.github` retains organisation metadata, community defaults, workflow-picker templates and its local
metadata checks. Consumers retain small callers, their build/test logic and reviewed pins. This kit records the
decision; caller adoption, signer verification and automatic update delivery change through their own reviewed work.

[Org-0005](skills/org-decisions/records/org-0005-ai-working-material-lives-in-agent-kit.md) keeps AI working
material here, grouped by task, instead of adding ad hoc Markdown to consuming repositories. Maintained
human documentation belongs in its owning repository's `docs/`, follows the `org-documentation` standard,
and exports through the documentation pipeline to `unset-sh/docs` for publication. A README can introduce
and link those guides. This rule does not start a bulk move or deletion of historical files. The bundle's
existing allowlist excludes `notes/` and `artifacts/`.

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

**Adopt it** (once per repository), with `sync.mjs` downloaded from a
[release](https://github.com/unset-sh/agent-kit/releases) into a temporary folder:

```sh
node /path/to/downloaded/sync.mjs 0.1.0
```

**Check the copy** in the repository's CI. It needs no network and fails when a kit file was edited by hand,
is missing, or when a file was added under the kit's names:

```sh
node .claude/agent-kit/sync.mjs --check
```

**Take a newer release** on a branch, then open a pull request. It is reviewed and merged like code:

```sh
node .claude/agent-kit/sync.mjs 0.2.0
```

If the download is blocked, fetch `agent-kit.json` from the release page another way and add
`--from <path to agent-kit.json>`.

To change a rule or a skill, change it here. The copy in a repository is never edited.

## What `sync.mjs` will and will not do

- It writes only under `.claude/rules/org/`, `.claude/skills/org-*/`, `.claude/agents/org-*.md` and
  `.claude/agent-kit/`. Where a file lands is decided by fixed rules in the script, never by the release.
- It refuses a release whose name, version, commit or any file's sha256 does not check out, and any path
  outside those names.
- It refuses to write through a symbolic link.
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
