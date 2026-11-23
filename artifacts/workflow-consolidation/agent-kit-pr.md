Record Alex's 2026-11-22 decisions: organisation workflows belong in `unset-sh/.github`; AI working notes and artifacts belong in agent-kit; maintained human documentation belongs in its owner's `docs/` folder, follows the organisation documentation standard, and exports to `unset-sh/docs` for publication.

Preserve org-0001 and org-0002 from #6 and org-0003's original decision text, marking only its status superseded by org-0004. Add org-0005 for documentation ownership. Update the existing rules, ownership guide, decision index and changelog. Keep version 0.1.0; this does not release the kit or update installed consumers.

The actual migration notes, validation logs and documentation export snapshot are stored under `notes/workflow-consolidation/` and `artifacts/workflow-consolidation/`. They are excluded from the installable bundle. No bulk migration or deletion of other repositories' existing documentation is included.

Related implementation: [organisation workflow PR #6](https://github.com/unset-sh/.github/pull/6). Published-doc import: [docs PR #2](https://github.com/unset-sh/docs/pull/2), draft pending the docs framework cutover. The original workflows repository is archived, with its PR and history retained.

Validation: **46 tests pass** on Node 26.12.0; shared rule files remain within the 150-line limit. Bundle inspection confirms org-0005 ships while actual notes and artifacts do not. Diff check passes. The workflow implementation independently passes 152 tests and hosted CI.

Reconcile this with the accepted-record import in #6 and with the `org-documentation` skill in #7 before the next kit release, so the named standard ships with the ownership rule. Merging and release remain the owner's actions.
