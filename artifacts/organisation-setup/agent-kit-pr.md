Record Alex's 2026-11-22 decisions: organisation workflows belong in `unset-sh/.github`; AI working notes and artifacts belong in agent-kit; maintained human documentation belongs in its owner's `docs/` folder, follows the organisation documentation standard, and exports to `unset-sh/docs` for publication.

Preserve org-0001 and org-0002 from #6 and org-0003's original text, marking only its status superseded by org-0004. Add org-0005 for documentation ownership. Update the existing rules, ownership guide, decision index and changelog. Keep version 0.1.0; this does not release the kit or update installed consumers.

Migration and organisation-setup working notes, validation logs and pinned documentation snapshots are under `notes/` and `artifacts/`. They are excluded from the installable bundle. The follow-up setup record includes Alex's choice to use GitHub reporting tools for conduct reports, the verified existing security mailbox, the `.github` private-reporting enablement and native GitHub form/adoption limits. No bulk move or deletion of other repositories' existing documentation is included.

Related implementation: [organisation setup and workflow PR #6](https://github.com/unset-sh/.github/pull/6). Human documentation import: [docs PR #2](https://github.com/unset-sh/docs/pull/2), draft pending source review. The docs website framework is already live; this is an additional section. The old workflows repository is archived with its PR and history intact.

Validation: **46 kit tests pass** on Node 26.12.0; shared rules stay within the 150-line limit. Bundle inspection confirms accepted rules and decisions ship while actual notes and artifacts do not. Source workflow checks pass 152 tests and hosted CI. The updated docs import passes 176 Node tests, 19 Python tests and its production build. All detailed evidence belongs in the task directories, not the kit bundle.

Reconcile the accepted-record import in #6 and `org-documentation` skill in #7 before the next release so the named standard ships with its ownership rule. Merging and release remain the owner's actions.
