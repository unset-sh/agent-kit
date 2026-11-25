# One admin panel for Unset: proposal

Written 2026-11-25 for Alex (thread "Compare the platform architecture with our monorepo"). He wants "a unified
dashboard" over the services Unset runs: "OpenFGA, Better Auth, and PDS, Ozone all offers some dashboard to manage
them". Those services keep running as they are ("we don't want to rewrite the whole code, but we will call their
API"), and Grafana shows what is happening in the back. He wants "a fully inclusive dashboard so we would have
everything under that same admin panel". It is an internal tool for Unset, not a hosting product.

Nothing is built yet. A decision record follows once Alex has read this.

## 1. What Alex decided (2026-11-25, 18:43Z to 18:48Z)

1. **`apps/admin`**, a SvelteKit app on its own private origin, also locked behind Pangolin.
2. **A separate admin process** holds the privileged credentials.
3. **`services/` at the monorepo root** holds each service's configuration.
4. **Operator rights come from OpenFGA**, with two-factor sign-in required.
5. **The Elysia app is `apps/api`** ("Feel like api describe more what it does"), renamed in unset-sh/unset#35.

## 2. What each service already offers

| Service     | What an admin can do through its API                                                                                                                  | How a call is authorised                                                                                         | Source                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Better Auth | Create, list, get, update users; set role and password; ban and unban; list and revoke sessions; impersonate; remove; `has-permission`                | Its own `role` column (`adminRoles`, default `admin`) or `adminUserIds`; session cookie                          | [Admin plugin](https://better-auth.com/docs/plugins/admin)                                                                   |
| PDS         | Account info and search, takedown (`updateSubjectStatus`), handle, email, password and signing key changes, invites, `sendEmail`, account deletion    | "Admin required" (the PDS admin password; the Basic-auth form is unverified until a test shows it)               | [`com.atproto.admin`](https://mintlify.com/bluesky-social/atproto/lexicon/atproto/admin)                                     |
| Ozone       | Moderation queue, events and actions, team membership (`tools.ozone.*`)                                                                               | Moderators sign in with a DID in `OZONE_ADMIN_DIDS`; `OZONE_ADMIN_PASSWORD` works as an API key for some actions | [Ozone](https://github.com/bluesky-social/ozone/), [HOSTING.md](https://github.com/bluesky-social/ozone/blob/main/HOSTING.md) |
| OpenFGA     | Read and write tuples, check, expand, list objects, read models                                                                                       | Preshared key                                                                                                    | [OpenFGA API](https://openfga.dev/api/service)                                                                               |
| Grafana     | Its own dashboards; embedding needs `allow_embedding`, which turns off its clickjacking protection                                                    | Its own sign-in, or an auth proxy in front                                                                       | [Embedding](https://grafana.com/blog/how-to-embed-grafana-dashboards-into-web-applications)                                  |

Ozone is a complete product of its own: a web UI, a backend, a Postgres database and a labeler account with its own
signing key. Creating that account and key is Alex's job by hand (organisation rule on keys).

## 3. The layout

```text
apps/
  admin/          SvelteKit (sv create): the panel's screens, private origin behind Pangolin
  api/            Elysia, one codebase, one image, three processes:
    src/main.ts     the member API that web calls (today's server)
    src/admin.ts    the admin API that apps/admin calls; the only process given admin credentials
    src/public.ts   later: api.unset.sh
  web/
packages/
  access/         the OpenFGA model, its tests and may(), as today
services/
  grafana/        dashboards and provisioning
  prometheus/     scrape and alert rules
  ozone/          settings that are the same in every environment
  openfga/        server settings, if any (the model stays in packages/access)
```

**Why one API app with several entry points.** The admin API needs the same Better Auth instance, the same
domains and the same adapters as the member API. Splitting it into its own app would first mean moving all of that
into new packages. Separate entry points give the separation that matters: each process serves only its own routes
and receives only its own secrets. The server already works this way for `migrate-cli.ts`. A dependency-cruiser rule
stops `main.ts` from reaching admin modules or admin adapters. Each entry point gets its own Eden type, so web never
sees an admin route. Split into a separate app only if the admin side ever needs different dependencies or its own
release schedule.

**Why `services/` holds only shared configuration.** `unset-sh/deployment` still owns each environment: image
digests, per-environment values and secret references. `services/` holds configuration that is the same in every
environment and changes with the product, such as Grafana dashboards for the API's metrics. This moves part of
deployment's responsibility, so the monorepo and deployment `CLAUDE.md` files and `repos.json` change in the same
pull request that adds the folder.

**Why the OpenFGA model stays in `packages/access`.** The model, its tests and `may()` change together, and both the
API and the worker use them. `services/openfga/` takes only server settings.

## 4. How a request flows

```text
operator's browser -> Pangolin -> apps/admin (SvelteKit server side)
  -> apps/api admin process: Better Auth session + 2FA, then may(operator, ...) in OpenFGA
    -> adapter -> Better Auth | PDS admin API | Ozone API | OpenFGA API
```

The browser never calls a service. Pangolin is an extra lock, not the check: the admin process still verifies the
session, the second factor and the OpenFGA relation on every request, and fails closed.

## 5. One panel for everything

- **Native screens over each API**, built in this order: accounts (Better Auth users with their PDS status), then
  sessions and bans, then access (who holds which OpenFGA relation, read-only first), then PDS actions, then
  moderation (Ozone). Grants go through our own domain services so OpenFGA tuples stay in step with the database;
  the panel never edits raw tuples.
- **Ozone moderation comes last**, because its screens are the largest piece. Its own UI stays available from the
  panel until ours covers what moderators need.
- **Grafana is embedded, not rebuilt**: served under the admin origin behind an auth proxy, so there is one sign-in,
  with `frame-ancestors` limited to that origin. Viewer role only.

## 6. Open questions to settle before building

1. **Better Auth's admin plugin decides admins by its own `role` column**, and its docs show no hook for an outside
   check. Spike: can the admin process call `auth.api` admin functions server-side with OpenFGA as the only gate,
   or does the plugin also need a role? If it does, the role must be written from OpenFGA, never edited on its own.
2. **Ozone actions should carry the moderator's identity**, not the shared admin password, so the audit log names
   who acted. Check how Ozone accepts calls on a moderator's behalf.
3. **PDS admin authentication**: confirm the Basic-auth form against the pinned PDS source.

## 7. First step

A read-only Accounts page: `apps/admin` from `sv create`, `src/admin.ts` with one route group, the operator check
(session, 2FA, OpenFGA), and a list of Better Auth users next to their PDS account status. It proves the admin process,
the operator check and question 1 before anything can write.
