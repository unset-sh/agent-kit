# agent-kit

Shared rules, skills and templates for AI assistants working on unset.sh.

Every unset.sh repository is worked on by AI assistants. This repository holds what all of them need to know,
whatever repository they are in, and gets it to them as a pinned copy that each repository's CI checks.

## What is in it

| Folder | What it holds | In a repository it becomes |
| --- | --- | --- |
| [`rules/`](rules/) | The organisation's rules, how to work, and the engineering principles in short. Loaded at the start of every session, so kept to 150 lines in total | `.claude/rules/org/` |
| [`docs/`](docs/) | Human guides maintained here for export to the documentation website | The `agent-kit/` website section; not part of the installed kit |
| [`skills/`](skills/) | Procedures for jobs that repeat across repositories and organisation decision records, read when needed | `.claude/skills/org-*/` |
| [`sync.mjs`](sync.mjs) | Installs the kit at one commit of `main` in a repository and checks the copy. Node built-ins and git only | `.claude/agent-kit/sync.mjs` |
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
human documentation belongs in its owning repository's `docs/` and exports through the documentation
pipeline to `unset-sh/docs` for publication; the shared `org-documentation` standard is not released yet.
A README can introduce and link those guides. This rule does not start a bulk move or deletion of historical files. `sync.mjs`
installs only `rules/`, `skills/`, `agents/` and itself, so `notes/` and `artifacts/` never reach a repository.

For missing shared design tokens or brand assets, use [brand requests](skills/org-brand-request/SKILL.md).
The organisation rule sends concrete requests to `unset-sh/brand` issues; the shared handoff stays here.
[`AGENTS.md`](AGENTS.md) and its [consumer template](templates/AGENTS.md) point to the relevant source or
installed files. This is a procedure for assigned agents, not a running queue monitor.

For repository, workflow and other maintained maps, follow [map maintenance](skills/org-map-maintenance/SKILL.md).
Maps use authoritative sources and automatic shared-tooling refresh; their ownership claims and explanations
still need review. The skill describes registration, provenance, freshness and recovery without claiming an
integration is active before its consumer verifies it.

## Review an experience

[`org-experience-review`](skills/org-experience-review/SKILL.md) coordinates seven independent perspectives
on clarity, competence, autonomy, trust, expression, comfort and satisfaction. The coordinator combines
observed strengths and gaps with separately labelled questions for later human testing. Smaller models
may be used after capability checks; model comparisons keep tasks and conditions matched.

Start with the [human overview](docs/experience-review.md) or the [run guide](docs/running-an-experience-review.md).
The skill and its perspective prompts ship with each commit of `main`. A repository gets them when it takes a newer
commit; their presence here does not update repositories that already hold an older one.

## Human documentation

The public source is [`docs/`](docs/); its export destination is `agent-kit/` in `unset-sh/docs`.
Pages use the documentation site's source format and keep local links inside that exported tree.
The docs are AGPL-3.0-only, like this repository, and `sync.mjs` never installs them.

The documentation site discovers the section from `_index.md`. Agent-kit has no automatic documentation
export caller yet. Export must preserve the source revision, page provenance and licence notices.
Shared workflow implementations belong in `unset-sh/tooling` (org-0006); this change adds no publisher or
credentials.

## How a repository uses it

A repository commits a copy of the kit as it is at one commit of `main` under `.claude/`. The file
`.claude/agent-kit/lock.json` records that commit and a sha256 for every copied file. The kit has no
releases: it is the assistants' shared memory, and assistants manage it. Every change reaches `main` through a
pull request reviewed by a thread other than its author. A repository takes a newer commit in a pull request
of its own, so a change is reviewed twice before it steers an assistant there: here, and in that repository.

A committed copy is used because it is the only form every kind of session loads. Claude Code loads a
repository's `CLAUDE.md`, `.claude/rules/` and `.claude/skills/` from the clone, in cloud and local sessions
alike. It does not install plugins a repository declares in a cloud session, and a plugin cannot carry rules
that are always loaded. (Claude Code documentation, read 2026-11-21:
[what cloud sessions carry over](https://code.claude.com/docs/en/cloud-environments#what-carries-over-from-your-setup),
[what project threads pick up](https://code.claude.com/docs/en/claude-projects#what-threads-pick-up-from-your-repositories),
[plugin reference](https://code.claude.com/docs/en/plugins-reference).)

**Pick the commit**: the newest commit of `main`, unless there is a reason to stay behind.

```sh
git ls-remote https://github.com/unset-sh/agent-kit.git refs/heads/main
```

**Adopt it** (once per repository): clone the kit into a folder outside the repository, check that the commit
is on `main` before running anything from it, then install:

```sh
git clone https://github.com/unset-sh/agent-kit.git /path/to/agent-kit
git -C /path/to/agent-kit merge-base --is-ancestor <commit> origin/main && echo "on main"
git -C /path/to/agent-kit -c advice.detachedHead=false checkout <commit>
node /path/to/agent-kit/sync.mjs <commit>
```

**Check the copy** in the repository's CI. It needs no network and fails when a kit file was edited by hand,
is missing, or when a file was added under the kit's names. It compares the copy with the lock beside it, so it
catches accidents, not intent: someone who edits a kit file and its lock together passes it. Catching that
needs a check outside the repository that compares each copy with the kit at the commit its lock names:

```sh
node .claude/agent-kit/sync.mjs --check
```

**Take a newer commit** on a branch, then open a pull request. It is reviewed and merged like code. Read what
changed first (`CHANGELOG.md` and `git log <old>..<new>` here), then:

```sh
node .claude/agent-kit/sync.mjs <new commit>
```

The full steps are in the skill `org-kit-update`.

To change a rule or a skill, change it here. The copy in a repository is never edited.

## What `sync.mjs` will and will not do

- It writes only under `.claude/rules/org/`, `.claude/skills/org-*/`, `.claude/agents/org-*.md` and
  `.claude/agent-kit/`. Where a file lands is decided by fixed rules in the script, never by what it fetches.
- It takes only a full 40-character commit id, fetches `main` from `https://github.com/unset-sh/agent-kit.git`
  with git (another repository, over https or a local path, only with `--from`), and refuses a commit that is
  not on that `main`. git runs with no prompts, no hooks, object checks on, and no other transport. A full
  commit id names exactly one tree, so the pin is the content, and an unmerged branch cannot be installed.
- It copies only regular files from that tree, and refuses a link, a submodule or any path in a shipped folder
  that the kit may not ship.
- It refuses to read or write through a symbolic link.
- It never touches a repository's own `CLAUDE.md`, rules, skills, subagents or settings.

## Working on this repository

```sh
npm run check
```

Node 26 (see `.nvmrc`), no dependencies.

## Licence

AGPL-3.0-only. See [`LICENSE`](LICENSE). Copyright (c) 2026 Alex (Undefined6799).
