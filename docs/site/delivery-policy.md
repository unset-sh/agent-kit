---
title: "Staging and production delivery"
description: "Branch roles, automated staging releases and human production promotion across unset.sh."
---

# Staging and production delivery

The accepted target is **automatic staging delivery and human production promotion**. `staging` is each
active repository's default development branch; `master` is its stable production/release branch. A human
merges staging into master once, then successful checks permit release and deployment automatically.
There is no second environment approval for that promotion.

This policy is recorded in `skills/org-decisions/records/org-0009-staging-and-production-delivery.md`
(source path relative to the agent-kit repository).
**The operational cutover is pending.** These documentation changes do not rename branches, change workflow
triggers or environment settings, publish artifacts, or install updated rules in consumers. Current gates
remain until the coordinated reviewed migration is complete.

## From a change to a release

| Step | Result | Who can perform it |
| --- | --- | --- |
| Feature PR into staging | Reviewed development change with required checks passing | A separate AI reviewer and merger may handle an eligible PR |
| Staging publication | A distinct prerelease for changed deliverables, with a unique version and provenance | CI automatically |
| Staging deployment | The application's selected artifact combination runs in staging | Deployment automation |
| Same-repository staging-to-master PR | Stable content or an assembled application manifest is approved | A human performs the merge |
| Stable publication and production rollout | The approved result is released and any configured deployment runs | CI automatically after successful checks |

Authors do not approve their own implementation. Agents may prepare and review a production promotion,
but must never merge it, enable auto-merge, enqueue it or bypass it through direct pushes, cherry-picks,
manual tags or another publication path. That instruction applies even when an agent uses the owner's
GitHub account. With shared credentials, this distinction is behavioral rather than proven by GitHub's identity checks.

Ordinary feature PRs can squash into staging. Promotions use merge commits to preserve ancestry between
the two long-lived branches; repeated squash promotions can cause repeated changes and conflicts. This
merge-method choice implements the owner's branch model and must be reflected in settings and checks.
[GitHub explains the long-running branch caveat](https://docs.github.com/en/pull-requests/reference/pull-request-merges#squashing-and-merging-a-long-running-branch).

## Separate release channels

A package may publish a staging version such as `1.4.0-staging.123`, using a staging registry channel and
GitHub prerelease status. Stable publication uses the normal version, such as `1.4.0`. The example does not
prescribe the sequence allocator; every published version must remain unique and immutable.
[SemVer defines prerelease ordering and immutable version contents](https://semver.org/spec/v2.0.0.html).

Staging consumers explicitly select exact prerelease versions. Stable consumers select approved stable
versions. A registry alias can help discover a candidate, but the consumer's reviewed lockfile or manifest
records the resolved version. npm publishing defaults to `latest`, so staging publication must select its
channel explicitly. [npm distribution tags](https://docs.npmjs.com/adding-dist-tags-to-packages/)

Repositories publish staging releases when relevant deliverables change. A rules or library repository
needs an artifact channel, not a dedicated live service. A repository without a deliverable needs checks
and branch policy, not a package release created only to satisfy the naming convention.

## Application composition

Producer repositories build and publish their packages or images. `deployment` selects the complete
application through a committed manifest: exact image digests, compatible package selections and relevant
configuration/migration versions. Its staging branch can receive checked automated updates and deploy
them for integration testing. A human promotion approves that selected combination for production.

Production consumes the approved manifest; it does not resolve newer inputs from `latest`, staging aliases,
other repository heads or latest-release queries. Pin containers by digest to identify their exact content.
[Docker's digest reference](https://docs.docker.com/reference/cli/docker/image/pull/#pull-an-image-by-digest-immutable-identifier)

Prefer reusing a tested container digest when its build inputs are unchanged. Keep provenance truthful:
the staging build and the production merge can have different commit SHAs. Verify their approved content
relationship rather than rewriting the build's source claim. If stable version metadata, dependencies or
configuration change the artifact bytes, build and test that stable output separately.

Staging uses separate destinations and access from production, including data stores and external-service
configuration where applicable. GitHub environment names do not themselves isolate infrastructure. Keep
branch eligibility and restricted secrets while removing only the superseded second approval prompt.
[GitHub environment controls](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

A producer's stable publication and the assembled application's deployment are separate repository
promotions. Each has one human merge where it publishes to production; there is no additional environment
approval on that same promotion. The deployment repository gives the assembled application its own release boundary.

## Adoption and ownership

Agent-kit owns these instructions and decision history. Tooling owns reusable execution and validation.
`.github` owns organisation defaults and starter templates. Each producer owns its checks, builds, versions
and contracts. Deployment owns application composition and rollout.

The migration must update the existing `main` assumptions, release-environment checks, caller pins,
promotion validation, documentation publishers and schedules together. Schedules follow the default branch;
workflow-token-created events may not trigger a later workflow. Verify actual publication and rollout,
not just successful PR creation or merging. These are implementation concerns, not extra approval steps.
[GitHub workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
[workflow triggering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

Sources consulted 2026-11-22. The detailed agent procedure is `skills/org-release/SKILL.md`
(source path relative to the agent-kit repository).
The policy does not migrate application code from the read-only source repository or change its local rules.
