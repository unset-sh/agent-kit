# Commit hygiene and PR merge strategy

Consulted: 2026-11-22. Primary documentation only. Recommendations below are implementation judgments for the requested staging/master workflow, not universal Git requirements.

Scope clarification: the numerical PR gate belongs to the read-only original app, not the current organization rules. The current organization convention prohibits Conventional Commits prefixes by default; the research discussion below does not authorize changing that convention.

## What should replace a rigid PR line cap?

### Takeaway

Use one coherent, reviewable change as the unit of a PR; use working logical steps as the unit of retained commits. Line count can signal review difficulty, but cannot establish it by itself. [Git workflows](https://git-scm.com/docs/gitworkflows#_separate_changes); [Google small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)

### Cited Findings

- Git recommends logical steps that work without later commits and pass tests; this improves review, blame, and bisection. Imperfect intermediate steps can be reorganized before publication. [Git workflows](https://git-scm.com/docs/gitworkflows#_separate_changes)
- Google defines a small change by cohesion, necessary context, related tests, and a working system after integration. It explicitly rejects a hard universal size boundary; file spread and generated/mechanical changes alter review effort. Significant refactoring should usually be separate from behavior changes. [Google small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- Git supports folding fixup commits into their target using autosquash and running checks after each resulting commit through rebase's exec option. [Git rebase](https://git-scm.com/docs/git-rebase)
- Untestable commits can be skipped during bisection, but adjacent skipped commits may prevent identifying the precise first regression. [Git bisect](https://git-scm.com/docs/git-bisect#_bisect_skip)
- Revert creates a new commit reversing an earlier patch. Reverting a merge has special effects on later merges and requires choosing the mainline parent. [Git revert](https://git-scm.com/docs/git-revert)

### Inferences

- Proposed replacement: “Keep each PR focused on one reviewable outcome. Split independent changes and large preparatory refactors. Include necessary tests and documentation. Explain unusually broad changes and provide a review order; do not split a coherent change merely to satisfy a line count.” This replaces the 800-line cap without removing reviewer judgment. [Google small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- Require the final integration candidate to pass repository gates. Every commit preserved on an integration branch should be coherent and buildable without later fixes. WIP/fixup commits are acceptable while working; squash them at merge or clean them before preserving the series. Requiring every temporary checkpoint to be green adds work without improving the retained history. [Git workflows](https://git-scm.com/docs/gitworkflows#_separate_changes); [GitHub merge strategies](https://docs.github.com/en/pull-requests/reference/pull-request-merges)
- Aim for a change that can be reverted without unrelated losses, but document dependencies and operational rollback for migrations. A source-code revert alone does not establish a safe deployed-state rollback. [Git revert](https://git-scm.com/docs/git-revert)

### Gaps

- These sources establish no evidence-based universal replacement number. Selecting another mandatory line threshold would be a local policy choice.

## How should commit descriptions and PR labels work together?

### Takeaway

Require clear descriptions of the change and its reason. Conventional Commits is useful when a chosen release tool consumes it; it is not a prerequisite for good history or label-based release notes. [Google CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html); [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/); [GitHub release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)

### Cited Findings

- Git's own contribution guidance recommends a short imperative subject and a body explaining the problem, solution, and relevant decisions. Its subject-length guidance is explicitly soft, and existing repository conventions matter. [SubmittingPatches](https://git-scm.com/docs/SubmittingPatches)
- Google recommends a specific, standalone first line, then enough context to explain why. Description tags are optional, and the description should be updated when review changes the implementation. [Google CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)
- Conventional Commits defines machine-readable types: fix maps to patch, feat to minor, and a breaking-change marker to major. Other types do not inherently select a SemVer increment. [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- GitHub can organize generated release notes into categories using PR labels; this documentation describes categorization, not automatic version selection. [GitHub release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)

### Inferences

- Proposed policy: “Write a short, specific imperative subject in the repository's existing style. Explain why when it is not obvious; include meaningful validation and compatibility context. Review the final PR title/body and squash message before merge.” Avoid mandatory empty prose for trivial edits. [SubmittingPatches](https://git-scm.com/docs/SubmittingPatches); [Google CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)
- Conventional Commits is optional as a general engineering choice, but the organization currently requires no prefixes by default. Keep its existing imperative subjects and PR labels; adopting prefixes needs a deliberate policy/tooling decision. Select one authoritative classification mechanism. If labels drive releases, preserve feature PR classifications through promotion; a generic promotion title cannot substitute for release impact. [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/); [GitHub release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)

### Gaps

- Existing repositories' release tools and version-selection inputs were not inspected for this research. Do not change their message format or infer release bumps until those consumers are identified.

## Which merge method fits feature PRs and staging-to-master promotions?

### Takeaway

Squash short-lived feature PRs into staging when each represents one coherent change. Preserve ancestry with ordinary merge commits for repeated staging-to-master promotions and master-to-staging synchronization. [GitHub merge strategies](https://docs.github.com/en/pull-requests/reference/pull-request-merges); [Git FAQ](https://git-scm.com/docs/gitfaq#_merging_and_rebasing)

### Cited Findings

- GitHub describes squash as suitable for one logical change containing fixups; merge commits preserve useful individual commits, while rebase preserves a linear sequence. Reusing a squashed feature branch can expose already-integrated commits and repeat conflicts. [GitHub merge strategies](https://docs.github.com/en/pull-requests/reference/pull-request-merges)
- Git's FAQ recommends ordinary merge commits for repeated integration between long-lived branches. Squash fails to advance their common ancestry, causing repeated differences and potentially repeated conflict resolution. [Git FAQ](https://git-scm.com/docs/gitfaq#_merging_and_rebasing)

### Inferences

- Default to squash for disposable feature branches into staging; begin subsequent work from updated staging. If a meaningful multi-commit series needs preservation, review its commit boundaries and tests explicitly rather than retaining incidental WIP history. [GitHub merge strategies](https://docs.github.com/en/pull-requests/reference/pull-request-merges)
- Promote staging to master using a merge commit, never squash or rebase the long-lived branches. Merge master back when it contains content absent from staging, including hotfixes, version edits, or conflict resolutions. Synchronizing after every promotion is a simple local convention, but a content-identical promotion does not technically require it for correct future merges. [Git FAQ](https://git-scm.com/docs/gitfaq#_merging_and_rebasing)
- The requested model can retain one human approval at master promotion, followed by automatic release. Commit strategy itself provides no access-control enforcement; the release process must consume the approved resulting revision and its version metadata. This recommendation follows the user's workflow decision, rather than a requirement imposed by Git. [GitHub merge strategies](https://docs.github.com/en/pull-requests/reference/pull-request-merges)

### Gaps

- This research does not verify live branch protection, CI freshness enforcement, merge permissions, or release triggers. Shared human/agent account use remains a behavioral boundary unless a distinct identity or external approval mechanism is introduced.
