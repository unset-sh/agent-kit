# Changelog

Each entry says what changes for a repository that takes the release, in plain words. The release page shows
the entry of its version.

## v0.2.0

Proposed next release; not published. Release preparation must consolidate this entry with the changes in
pending pull requests #7, #9, #11 and #12, which also propose v0.2.0. This work does not publish a release or
update consuming repositories.

- Add the `org-decisions` skill and preserve the accepted history in org-0001 to org-0004. Org-0003's
  separate workflows repository was superseded by org-0004's `.github` ownership; org-0006 now supersedes
  that implementation placement with the public `unset-sh/tooling` repository.
- Point current ownership to org-0006: shared CI, release and deployment implementations, helpers and
  tests live in tooling. `.github` retains organisation metadata, community defaults, workflow-picker
  templates and local metadata checks. Consumers keep small callers, build/test logic and reviewed pins.
  This kit change does not migrate callers, change signer verification, enable automatic adoption or
  publish a release. Existing workflows retain their approval requirements until the separate delivery-policy
  cutover is completed.
- Add org-0005: keep AI plans, notes and review reports in agent-kit under `notes/<task>/`, and supporting
  artifacts under `artifacts/<task>/`, outside the distributed kit. Maintained human docs belong in the
  owning repository's `docs/`, follow `org-documentation`, and export to `unset-sh/docs` for publication.
  Historical files are not moved or deleted by this rule alone.
- Use applicable approved Google AIPs for API design and review, with the governing protocol taking
  precedence. Cite the guidance and supported versions, review source, wire and semantic compatibility,
  and let private interfaces evolve with their consumers.
- Document the target delivery model: `staging` is the default integration branch, where assistants may
  review and merge changes after the required checks. Promotion to `master` is the human approval for
  production; stable release automation follows that promotion without a second human approval.
- Distinguish human authorization from the GitHub account used by a tool. Sharing an account does not
  authorize an assistant to perform the human-only production promotion.
- Define automatic staging prereleases separately from stable releases, so staging changes can be tested
  without publishing them as production releases.
- Require PRs to declare independent or dependent readiness, identify prerequisites and published artifacts,
  and leave staging working and releasable at every merge. Use the canonical PR labels from `unset-sh/.github`;
  dependencies and labels do not waive required checks or production promotion rules.
- These are documented policies. Workflow changes, repository defaults, protections and release settings
  still await a coordinated cutover; this change does not activate that automation.

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
