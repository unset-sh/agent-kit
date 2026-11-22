## What changed

Make `.github` the home of organisation automation. Authored workflows live in `ci/`, `releases/` and `automation/`; deterministic generation commits GitHub's required flat `.github/workflows/` entry points. `templates/` supplies the workflow picker. `pages/`, `deployments/` and `code-scanning/` are supported when their first workflow moves.

Preserve the unpublished check/release implementation from [workflows #1](https://github.com/unset-sh/workflows/pull/1) at `4cdb60eab9d4e8d6f00ffc8521531b56a00a75b4`, including its helpers and all 95 tests. Repository and signer paths change; main-only release, protected owner approval, read-only build and publish isolation remain intact. Existing organisation-map automation is preserved. Version stays `0.0.0`.

Human guides live in `docs/site/`. A read-only workflow exports their exact committed tree, licence and hashes for import into `unset-sh/docs:github/`. Working notes and artifacts live in agent-kit. Export packages documentation; website publication remains part of docs #1's separate cutover.

## Where it came from

Alex approved consolidation, retirement of the separate workflows repository, and the split between agent working material and maintained human documentation on 2026-11-22. Category sources plus generated entry points respect [GitHub's reusable-workflow rule](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows) and [template contract](https://docs.github.com/en/actions/how-tos/reuse-automations/create-workflow-templates), using [starter-workflows](https://github.com/actions/starter-workflows) as the catalogue reference.

## Validation

- `npm run check`: **152 tests pass** on Node 26.12.0 / npm 11.20.0, including generation/map freshness, preserved release refusals and export boundaries.
- actionlint 1.7.12 passes. Its only suppression covers documented `job.workflow_repository` and `job.workflow_sha` properties missing from that version's job type; runtime identity checks remain intact.
- Exact documentation export from `b998c0ac303fa32b1752908ef58cb25968e4061a` renders against docs framework `0d8d3ad903dd42718d0168e97836baaef8deb769` with Hugo 0.168.0. Output validation checks nine HTML pages and local assets.
- Independent review found and resolved Renovate source matching; no remaining blockers found. Diff checks pass.

No live release or cross-repository adoption is claimed. First-release settings and attestation behavior remain listed in the release reference. Templates require a real reviewed release commit before installation. Existing consumers retain their workflows until reviewed adoption preserves each repository's checks and outputs.

## Reconciliation

Keep this ownership change when reconciling map PRs #3 and #5. The agent-kit companion preserves accepted decisions and supersedes the old workflow hosting choice; the documentation standard remains in agent-kit #7. The old workflows repo had no releases or default-branch callers. It is now archived after this replacement became accessible, preserving its original PR and history. The map records the confirmed archived state. The documentation import is [docs #2](https://github.com/unset-sh/docs/pull/2).

## Checklist

- [x] `npm run check` passes
- [x] Caller-visible migration recorded under `CHANGELOG.md` → Unreleased
- [x] Release trigger, permissions, approval and publish gates preserved
- [x] No stored secret added; expression values reach shell commands through environment variables
- [x] Generated output, map and human documentation updated together

Merging and first-release approval remain the owner's actions.
