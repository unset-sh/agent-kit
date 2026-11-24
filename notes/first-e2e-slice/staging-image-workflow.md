# Staging image workflow (step 8): findings

Tooling pull request: https://github.com/unset-sh/tooling/pull/26, adding
`.github/workflows/image-staging.yml` (source `workflows/shared/image/staging.yml`). Written 2026-11-24.
Nothing has been pushed to GHCR or attested yet: that first happens when a caller merges into staging.

## Plan and visibility

- `unset-sh/backend` and `unset-sh/web` were public on 2026-11-24, so the approved design holds: on Free,
  Pro and Team, artifact attestations exist for public repositories only (github/docs
  `data/reusables/gated-features/attestations.md`). If either goes private, attestations stop unless the
  organisation moves to Enterprise Cloud. Stop and tell Alex before that happens.

## Where the build differs from the prompt

- **The prompt's verify command is too weak.** `gh attestation verify ... --owner unset-sh` accepts an
  attestation made for any repository of the org, and `--signer-workflow` without `--signer-digest`
  accepts any commit of tooling on any branch (cli/cli v2.105.0 `pkg/cmd/attestation/verify/policy.go`).
  Deployment should run `--repo unset-sh/<repo> --signer-workflow
  unset-sh/tooling/.github/workflows/image-staging.yml --signer-digest <tooling commit the caller pins>
  --source-ref refs/heads/staging --source-digest <commit> --deny-self-hosted-runners`. In v2.105.0
  `--signer-workflow` is anchored at both ends. Older versions matched the name as a prefix.
- **`actions/attest` v4.2.2 writes an artifact storage record by default**, which needs
  `artifact-metadata: write`. That permission is outside Alex's approved four, and the action only warns
  without it. The workflow sets `create-storage-record: false`.
- **OCI layout folder, not an archive.** BuildKit's `tar=false` means the publish job reads plain files and
  unpacks no tar built by caller code.
- **The build gets no package token.** The backend has no `@unset-sh` dependency yet. A Dockerfile that
  needs one needs a reviewed BuildKit secret, not `packages: read` on the job.
- **The push tool is crane v0.22.1**, pinned by SHA-256. skopeo on runners is an unpinnable apt package,
  and `docker push` needs a tag.
- **Pins observe the 7-day wait.** BuildKit is v0.35.0 (2026-11-11), not v0.35.1 (2026-11-19).

## GHCR facts and open items (unverified until the first run)

- GitHub's docs say a `GITHUB_TOKEN` push links the new package to "the repository that contains the
  workflow". For a reusable workflow, whether that means the caller (whose token it is) or tooling is not
  stated. Expect the caller, and check the package page after the first run.
- New organisation packages start private. Alex must choose visibility, check the repository link, and
  give only the caller **Write** under Manage Actions access. Assistants do not change package settings
  (cloud proxy refuses settings writes; these are owner decisions). Steps are in tooling
  `docs/build-staging-images.md`.
- `GITHUB_TOKEN` cannot push to an existing package of the same name that is not connected to the
  repository. A first-run permission error should start with that check.
- `actions/attest` reads registry credentials from `~/.docker/config.json` only (its bundled
  `@sigstore/oci`), so the workflow signs in with `docker login`. A runner with a credential helper
  configured would break that. Not seen on `ubuntu-24.04`, unverified.

## What the separate review found (2026-11-24)

The review is in the project's shared files (`tooling/review-pr26.md`). Fixed in tooling commits `ea836ca`,
`449027b` and `afae162`.

- **F1: the digest-pin check read less than BuildKit.** Four Dockerfiles passed the check while BuildKit
  v0.35.0 pulled an unpinned image: a quoted `"<<EOF"` taken for a heredoc, a `#!` line before
  `# syntax=` (`DetectSyntax` drops it), an escape in a flag name (`--fr\om=`), and quotes inside
  `--mount`. Reading `frontend/dockerfile/parser` at v0.35.0 found five more, each confirmed against that
  BuildKit locally: continued lines joined with a space (BuildKit adds none, so `COPY --fr\` + `om=x`
  is `--from=x`), `\\` at a line end taken for a continuation, a lone CR after a heredoc's name
  (`trimNewline` trims every trailing CR), an indented `# escape=` (the parser strips leading space
  first), and whitespace Go and JavaScript disagree on (`extractBuilderFlags` tests single bytes, so a
  0xA0 byte inside `à` splits a flag). The check now mirrors BuildKit for line ends, joining and
  directives, and refuses the rest: a `#!` first line, odd whitespace, unknown instructions, flags with
  quotes, backslash, backtick or non-ASCII, and `<<` outside the plain heredoc forms.
  **Lesson:** a second parser in front of a real one must refuse every shape it does not read the same
  way, and the only way to find them is to read the real parser's source and test it.
- **F2: `push-to-registry: true` writes a tag.** `actions/attest` v4.2.2 (`@sigstore/oci`
  `#createReferrersIndexByTag`) falls back to the OCI referrers tag `sha256-<image hex>` when the registry
  has no referrers API, and GHCR has none. That tag names an index of attestations and moves when another
  is attached. `gh attestation verify` reads GitHub's API unless `--bundle-from-oci` is given, so nothing
  needs it. Whether to keep the registry copy is open with Alex; the docs now describe the tag.
- **F3: Re-run failed jobs cannot rerun publish alone**, because the artifact name carries the run
  attempt. The guide says to use Re-run all jobs. FROM and `RUN --mount from=` no longer take a stage
  number; only `COPY --from` does.

## Local evidence

Built a scratch-based image with BuildKit v0.35.0 to `type=oci,tar=false,rewrite-timestamp=true`.
`index.json` held one manifest with its platform, and an empty `ingest/` folder sat beside it (the
workflow removes it). A second build gave the same digest. `crane push <layout> <repo>@<digest>` to a
local `crane registry serve` created no tag (the referrers tag above comes from `actions/attest`), and
the manifest read back hashed to the digest.
