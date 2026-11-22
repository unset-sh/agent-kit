# unset.sh organisation rules

These rules hold in every unset.sh repository. They are a copy of `rules/org.md` in `unset-sh/agent-kit`: change
them there, never in this copy. A repository's own `CLAUDE.md` adds its own rules and names any exception.

## Licence

- The owner sets each repository's licence and decides any change to a published one; where none is set, ask.
  Product repositories are AGPL-3.0-only and take no outside code for now. Others' work keeps its own licence.
- Work made to be copied stays permissive (`profile-recipes` recipes CC0-1.0, lexicon schemas MIT) and takes
  outside work with a DCO sign-off only. Propose no contributor licence agreement or other signing step.
- The copyright line is `Copyright (c) 2026 Alex (Undefined6799)`.

## The owner

- The owner is named only as "Alex" or by the GitHub login `Undefined6799`. Their surname never appears: not in
  code, docs, commits, licence lines or package metadata.

## Repositories

- One job per repository. The map of every repository is
  <https://github.com/unset-sh/.github/blob/main/MAP.md>. Read it before moving work between repositories or
  starting work that might belong elsewhere.
- What one repository takes from another comes at a pinned version: a package at an exact version, a release
  asset, or a full commit while no release exists. A copy is allowed only when it is pinned and a check proves
  it still matches. The pushes the map records (docs into `unset-sh/docs`, the lexicon mirror) are exceptions.
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
- Keep AI plans, working notes and review reports in `unset-sh/agent-kit` under `notes/<task>/`, and their
  supporting artifacts under `artifacts/<task>/`; neither folder ships in the kit (org-0005).
- Put maintained human documentation in its owner's `docs/`, follow `org-documentation`, and export it
  through the documentation pipeline to `unset-sh/docs`. Keep ad hoc AI task/design/review Markdown out
  of consuming repositories; do not infer a bulk move or deletion of historical files.

## Releases

- A release is published only after the owner approves it in the `release` environment. Never bypass, remove or
  weaken that approval, and never move or reuse a release tag. A bad release is fixed by a new version.
- Pin dependencies to exact versions and GitHub Actions to full commit SHAs.
- A new version of an `@unset-sh` package may be taken at once. Third-party packages keep the 7-day wait.

## Keys, tokens and secrets

- Assistants never create, read, copy, place or rotate a deploy key, a private key or a token that can write.
  The owner does that by hand. A read-only token used only to pull packages is fine.
- Secrets and users' personal data never appear in code, logs, commits, pull requests or chat.
