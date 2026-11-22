# unset.sh organisation rules

These rules hold in every unset.sh repository. They are a copy of `rules/org.md` in `unset-sh/agent-kit`: change
them there, never in this copy. A repository's own `CLAUDE.md` adds its own rules and names any exception.

## Licence

- Everything written for unset.sh is AGPL-3.0-only. Work we use from others keeps its own licence.
- The only exceptions are the ones a repository's `CLAUDE.md` names.
- Never change the licence of anything already published without the owner's decision.
- The copyright line is `Copyright (c) 2026 Alex (Undefined6799)`.

## The owner

- The owner is named only as "Alex" or by the GitHub login `Undefined6799`. Their surname never appears: not in
  code, docs, commits, licence lines or package metadata.

## Repositories

- One job per repository. The map of every repository is
  <https://github.com/unset-sh/.github/blob/main/MAP.md>. Read it before moving work between repositories or
  starting work that might belong elsewhere.
- Repositories meet only through pinned versions: a package at an exact version, a release asset, or a full
  commit while no release exists. A copy of another repository's files is allowed only when it is pinned and a
  check proves it still matches.
- For missing shared design tokens or brand assets, follow `org-brand-request`: open or update a concrete
  request in `unset-sh/brand` issues. The requester/provider handoff instructions live in agent-kit.
- Never create, rename, archive or change the visibility of an organisation repository without the owner's
  approval for that repository.
- When a change adds, removes or moves a responsibility, or changes what a repository uses or ships, update
  `repos.json` in `unset-sh/.github` in the same piece of work.
- Do not design a new repository around the current app (`Undefined6799/unset`). The app will be largely
  rewritten and connected to the organisation's repositories afterwards.

## Decisions

- Organisation decisions live in agent-kit, in the skill `org-decisions`; read it before changing an
  organisation-wide decision. Never add or edit an ADR in the app repository for organisation work.
- An accepted decision record is never edited, only superseded by a new one.
- Store all AI working plans, drafts, task notes and review reports only in `unset-sh/agent-kit:notes/<task>/`,
  and supporting artifacts only in `artifacts/<task>/` there, outside the kit (org-0005), never across repos.
- Maintain human docs in their owner's `docs/`, follow `org-documentation`, and export to `unset-sh/docs`.
  A docs folder is not storage for AI working material. This rule does not authorise bulk moves or deletions.

## Releases

- A release is published only after the owner approves it in the `release` environment. Never bypass, remove or
  weaken that approval, and never move or reuse a release tag. A bad release is fixed by a new version.
- Pin dependencies to exact versions and GitHub Actions to full commit SHAs.
- A new version of an `@unset-sh` package may be taken at once. Third-party packages keep the 7-day wait.

## Keys, tokens and secrets

- Assistants never create, read, copy, place or rotate a deploy key, a private key or a token that can write.
  The owner does that by hand. A read-only token used only to pull packages is fine.
- Secrets and personal data never appear in code, logs, commits, pull requests or chat.
