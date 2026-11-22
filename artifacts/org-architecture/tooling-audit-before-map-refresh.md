# Tooling and deployment adoption audit

Read-only snapshot review, 2026-11-22. Tooling: `838a965d14d0887291046c279422becb7b0228f3`; agent-kit: `ca8a1f6d28e13e258e043f0fb1a7ce52b42982c1`; `.github` main: `b3c1b3d120915b046ec149b5f33de3c6900e9b1e`. Also read `.github` PR 6 at `36fb5dc50da302dabd4df102be7ae7856364518b`, which remains open. No repository edits, checks, builds, release actions, settings changes or secret reads were performed. The app checkout was not accessed.

## What exists

Org-0006 puts shared implementations in `unset-sh/tooling`, with `.github` retaining metadata, community defaults and native workflow-picker templates. Consumers retain their small callers and product-owned commands/configuration. Tooling now implements three reusable capabilities: Node checks, protected package/release-asset publication, and committed documentation export. Their maintained sources are `ci/check.yml`, `releases/package.yml` and `automation/docs-export.yml`; generation produces flat `.github/workflows/` entrypoints. There is **no deployment implementation or release-assembly implementation** in the inspected tree. `deployments/` is a reserved future category, not an existing service. [Decision](https://github.com/unset-sh/agent-kit/blob/ca8a1f6d28e13e258e043f0fb1a7ce52b42982c1/skills/org-decisions/records/org-0006-developer-tooling-lives-in-tooling.md#L25-L48), [current inventory](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/README.md#L3-L16).

Tooling is explicitly version `0.0.0`, unreleased. Its source tests encode meaningful security invariants; they are not evidence of a successful first central release or consumer deployment. The release reference explicitly leaves workflow identity fields, protected-environment behavior, signer claims and publication awaiting a live approved run. [Unverified release behavior](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/docs/site/release-reference.md#L99-L106).

The inspected main branches of brand, presentation, agent-kit, docs and `.github` do not call tooling. PR 6 already supplies the intended native check/release templates with `APPROVED_COMMIT_SHA` placeholders. Reuse that pending work; do not create parallel template implementations or treat placeholders as usable pins. [Existing PR](https://github.com/unset-sh/.github/pull/6), [check template at reviewed snapshot](https://github.com/unset-sh/.github/blob/36fb5dc50da302dabd4df102be7ae7856364518b/workflow-templates/check.yml#L1-L23).

## Minimum check contract: independent of releasing

New Node repositories can have normal PR/main checks without any release workflow, publishing permission or release environment. Until an approved tooling release is available, keep a small working native workflow; then replace its mechanics with a reviewed pinned caller after checking parity.

The current shared check accepts:

| Input | Actual behavior |
|---|---|
| `install`, default false | Optional `npm ci --ignore-scripts`; requires the consumer's compatible lockfile. |
| `command`, default `npm run check` | Executes from the consumer root using Bash with failure propagation. |
| `keep`, default empty | Uploads the selected path as `check-output`, including after failure, for 14 days; missing files warn. |
| `timeout-minutes`, default 10 | Sets job duration. |

It uses the consumer's `.nvmrc`, Ubuntu runner, SHA-pinned actions, read-only contents access and no persisted checkout credentials. Its output is job success/failure and optionally a report artifact—no workflow result outputs. The expected nested label `check / Check` must be confirmed in the first consumer run before changing required checks. [Implementation](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/ci/check.yml#L15-L70).

A consumer's root command must actually compose its format/lint/type/build/behavior/boundary checks as applicable. App-specific contracts and negative fixtures remain product-owned. This workflow has no configurable service containers, installation credentials or lifecycle-script policy. Authenticated packages, image builds, database integration tests and mandatory report generation need deliberate adapters or separate jobs; an optional upload is not a mandatory-report gate. Other languages need suitable native CI or a reviewed additional tooling implementation, not artificial npm packaging.

## Release adoption has a policy mismatch to resolve

Agent-kit's current `org-release` instructs callers to push a `v*` tag and configure the environment for tags. Tooling instead refuses anything except a push to `refs/heads/main`, requires a main-only environment, and creates its own tag after approval. This is a concrete migration prerequisite: update the applicable instructions and owner-managed policy together, without broadening the environment to accept both paths merely to make checks green. Existing tag-based consumers should continue their existing process until explicitly migrated. [Kit instructions](https://github.com/unset-sh/agent-kit/blob/ca8a1f6d28e13e258e043f0fb1a7ce52b42982c1/skills/org-release/SKILL.md#L8-L27), [main-only validator](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/scripts/release-gate.mjs#L24-L54).

Preserve the central release's separation: read-only plan/build; only publish has write privileges and enters the protected environment; publish runs no consumer code, rechecks the environment and validates downloaded artifacts before attestation/publication. Current release inputs are `install`, `check`, `build`, `files` and `npm-package`. `files` selects a repository-relative directory of direct regular files; package mode publishes to GitHub Packages. Outputs are `version` and the string `released=true` only after completion. This publishes packages/assets; it does not build/push OCI images or deploy applications. [Release contract](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/releases/package.yml#L53-L85).

## Proposed minimum assembly and deployment contract

Apply org-principles sections 4, 7, 8 and 22: small contracts, explicit composition, cohesive ownership and meaningful automated checks. The agreed deployment owner should assemble **released artifacts**, not import sibling source checkouts. Start with a versioned manifest naming each web/backend/renderer image or package, immutable digest/version, source revision and required compatibility identifiers. Keep environment configuration and secret references separate; never put secret values in artifacts.

Product repositories own their builds, tests, API/schema contracts and migrations. Deployment owns selected versions, topology, readiness checks, rollout ordering, migration compatibility and recovery instructions. Tooling owns only reusable execution/verification mechanics. Its first deployment implementation should accept the assembly revision and target environment, verify artifact identity and compatibility, apply the declared deployment, check health, and record the resolved versions and result. Build once and promote those same artifacts; do not rebuild source during production delivery. Keep independently privileged processes and PDS packaging separate.

These are proposed contracts, not implemented capabilities. Add them incrementally for the first real deployment target instead of introducing a general deployment framework now.

## Automatic propagation is still outstanding

The complete chain remains: approved tooling/brand release → consumer pin-update PR → consumer and contract checks → policy-eligible merge → consumer build/publication → deployment manifest update → deployment checks and allowed delivery → recorded deployed versions. Tooling's Renovate config has `automerge: false`; its docs explicitly say propagation is unimplemented. A central merge therefore changes neither consumer pins nor deployed artifacts. Package attestation verification on installation is also not implemented. [Update limitation](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/docs/site/use-workflows.md#L72-L76), [Renovate policy](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/.github/renovate.json#L1-L15).

Adoption order: finish PR 6 and reconcile release instructions; validate a first owner-approved tooling release; migrate one simple check consumer; preserve more demanding consumers' existing gates; implement one artifact assembly/deployment path; then add verified update automation. Do not describe automatic merging, token-triggered downstream events or runtime rollout as working until observed end to end.
