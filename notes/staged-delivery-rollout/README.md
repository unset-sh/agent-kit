# Staged delivery rollout

Date: 2026-11-22 local time; verification and merges continued on 2026-11-23 UTC. Working material, excluded
from the distributed kit. This records Alex's authorized repository-settings rollout and its limits. The
[audit ledger](status.md) links the verified settings, exact revisions and independent reviews.

## Effective direction for this rollout

`staging` is the development/default branch; `main` remains stable/production. Alex's final naming correction
was "oh nvm lets just use main instead of master". No branch was renamed to master. Brave capture failed
before any mutation; Alex subsequently authorized the GitHub API fallback used for setup.

Feature changes enter staging through checked PRs and separate agent or human review. Only a human may merge
a same-repository staging-to-main production promotion. Agents must not merge, auto-merge, enqueue or bypass
that promotion. The shared branch-policy check verifies the branch relationship, not who operates the account.
Native GitHub sees the shared owner account and cannot distinguish a human from an agent using its credentials.
The native approval count is therefore zero; separate-review evidence is recorded without claiming a qualifying
self-approval. This procedural boundary remains essential.

The verified settings establish protected staging/main branches, exact required checks, strict freshness,
conversation resolution and PR-only changes, with no bypass actors, force-push or deletion. Main accepts merge
commits only. Staging allows squash and merge commits, so main ancestry can be synchronized through a reviewed
PR after a production promotion. Repository auto-merge is disabled. See the ledger for the per-repository evidence.

## What this work completed

- Created staging from recorded main revisions, initialized the previously empty PDS foundation, then made
  staging the default in all 12 active repositories. The original `Undefined6799/unset` application and archived
  history are outside the cutover.
- Installed two active native rulesets per repository and read them back through the API.
- Merged the shared branch guard and consumer CI prerequisites into staging after independent review and
  successful hosted checks. The guard caller is pinned, read-only and unfiltered, including PR retarget events.
- Preserved release environments, publishing approvals, schedules and production workflows. No production
  promotion, release, application migration or deployment was performed by this setup.

## Work deliberately remaining

**Consolidate the source policy.** Agent-kit PR #14 still contains the historical master choice and collides
with the accepted org-0009 map decision. Its owner must reconcile the unmerged decision, links and installed
rules as one reviewed change, checking the next free identifier first. Do not edit the accepted map record.
This notes-only PR neither allocates an ADR nor distributes new assistant instructions. Existing source rules
still mention feature branches from main; Alex's explicit staging instruction governs this authorized rollout.

**Migrate delivery separately.** Automated staging prereleases and the complete single-human-promotion delivery
chain are not implemented by branch settings. Keep current release-environment approval until the exact source
restriction, artifact selection and replacement publisher are prepared, reviewed and tested together. Repositories
without a runtime or package need no fabricated release. Never allow staging artifacts to update a stable channel.

**Account for scheduled publication.** The existing `.github` map publisher and `docs` site publisher require
main. Schedules now originate from default staging, so those main-only publishing jobs skip their scheduled path.
Main-push publication and manual runs explicitly targeting main keep their existing eligibility. This is a known
remaining workflow migration, not evidence that automatic publication is operating from staging.

**Exercise the production chain with the human.** After delivery changes are ready, verify rejected source
paths, immutable artifacts, production inputs and actual results. A passing branch check does not prove delivery.
After each human production merge, preserve long-lived branch ancestry through a reviewed merge-based sync PR.

Primary references: [ruleset configuration](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository),
[available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
[required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks),
[review limitations](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)
and [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
