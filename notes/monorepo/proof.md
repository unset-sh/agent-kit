# Scratch proof of the monorepo layout (2026-11-24)

Alex asked (22:56Z) to "make a test repo", then added (22:57Z) that OpenFGA is the policy engine. This is step 1 of
the migration order in [proposal.md](proposal.md): a throwaway repository, never pushed to GitHub, built in a cloud
sandbox with Bun 1.4.4. Its source is in project files as `monorepo/unset-proof.tar.gz` (one commit, no
`node_modules`). Nothing in a product repository moved.

## Result

Every point the proposal said was untried works. The full chain ran in containers built from the root: web's page
rendered a name it read through Eden from the server, which asked OpenFGA through `may()` and read Postgres through
Drizzle on Bun's SQL client. `bun run check` at the root (format, lint, boundaries, each workspace's check, every
test) passes in 17 seconds.

| What | Result |
| --- | --- |
| Scaffold | `bunx sv create` (sv 1.7.1) for `apps/web` and `bun create elysia` (create-elysia 0.1.0) for `apps/server`, then renamed `@unset-sh/web` and `@unset-sh/server`, exact versions from a root catalog |
| Isolated install | One `bun install`, one `bun.lock`. The root `node_modules` holds only the root's tools; each workspace sees only what its `package.json` lists, so an import of anything else fails |
| Web | `svelte-check` 0 errors on 1,561 files; `bun --bun vite build` with adapter-node; Kit 3.2.0, Vite 8.3.8 |
| Eden over `workspace:*` | `import type { App } from "@unset-sh/server/app"` is fully typed: two planted wrong types were refused. Web's build contains no server, Drizzle, Better Auth or OpenFGA code |
| `bun test` at the root | 7 tests across server, web and authz in 0.23 s |
| `bun fmt` | Replaces Prettier: formats `.ts`, `.svelte`, JSON and YAML; one `printWidth = 120` in `bunfig.toml` |
| ESLint | sv's `eslint.config.js` moved to the root covers every workspace, `.ts` and `.svelte`, in 12 s |
| Drizzle + Better Auth | Drizzle 0.45.4 on `drizzle-orm/bun-sql`; Better Auth 1.7.25 with `@better-auth/drizzle-adapter`; `auth generate` wrote its tables into `packages/db`; `drizzle-kit generate` wrote the migration; applied to Postgres 16 |
| OpenFGA | The model from #48 in `packages/authz/model/`, 23/23 checks with `fga model test` (CLI v0.9.0); OpenFGA v1.22.1 by digest in `compose.yaml`; 4 adapter tests against the real server pass, including "unreachable is `unavailable`, never allow" |
| Boundaries | dependency-cruiser 18.7.2 at the root: 7 planted violations, 7 caught |
| Images | Both from the root with each app's Dockerfile. Server: `bun install --production --filter @unset-sh/server` installs 139 of 377 packages. Web: no `node_modules` in the runtime |

## What the proof changes in the plan

1. **Move vendors to the package that uses them.** With the isolated linker, `apps/server` cannot import
   `drizzle-orm` or `@openfga/sdk` at all, because only `packages/db` and `packages/authz` list them. The install
   itself enforces "one folder per vendor" for packages; the dependency-cruiser rules cover what stays inside an app
   (Better Auth only in `src/adapters/auth/`, no Elysia in `service.ts` or packages, web takes only the server's
   type and only from `src/lib/server/` or `*.server.ts`). A `no-unresolvable` rule makes the check say so before
   the build does.
2. **Migrations run with Drizzle's migrator, not `drizzle-kit migrate`.** drizzle-kit 0.31.11 needs the `pg`
   driver to apply migrations. `drizzle-orm/bun-sql/migrator` applies the same files on Bun's client, as its own
   process, which is what the `migrator` role needs anyway. `drizzle-kit generate` still writes them.
3. **Better Auth's CLI runs under Bun explicitly.** `auth generate` runs on Node by default and cannot load
   `packages/db` (it imports `bun`); `bun auth` is a reserved Bun subcommand. The script is
   `bun --bun x auth generate --config auth.schema.ts --output ../../packages/db/src/schema/auth.ts`.
4. **SvelteKit 3's environment variables.** `$env/dynamic/private` is deprecated in Kit 3 (kit docs
   `20-core-concepts/70-environment-variables.md`). Web declares its settings in `src/env.ts` with
   `defineEnvVars` and imports them from `$app/env/private`; a setting may be absent only while `building`.
   Today's web still uses the old modules and would change when it moves.
5. **Web's runtime dependencies stay devDependencies.** adapter-node bundles devDependencies and leaves
   `dependencies` external; with `@elysia/eden` under `dependencies` the image started and failed on the first
   page. Web's current repository already follows this rule.
6. **Don't name a script `fmt`.** A `package.json` script called `fmt` is run instead of the built-in `bun fmt`.
   The root scripts are `format` and `format:check`.
7. **Type pages for ESLint.** sv's minimal template writes `let { data } = $props()`; the typed lint rules refuse
   it. `let { data }: PageProps = $props()` is Kit's documented form.

## Limits

- dependency-cruiser reads `.svelte` files after compiling them, so a type-only import in a component is invisible
  to it. It carries no code; a value import from the server is caught.
- Web's type check compiles the server's sources through the type import (the proposal keeps a generated
  `app.d.ts` to avoid that); here it cost nothing noticeable on a small server. Measure again with the real one.
- The server image is 422 MB against web's 188 MB; the base is the same, so the difference is the server's
  installed packages. Not optimised.
- Not covered: `apps/worker`, moving brand and rendering, merging history, tooling's image-name input, CI, and a
  real sign-in (the session-to-principal step is wired but no session was created).
- The sandbox's proxy needed its CA as an optional BuildKit secret in both Dockerfiles; that line is proof-only.
- sv 1.7.1 was published 2026-11-24, inside the 7-day wait. It only scaffolded files and is not a dependency;
  every installed package respected the wait.

## Versions

Bun 1.4.4; elysia 1.4.32, @elysia/eden 1.4.10; @sveltejs/kit 3.2.0, svelte 5.57.3, vite 8.3.8, svelte-check 4.7.8,
@sveltejs/adapter-node 6.0.2; drizzle-orm 0.45.4, drizzle-kit 0.31.11; better-auth, auth and
@better-auth/drizzle-adapter 1.7.25; @openfga/sdk 0.9.8; openfga/openfga v1.22.1
(`sha256:b852071314f1fda1194d341a6ebac0a4f619b3cd87a6626d2ccc7048af4ec671`); fga CLI v0.9.0; eslint 10.15.0,
typescript-eslint 8.72.2, eslint-plugin-svelte 3.24.1; dependency-cruiser 18.7.2; typescript 6.0.3; Postgres 16.
