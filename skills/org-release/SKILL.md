---
name: org-release
description: Prepare and verify staging prereleases and human-approved production promotions in unset.sh. Use when publishing a package or release asset, proposing a promotion, changing release automation, or investigating a waiting or failed release.
---

# Prepare and verify a release

[Org-0009](../org-decisions/records/org-0009-staging-and-production-delivery.md) defines the target model:
`staging` is the default development branch, with automated prereleases; a human merge from same-repository
`staging` into `master` approves stable publication and production deployment. There is no second
environment approval for that promotion. This skill does not claim the workflows have been migrated.

## Check adoption first

Read the repository's current instructions, workflows and rollout record. Before coordinated cutover,
branch from its existing development default and preserve its current checks, merge authority and release
gates. Do not bypass the existing workflow or remove its approval because this target policy is accepted.
Prepare the migration through reviewed PRs; update triggers, branch settings, environment restrictions,
consumer pins and validation together. Existing release tags remain immutable.

## Staging

1. Prepare the deliverable, consumer-facing changelog, appropriate version intent and relevant checks in
   a feature PR to staging. A separate AI may review and merge an eligible PR after required checks pass;
   an author does not approve their own implementation. Follow any applicable repository-specific review.
2. The adopted CI pipeline builds and tests the selected merged revision, then automatically publishes a
   unique prerelease through the staging channel when relevant deliverables change. Record its source
   commit, artifact digest and provenance. A package example is `1.4.0-staging.123`; registry aliases help
   discovery but are not dependency pins. Repositories without published deliverables need no artificial release.
3. Staging consumers opt into exact prerelease versions. The deployment repository selects exact images
   and configuration in its staging manifest and can automatically validate and deploy that combination.
   Keep staging destinations and access separate from production. Not every package needs a live server.

## Production

4. Prepare a same-repository staging-to-master promotion PR with the selected versions or artifact
   manifest, changes since the last production release, validation evidence and relevant migration/recovery
   notes. Where a repository requires a full release review, a separate reviewer performs it.
5. Use a merge commit for this long-lived-branch promotion; ordinary feature PRs can use squash merges.
   Verify the proposed merge and its selected build inputs. If promotion changes them, validate that result.
6. Leave the merge to a human. Agents must not merge, enable auto-merge, enqueue a promotion or substitute
   direct pushes, cherry-picks, manual tags or another publication path. This holds even with owner credentials.
7. After the human merge and successful checks, the adopted pipeline automatically publishes the stable
   release and performs any configured production deployment. Keep environment access restricted to the
   production source, but do not add another manual approval for the same promotion.
8. Verify the actual release, artifact digest, provenance and deployment result. Report failures or missing
   evidence plainly. A successful merge is not evidence that publication or deployment succeeded.

## Artifacts and consumers

- Choose stable versions by their consumer impact: major for an incompatible public contract change, minor
  for a compatible addition, patch for a compatible fix. Keep the version and changelog consistent.
- Stable publication selects approved stable versions; staging cannot update a stable channel. Never
  overwrite a package version or move, delete or reuse a release tag. A bad release needs a new version.
- Pin the complete deployment selection before promotion. Production jobs must not resolve newer versions
  from mutable aliases, branch heads or latest-release queries after approval.
- Prefer promoting the tested container digest where build inputs are unchanged. Record its actual staging
  source and approved relationship to master; do not relabel provenance to the merge SHA. If stable version
  metadata or other build inputs change the bytes, build and test the stable artifact as a separate output.
- Consumers take releases through reviewed pin-update PRs. Shared package publication and whole-application
  deployment are separate repository promotions; neither adds a second environment approval.
- Use the existing approved CI mechanisms. Never create or handle writable secrets to make publishing work.

## Automation details to verify

Most events created with a repository workflow token do not start another workflow. Connect release and
deployment with supported downstream jobs or explicit dispatch, and verify the actual result. Scheduled
jobs run on the default branch, so switching the default to staging requires reviewing scheduled publishers.

Sources consulted 2026-11-22: [workflow triggering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow),
[workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
[GitHub merge methods](https://docs.github.com/en/pull-requests/reference/pull-request-merges#squashing-and-merging-a-long-running-branch),
[SemVer](https://semver.org/spec/v2.0.0.html), and [Docker digests](https://docs.docker.com/reference/cli/docker/image/pull/#pull-an-image-by-digest-immutable-identifier).
