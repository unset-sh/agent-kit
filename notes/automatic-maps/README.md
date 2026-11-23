# Automatic map maintenance

Alex, 2026-11-22: the code is the source of truth; routine derived map updates
must not need another owner approval. Every maintained map should refresh
automatically where extraction is possible, including workflow maps and the
organisation profile.

Existing implementation: tooling has the shared JSON map refresh runner; docs
PR 6 registers organisation and workflow maps for hourly/main/manual publication.
Agent-kit PR 12 supplies the general maintenance rule. Both were independently
reviewed and merged after Alex explicitly approved both PRs. The docs publication
run 45088594181 passed on merged revision bf11b83aa3239efc68f868d1f9357e7648f3ae80.

## Design

Use the existing shared runner for the website. For GitHub's committed Markdown
views, add a narrow tooling workflow for unset-sh/.github. Its read-only job
checks out an exact main revision, regenerates MAP.md and the marked profile
block, runs checks, and stages those two outputs. An isolated publisher uses only
trusted tooling code, verifies the source revision and unchanged authored README
text, and creates and merges a generated-only PR. It never changes protections
or bypasses a refused merge. Generation or validation failure retains the existing
main/profile output. The merge API does not atomically guard the base: a concurrent
source change after the final check can leave a stale view until a successful
current-main scheduled or manual refresh.

Keep ownership, plans and explanatory text in their reviewed declarations.
Automatically reflecting declarations is distinct from inventing them from code.
Workflow relationships continue to be extracted from actual committed YAML.
The existing public-metadata drift report remains an explicit signal for facts
that the curated organisation source has not adopted.

Rejected approaches: a second site refresh system duplicates the merged runner;
direct pushes to main violate delivery rules; executing source-repository scripts
with a write token unnecessarily widens the publisher's authority.

## Implementation plan

- [x] Inventory existing maps, sources and related unmerged work.
- [x] Independently review docs 6 and agent-kit 12 and run their checks.
- [x] Test and implement a publisher restricted to two generated Markdown files.
- [x] Add the isolated reusable workflow and verify its permission/artifact guards.
- [ ] Install the exact reviewed caller in .github; regenerate during checks so
      authors can change source data without a separate output-maintenance step.
- [x] Document source ownership, recovery and the generated-only approval exemption.
- [ ] Review each implementation diff, open PRs, and verify live publication only
      after permitted merges. Report any remaining approval/runtime limits.

No changes are made to the read-only Undefined6799/unset application.

The .github caller remains uninstalled until its reviewed tooling commit lands on
main. The repository currently disables Actions PR creation; enabling that
repository setting is also required. Default token permissions remain read-only,
and only the isolated publisher requests contents and pull-request writes.
