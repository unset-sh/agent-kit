# Staged delivery rollout plan

Date: 2026-11-22. Working material, excluded from the kit. Alex authorized organisation setup and subsequently
approved a GitHub API fallback after Brave capture failed before any mutation. The coordinating task owns
settings. This branch prepares agent-kit CI prerequisites and notes; parallel PRs cover rendering and lexicons.
No application code, release/publishing path, environment, accepted decision or another task's branch changes here.

Target: `staging` is development/default; checked feature PRs receive a separate review; only a human merges
same-repository `staging` into `main`; successful production checks then permit publication/delivery.
Repositories with deliverables have a distinct automated staging prerelease channel. Foundations without a
runtime or package do not need a fabricated deployment or release. The original `Undefined6799/unset` app and
archived history are outside the active-repository cutover.

## Resolve policy dependencies first

Current agent-kit main is [`a98152c`](https://github.com/unset-sh/agent-kit/tree/a98152cd5391ffd84776dc7c5eee7ff3994d5e57).
It still requires feature branches from main and owner approval in the release environment. The accepted
target is documented in [PR #14](https://github.com/unset-sh/agent-kit/pull/14), inspected at
`411280a0e3df512d4038c22efe8436cdefdc5c9d`; its text explicitly preserves current gates until coordinated cutover.
That PR used `master`. Alex's later correction is "oh nvm lets just use main instead of master": production
remains `main`, development is `staging`, and no main-to-master rename is intended. The PR owner must update
its unmerged branch wording together with the numbering conflict; this branch leaves that work untouched.

**Number collision:** main already contains accepted org-0009 for automatic maps. PR #14 independently uses
org-0009 for staged delivery. Its owner should reconcile the unmerged record and every link/reference with
the next free identifier, tentatively org-0010 after checking current reservations. Preserve the accepted map
record and PR history. This prerequisite branch does not repair another owner's PR or allocate a duplicate ADR.

The target's human-only merge is an agent instruction when owner credentials are shared. Native GitHub
sees the account, not whether a human or agent operated it. A second agent using the same account also cannot
provide a qualifying self-approval. Preserve existing native review requirements; where the current count is
zero, record independent reviewer evidence rather than silently adding an impossible approval requirement.
Agents must not merge, auto-merge, enqueue or bypass a production promotion. These limits are explicit in
the [reviewed target decision](https://github.com/unset-sh/agent-kit/blob/411280a0e3df512d4038c22efe8436cdefdc5c9d/skills/org-decisions/records/org-0009-staging-and-production-delivery.md).

## Roll out in evidence-backed stages

1. **Inventory.** Record each active repository's actual default, branch SHAs, open PR bases, workflow
   triggers, required checks, review/bypass settings, environments and deliverables. Inspect source filters
   separately from live settings. Mark unknowns; a workflow file does not prove a required check is configured.
2. **Prepare the exact replacement.** Reconcile PR #14 and current instructions, then prepare workflow
   changes through their owners. Cover staging/main PRs and pushes, tag ancestry, publishing eligibility,
   scheduled publishers, downstream events, caller pins and production inputs. Never globally replace every
   branch references: upstream references, Lexicon `#main` and historical evidence have other meanings.
3. **Protect both persistent branches.** Establish branches from recorded approved commits without
   deleting main. Prefer explicit staging/main ruleset targets. Preserve actual required checks, forbid
   force-push/deletion and require PRs/conversation resolution. Avoid broad bypass actors. Enable merge
   commits for production promotion; do not apply linear-history/squash-only rules that break long-lived
   branch synchronization. Retain old settings until their replacement is verified.
4. **Verify promotion eligibility.** Require a check that fails unless base is `main`, head is `staging`
   and both belong to the same repository. Invalid sources must fail, not skip successfully. Bind evidence
   to the checked revision and rerun on relevant metadata changes. Prefer an independently controlled check
   producer; a workflow editable by the PR is not tamper-proof. This check proves origin, not human identity.
5. **Switch defaults only with a usable path.** After matching checks run and protections are verified,
   make staging default and deliberately retarget development PRs. Rerun checks before merging. If strict
   main freshness is retained, synchronize main merge ancestry back through a merge-based staging PR;
   otherwise explicitly review the alternative candidate-merge validation policy.
6. **Cut over publication separately.** Keep current release approvals until the prepared promotion guard,
   production-source restriction and replacement publisher have been tested together. Production accepts
   only main, not every protected branch. Remove only the superseded second reviewer prompt after that
   evidence exists. Staging uses separate versions, channels, destinations and access; it cannot update stable.
7. **Demonstrate completion.** Exercise a passing feature path, meaningful rejected paths and the permitted
   release chain. Leave the production merge to the human. Record artifact digests, selected versions and
   actual delivery results. Update the [ledger](status.md); distinguish branch setup from runtime readiness.

## Evidence required before calling a repository adopted

| Property | Evidence |
| --- | --- |
| Development path | Default branch shown as staging; matching checks run on the proposed merge; separate reviewer recorded |
| Source restriction | Same-repository staging-to-main passes; feature/fork/incorrect-source cases fail |
| Protection | Exact required-check names and producers, PR/review rules, merge methods and bypass behavior inspected |
| Prerelease isolation | Unique immutable staging artifact; stable channel and production destination unaffected |
| Production publication | Human promotion, checked approved inputs, main-only eligibility and actual artifact/result |
| Foundation-only repository | Branch/review/check path works; runtime/package delivery marked not applicable |

Scheduled jobs run on the default branch, and workflow-token events do not universally trigger another
workflow. Inspect map/docs publishers as well as package releases before changing defaults. The independent
source audit and settings observations remain separate evidence. The existing release environment is not
removed merely because staging/main now exist.

## Immediate CI prerequisite

For agent-kit, rendering and lexicons, preserve existing product jobs and add explicit staging/main PR and
push coverage. Add an unfiltered PR caller for the pinned shared branch-policy workflow, with events opened,
synchronize, reopened, edited and ready_for_review. Unsupported bases must receive a failed guard rather than
being silently filtered out. The caller performs no checkout, inherits no secrets, and starts with no token
permissions; its reusable job permits only contents read. Expected context: `policy / Validate branch policy`.
Confirm the actual hosted context before making it required. Publication, schedules, environments and installed
agent-kit rules remain unchanged by these PRs. They target staging and are not merged by their author.

Primary references: [ruleset configuration](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository),
[available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
[required-check behavior](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks),
[review limitations](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)
and [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
These implementation recommendations preserve the approved direction without claiming that GitHub enforces
the shared-account human/agent distinction.
