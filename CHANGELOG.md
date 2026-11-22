# Changelog

Each entry says what changes for a repository that takes the release, in plain words. The release page shows
the entry of its version.

## Unreleased

Combine this entry with the other pending changes and choose the version when preparing the release.

- Add the `org-decisions` skill and preserve accepted records org-0001 to org-0003 from the pending
  decision-record work. Mark org-0003 superseded and add org-0004: organisation workflow implementations
  move to `unset-sh/.github`, grouped by purpose with committed generated GitHub entry points.
- Point current ownership and the organisation rule to those records. This change does not migrate
  callers, change release verification, publish a kit release or retire the old repository.

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
