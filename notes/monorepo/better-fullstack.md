# Better-Fullstack's scaffold, compared with the monorepo proposal

Alex posted a `bun create better-fullstack@latest` command on 2026-11-24 (22:45Z), with Svelte, Elysia, Bun, Better
Auth, Drizzle on Postgres, nx, ultracite and about fifteen service integrations. It was generated once, in a
throwaway folder, with `create-better-fullstack` 2.8.1 (published 2026-10-28, MIT,
`github.com/Marve10s/Better-Fullstack`, `apps/cli`), the same options except `--no-install` and `--no-git`. Nothing
from it was adopted. Every point below was read from the generated files.

## What it confirms

The generator lands on the same shape as the proposal: a Bun workspace with `apps/*` and `packages/*` and a catalog,
`apps/server` (Elysia) and `apps/web` (SvelteKit, shadcn-svelte, Tailwind), `packages/db` (Drizzle, with Better
Auth's tables in `src/schema/auth.ts`), and a Dockerfile per app. The names `server`, `web` and `db` match ours.

Two small ideas worth keeping: `packages/config` for the shared `tsconfig`, and `packages/env` for each app's
validated settings (ours already exist as backend's config schema and would move there when web and server share it).

## Where it conflicts with decisions

| Generated | Our decision | Effect if used |
| --- | --- | --- |
| `apps/web/src/lib/auth-client.ts`: `createAuthClient` from `better-auth/svelte`, web depends on `better-auth` and `packages/auth` | The browser never calls the server; web reaches Better Auth only through our own session routes (security proposal S4, API conventions) | The browser would talk to Better Auth's raw routes |
| Web depends on `packages/api`, which depends on `packages/db` and `packages/auth` | Web imports only the `App` type; never db or authz (proposal section 7) | Database code in web's dependency graph |
| Version ranges (`^1.4.30`, `^0.45.3`) and `"lefthook": "latest"` | Exact pins, 7-day wait (org rules) | Unreviewed versions on every install |
| `better-auth` 1.6.22 | 1.7.25 runs today | A downgrade |
| `nx run-many` for every script | `bun run --filter` (Bun's own runner) | A large second tool doing what Bun does |
| ultracite (`biome.jsonc`) | ESLint from `sv add eslint`, `bun fmt` (Alex, 17:23Z) | Biome back |
| Zod + `zod-to-openapi` in `packages/api` | Elysia's TypeBox route schemas generate `openapi.yaml` and Eden's types (org-0015, org-0017) | Two schema languages |
| `pg` and `postgres` drivers, `ioredis` | Drizzle on `Bun.SQL`, Bun's built-in Redis client | Extra drivers |
| `dotenv` everywhere | Settings from the environment and `_FILE` secrets; Bun reads `.env` itself | A dependency we don't need |
| Jobs inside `apps/server/src/jobs` | `apps/worker`, one home for background jobs (Alex, 17:23Z) | Background work in the web-facing process |
| Each vendor imported straight from `apps/server/src/lib/*.ts` | Each vendor in one folder, enforced by a check (Alex, 19:57Z) | No check stops it spreading |
| `react-hook-form` asked for; it generated `@tanstack/svelte-form` | react-hook-form is React-only | Not usable as asked |
| Starlight docs | Docs are Markdown in `docs/`, published by `unset-sh/docs` | A second docs site |
| `.mcp.json` running `npx -y @upstash/context7-mcp` unpinned, plus `.ruler`, `.cursor`, `.agents` | Assistant rules come from agent-kit; nothing unpinned runs | An unpinned package runs on every assistant start |
| pg-boss creates and migrates its own schema when it starts | Runtime roles cannot change the schema; migrations run as `migrator` | Needs pg-boss's own migration run as `migrator`, with start-time migration off |

## New vendors it adds, each needing its own decision

None is needed by the first slices. Each should come with the feature that needs it, as a decision with its
licence, where it runs, what data it sees, and its folder in the check.

| Tool | Job | Note |
| --- | --- | --- |
| pg-boss | Job queue in Postgres | Good fit for `apps/worker`: no new service. The first candidate. |
| Paraglide | Translations | An official `sv add` add-on; take it when the app is translated. |
| Playwright | Browser tests | Already in profile-recipes; for end-to-end tests later. |
| knip | Finds unused files, exports and dependencies | Matches "no dead or deprecated code"; could run in tooling's check. |
| gitleaks | Secret scanning | Belongs in tooling's shared check for every repository. |
| OpenTelemetry | Traces and metrics | Needs a decision on where data goes; nothing may carry personal data. |
| S3 (`@aws-sdk`) | File storage | Already planned with `Bun.S3Client`, no SDK. |
| Redis (`ioredis`) | Cache | Already planned: Valkey through Bun's client. |
| Resend | Sending email | A third party sees addresses and contents; members sign in with AT Proto and may have no e-mail. |
| Uppy | Upload widgets | With the assets capability. |
| evlog | Logging | Backend already has a logger that scrubs secrets. |
| Flagsmith | Feature flags | A service to run or a SaaS; not needed yet. |
| Meilisearch | Search | A service to run; Postgres full-text first. |
| pgvector | Vector search in Postgres | Only with an AI feature. |
| Mastra | AI agent framework | Only with an AI feature. |
| lefthook | Git hooks | Optional; CI is the gate either way. |
| msw | Fake HTTP in tests | Backend's tests already run stand-in servers. |

## Recommendation

Use it as a reference, not as the generator. Its layout confirms ours, but running it would undo several of Alex's
decisions at once and add more than a dozen vendors no feature needs yet. Keep `sv create` and `bun create elysia`
as the scaffolding tools, and take pg-boss, knip and gitleaks as the first candidates to decide on.
