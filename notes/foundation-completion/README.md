# Foundation completion

Alex requested “ok lets finish the foundation” after the remaining work was divided into foundation, release activation, consumer migration and automatic adoption. This completes the foundation scope through independent review and guarded pull-request merges. Release activation and broader rollout remain separate.

## Landed changes

| Repository / pull request | Merged commit | Result |
| --- | --- | --- |
| [tooling #1](https://github.com/unset-sh/tooling/pull/1) | `838a965d14d0887291046c279422becb7b0228f3` | Shared checks, protected-release implementation, reusable committed-tree documentation exporter, tests and human guides |
| [agent-kit #8](https://github.com/unset-sh/agent-kit/pull/8) | `ca8a1f6d28e13e258e043f0fb1a7ce52b42982c1` | Ownership decisions, working-material boundaries and preservation of three docs planning files |
| [.github #6](https://github.com/unset-sh/.github/pull/6) | `36665552fe5d95005ddfdac1a8276333d479f103` | Community defaults, starter templates, current organisation map and read-only callers pinned to merged tooling |
| [docs #5](https://github.com/unset-sh/docs/pull/5) | `c58f1e39660db08ff6592b3c0a9680a03162aa15` | Tooling guides imported from the merged source, authored framework references aligned, AI planning files removed after preservation |
| [docs #2](https://github.com/unset-sh/docs/pull/2) | `02bfc33cbe6a44f7f57f3e06dfc4012739899265` | Organisation guides imported from the merged .github source |

Independent verifiers checked exact PR heads, repository instructions, review threads, hosted checks and appropriate local tests before merging. Merges were squash operations with expected-head guards and no administrative bypass. Branches were retained so earlier checked source references remain available. The GitHub connector returned integration permission errors on merge; the authenticated CLI completed the same guarded operations.

## Verification

- Tooling: 138 tests, generated workflow freshness and actionlint passed. The merged tree matches the reviewed tree. Main CI and documentation export passed. Version `0.0.0` passed its release plan and correctly skipped build and publication.
- Organisation defaults: 22 map tests, generation freshness, actionlint, form parsing and a live public metadata comparison passed. The lexicons entry now reflects the already-created MIT repository and its documented manual synchronization; no mirror or repository settings were configured.
- Both .github caller jobs pin merged tooling `838a965d14d0887291046c279422becb7b0228f3`. Main check → export passed and uploaded its artifact with source `36665552fe5d95005ddfdac1a8276333d479f103`.
- GitHub's community-profile API for tooling resolves its inherited code of conduct, contributing policy and PR template to .github; the reported health percentage is 100. Private vulnerability reporting remains enabled in .github. A browser issue-form preview was interrupted before inspection; no issue was submitted and no browser-rendering result is claimed.
- Agent-kit: 46 tests passed; the bundle includes the decision records and excludes all notes/artifacts. Accepted history, 46 existing artifact hashes and all three relocated planning files were checked. Main CI passed.
- Final documentation imports: exact source bytes, licences and hashes verified; 176 Node tests, 19 Python tests, 38 pinned links, 22-page production/publication builds and a 29-page preview/navigation build passed. The docs-impact explanation for the source-only import is recorded in its PR body.

See the reviewer reports and logs in `artifacts/foundation-completion/`. `main-runs.json` records the final main-branch workflow results. The live verification report records deployed source revisions and the retained profile-recipes section.

## Remaining scope

The shared tooling remains unreleased. No release environment, branch protection, new writable credential, release approval setting, automatic consumer update pipeline or broad consumer migration was configured. The shared human documentation standard remains proposed in agent-kit #7 and must be settled before the next kit release. The .github bootstrap caller is the initial adoption.

The archived `unset-sh/workflows` repository was not changed. Current organisation default-branch workflows do not depend on it. Deleting it would remove original PR/review history and break historical links; the user asked whether deletion was possible, and no deletion was requested or performed.
