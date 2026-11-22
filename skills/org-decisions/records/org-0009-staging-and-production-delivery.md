# org-0009. Staging development and human production promotion

Status: accepted (2026-11-22, Alex's branch, approval and staging-release decisions below; operational cutover pending)

## Context

The organisation's existing instructions and release implementation assume `main`, with a separate owner
approval in the release environment. Alex chose two persistent branches and moved the production approval
to the merge between them:

> Yes — staging is the default development branch; master is the stable production/release branch

> PR's on staging can be automatically approved by AI but anything going on prod need 1 click of a human to merge staging into master

> Yes — human merge is the single approval; release and deployment run automatically afterward

For distinguishing agents from humans using the same GitHub account, Alex said:

> it can just be a rule in claude.md
>
> for the identity issue with github

Alex also required a separate staging release:

> also we will require a separate staging release that can be automated

## Decision

1. Each active organisation repository uses `staging` as its default development branch and `master` as
   its stable production/release branch. Ordinary work enters staging through pull requests.
2. Eligible staging PRs may be reviewed and merged by AI after required checks and review. Existing
   author/reviewer separation remains: authors do not approve their own implementation.
3. Production promotion is a same-repository `staging` to `master` PR. A human performs the merge. The
   shared rules loaded through `CLAUDE.md` prohibit agents from performing that merge even when they use
   the owner's account. Agents may prepare, test and review the promotion, but may not merge it, enable
   auto-merge, enqueue it for eventual automatic merge, or bypass it by direct pushes, cherry-picks or tags.
4. That human merge is the single approval for the promotion. Successful checks then permit release and
   deployment automatically; there is no second release-environment approval. Branch restrictions,
   validation, immutable artifacts, provenance and secret handling still apply.
5. Repositories that publish deliverables have a separate automated staging prerelease channel. Staging
   consumers explicitly select those artifacts; staging publication must not update stable channels or
   production deployments. A repository without a published deliverable need not invent a package or server.
6. The deployment repository owns the assembled application's environment selections and rollout. Producer
   repositories own their packages/images. A deployment promotion approves its selected combination;
   stable producer publications remain their own repository promotions, without an extra environment
   approval for either promotion.
7. This supersedes only the separate release-environment approval placement preserved by org-0006's
   decision 5 and consequences, and the older `main`-based delivery instructions. Org-0006's ownership,
   reviewed consumer updates and pinned references remain in force. Accepted records remain intact.

## Consequences

- The human/agent distinction is an instruction, not an identity guarantee enforced by GitHub when the
  same credentials are used. No separate bot identity or new writable credential is required by this decision.
- Implementation choices for review: squash ordinary feature PRs into staging; use merge commits for
  staging-to-master promotions so long-lived branch ancestry is retained. GitHub warns against repeatedly
  squashing a long-running branch. Branch rules/settings must support the selected methods.
- Use distinct prerelease versions and channels, for example `1.4.0-staging.123` and a staging registry
  tag, while stable releases use `1.4.0`. These are example mechanics, not a mandated version allocator.
  Published versions and artifact digests never change; consumers and deployment manifests pin selections.
- The policy is accepted; implementation is not complete. Current workflows still need a coordinated
  reviewed migration, including shared tooling, consumers, scheduled jobs, production input pins and
  branch/environment settings. Preserve working checks and existing publication gates until that cutover.
  Do not rename branches or remove approval checks independently and call the migration complete.
- Bootstrapping empty repositories and adopting this policy are explicit migration work. The read-only
  source application is outside the organisation cutover; this decision does not move application code.

References consulted 2026-11-22: [GitHub merge methods](https://docs.github.com/en/pull-requests/reference/pull-request-merges#squashing-and-merging-a-long-running-branch),
[workflow triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow),
[environment restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments),
and [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html). Merge methods, naming examples and the cutover sequence
are implementation recommendations applying the owner's decisions, not additional quoted decisions.
