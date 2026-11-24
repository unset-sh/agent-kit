# org-0019. Cerbos reads backend's policies from backend's own image

Status: accepted (2026-11-24, Alex, on a decision card asking "Choose how Cerbos gets backend's policies at run
time": he chose "Inside backend's image" over "A separate policy image"). It supersedes point 7 of org-0018 in how
the policies ship; the rest of org-0018 stands.

## Context

org-0018 point 7 had backend build a second image, its policies on the pinned Cerbos image, so a release and its
policies carry one version. Tooling's staging image workflow builds one image per repository, named after it
(`ghcr.io/unset-sh/staging/<repository>`), so a second image needed a change to that workflow and a second package
to secure and attest. The same goal can be met without either.

## Decision

1. **Backend's image holds `policies/`** at `/app/policies`, without the test suites. The tests still run in
   `bun run check`.
2. **Deployment runs the official Cerbos image, pinned by digest, and mounts that folder of the selected backend
   image into it read-only** (a Docker image mount, `type=image` with `image-subpath=app/policies`). One backend
   digest selects the code and the policies it was tested with; nothing is copied by hand.
3. The rest of org-0018 point 7 is unchanged: policies live in backend's `policies/` with their tests, checked by
   the exact `cerbos` binary package run with Bun.

## Consequences

- No new image, workflow input or registry package. The backend image grows by the policy files.
- The environment needs a Docker Engine and Compose that support image mounts. Checked by hand on Docker 29.9.3
  with Compose 5.7.1 (unset-sh/backend#25): the PDP ran as uid 65532, read-only, with no network, reading policies
  from the image mount and serving gRPC on a socket in a tmpfs volume only backend's uid could open.
- A policy change reaches an environment only with a new backend image, like a code change.
