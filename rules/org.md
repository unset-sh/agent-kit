# unset.sh organisation rules

These rules hold in every unset.sh repository. They are a copy of `rules/org.md` in `unset-sh/agent-kit`: change
them there, never in this copy. A repository's own `CLAUDE.md` adds its own rules and names any exception.

## Licence

- Licence is set per repository, and the owner sets it. Product repositories are AGPL-3.0-only and take no
  outside code for now.
- Work made to be copied stays permissive: the recipes in `profile-recipes` are CC0-1.0 and the lexicon schemas
  are MIT. Those two take outside work with a DCO sign-off only.
- There is no contributor licence agreement. Do not propose one, or any other signing step.
- Where the owner has not set a licence, say so and ask. Work we use from others keeps its own licence.
- Never change the licence of anything already published without the owner's decision.
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

- Organisation decisions are records in `unset-sh/agent-kit`, carried here as the skill `org-decisions`. Read
  it before deciding anything organisation-wide. Never use the app repository's ADRs for organisation work.
- An accepted decision record is never edited, only superseded by a new one.

## Releases

- A release is published only after the owner approves it in the `release` environment. Never bypass, remove or
  weaken that approval, and never move or reuse a release tag. A bad release is fixed by a new version.
- Pin dependencies to exact versions and GitHub Actions to full commit SHAs.
- A new version of an `@unset-sh` package may be taken at once. Third-party packages keep the 7-day wait.

## Keys, tokens and secrets

- Assistants never create, read, copy, place or rotate a deploy key, a private key or a token that can write.
  The owner does that by hand. A read-only token used only to pull packages is fine.
- Secrets and users' personal data never appear in code, logs, commits, pull requests or chat.
