# Architecture adoption plan

**Status:** Proposed implementation sequence. This document authorizes no repository, workflow, release, or settings changes. Role owners below are responsibilities to assign, not named appointments.

The durable design rules live in [Architecture standard](./architecture-standard.md) and [Multi-repository standard](./multi-repository-standard.md). The desired automation and reusable-platform model is recorded in [Shared platform and automatic adoption](./shared-platform-and-automation.md). This plan turns those rules into incremental work, using the dated audit below as its starting point. Recheck the affected repository and settings before opening implementation work; the snapshot is not a statement about future repository state.

## Baseline: read-only audit, 22 November 2026

The audit inspected remote default-branch code, configuration, and CI metadata. It did not rerun tests, exercise deployed applications, or test live runtime compatibility. The main application outside the organization was not audited.

| Repository | Audited revision |
| --- | --- |
| `.github` | [`b3c1b3d120915b046ec149b5f33de3c6900e9b1e`](https://github.com/unset-sh/.github/tree/b3c1b3d120915b046ec149b5f33de3c6900e9b1e) |
| `docs` | [`301bfd590715653dd14c0c5f44613bb9347245f1`](https://github.com/unset-sh/docs/tree/301bfd590715653dd14c0c5f44613bb9347245f1) |
| `agent-kit` | [`560c5957bdb0d73c79785d40ec881f0b0e7323e4`](https://github.com/unset-sh/agent-kit/tree/560c5957bdb0d73c79785d40ec881f0b0e7323e4) |
| `brand` | [`8c998a2990ae477daf5ac1636028f6cbf379577b`](https://github.com/unset-sh/brand/tree/8c998a2990ae477daf5ac1636028f6cbf379577b) |
| `presentation` | [`f4597ce765007c28c0fd0aadbd3f9f0333939229`](https://github.com/unset-sh/presentation/tree/f4597ce765007c28c0fd0aadbd3f9f0333939229) |
| `profile-recipes` | [`1e64c469f86dd2ad6e9b26200d26e308d6d06f4e`](https://github.com/unset-sh/profile-recipes/tree/1e64c469f86dd2ad6e9b26200d26e308d6d06f4e) |
| `lexicons` | [`52cfb6990f3833e4bdd260cd5bb520fc4446e122`](https://github.com/unset-sh/lexicons/tree/52cfb6990f3833e4bdd260cd5bb520fc4446e122) |

`pds` was empty. `workflows` was archived, with only a README at [`687c9bcc9857965a6c39fc4fcf87c5e3cedfecb1`](https://github.com/unset-sh/workflows/tree/687c9bcc9857965a6c39fc4fcf87c5e3cedfecb1). Neither represents an implemented shared-workflow platform.

### Findings that determine the sequence

1. **Establish supported contract versions before integration.** Recipes use a profile-schema snapshot containing `profile.cards`; the lexicons profile description places cards in a page. Both repositories had successful CI runs, which do not establish compatibility between these versions. Recipes explicitly label their snapshot as draft and disclaim current editor/renderer support; lexicons imports are manual. Different pins are therefore not inherently a defect. The audit leaves their supported-version and cutover relationship unverified, with no demonstrated deployed failure. [Recipe instructions](https://github.com/unset-sh/profile-recipes/blob/1e64c469f86dd2ad6e9b26200d26e308d6d06f4e/AGENTS.md#L48-L52), [recipe schema](https://github.com/unset-sh/profile-recipes/blob/1e64c469f86dd2ad6e9b26200d26e308d6d06f4e/schemas/upstream/sh.unset.profile.json#L48-L65), [snapshot disclaimer](https://github.com/unset-sh/profile-recipes/blob/1e64c469f86dd2ad6e9b26200d26e308d6d06f4e/schemas/upstream/source.json#L16-L17), [lexicons description](https://github.com/unset-sh/lexicons/blob/52cfb6990f3833e4bdd260cd5bb520fc4446e122/lexicons/sh/unset/profile.json#L8), [manual-import policy](https://github.com/unset-sh/lexicons/blob/52cfb6990f3833e4bdd260cd5bb520fc4446e122/docs/maintenance.md#L3-L6), [recipe CI](https://github.com/unset-sh/profile-recipes/actions/runs/45042471065), [lexicons CI](https://github.com/unset-sh/lexicons/actions/runs/45047625061).
2. **Presentation has a known dependency migration.** Its manifest pins an older brand Git revision; brand documents a changed JSON contract, while presentation's release workflow rejects Git dependencies. The pin protects the existing build. This is unfinished migration/release work, not evidence of an accidental semantic-versioning break. [Dependency](https://github.com/unset-sh/presentation/blob/f4597ce765007c28c0fd0aadbd3f9f0333939229/package.json#L40), [migration](https://github.com/unset-sh/brand/blob/8c998a2990ae477daf5ac1636028f6cbf379577b/docs/migration.md#L16-L23), [release guard](https://github.com/unset-sh/presentation/blob/f4597ce765007c28c0fd0aadbd3f9f0333939229/.github/workflows/release.yml#L38-L47).
3. **Shared tooling is partly implemented, with adoption pending.** Shared workflows remained in open `.github` PR #6. Agent-kit implements and tests locked-copy drift detection, but no published release was surfaced and consuming repositories had not adopted its check. [Recorded workflow status](https://github.com/unset-sh/.github/blob/b3c1b3d120915b046ec149b5f33de3c6900e9b1e/repos.json#L94-L117), [kit checker](https://github.com/unset-sh/agent-kit/blob/560c5957bdb0d73c79785d40ec881f0b0e7323e4/sync.mjs#L217-L233).
4. **CI execution and merge enforcement differ.** At inspection, `.github`, `docs`, and `lexicons` reported `protected:false` and empty ruleset lists. Agent-kit, brand, presentation, and recipes had active required-check rulesets, but zero required approvals and no required code-owner review. Legacy protection reads returned permission errors, so their complete settings were not verified. Treat these as dated API observations, not immutable source-code facts.

## Phase 1: agree ownership and verify profile compatibility

**Owners to assign:** architecture coordinator and maintainers of lexicons and recipes. **Prerequisite:** confirm current revisions and identify the authoritative contract and intended supported versions.

First record a compatibility matrix: which versions are authoritative for each consumer, which record owns cards in each version, and whether any transition is needed. Add representative producer/consumer fixtures before changing behavior. Preserve supported paths until replacements and transitions are reviewed. Update snapshots or recipes only where the agreed relationship requires it, in separately reviewable changes with explicit version provenance.

**Completion evidence:** each supported producer/consumer pair passes schema checks and representative consumer-behavior checks. A negative case demonstrates detection of an unsupported declared contract version or unmet consumer requirement. Protocol-permitted extension fields are not rejected solely because the consumer does not recognize them. The dependency map names the authoritative source and any planned cutover. Separate successful CI badges alone are insufficient.

The intended forward policy is compatible evolution from an agreed authoritative baseline. The existing recipe transition still needs reconciliation; future additions must be verified through actual supported consumers rather than assumed safe because no field was removed.

## Phase 2: complete the brand-to-presentation migration

**Owners to assign:** brand and presentation maintainers. **Prerequisite:** an agreed supported brand release and review of its migration document.

Adapt presentation to the supported JSON contract, verify representative rendered outputs, and replace the Git dependency with the approved published artifact when available. Keep dependency changes and unrelated refactoring separate. Retain the existing release guard; do not weaken it merely to publish. Document the previous supported version and a recovery approach if the new consumer fails validation.

**Completion evidence:** presentation consumes an explicit supported package version, relevant behavior/output checks pass, and the unchanged release preflight accepts the dependency. The migration record explains the contract change. Add a follow-up acceptance case demonstrating that a compatible brand release automatically updates presentation and the other registered consumers through their required delivery stages, with blocked consumers reported explicitly.

## Phase 3: adopt shared automation and assistant standards

**Owners to assign:** shared-tooling maintainer and each adopting repository's maintainer. **Prerequisite:** re-review the current shared-workflow proposal and approve the release process.

First record the destination decision: the audit found consolidation into `.github` under review; the later proposed direction is a dedicated `developer-tooling` repository. Do not treat this document as silently superseding that existing proposal or any accepted decision. After resolving the destination, complete shared implementations and their tests, then release them through the approved process. Migrate one representative caller first, comparing its required checks and artifacts before expanding repository by repository. Pin callers to reviewed immutable revisions and automate their updates under M09. Preserve repository-specific build commands and language choices.

Release agent-kit independently, install its locked copy through explicit adoption PRs, and add its offline drift check to each adopter's gate. Track adoption and versions in the organization inventory. Templates initialize files; maintained shared implementations and checked copies prevent subsequent drift.

**Completion evidence:** caller checks run against recorded revisions; an altered kit file fails validation; upgrades produce reviewable diffs; a central tooling release automatically advances an eligible consumer through checks and adoption; failures are reported without losing the last working version; each adopter has a documented way to return to its previous supported tooling version.

## Phase 4: make the intended review policy enforceable

**Owners to assign:** repository administrator and maintainers. **Prerequisite:** agree the policy appropriate to current contributors, including reviewer availability, ownership, and exceptional access.

Reinspect effective settings with adequate read access. Decide which checks must block merging and which changes need independent or owner review. Configure repositories incrementally after confirming exact check contexts. Document any intentional bypass and its purpose; avoid policies that cannot function with the available maintainers. Verify release-environment approval settings separately from workflow declarations.

**Completion evidence:** reviewed settings records match the intended policy; a controlled failing-check case cannot merge through the ordinary path; the normal passing path remains usable. Record anything still unverifiable.

## Phase 5: maintain the standard through ordinary changes

**Owner to assign:** architecture coordinator, with repository maintainers. Improve existing files rather than performing a mass folder move. Update the inventory when responsibility or dependencies change, and use short decision records for consequential exceptions.

Review whether developers can find the responsible maintainer, identify affected consumers, reproduce a build, update a dependency, and explain a significant decision without reconstructing chat history. Watch recurring cross-repository breakage, check duration, flaky failures, review delays, and abandoned upgrades. Use these observations to improve boundaries and tooling; do not impose arbitrary file-size, coverage, or repository-count targets.

## Review checklist for each adoption change

- Is its scope small enough to review and independently validate?
- Are authoritative contracts, exact dependencies, and affected consumers identified?
- Does the evidence test behavior or compatibility, including a meaningful failure case?
- Are documented guarantees distinguished from CI checks and enforced settings?
- Are transition, recovery, ownership, and any exception documented?
- Has the dated inventory been refreshed where this change makes it inaccurate?
