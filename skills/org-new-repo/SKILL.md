---
name: org-new-repo
description: Set up a new repository in the unset-sh organisation after the owner approved it. Use when a plan for a new repository is approved, when an empty organisation repository needs its first pull request, or to check that an existing repository has everything a repository needs.
---

# Set up a new organisation repository

## Before anything exists

1. The owner approves this repository by name. Approval of one repository never covers another. The owner
   creates it, or says who does.
2. The repository has one job. Write down what belongs in it, what does not and where that goes instead.
   If you cannot, the repository is not ready to exist.
3. Add it to the map: a pull request on `unset-sh/.github` that adds the entry to `repos.json` and runs
   `npm run map`. Cloud sessions cannot attach a repository whose name starts with a dot, so that change goes
   through the owner's machine or the thread that maintains the map.

## The first pull request

Keep it to what the repository needs on day one. Folders appear with their first file.

| File | Content |
| --- | --- |
| `README.md` | What the repository is, what belongs here and what does not, how to use what it ships, how to run its checks |
| `LICENSE` | The AGPL-3.0 text, unless the repository's `CLAUDE.md` names an exception the owner decided |
| `CLAUDE.md` | From the kit's `templates/CLAUDE.md`: the "Where this repository fits" section filled from the map entry, then this repository's own rules |
| `AGENTS.md` | From the kit's `templates/AGENTS.md` |
| `.claude/` | The kit's copy, installed with the skill `org-kit-update` (first adoption) |
| Manifest | The licence field, exact dependency versions, and one `check` command that runs every check |
| `.github/workflows/ci.yml` | Runs the `check` command and `node .claude/agent-kit/sync.mjs --check` on every pull request and on `main` |
| `.github/pull_request_template.md` | What changed, where it came from, a short checklist |

Workflow rules: `permissions: {}` at the top and the least each job needs; every action pinned to a full
commit SHA with the version in a comment; `persist-credentials: false` on checkout; a timeout on every job.
Copy pins from a repository whose CI is green, and read the action's release notes before raising one.

## After the first merge

4. Ask the owner to protect `main` with a ruleset: pull requests only, squash merges, no force pushes or
   deletion, and the CI check required. Assistants do not change repository settings.
5. If the repository releases anything, ask the owner for the `release` environment, then follow the skill
   `org-release`.
6. Human docs live in the repository's `docs/` folder. Wiring it to docs.unset.sh needs a deploy key, which
   the owner places.
7. Update the map entry from planned or proposed to active, and check its description matches GitHub's.
