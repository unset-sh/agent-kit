# org-0023. Deployment moves into the product repository

Status: proposed (2026-11-25). Alex, 22:12Z: "if a repository is going to depend on another repository, it's a good
sign that they should be in the same mono repository. So that's why my decision of having like service under deploy
and with the environment, maybe like the best way forward." Earlier the same evening (22:05Z) he wanted "something
that describe like whatever we're going to use to put the stack up", with each service "with its own folder", and
(22:10Z) agreed to "group them by service, not by runtime".

## Context

org-0020 moved web, backend, rendering and brand into `unset-sh/unset` and kept deployment separate (point 2).
Deployment's `main` holds only a licence and a readme. Its `staging` holds the local stack
(`environments/local/compose.yaml` with postgres, migrate, backend and web, a Postgres bootstrap script), the
internal TLS and local secrets scripts, and two runbooks. That is 16 commits, none promoted.

Every change to an app's image, settings or health contract has a matching deployment change, the same lockstep
that org-0007 named as a reason to revisit a boundary. The admin panel (`notes/admin-panel/proposal.md`) adds more
third-party services to run (Ozone, Grafana, Prometheus, Tap), each with settings that change with the product.

Self-hosted projects with a monorepo keep this in it: Immich's `docker/` ("Docker compose resources for dev, test,
production", https://docs.immich.app/developer/directories) and Supabase's `docker/`, with one compose file plus a
folder per service (https://supabase.com/docs/guides/self-hosting/docker). golang-standards/project-layout calls the
folder `/deployments` or `/deploy` (README, `master`).

## Decision

1. **`unset-sh/unset` gets `deploy/`**, owning what `unset-sh/deployment` owned under org-0007: topology, selected
   images by digest, runtime configuration references, rollout order, readiness and recovery.
2. **Grouped by service, not by runtime.** `deploy/services/<name>/` holds one service's compose file and its
   settings (`traefik`, `postgres`, `openfga`, `pds`, `tap`, `ozone`, `grafana`, `prometheus`, and our own `api`,
   `web`, `admin`, `worker`). A compose file runs on Docker and on Podman, so there is no `docker/` and `podman/`
   copy of each service. Runtime-specific files (Podman's systemd units, if adopted) sit beside the compose file in
   the same service folder.
3. **Environments apart from services.** `deploy/environments/<env>/` (`local`, `staging`, later `production`) says
   which services and image digests run there, with that environment's values and secret references, never secret
   values.
4. **History is kept.** Deployment's `staging` is merged in under `deploy/` as org-0020 did for the apps.
   `environments/local/` keeps its place; its services split into `deploy/services/` in a later, separate change.
5. **Production stays guarded.** Changes under `deploy/environments/staging/` and `production/` need their own
   review rule, so a product pull request cannot change an environment unnoticed. The release approvals of org-0010
   and org-0012 are unchanged.
6. **The root `compose.yaml` stays** as the test services (OpenFGA, Postgres) that `bun test` needs. It is not an
   environment.

This supersedes org-0020 point 2 for deployment only. lexicons, profile-recipes, pds, tooling, agent-kit, `.github`
and docs stay separate.

## Consequences

- `unset-sh/deployment` is archived after the merge, on Alex's word (organisation rule on repositories). Its open
  pull requests are moved or closed first.
- `.github`'s `repos.json` moves deployment's responsibility to `unset`, and the monorepo's `CLAUDE.md` changes
  "Does not belong here: environments and rollout".
- The review rule in point 5 needs a ruleset or CODEOWNERS on `unset-sh/unset`, which Alex sets up.
- The Pangolin route for the admin site and the staging home lab definitions are written in
  `deploy/environments/staging/`.
- Monorepo CI runs on every deploy change, and a deploy-only change still waits for every app's check.
