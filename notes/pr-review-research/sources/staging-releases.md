# Separate automated staging releases

Sources consulted on 2026-11-22. The user has chosen `staging` as the default development branch and `master` as the stable release branch. AI may review and merge eligible staging PRs; a human alone performs `staging` to `master` promotion. That merge is the sole production approval, with release and deployment automatic afterward. The user accepts a shared agent instruction for the human identity distinction. The recommendations below implement that intent; they are not claims that this workflow is already enabled.

## How should staging and stable releases be distinguished?

### Takeaway

Give staging its own automatic prerelease channel. A branch, a package prerelease version, a registry channel alias, a GitHub prerelease, and a running environment are separate things that must agree; naming the branch alone does not establish a release channel.

### Cited Findings

- SemVer supports prerelease suffixes such as `1.4.0-staging.123`, which have lower precedence than `1.4.0`. Build metadata after `+` does not affect precedence. Released package contents must not change; publish a new version for changed content. — [SemVer 2.0.0, rules 3, 9–11](https://semver.org/spec/v2.0.0.html)
- npm publishes to the `latest` dist-tag by default. Publishing with an explicit tag, such as `--tag staging`, selects another distribution channel. A dist-tag can later be assigned to another version, so it is a discovery pointer rather than an immutable dependency selection. — [npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages/)
- GitHub supports marking a release as a prerelease, including through the CLI. With immutable releases enabled, release assets and the tag cannot be replaced after publication, although title, notes, and prerelease/latest status can still change. — [GitHub release management](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)

### Inferences

- Recommended staging release: successful checks on a merged `staging` revision produce a unique version such as `1.4.0-staging.123`; publish with the staging registry tag and GitHub prerelease status. Record the full source commit and artifact digest in release provenance. Allocate sequence values per producer; do not assume retries may overwrite an existing version.
- Recommended stable release: after the human promotion, successful `master` checks publish `1.4.0` through the stable channel. Do not turn `1.4.0-staging.123` into the stable version merely by clearing GitHub's prerelease flag: the package's SemVer suffix has not changed.
- Stable consumers use exact approved stable versions. Staging consumers explicitly opt into exact staging versions. A staging alias may help automation discover candidates, but the resulting consumer lockfile or deployment manifest should record the resolved immutable selection.
- Release when relevant deliverables change, not necessarily on every documentation commit. A package repository needs a prerelease artifact channel; it does not need its own live server. Repositories without published deliverables need CI and branch policy, not a meaningless package release.

### Gaps

- The exact version allocation scheme and per-repository release triggers are not yet implemented or tested. These examples are a proposed convention, not an existing org contract.

## How should deployment compose releases and preserve what was tested?

### Takeaway

Let producer repositories publish artifacts and let `deployment` select an explicit set of them. Automate staging rollout; promote a reviewed set to production without resolving newer dependencies during the production run.

### Cited Findings

- Docker pulls by digest select an exact immutable image. Tags can resolve to newer content; a digest is the appropriate identifier for ensuring the same image is used again. — [Docker image pull by digest](https://docs.docker.com/reference/cli/docker/image/pull/#pull-an-image-by-digest-immutable-identifier)
- GitHub environments can restrict permitted deployment branches and tags; these restrictions match the workflow's `GITHUB_REF`. Environment secrets are available only to jobs that reference that environment. A required reviewer is optional, separate from these restrictions. — [GitHub deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- The currently checked organization rules require exact dependency versions and full Action SHAs, and put shared agent policy in agent-kit. This local checkout still contains the older owner-approved release-environment model. — [agent-kit rules at the inspected base](https://github.com/unset-sh/agent-kit/blob/5792624b2215f3d9d59ae6798b3d1df389af5b1a/rules/org.md)

### Inferences

- Recommended `deployment/staging`: a committed manifest identifies exact producer versions/image digests and compatible configuration/migration versions. Automation can update that manifest through eligible staging PRs, validate the combined application, and deploy it to the staging environment. Backend/web builds remain producer responsibilities; deployment owns composition and rollout.
- Recommended `deployment/master`: human promotion approves the manifest. The subsequent deployment consumes that exact manifest. It must not resolve `latest`, a mutable staging alias, or the current head of another repository after approval.
- Use separate staging destinations, credentials, databases, buckets, and external-service configuration as appropriate. Environment names alone do not isolate services or accounts. Production access remains restricted to the approved production workflow even without a second reviewer prompt.
- Prefer promoting an already tested container digest when feasible. Record the staging build's real source SHA and its connection to approved master content; a merge commit has a different SHA. Verify tree/build-input equivalence rather than relabeling provenance. If a stable version changes packaged bytes, embedded version information, dependencies, or build settings, build and test the resulting stable artifact instead of claiming it is byte-identical to the staging artifact. npm prerelease-to-stable package version changes are one common example.
- Keep package release and whole-application rollout distinct. Human merges in producer repositories approve their stable publications; the human merge in deployment approves the selected application combination. This does not provide one transaction or one total click across all repositories. Under the user's per-repository rule, these are separate promotions, each with one approval and no extra environment approval.

### Gaps

- No live staging environment, storage separation, credentials, artifact promotion logic, or cross-repo compatibility manifest was verified in this research. A separate implementation must establish them before automation is described as operating.

## What must the automation account for, and what exists now?

### Takeaway

The intended workflow is feasible, but current tooling is still designed around `main` and a release-environment approval. The migration must update triggers and release checks together, and must deliberately connect workflow stages.

### Cited Findings

- In the inspected tooling checkout, `releases/package.yml` rejects any event except a push to `refs/heads/main`; its publishing job uses the `release` environment. `scripts/release-gate.mjs` requires the owner reviewer and main-only branch access. — [package workflow at inspected commit](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/releases/package.yml), [release gate](https://github.com/unset-sh/tooling/blob/838a965d14d0887291046c279422becb7b0228f3/scripts/release-gate.mjs)
- GitHub's `release: published` event covers both stable and prereleases. `prereleased` does not cover prereleases published from drafts. Scheduled workflows run on the default branch, which will become staging under the accepted model. — [GitHub workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- Most events caused by the repository `GITHUB_TOKEN`, including pushes and release events, do not start another workflow. Explicit `workflow_dispatch` and `repository_dispatch` are exceptions. Current documentation also says automated PR creation/update with that token starts PR workflows in an approval-required state; this may introduce a manual step if the pipeline is designed around it. — [GitHub workflow triggering](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- Reusable workflows support centrally maintained execution and outputs used by downstream caller jobs. — [GitHub reusable workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations)

### Inferences

- Put shared deterministic release mechanisms in tooling, with small producer-owned callers. Keep distinct staging and production eligibility checks, output channels and environment destinations. Preserve artifact validation, least-privilege job separation, pinned helpers and provenance when replacing the old manual environment approval.
- For a pipeline that creates its own release with `GITHUB_TOKEN`, use a downstream job/reusable workflow or an explicit supported dispatch rather than expecting that release to trigger a second workflow. If AI staging merges use `GITHUB_TOKEN`, account for the same suppressed push-event behavior. Automation using another already-authorized identity may behave differently; no new identity or credentials are required by this policy proposal.
- A human-only merge rule in the shared instructions should explicitly forbid agents from merging or enabling auto-merge on master promotions even when using the owner's GitHub login. This is a behavioral control; it cannot prove actor identity to GitHub when credentials are shared. Other machine checks can still enforce staging as the only promotion source and master as the only production source.
- Document and test refusal of staging production publication, wrong promotion source, altered/unapproved artifact selection, reused release version, and malformed outputs. Make reruns idempotent or fail clearly; never overwrite a published artifact to recover from partial publication.

### Gaps

- This was a read-only inspection of the specified local tooling clone plus official documentation, not a fresh live GitHub settings audit. No workflows, branches, settings, credentials, releases, or environments were changed. The intended automatic staging release is not established by these notes.
