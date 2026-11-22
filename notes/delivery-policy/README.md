# Delivery policy adoption

Date: 2026-11-22. This working note records the migration still required to implement
[org-0009](../../skills/org-decisions/records/org-0009-staging-and-production-delivery.md). It is excluded
from the distributed kit. The maintained human guide is [delivery-policy.md](../../docs/site/delivery-policy.md).

## Accepted scope and current limit

Alex chose staging as default, master as stable, eligible AI staging review/merge, a human production merge
as the single approval, a CLAUDE-loaded instruction for shared-account identity, and a separate automated
staging release. This change records those decisions and updates instructions; it performs no workflow or
settings cutover, release, consumer update, deployment or application-code migration.

Merge-commit promotions, squash feature merges, prerelease naming examples and the sequence below are
implementation recommendations. The PR must identify them as such. The existing app's line-count policy
is unchanged; research on PR size does not itself replace a local guard.

## PR readiness clarification

Alex asked:

> we should attempt a way to make that each PR's can either be deploy immediately or in a dependant PR no?

The implementation interpretation is explicit independent/dependent readiness in every PR description.
Independent means the PR can merge and release on the actual target after checks and review. Dependent
means prerequisite PRs and availability conditions are named, including a published version or artifact
where another repository supplies the dependency. It may be reviewed before those prerequisites land,
but cannot merge while blocked. Every merge into staging leaves a working, releasable state.

Stacking is an optional review technique, not a requirement to split by layer. Dependencies land in order;
remaining PRs are updated and checked against their resulting inputs. This guidance and the canonical label
pointer are policy documentation, not new CI enforcement. No local app guard or numerical threshold changes.

## Coordinated cutover checklist

- [ ] Recheck live repositories, branch heads, open PRs and active workflows; do not rely on old inventory
  names or modify another task's branches. Record each repository's migration state.
- [ ] Update tooling's release eligibility, prerelease channel, environment contract and refusal tests.
  Preserve least-privilege build/publish separation, pinned helpers, artifact validation and provenance.
  Do not remove the current reviewer gate until its matching reviewed replacement is ready.
- [ ] Update producer callers, tag ancestry checks, release documentation and workflow pins. Test both
  branches without allowing staging to publish stable packages or deploy to production.
- [ ] Update `.github` starter templates and guidance. CI must cover staging and master explicitly;
  replacing only the default-branch placeholder does not guarantee production checks run.
- [ ] Move direct documentation pushes into the reviewed staging path. Pin production brand/map/document
  inputs so rerunning an approved build cannot silently consume newer upstream content.
- [ ] Review scheduled jobs: GitHub runs them on the default branch. Keep staging discovery/update work
  separate from production publication, and verify workflow-token event propagation deliberately.
- [ ] Establish both branches at recorded commits, including an approved initial commit for an empty
  repository. Apply the authorised branch/environment configuration, required checks and compatible merge
  methods. Retarget development PRs deliberately, then rerun their checks before merging.
- [ ] Verify same-repository staging-to-master promotion eligibility and the agent human-merge instruction.
  Do not claim GitHub distinguishes human and agent use of the same login. Do not create a new identity.
- [ ] Verify separate staging versions, channels and deployment destinations; verify unique immutable
  artifacts and stable selections. Check failures/reruns cannot overwrite a published version.
- [ ] Verify human promotion triggers automatic stable publication and configured rollout with no second
  reviewer prompt. Inspect resulting artifacts and deployments; a green merge alone is insufficient.
- [ ] Switch defaults and retire old main references only as the reviewed migration permits; retain
  historical records, external upstream refs, Lexicon `#main` and unrelated configuration keys.
- [ ] Release the updated kit through the authorised transition and adopt it via exact consumer pins.
  Reconcile pending agent-kit changes before release, retaining the 150-line always-loaded budget.

## Read-only evidence used

The inspected tooling checkout was at `838a965d14d0887291046c279422becb7b0228f3`:
[`releases/package.yml`](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/releases/package.yml)
still required push-to-main, and [`scripts/release-gate.mjs`](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/scripts/release-gate.mjs)
still required the owner reviewer and main-only environment eligibility. This local evidence does not
establish current live settings. Recheck before implementation.

Official references and source dates are in the maintained guide. No credentials were inspected or created.
