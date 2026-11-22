# Pull requests commits and releases

Research checked on 2026-11-22.

**Use one coherent, reviewable outcome per PR, with logical commits inside it.** Avoid PR-per-day quotas, mandatory microscopic changes, and a hard line-count gate. A larger change can be appropriate when its purpose, consequences, verification and recovery remain understandable. The organization currently has a non-numeric rule; the 400-line target and 800-line exception gate belong to the separate, read-only original app. This report recommends the future organization standard and leaves that app unchanged. Your chosen delivery model is separate: agents can review and merge eligible work into `staging`; a human promotes it to `master`, after which production release is automatic. That approved policy is documented in a pending documentation PR; live automation still needs implementation.

Google defines a useful change by cohesion and a working integration state, explicitly leaving size to judgment. GitHub similarly asks for one purpose and enough explanation to guide review. Neither establishes 800 lines as a universal safety boundary. Counts remain useful signals, alongside affected files, complexity and risk. They cannot determine whether a change is understandable. ([Google small changes](https://google.github.io/eng-practices/review/developer/small-cls.html), [GitHub review guidance](https://docs.github.com/en/pull-requests/concepts/helping-others-review-your-changes))

The supplied DeployHQ article offers useful advice about intent, review order, verification and deployment context. Its precise claims about Google review time and defect thresholds lack primary citations; the reviewed Google study does not establish them. Treat its size bands as suggestions. SmartBear’s own 200–400-line recommendation concerns reviewing that amount **at a time**, which does not establish a maximum total PR size. ([DeployHQ article](https://www.deployhq.com/blog/the-perfect-pull-request-best-practices-for-collaborative-development), [Google study](https://storage.googleapis.com/gweb-research2023-media/pubtools/4476.pdf), [SmartBear guidance](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/))

The proposed rule is: “Keep each PR focused on one reviewable outcome, with the context and verification needed to assess it. Split unrelated work and changes that cannot be reviewed coherently. Keep necessary implementation, tests and documentation together.” A reviewer should understand the resulting behavior and failure cases. Explain substantial generated or mechanical content and verify its source. Solo work and low-impact changes justify proportionate process; they do not remove compatibility, data or security obligations. ([Google review criteria](https://google.github.io/eng-practices/review/reviewer/looking-for.html))

**Atomic means logically complete.** Creating extra PRs solely for a quota or directory boundary adds coordination without demonstrating correctness. Keep related contract, implementation and usage together when separation would obscure the outcome. Split independent preparatory refactors or useful integration stages. Git recommends retained commits that work without later fixes and pass tests, improving later investigation. Temporary WIP and fixup commits are reasonable; clean them up when preserving a series, or squash them when integrating one logical PR. ([Git workflows](https://git-scm.com/docs/gitworkflows#_separate_changes), [GitHub merge strategies](https://docs.github.com/en/pull-requests/reference/pull-request-merges))

Your proposed stack is useful when the layers form sensible review units within one repository:

| PR | Target while reviewing |
| --- | --- |
| Database migration | `staging` |
| Service implementation | Migration branch |
| API integration | Service branch |
| Frontend integration | API branch |

These PRs are separately reviewable, **not automatically independently deployable**: a child includes its parents’ unmerged changes. Merge bottom-up; after a squash, retarget and, where necessary, rebase branches you own, then rerun checks against their actual new bases. Each landed state must remain supported—for example, an additive migration must still work with the existing application. A layered stack is optional. Across repositories, use linked PRs, exact dependency versions and an explicit release/adoption order; a target-branch stack is not a cross-repository dependency mechanism. ([GitHub stacked PRs](https://docs.github.com/en/pull-requests/tutorials/stack-code-changes-in-pull-requests), [Google integration guidance](https://google.github.io/eng-practices/review/developer/small-cls.html))

Make readiness explicit: **independent** means the PR can merge and, where configured, deploy after checks; **dependent** means it can be reviewed early but must wait for named prerequisites before merging. Once prerequisites land in the target branch, rerun checks against the updated integration state. Cross-repository prerequisites must be available as the pinned published versions the consumer uses, not merely merged PRs. Every merge into staging must leave a supported, releasable state; passing tests on a stacked branch does not prove independent deployability.

Keep the organization’s imperative, no-prefix commit convention and PR labels. Explain why where needed, and review the final squash message so history describes the outcome rather than review fixes. Conventional Commits is an available tooling convention, not an option under the current organization rule; adopting it requires a deliberate policy/tooling change. Labels can categorize release notes without introducing another classification scheme. ([Google descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html), [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), [GitHub release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes))

The recommended flow distinguishes temporary feature history from long-lived branch ancestry:

| Transition | Authorization | Result |
| --- | --- | --- |
| Feature PR → `staging` | Eligible agent review/merge after checks | Usually squash; automatic staging prerelease when deliverables change |
| `staging` → `master` | Human promotion only | Ordinary merge; automatic stable release after checks |
| `master` → `staging` synchronization | Eligible staging process | Ordinary merge carrying production-only changes back |

Use ordinary merges between long-lived branches because repeated squash merges lose useful shared ancestry and can repeat conflicts. Synchronize production-only fixes, version edits or conflict resolutions back into staging. A production promotion reviews the accumulated approved changes and release inputs; it should not inherit an implementation-PR line cap. ([Git FAQ](https://git-scm.com/docs/gitfaq#_merging_and_rebasing))

Staging needs a distinct artifact channel: for example, `1.4.0-staging.123`, explicitly published to an npm staging tag and marked as a GitHub prerelease. Stable publication uses `1.4.0`. Clearing GitHub’s prerelease flag does not change the package version. Repositories without deliverables need checks, not artificial package releases. ([SemVer](https://semver.org/spec/v2.0.0.html), [npm channels](https://docs.npmjs.com/adding-dist-tags-to-packages/))

Deployment should select exact package versions and image digests in a reviewed manifest. Production consumes that selection rather than resolving newer dependencies after approval. Promote tested image bytes when possible; rebuild and test when stable versioning changes the artifact. Producer publications and application deployment remain separate promotions, each with its own human decision. ([Docker digests](https://docs.docker.com/reference/cli/docker/image/pull/#pull-an-image-by-digest-immutable-identifier))

The implementation must coordinate branch defaults, protections, workflow triggers and release guards. Inspected tooling still uses `main` and a separate release-environment approval. No live cutover or release occurred in this work. Shared-account use does not authorize an agent to perform the human-only promotion; that distinction remains an explicit behavioral rule. ([Inspected release workflow](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/releases/package.yml))
