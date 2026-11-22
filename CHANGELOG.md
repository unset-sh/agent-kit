# Changelog

Each entry says what changes for a repository that takes the release, in plain words. The release page shows
the entry of its version.

## Unreleased

The pending changes below are prepared as version 0.2.0. No release is published by preparing these notes.
Org-0007 adds the owner-approved backend, web and deployment direction and records this architecture chat.

## v0.2.0

Prepared, not published. A repository that takes this release gains the following changes:

- Add org-0007: separate backend, web and deployment through small capability contracts and
  runtime-appropriate adapters. Replace the proposed server-kit entry with backend and remove the
  standalone messaging proposal; neither proposal was an existing repository to rename or delete.
  Preserve tooling ownership under org-0006 and existing release controls. Product migrations, API
  implementations, consumer adoption and production delivery remain separate work.
- Preserve the architecture chat synthesis, plan, status ledger and dated research under notes and
  artifacts. These task-specific files stay outside the distributed kit; the accepted decision ships.

- Add the `org-decisions` skill and preserve the accepted history in org-0001 to org-0004. Org-0003's
  separate workflows repository was superseded by org-0004's `.github` ownership; org-0006 now supersedes
  that implementation placement with the public `unset-sh/tooling` repository.
- Point current ownership to org-0006: shared CI, release and deployment implementations, helpers and
  tests live in tooling. `.github` retains organisation metadata, community defaults, workflow-picker
  templates and local metadata checks. Consumers keep small callers, build/test logic and reviewed pins.
  This kit change does not migrate callers, change signer verification, enable automatic adoption or
  publish a release. Existing owner release approvals remain required.
- Add org-0005: keep AI plans, notes and review reports in agent-kit under `notes/<task>/`, and supporting
  artifacts under `artifacts/<task>/`, outside the distributed kit. Maintained human docs belong in the
  owning repository's `docs/`, follow `org-documentation`, and export to `unset-sh/docs` for publication.
  Historical files are not moved or deleted by this rule alone.

## v0.1.0

The first release. A repository that takes it gains:

- **Organisation rules** (`.claude/rules/org/org.md`): the licence rule, how the owner is named, how
  repositories meet, where decisions go, how releases are approved, and who handles keys and tokens.
- **Working rules** (`.claude/rules/org/working.md`): current documentation before memory, challenging a
  decision with evidence, no security shortcuts, branch and pull request habits, and when to stop and ask.
- **Engineering principles, in short** (`.claude/rules/org/principles.md`), with the three full documents in
  the skill `org-principles`.
- **Skills**: `org-new-repo` (set up a repository), `org-release` (prepare a release for approval) and
  `org-kit-update` (take a newer kit release).
- **`sync.mjs`** and its lock file under `.claude/agent-kit/`, which install a release and check the copy.

Remove from the repository's own `CLAUDE.md` any rule these files now state.
