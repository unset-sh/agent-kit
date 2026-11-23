# Organisation architecture implementation plan

Date: 2026-11-22. Approved direction: org-0007. Current tooling authority: org-0006.
This plan applies the full org-principles architecture sections on small contracts, progressive refinement,
runtime adapters and meaningful enforcement, plus change-management guidance on stored data and public APIs.

## 1. Establish the organisation foundation now

- Record org-0007, this synthesis and the dated artifact set in agent-kit. Update the decision index and
  pending kit version/changelog; run the full check and review the diff. Publish only through the normal
  later kit release process and owner approval.
- Update `.github`'s source catalog and generated map. Replace the proposed server-kit entry with backend,
  remove the uncreated standalone messaging proposal, and give backend, web and deployment their approved
  responsibilities. Keep mobile future and presentation's existing name.
- Establish the approved repositories with clear boundaries, local rules and minimal usable foundations.
  Do not fill them with speculative layers or call a scaffold a running API. Record creation, source revision
  and verification evidence separately from release and adoption.
- Reconcile the catalog with existing tooling. Tooling is implemented but unreleased; retain org-0006 and
  verify its actual caller/release state. PR #6 merged during this task, and the refreshed `.github` baseline
  is `3666555`; preserve its pinned callers. Keep docs-site framework changes outside this task.

Completion evidence: reviewed decision and map agree; existing versus proposed versus newly created
repositories are identified accurately; foundation checks pass; no change to the original app, live data,
secret handling, release approvals or production topology is implied.

## 2. Prove the first backend/client contract

Choose one representative profile operation. Separate the current route-owned contract, form parsing,
redirect behavior and provider-specific outcomes. Specify its product meaning, input/output, authorization,
errors, retry/idempotency, concurrency and support expectations. Decide which definitions are public and
which are private backend ports.

Implement the operation and adapter in the isolated destination, with a real web consumer and observable
behavior checks. Preserve relevant existing fixtures; translate path-based rules to the new structure and
prove they scan actual files and still reject forbidden dependencies. Keep existing independently privileged
processes distinct. Review the actual server/client session and credential flow before any live use.

Completion evidence: provider and consumer demonstrate the same supported behavior, negative contract cases
fail for meaningful reasons, server authorization remains authoritative, and API details are not inferred
from a green build or shared TypeScript declarations.

## 3. Adopt shared products independently

- **Brand:** map semantic tokens, assets, fonts and icon shapes into real web/PDS/rendering adapters. Preserve
  provenance and visual/behavioral checks; a new token is not automatically used by existing screens.
- **Lexicons:** agree the authoritative version and source/release cutover. Publish reproducible schema and
  validator artifacts, compare read/write behavior and preserve allowed extensions. Keep product editor
  policy and scope selection with their application owner.
- **Rendering:** use existing presentation through a verified versioned API for a concrete output. Do not
  rename the repository or claim an app renderer was extracted when none was found.
- **Tooling:** adopt a reviewed immutable release through real caller checks. Keep product-local policy and
  fixtures; identify subprocess/build-path dependencies before extracting a script. Reconcile the existing
  tag-triggered org-release instructions with tooling's main-triggered protected publication contract before
  release adoption. Preserve working existing release flows; do not broaden owner-managed protection to
  accept both paths simply to avoid the decision.

Completion evidence: supported artifact/version pairs and representative consumer results, previous working
versions and recovery route, authoritative catalog updates and removal of redundant authoring only after
successful cutover. Do not roll stored data back destructively to match an older consumer.

## 4. Assemble deployment from released components

Producers own their images, migrations and configuration/run contracts. Deployment selects immutable images
and coordinates environment topology, storage/network configuration, migrations and readiness. PDS retains
its component packaging owner; Tap integration remains explicit future work until selected and verified.
The AppView/indexer distinction is a responsibility model, not a demand to add another process or database.

Test coexistence, failures and forward recovery for the specific supported versions. Preserve source
attestation, required checks, privileged roles and owner approval gates. No credential creation, production
cutover or protection weakening is authorized by repository creation alone.

## 5. Enable complete automatic propagation

Register actual consumers and release lines. Exercise immutable producer release → dependency update →
consumer checks → eligible merge → build → required delivery, including failure reporting and the actual
downstream event path. Distinguish expected, proposed, merged, built and delivered versions. Retry safely,
retain last-known-good artifacts and stop affected dependents when an upstream compatibility check fails.

Future mobile support must account for installed older clients. Separate source/client-library updates from
distribution and installation. Revisit a boundary when ordinary changes repeatedly require lockstep releases.
