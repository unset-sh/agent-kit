# Workflow consolidation

Alex approved `unset-sh/.github` as the home of organisation automation on 2026-11-22. Workflow sources are grouped
by purpose, like GitHub's starter-workflows catalogue; generated entry points satisfy GitHub's flat path rules.

## Preserved implementation

The initial check/release implementation, scripts and all 95 tests come from
[workflows PR #1](https://github.com/unset-sh/workflows/pull/1) at
`4cdb60eab9d4e8d6f00ffc8521531b56a00a75b4`. The move changes its host to `unset-sh/.github`, its check path to
`.github/workflows/ci-check.yml`, and its release/signer path to `.github/workflows/releases-package.yml`.
The original PR and commit remain provenance, not a runtime dependency.

The first port includes the shared check and release, this repository's callers, its existing organisation-map
automation, the generator and starter templates. It does not replace other repositories' working workflows before
there is a reviewed central revision to pin. Version 0.0.0 prevents a release during the initial merge.

## Adoption

No organisation main-branch workflow called `unset-sh/workflows` during the 2026-11-22 inventory. That repository
had only README.md on main, the implementation in PR #1, and no tags or releases. Every existing consumer still
runs its own implementation. Adding reusable workflows here does not activate them elsewhere.

For each consumer, first inventory its triggers, job/check names, installation, outputs and release verifier. Then
replace its orchestration with a small caller pinned to a reviewed, merged central commit. Verify the observed
GitHub check names before changing a ruleset. Keep the old pin for rollback. Update signer verification together
with release adoption, never before it.

Known consumer-specific work:

- brand also installs verified Hugo and checks both root and subpath site builds.
- presentation always renders a gallery, and its package-adoption PR needs GitHub Packages read authentication.
  The initial shared check/release build does not provide that authentication; it is not a drop-in replacement.
- profile-recipes renders recipes and checks contributor DCO sign-offs.
- agent-kit also builds its downloadable bundle and verifies its currently local release signer.
- docs has a pending root-framework cutover; its existing Pages workflow is copied from the external app. Change
  the workflow's authoritative source during that cutover, not only the overwritten destination.

Each of these moves is a focused follow-up with preserved behavior. Pages, container publication and app deployment
sources are added with their migrations; empty categories are not created in advance. Production permissions and
approval rules do not become optional as a result of centralisation.

## Pending proposals to reconcile

- `.github` PRs #3 and #5 must keep the new automation ownership when their maps are regenerated.
- agent-kit PR #6's accepted org-0003 decision is preserved and superseded by a new consolidation decision.
- docs PR #1 must refresh its pinned organisation-map snapshot and its workflow ownership notes after this map lands.
- agent-kit PRs #3 and #4 must retain the current signer until its own release adoption changes it.

Do not rewrite someone else's branch. Reconcile these records in their companion PRs and regenerate map snapshots
from the actual merged revision; never claim a pending snapshot is already deployed.

## Retire the old repository

Preserve the original commit and review history, verify the replacement PR is accessible, and repeat the reference
check. Archive `unset-sh/workflows` rather than delete it, so cited review evidence remains readable. Update its map
entry to archived only after GitHub reports that state. No live consumer pin needs changing for this retirement.

## Sources

- [Reusable workflows and their required flat directory](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Organisation templates and metadata](https://docs.github.com/en/actions/how-tos/reuse-automations/create-workflow-templates)
- [Starter-workflows catalogue](https://github.com/actions/starter-workflows#directory-structure)

Read 2026-11-22. The category-to-entry-point generator is this repository's own organisation choice, not a feature
of GitHub's starter-workflows service.

## Delivery evidence

- Implementation: https://github.com/unset-sh/.github/pull/6; source port dc00d52ce2286c0559e68138c1d84ae2db2cc945 and pinned documentation b998c0ac303fa32b1752908ef58cb25968e4061a.
- Documentation import: https://github.com/unset-sh/docs/pull/2 (draft). Exact source snapshot and hashes are in artifacts/workflow-consolidation/docs-export/.
- GitHub API confirmed unset-sh/workflows archived=true after the replacement PR was accessible. Default-branch code search still found no unset-sh/workflows calls; releases remained empty. Its original PR #1 remains readable.
- The current docs framework at 0d8d3ad903dd42718d0168e97836baaef8deb769 accepts github/ and successfully renders these pages. The import records the explicit .github-to-github section mapping exception; framework policy alignment/cutover remain review prerequisites.
- Validation: 152 tests; actionlint 1.7.12 with only the documented job identity context exception; Hugo 0.168.0 build and output validation of nine HTML pages/assets. Independent review completed with no remaining findings after fixing Renovate source discovery.
- All five action references verified against their official tag refs on 2026-11-22. No stored secrets, deployment or environment settings changed.
- Agent-kit records accepted org-0004 and org-0005. Reconcile its org-documentation skill PR #7 before releasing the kit; no version bump or kit release is included.

The export job produces a read-only artifact, not automatic cross-repository publication. Consumer migrations require their own reviewed calls to a released central commit; the initial shared implementation has no approved release yet.
