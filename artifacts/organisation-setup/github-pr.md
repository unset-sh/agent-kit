## What changes

Set up `.github` as the organisation's community and automation home. Add default conduct, security, support and accessibility policies; bug, feature, accessibility and question forms; a private vulnerability-report form; and a general inherited pull-request template. Link the profile and contributing guide to the reporting routes.

The existing contribution and DCO rules remain intact. Conduct concerns use GitHub reporting tools, as Alex requested. Vulnerabilities use the affected repository's private-reporting channel when enabled, with the established `security@unset.sh` address as fallback. No funding destination, discussion service, response deadline or accessibility certification is invented. Private vulnerability reporting is now enabled and verified on `unset-sh/.github` only; the custom form activates after merge.

This PR also preserves the shared CI/release implementation from [workflows #1](https://github.com/unset-sh/workflows/pull/1) at `4cdb60eab9d4e8d6f00ffc8521531b56a00a75b4`. Sources live in `ci/`, `releases/` and `automation/`; deterministic generation produces GitHub's flat executable paths and workflow-picker templates. Release helpers and all original 95 tests are retained. The protected owner approval, read-only build and isolated publish job remain unchanged. Version remains `0.0.0`; consumer adoption and first release are separate reviewed steps. The old workflows repository is archived with its history intact.

## Why

Alex requested organisation-wide defaults and central workflows, with AI working material kept in agent-kit and maintained human documentation kept in the owning repository's `docs/` folder. The inherited PR template must work across repositories; workflow-specific review requirements remain in this repository's maintainer instructions.

Merged current `main` at `b3c1b3d` into this owned branch and preserved the live documentation-site facts, source publishing relationships and publishing-key guide. This does not restore the retired app mirror or overwrite other pending branches.

## Validation

- `npm run check`: **152/152 tests pass** on Node 26.12.0 / npm 11.20.0.
- All six community YAML files parse; their used fields, IDs, types and required flags match GitHub's documented schemas. No labels, assignees, project IDs or issue types depend on consumer setup.
- Independent review found no blockers in community defaults, forms, inheritance explanations or reporting routes.
- actionlint 1.7.12 passes with the existing narrow exception for documented job identity properties missing from that version's type definition.
- Hosted [CI](https://github.com/unset-sh/.github/actions/runs/45047565115), [org-map](https://github.com/unset-sh/.github/actions/runs/45047565075) and [docs-export](https://github.com/unset-sh/.github/actions/runs/45047565083) pass at `a364702ca70ce6b8de4c28de233613a6ea47f420`.
- The exact documentation export passes the current docs framework's 176 Node tests, 19 Python tests and workflow/map checks; the local production build verifies 16 HTML pages and assets. One existing test falsely matches `/private` in local stack paths; the unchanged source passes from a clean checkout outside that path.
- Diff checks pass. Native GitHub form rendering and inheritance require verification after these files reach the default branch. No live release or consumer adoption is claimed.

## Documentation

Public explanations and workflow contracts live in `docs/site/`, including the organisation-defaults guide and the existing publishing-key guide. The committed-tree exporter retains the licence and file hashes. [Docs #2](https://github.com/unset-sh/docs/pull/2) imports only `github/` from source `a364702ca70ce6b8de4c28de233613a6ea47f420`; the website framework is already live, but this additional section is still under review.

AI notes, review evidence and export snapshots are in [agent-kit #8](https://github.com/unset-sh/agent-kit/pull/8). Reconcile its accepted decision imports and documentation-standard PR #7 before releasing that kit. Preserve current map facts when reconciling `.github` #3 and #9; #2's profile work remains separate.

GitHub contracts checked 2026-11-22: [default community files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file), [form schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema), [private reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository), [reporting conduct](https://docs.github.com/en/communities/maintaining-your-safety-on-github/reporting-abuse-or-spam), and [reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).

Merging remains the owner's action. Organisation defaults do not automatically configure other repositories' permissions, code ownership, licences or workflows.
