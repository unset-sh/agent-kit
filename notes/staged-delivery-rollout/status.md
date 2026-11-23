# Staged delivery audit ledger

Verified at **2026-11-23T02:06:15.994869+00:00**. The coordinator's read-only GitHub API audit exited zero
with no findings across 12 repositories. The [verbatim verification snapshot](../../artifacts/staged-delivery-rollout/verification.json)
records settings, 24 ruleset IDs, exact main/staging revisions, reviewed PR heads, merge commits, required
check names/producers and 19 retargeted feature PRs. The snapshot precedes this evidence-only documentation
commit: its staging SHAs are observed revisions, not a promise that branches remain at those revisions.
Artifact SHA-256: `ce6cc86dccf9d7649c75c57fded472e345a2b27cdfa3aab3827c6398a78e48d1`.
An independent settings review compared all 24 desired/applied rulesets, 12 defaults/main baselines and
19 retargets, with live docs/profile-recipes spot checks; it found no material mismatch.

## Verified result

- All 12 active repositories have protected `staging` and `main` branches, with staging the default. No
  master branch was created. Existing main SHAs matched their recorded baselines throughout this rollout.
- PDS was previously empty. Its authorized README initialization established main baseline
  [`5d2ac534cc1851d12698dc7957911c6094247d2b`](https://github.com/unset-sh/pds/commit/5d2ac534cc1851d12698dc7957911c6094247d2b)
  before staging and its checked caller were added; no PDS runtime was deployed.
- The coordinator verified 24 active, explicit-branch native rulesets and effective rules: PRs and resolved
  conversations required, deletion and force-push blocked, no bypass actors, and strict required checks.
  Check producers are GitHub Actions App **15368**. Product checks are retained wherever a product exists;
  the backend/web/deployment/PDS foundations currently require the branch guard and claim no runtime readiness.
- Main permits merge commits only. Staging permits squash and merge commits for feature work and reviewed
  ancestry synchronization. Rebase merges, repository auto-merge and automatic branch deletion are disabled.
- The native approving-review count is **0** because the shared owner account cannot approve its own PRs.
  Independent reviewers checked the actual diffs and successful hosted checks before the merges below.
  This is separate-review evidence, not a fabricated native approval or technical human-identity check.
- All 12 rollout PRs merged into staging after their exact required checks passed. All 19 previously open
  feature PRs targeting main were retargeted to staging; retargeting does not approve or merge their contents.
- Alex authorized the API fallback after Brave failed with ScreenCaptureKit/SCStream **-3812**, before any
  browser mutation. No application code, production promotion or release was part of this settings rollout.

## Independent review and merged source

Reviewer labels identify separate subtasks in this work, not separate GitHub identities. Each reviewer was
independent of the corresponding implementation. The snapshot binds the PR and successful checks to the full
reviewed head; the links below identify the resulting staging squash commit. DCO sign-offs were retained.

| Repository | PR | Staging merge | Independent reviewer |
| --- | --- | --- | --- |
| pds | [#1](https://github.com/unset-sh/pds/pull/1) | [1ff1df8](https://github.com/unset-sh/pds/commit/1ff1df8bdd9dfc5bf1260053df0e6f46d97b38cc) | scaling_operations |
| .github | [#17](https://github.com/unset-sh/.github/pull/17) | [ff0e35a](https://github.com/unset-sh/.github/commit/ff0e35a129a52914cb0e6f0bb15465165032fed5) | research_synthesis |
| docs | [#7](https://github.com/unset-sh/docs/pull/7) | [831871f](https://github.com/unset-sh/docs/commit/831871ff8e5fbc64b421834f4788aac603ff3c04) | research_synthesis |
| profile-recipes | [#8](https://github.com/unset-sh/profile-recipes/pull/8) | [a6eadbb](https://github.com/unset-sh/profile-recipes/commit/a6eadbb3e570e59b06cde65b0c9181c300b4cc39) | research_synthesis |
| brand | [#7](https://github.com/unset-sh/brand/pull/7) | [a29c942](https://github.com/unset-sh/brand/commit/a29c94293613e119faf5cdd0eab0a6e18664b618) | research_synthesis |
| rendering | [#5](https://github.com/unset-sh/rendering/pull/5) | [d47afda](https://github.com/unset-sh/rendering/commit/d47afdae9dcd542dc2f343ba8254b85b650ae828) | architecture_principles |
| agent-kit | [#16](https://github.com/unset-sh/agent-kit/pull/16) | [25c4b50](https://github.com/unset-sh/agent-kit/commit/25c4b50e68a2f80d8f042166c07258a73f9701e9) | architecture_principles |
| lexicons | [#2](https://github.com/unset-sh/lexicons/pull/2) | [27e6e5b](https://github.com/unset-sh/lexicons/commit/27e6e5b573d49c8bc01171c6cf6d275382a5f07e) | architecture_principles |
| tooling | [#8](https://github.com/unset-sh/tooling/pull/8) | [33817bb](https://github.com/unset-sh/tooling/commit/33817bbf23fd4a4e2f6bf99d1f958847364b4549) | coordinator |
| backend | [#2](https://github.com/unset-sh/backend/pull/2) | [19ea29a](https://github.com/unset-sh/backend/commit/19ea29a840bb38cec37a5aa4626c5b6353eb43a9) | scaling_operations |
| web | [#2](https://github.com/unset-sh/web/pull/2) | [8239c4a](https://github.com/unset-sh/web/commit/8239c4ac24059c236524aef1433f1582255d2d25) | scaling_operations |
| deployment | [#2](https://github.com/unset-sh/deployment/pull/2) | [979b2bf](https://github.com/unset-sh/deployment/commit/979b2bfb88953f1449fbfdc69ba8b4bb1f81c462) | scaling_operations |

The shared caller pins tooling implementation `5f47dbe68fc8c8860e99eccd1edc882aba65bf63`; its stable check name
is `policy / Validate branch policy`. The implementation accepts only supported PR bases and permits main
promotion only from the same repository's staging branch. It has no checkout, custom caller inputs or inherited
secrets. Review remains necessary: a PR-controlled workflow is not tamper-proof against a writer changing it.

Local validation before adoption included tooling's 289 tests; agent-kit's 46 tests; rendering's 77 tests,
typecheck/lint/build and gallery; lexicons' 19 tests and schema/docs/source-hash checks; the organisation map's
25 tests; and docs' 220 JavaScript plus 19 Python tests. The independent docs review reran all 62 workflow-guard
tests successfully. Applicable hosted product/policy checks passed at the reviewed heads, including brand and
recipe checks; `.github`'s scheduled drift job was intentionally skipped on PR events. These earlier results
validate the rollout source changes, not a future application or deployment.

## Effective policy and remaining work

The [rollout direction](README.md) records Alex's final choice: staging development/default, main stable,
separate review for feature PRs, and human-only same-repository staging-to-main production merges. Native GitHub
cannot distinguish human and agent use of the owner's credentials. No main merge, auto-merge, queueing or bypass
is authorized for agents by this record.

Existing release-environment approvals and main-push/manual publication gates remain unchanged. Automated
staging prereleases and the complete single-human-approval production delivery chain still require a separately
reviewed workflow migration. Legacy hourly `.github` map and `docs` site publication jobs are main-gated; they
skip their scheduled publishing path now that default is staging. Manual publication must explicitly target
main. This known limitation is preserved in the snapshot; branch protection is not full delivery adoption.

[Agent-kit PR #14](https://github.com/unset-sh/agent-kit/pull/14), recorded at
`411280a0e3df512d4038c22efe8436cdefdc5c9d`, still needs consolidation of its historical master wording and
org-0009 collision with the accepted map decision. Installed source rules also retain the old main-based
feature-branch wording. Alex's explicit staging instruction applies to this rollout; no accepted ADR, installed
rule, kit version, release environment or another owner's branch is changed by this evidence-only PR.

The external `Undefined6799/unset` app remains read-only and excluded. Backend, web, deployment and PDS remain
foundations awaiting their separate reviewed product work. Refresh the live evidence before future cutovers.
