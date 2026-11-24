# One repository for the Unset product: proposal

Written 2026-11-24 for Alex, revised the same day after his review. He asked (thread "Plan a move to a
monorepo"): "It should be like a mono repo ... some repository heavily depend on each other's", using "those tools
that like each framework that we're using is providing to create those workspace", named by app, with OpenFGA
planned in, checked against "the official doc of each one and see where like things overlap".

His review, 2026-11-24 17:23Z, set these: brand becomes a package like rendering; `apps/server` instead of
`apps/api`, the API living inside it as its own Elysia group; `apps/worker` as "the one home for the background
jobs", the indexer and OpenFGA's background work inside it; Drizzle for the database; where tools overlap, "follow
what Bun says, because Elysia is like a framework of Bun"; SvelteKit runs "inside wherever it belongs"; workspace
packages for shared code; the catalog for versions; the isolated linker; `bunfig.toml` at the root; Dockerfiles in
each app; `sv create`'s ESLint (and Prettier) add-ons instead of Biome; and `bun test` should run at the root.

Nothing has moved. The decision is drafted as
[org-0020](../../skills/org-decisions/records/org-0020-product-apps-share-one-repository.md), status proposed.

## 1. The short answer

- **One new repository, `unset-sh/unset`**, holding `apps/web`, `apps/server`, `apps/worker`, and the packages
  `brand`, `rendering`, `db` and `authz`. Later `apps/mobile`.
- **Everything else stays separate**: deployment, lexicons, profile-recipes, pds, tooling, agent-kit, `.github`, docs.
- **Laid out by the tools**: Bun workspaces, `bunx sv create` for web, `bun create elysia` for server, Drizzle Kit
  for the database. Where they disagree, Bun wins (section 4).
- **History kept**: every old commit keeps its id. The old repositories are archived, not deleted.
- **Do it before slice 2.** Web, backend and rendering hold about 26,000 lines today, tests included.

## 2. What goes in, what stays out

| Repository | Goes in? | Why |
| --- | --- | --- |
| backend | **Yes**, as `apps/server` (and `packages/db`) | Web's only server dependency; every route change is two repositories today. |
| web | **Yes**, as `apps/web` | Same. The pinned `app.d.ts` copy becomes a workspace link. |
| rendering | **Yes**, as `packages/rendering` | Used only by product code. Stops being published. |
| brand | **Yes**, as `packages/brand` (Alex, 17:23Z) | Web and rendering use it on every screen. It **keeps publishing** `@unset-sh/brand`, because docs (and pds's theme later) are outside and still need it. Its guide site and gallery come along. |
| deployment | No | It selects image digests CI builds from the product. Inside, every digest bump would rebuild the images it pins, and deploy settings would sit beside product code. Separate, it can roll web and server back independently. |
| lexicons | No | MIT, not AGPL. Its `main` is what the network sees, with its own `drafts` flow. The apps keep a pinned, hash-checked copy. |
| profile-recipes | No | CC0 recipes and outside contributions under DCO. |
| pds | No | A customised upstream image with upstream's cadence; it meets the product only over the protocol. |
| tooling, agent-kit, `.github`, docs | No | They serve every repository and work on `main` alone. |

Name: `unset-sh/unset` (alternative `unset-sh/app`). Creating it is Alex's action.

## 3. The tree

Marked `(tool)` where a scaffolding tool or framework puts it; the rest is ours.

```text
unset/                                   unset-sh/unset
├── package.json                         workspaces ["apps/*", "packages/*"] + catalog of exact versions (tool: Bun)
├── bun.lock                             one lockfile (tool: Bun)
├── bunfig.toml                          install rules once; [test] settings for `bun test` at the root
├── .bun-version
├── tsconfig.json                        shared options; every workspace extends it (tool: Bun workspace layout)
├── eslint.config.js                     one lint config (tool: sv add eslint), reused by `bun lint` later
├── CLAUDE.md, AGENTS.md, .claude/       repository rules and the agent-kit copy, once
├── .github/workflows/                   thin tooling callers: a check per workspace, an image per app
├── docs/                                human docs, exported as one section with a folder per app
├── apps/
│   ├── web/                             bunx sv create apps/web --template minimal --types ts --add eslint
│   │   │                                  --package-manager bun --no-install
│   │   ├── src/routes/  src/lib/  src/app.html  static/  vite.config.ts   (tool: SvelteKit)
│   │   ├── server.ts                    runs the built app on Bun
│   │   └── Dockerfile
│   ├── server/                          bun create elysia apps/server
│   │   ├── src/index.ts                 (tool) composition root; exports `type App`
│   │   ├── src/api/internal.ts          the internal API group web calls; later public.ts (api.unset.sh), xrpc.ts
│   │   ├── src/modules/<feature>/       (Elysia's layout) index.ts routes, service.ts logic, model.ts schemas
│   │   ├── src/modules/session/         our sign-in and session routes: the only door web uses into Better Auth
│   │   ├── src/adapters/auth/           Better Auth itself: its config, plugins, the AT Proto sign-in plugin (as today)
│   │   ├── src/adapters/<tech>/         atproto, egress, ... behind small contracts
│   │   ├── src/utils/                   (Elysia's name) config, log, errors
│   │   ├── openapi.yaml, app.d.ts       generated contracts, drift-checked
│   │   └── Dockerfile                   (Elysia: the Dockerfile lives in the app, built from the root)
│   ├── worker/                          one home for background jobs, one image, one entry per job
│   │   ├── src/indexer/                 Tap indexer
│   │   ├── src/authz-sync/              OpenFGA outbox relay and daily reconciliation
│   │   └── Dockerfile
│   └── mobile/                          later
└── packages/
    ├── brand/                           @unset-sh/brand, still published; its guide site and gallery inside
    ├── rendering/                       @unset-sh/rendering, no longer published
    ├── db/                              @unset-sh/db: Drizzle schema (Better Auth's tables too), migrations/ (tool: Drizzle Kit)
    └── authz/                           @unset-sh/authz: OpenFGA model + tests, the client, the may() port
```

Why these packages exist now: each has two users. `db` is used by server and worker. `authz` is checked by server
and written by worker. `brand` by web, rendering and docs. `rendering` by server and web.

**Server and its groups.** Elysia's own monorepo example names the app `apps/server`. `src/index.ts` mounts groups,
each one plain `new Elysia({ prefix })` chain (backend's rule for Eden): `internal` today, `public` and `xrpc`
later. Features live in `src/modules/<feature>/` and are mounted by the groups that expose them.

**Better Auth.** It runs only in the server, where it runs today. Better Auth itself stays an adapter
(`src/adapters/auth/`), so its types never reach the domain or `app.d.ts`; `src/modules/session/` holds our own
documented routes that wrap `auth.api.*`, and Better Auth's raw routes are not exposed (the API conventions). Its
tables are generated by `auth generate` into `packages/db`, under its own database role. When Redis arrives it
becomes Better Auth's secondary storage for sessions (section 9). Web never imports it.

**Worker and privilege.** One app and one image, but each job runs as its own container with its own database role
and credentials, chosen by its entry command (as backend's `migrate` does today). That keeps org-0007's separate
privileged processes. The OpenFGA server itself is not a worker: it is upstream's image, run by deployment beside
Postgres. Only Unset's background work for it (the outbox relay) lives in the worker.

A comparison with Better-Fullstack's generator (Alex's command, 22:45Z) is in [better-fullstack.md](better-fullstack.md):
same shape, but it conflicts with several decisions and adds a dozen vendors, so it stays a reference.

## 4. Where the official docs overlap, and what we pick

Read 2026-11-24: Bun at tag `bun-v1.4.4` (38afee6): `pm/workspaces`, `catalogs`, `isolated-installs`, `filter`,
`runtime/bunfig`, `runtime/environment-variables`, `test/discovery`, `test/mocks`, `format/index`, `lint/index`,
`guides/ecosystem/sveltekit`, `guides/test/svelte-test`. Elysia `elysiajs/documentation` bb88abe:
`essential/best-practice`, `eden/installation`, `patterns/deploy`, `integrations/drizzle`. SvelteKit `sveltejs/kit`
efced48 (main, ahead of web's 3.2.0): `project-structure`, `adapter-bun`. sv CLI `sveltejs/cli` ced6fcd:
`sv-create`. Drizzle `drizzle-team/drizzle-orm-docs` fb09abd: `pg/connect-bun-sql`, `typebox`,
`typebox-legacy`, `kit-migrations-for-teams`. Better Auth `better-auth/better-auth` c70565a: `adapters/drizzle`.
Rule from Alex: where they disagree, Bun's way wins.

| Overlap | What each says | Pick |
| --- | --- | --- |
| Folder names | Bun: workspaces "by convention" in `packages/`. Elysia's monorepo example: `apps/server` + `packages/`. | `apps/` for what runs, `packages/` for what is imported. Bun accepts any glob; Elysia's example is exactly this. |
| Code shared between apps | Bun: `workspace:*`. Elysia: path aliases are "tricky", Eden turns to `any` if they don't resolve. Kit: `#lib` for the app's own code. | Workspace package names only, no tsconfig `paths`. Eden's alias problem can't happen. |
| TypeScript config | Bun: root `tsconfig.json`, one per package. Elysia: one root, each extends it. Kit: web extends `.svelte-kit/tsconfig.json`. | Root + one per workspace; web extends both (tsconfig `extends` takes a list). |
| Versions | Bun: catalogs. Eden: Elysia "matching the server". | Catalog, exact versions. org-0017's peer check and bump bot go away. |
| Install layout | Bun: new workspaces default to isolated. | Isolated (Alex agreed). Untried with Vite and svelte-check; the proof (section 11) checks it. |
| Database | Drizzle: `drizzle-orm/bun-sql` on Bun's own SQL client. sv: `sv add drizzle` adds it to a SvelteKit app. Elysia: models from tables with `drizzle-typebox`. | Drizzle on Bun SQL in `packages/db`, used by server and worker only, **never by web**, so sv's drizzle add-on is not used. See section 6. |
| Tests | Bun: `bun test` finds every `*.test.ts` below where it runs. sv: Vitest. | `bun test` for every workspace, web included, run from the root. Vitest goes (section 5). |
| Formatting | Bun 1.4.4 ships `bun fmt`: "the same output as Prettier", formats `.svelte` (tried here on 1.4.4: it works). sv: Prettier add-on. | **`bun fmt`** instead of Prettier: Bun's way, Prettier's output, nothing to install. Prettier if Alex prefers it. |
| Linting | Bun: `bun lint` is canary-only today and "works with your existing ESLint ... config". sv: ESLint add-on with Svelte support. | **ESLint** from `sv add eslint`, one root config for every workspace. Move to `bun lint` on the same config once it is in a stable Bun. Biome goes. |
| `.env` files | Bun loads `.env` files automatically. Vite has its own `.env` handling. | No `.env` files in the repository; config comes from the environment and `_FILE` secrets, as now. |
| Running scripts | Bun: `bun run --filter '*' <script>`, in dependency order; `--parallel` for dev. | Root `check`, `test`, `dev` scripts use it. |
| Images | Elysia: Dockerfile in the app, built from the root. Kit: adapter-node, or adapter-bun on `main`. | `apps/<app>/Dockerfile`, context `.`. Web keeps adapter-node + `server.ts` now; adapter-bun is a later, separate look (not known to exist in Kit 3.2). |

## 5. Bun, Vite and the tests, in plain words

- **Bun replaces Node, not Vite.** SvelteKit is built on Vite: `vite dev` and `vite build` are SvelteKit's dev
  server and build, and Vite turns `.svelte` files into browser JavaScript. Bun runs Vite (Bun's own SvelteKit guide:
  `bun --bun run dev` starts `vite dev` on Bun).
- **Bun can test web today.** Tried 2026-11-24 on web at `ceef5ee`, Bun 1.4.4: after `bun run build`, changing each
  test's `from "vitest"` to `from "bun:test"` and running `bun test` passed all 257 tests in 26 files (2.5 s);
  Vitest on the same tree also passes 257. None of web's tests imports a `.svelte` file or a SvelteKit module such
  as `$app/...`; they test plain TypeScript and the built server.
- **So: `bun test` everywhere, Vitest removed**, and `bun test` at the root runs every test in the repository.
- **The limit.** A future test that renders a `.svelte` component or imports `$app/...` needs Vite, which `bun test`
  does not run. Bun's Svelte guide adds a loader plugin, written for Svelte 4 and without SvelteKit's modules. Keep
  logic in plain TypeScript modules, as web does now, and test components in the browser later; if component tests
  become necessary, choose then between a Bun preload plugin and Vitest for that folder alone.

## 6. Drizzle

- **Where**: `packages/db`, `@unset-sh/db`: the schema in TypeScript (`src/schema/`), `drizzle.config.ts`, the
  migrations `drizzle-kit generate` writes as SQL (committed and reviewed), and the migrate entry, run as the
  `migrator` role as today. Server and worker import it; web never does.
- **Driver**: `drizzle-orm/bun-sql`, on `Bun.SQL`, so no `pg` package. Each process opens its own connection with
  its own role (app, auth, migrator, indexer), keeping today's least-privilege roles. Roles and grants stay as custom
  SQL migrations (`drizzle-kit generate --custom`), since table schemas do not express them.
- **Better Auth**: its Drizzle adapter (`better-auth/adapters/drizzle`); `auth generate` writes its tables into the
  same schema. This replaces Kysely and `pg` for Better Auth and raw `Bun.sql` for ours, which org-0015 chose, so
  it needs its own record (org-0021) after a spike.
- **API models are not derived from tables.** Elysia's guide shows API schemas made from tables with
  `drizzle-typebox`. That couples the public contract to the database, which our principles rule out ("do not
  mirror"); `model.ts` schemas stay written by hand. Table-derived schemas are fine inside the server.
- **Which Drizzle.** Stable is `0.45.4` (2026-10-08). The docs, the Bun SQL guide and the TypeBox support are
  written for `1.0.0-rc.6` (2026-11-20, inside the 7-day wait until 2026-11-27), and 1.0 changes the migrations
  folder layout. Recommendation: start on the 1.0 release candidate once it clears the wait, pinned exactly, so we
  never migrate the migration format. Alex's call.
- **No live data**, so the first Drizzle migration is a fresh baseline taken from today's schema
  (`drizzle-kit pull`), checked against the eight current migrations.

## 7. Keeping the parts apart

1. **Package `exports`.** `@unset-sh/server` exports only `./app`, a type; `@unset-sh/db` and `@unset-sh/authz` are
   server-side packages.
2. **One boundary check at the root** (dependency-cruiser, which backend already runs): web may import from
   `@unset-sh/server` only the `./app` type, only in `src/lib/server/`; web never imports `db` or `authz`; no app
   imports another app's files by path; packages never import apps.
3. **The isolated linker**: a workspace imports only what its `package.json` declares.

**Every outside tool stays replaceable** (Alex, 2026-11-24: "I want to keep it easy to replace"). Backend already
enforces this in `.dependency-cruiser.cjs` (`SDK_HOMES`: each vendor package may be imported from one folder only;
`domain-no-vendor`: a domain imports no package). The monorepo keeps that check at the root and extends the list:

| Outside tool | The only place allowed to import it | What the rest of the code sees |
| --- | --- | --- |
| `drizzle-orm`, `drizzle-kit` | `packages/db` | our own functions (`members.findByDid`, `profiles.update`, ...) with our own types |
| `better-auth` | `apps/server/src/adapters/auth/` | the session contract `src/modules/session/` uses |
| OpenFGA's SDK | `packages/authz/src/openfga/` | `may()` and the tuple writes behind it |
| Redis/Valkey (`bun`'s client) | one `redis/` adapter folder | a small key-value or rate-limit port |
| `@atproto/*` | `apps/server/src/adapters/atproto/` | the identity and profile contracts |
| `elysia`, `@elysia/*` | route files only: `src/index.ts`, `src/api/`, each module's `index.ts` | — services and models stay plain TypeScript |
| `bun` built-ins for I/O (`Bun.sql`, `redis`) | their adapter or `packages/db` | — |

So a feature's `service.ts` calls `@unset-sh/db` functions, never a Drizzle query; replacing Drizzle means rewriting
`packages/db` behind the same functions, and nothing else changes. A new tool is a new row in the same pull request.

One overlap to note: Elysia's best-practice example has its `service.ts` call `status()` from `elysia` and run SQL
directly. We keep our rule instead: services return our own results and errors, and only the route file turns them
into HTTP, as backend's problem+json errors do today. That is what keeps Elysia itself replaceable too.

**Eden**: the server keeps generating its declaration-only `app.d.ts` (no Better Auth types) and checks it for
drift. Web takes `"@unset-sh/server": "workspace:*"` and writes `import type { App } from "@unset-sh/server/app"`,
Eden's own pattern with a generated file in the middle, so web's type check never compiles the whole server.

## 8. Authorization with OpenFGA

Alex chose OpenFGA as the policy engine (22:57Z); org-0022 records it and supersedes Cerbos (org-0018 points 1 and
7, all of org-0019). The scratch proof ran it in this layout ([proof.md](proof.md)):

- `packages/authz`: the model (`fga.mod` and modules), `tests.fga.yaml` run by `fga model test` in its check, the
  OpenFGA client, and the `may()` port. The server checks through it; the worker writes tuples through it.
- `apps/worker/src/authz-sync/`: the outbox relay (removals first) and the daily reconciliation.
- Writing the model to OpenFGA at release is a one-shot job from the server image, like `migrate`.
- Deployment runs OpenFGA (pinned by digest) with its own database, in the local stack first.
- Cerbos does not move into the monorepo: org-0022 replaces it in backend first, or the monorepo starts without it.

## 9. The edge and scaling: Traefik and Redis

Alex, 2026-11-24 19:50Z: "we're going to use Traffic [Traefik] as a reverse proxy. And then we shall consider Redis
as a mean to manage a session and stuff like that to plan for scalability."

- **Traefik is the reverse proxy.** It ends HTTPS from the internet and routes by host: `unset.sh` to web, later
  `api.unset.sh` to the server's public group. Routes come from Docker labels in deployment's Compose files, so it
  belongs to **deployment**, not the monorepo. Web and server keep their private mutual-TLS link behind it; Traefik
  never reaches the server's internal API. Staging's Pangolin is itself built on Traefik. Web's `trustedProxy`
  setting then names Traefik as the one proxy whose forwarded client address it believes.
- **Redis is planned for sessions and scaling**, added when a second copy of web or server runs. Its jobs then:
  Better Auth's secondary storage (its documented `SecondaryStorage` interface: sessions, verification records,
  rate-limit counters, Better Auth `docs/concepts/database`, c70565a), web's rate limits shared across copies
  (today each process keeps them in memory), and the worker's job queue if Postgres stops being enough.
- **Valkey proposed as the server** (the Linux Foundation's BSD-licensed fork of Redis), not decided. Bun's built-in
  client (`import { redis } from "bun"`, Bun 1.4.4 `runtime/redis`) speaks to Redis 7.2+ and reads `VALKEY_URL`, so
  no client package is added. It sits in **deployment**, on a private network reachable only by server and worker,
  with a password from a `_FILE` secret, TLS, and no persistence needed for session caches.
- **Not a shared HTTP cache.** Pages are mostly per member; a shared cache (Varnish) risks serving one member's page
  to another. Public pages and preview images use `Cache-Control` headers, and a CDN in front later if measured.
- **Where it shows in the tree**: nothing yet. When Redis arrives, its adapter lives in the server
  (`src/adapters/redis/`), or in a `packages/` entry once the worker uses it too.

## 10. How the rules change

| Record | After |
| --- | --- |
| org-0007 | Web and server are apps in `unset-sh/unset`; ownership lines stay, enforced by section 7. Brand and rendering are packages there. Deployment stays separate. |
| org-0010 | `unset-sh/unset` replaces backend, web, rendering and brand in the staged list. One promotion releases every app and brand's package. |
| org-0014 | Unchanged, applied to `unset-sh/unset`. |
| org-0015 | Its database part (Kysely, `pg`, raw `Bun.sql`) is replaced by Drizzle in a separate record, org-0021, after a spike. |
| org-0017 | Types over a workspace link; the catalog keeps Elysia equal. No types package, peer check or bump bot. |
| org-0006 | Unchanged: the product is a caller of tooling like any repository. |

`rules/org.md`: one sentence under "One job per repository" naming `unset-sh/unset`. Brand's and the backend's
`CLAUDE.md` rules move into their folders.

Tooling: (1) the staging image workflow gains a validated `image-name` input, so the product pushes
`staging/web`, `staging/server`, `staging/worker`; (2) the package release workflow gains a working-directory input
so brand publishes from `packages/brand`. The check workflow needs nothing: its `command` input runs each
workspace's check as its own required check. No path filters, so a required check never sits skipped.

Deployment re-points at the new images and verifies attestations from `unset-sh/unset`; Alex gives the new
repository write access to the packages. `.github`'s map and docs' export register the new repository.

## 11. Migration order

Nothing starts until Alex accepts org-0020.

1. **Prove the layout in a scratch repository**: workspace root, `sv create`, `bun create elysia`, isolated
   linker, web's `svelte-check`, `bun test` at the root over every workspace, `bun fmt` and ESLint over
   `.svelte` and `.ts`, Drizzle on Bun SQL with Better Auth's adapter against Postgres, images built from the root,
   the Eden type across the link, OpenFGA behind `may()`. **Done 2026-11-24, all passed: [proof.md](proof.md).**
2. **Tooling**: the two inputs in section 10.
3. **Alex creates `unset-sh/unset`** (`staging` default, `main`, rulesets copied).
4. **Short freeze** of web, backend, rendering and brand: land or close their open pull requests, stop merging.
5. **Import with history**: in a clone of each, one commit moves everything into its folder; the new repository
   merges it with `--allow-unrelated-histories`. Commit ids stay, so every provenance link still resolves.
6. **One workspace** (one PR): root files, catalog, one lockfile, CI and image callers, kit copy.
7. **Tooling swaps** (one PR each): Biome to ESLint and `bun fmt`; Eden over the link; rendering and brand over links.
8. **Elysia's folders in the server** (moves only, no behaviour change).
9. **Drizzle** (after org-0021): `packages/db`, baseline migration, Better Auth adapter, Kysely and `pg` removed.
10. **Worker**: when the indexer or the OpenFGA relay is built, not before.
11. **Elsewhere**: deployment (Traefik at the edge, new image paths), `.github` map, docs export, agent-kit records and CHANGELOG.
12. **Alex archives** web, backend, rendering and brand. Published package versions stay.

## 12. Risks

- **Isolated installs with Vite and svelte-check are untried.** Fallback: the hoisted linker.
- **One promotion releases everything**, brand's package included. Deployment still picks each app's digest alone.
- **Drizzle 1.0 is a release candidate.** Better Auth's Drizzle adapter on Bun SQL is untried here; the spike settles it.
- **ESLint is slower than Biome** and brings more dependencies; `bun lint` later removes most of that.
- **The other repositories keep Biome**, so this one differs from them until they follow.
- **One lockfile** can move transitive versions; the 7-day rule applies; the resolved diff is reviewed.
- **Lost branches**: the freeze exists so nothing is left behind.

## 13. In-flight work

- **OpenFGA** (org-0022): replaces Cerbos. If backend switches before the move, the history comes across; otherwise
  it is built straight into `packages/authz`. Cerbos and deployment #11 do not move.
- **Slice 2**: start after step 8. Built earlier, its history comes across anyway.

## 14. What Alex decides now

1. The revised split and tree above.
2. Repository name: `unset-sh/unset` or `unset-sh/app`.
3. `bun fmt` or Prettier for formatting.
4. Drizzle 1.0 release candidate (after 2026-11-27) or 0.45.4 stable.
5. Valkey as the Redis server when it arrives (section 9).
6. ~~Go ahead with step 1, the scratch proof.~~ Done at Alex's request (22:56Z); see [proof.md](proof.md).
