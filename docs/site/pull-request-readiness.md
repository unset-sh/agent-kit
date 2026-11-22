---
title: "Pull request readiness"
description: "Keep each staging merge releasable while making dependencies between pull requests explicit."
---

# Pull request readiness

Each PR has one coherent purpose and states whether it is independent or dependent. Both can be reviewed
before they merge; only a PR whose prerequisites, checks and review are satisfied is ready to merge.

There is no fixed line limit or PR-count quota in this organisation policy. The original application's
800-line exception gate is not carried over. Size is a review signal: a large coherent change can remain
together, while a small but risky change still needs appropriate scrutiny.

| Readiness | What it means | Required description |
| --- | --- | --- |
| Independent | Can merge and, where applicable, release or deploy on the current target without another pending change; changes without deliverables need applicable checks, not an artificial release | State that no prerequisite PR or unavailable artifact is needed |
| Dependent | Needs another change or artifact before it can safely merge | Link each prerequisite PR and state its readiness condition, including the required published version or artifact across repositories |

For example, a consumer PR that needs a new backend capability is dependent until the capability is
available in the form the consumer uses. If that is a package, the producer PR merging is insufficient:
the required version must be published and the consumer must pin and test it. If it is a deployed service,
state the required capability and compatible rollout order.

## Keep staging releasable

Every merge into staging must leave a working, releasable result. A dependency note does not allow a broken
intermediate state that a later PR will repair. An incomplete feature can land in compatible increments
when each increment has intentional, valid behavior on its own.

When a prerequisite becomes available, update the PR against the actual target branch and exact inputs,
rerun the relevant checks, and refresh review where the result changed. Earlier green checks on different
code or dependencies do not establish that the new combination works.

An independent PR can enter the automated staging release pipeline after checks and review; it does not
receive permission to publish production directly. The human staging-to-master promotion rule still applies.

## Use stacks when they help review

Stacked PRs can make a sequence easier to review, but are optional. Link dependencies, land prerequisites
first, and update and recheck each remaining PR. Only rewrite a branch you own and are authorised to rewrite.
Do not divide a coherent change by folder, layer or line count merely to manufacture smaller PRs. Keep the
implementation, meaningful tests and relevant documentation together when they form one reviewable outcome.

Refactoring and behavior changes use separate commits. Required checks, documentation impact and canonical
PR labels still apply. A label neither satisfies a dependency nor grants merge permission.

The shared instruction source is `skills/org-principles/workflow-and-change-management.md`, section 1,
relative to agent-kit. The label source is `docs/site/pull-request-labels.md`, relative to `unset-sh/.github`.
The [delivery policy](delivery-policy.md) describes staging and production promotion.

This is documentation of readiness expectations, not a new dependency-checking service or numeric CI gate.
It does not modify the read-only source application's existing PR-size guards.
