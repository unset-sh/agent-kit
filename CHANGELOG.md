# Changelog

Each entry says what changes for a repository that takes the release, in plain words. The release page shows
the entry of its version.

## v0.2.0

- Add `org-experience-review` and seven specialist perspectives for reviewing how design supports clarity,
  competence, autonomy, trust, expression, comfort and satisfaction. Reports separate observed behaviour
  from emotional hypotheses and questions for later human testing.
- Add source-owned human guides in `docs/`, prepared for export to the documentation site's `agent-kit/`
  section. They are not installed under `.claude/`; an automatic docs export caller is not configured.

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
