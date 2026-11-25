# Monorepo review: what was fixed, and what waits on a decision

An external review of `unset-sh/unset` `staging` at `4a303be` (2026-11-25) listed ten fixes and five nits. This note
records where each one landed and plans the items that need a decision from Alex before code changes.

## Landed (all merged into `staging` under org-0014 unless marked)

| Review item | Pull request | Note |
| --- | --- | --- |
| 1 Web uses a pinned copy of the old App type | unset #12 (before the review) | Already fixed: web imports `@unset-sh/server/app` |
| 9 SvelteKit `./$types` | unset #12 (before the review) | Already fixed, plus an ESLint rule |
| 2 Sign-out deletes the session before the grant | unset #13 | Grant settled first, row deleted last, under the account lock |
| 3 Boundary rules | unset #14 | Server narrowed, web gets its own cruiser, fixture tests prove each rule |
| 4 (web half) Package token in the web image | unset #15 | Web's filtered install reads no registry package |
| 5 Front-door docs | unset #16 | |
| 6 Route schemas list codes they never answer | unset #17 | Codes per status derived from the handler's table, `never` ending |
| 7 Two authorizer ports | unset #18 | Kept both (domain-no-vendor, access-home); the adapter asserts they agree |
| 8 (first half) Dead log events | unset #19 | Plus a test that every catalog event is written somewhere |
| 10 `never` defaults | unset #17 (session), #20 (profile) | |
| Nits | unset #21 | Comments, encoded DID, barrel export, web tests run once |

## Waiting on Alex

### A. Better Auth and the server's tables on Drizzle (org-0021)

Today Better Auth opens its own `pg` 8.23.1 pool under Kysely 0.29.9 (`apps/server/src/adapters/auth/database.ts`),
because its adapter suites passed on `pg` (468/468) and not on a Kysely `Bun.sql` dialect (358/468;
`notes/first-e2e-slice/spike.md` (f)). The server's own tables use `Bun.sql` in `src/adapters/postgres/`. Alex chose
Drizzle in `packages/db` on 2026-11-24 (bun-sql driver, Better Auth's Drizzle adapter). That needs a spike and a
record that supersedes org-0015's database part. Proposed order, one pull request each:

1. **Spike, in a scratch workspace.** Run the same seven `@better-auth/test-utils/adapter` suites at Better Auth
   1.7.25 against `drizzleAdapter` on `drizzle-orm/bun-sql`, Bun 1.4.4, Postgres 18. Also check, against the current
   setup: the `backend_auth` role with an empty `search_path` (does the adapter qualify `auth.` tables, or does the
   connection still need `search_path=auth`?), `verify-full` TLS on `Bun.sql`, the uuid casts org-0015 needed, and
   whether `drizzle-orm/bun-sql/migrator` or our own runner applies the migrations (the monorepo proof found
   `drizzle-kit migrate` needs `pg`). The result goes in `notes/drizzle-spike/`.
2. **org-0021**, written from the spike's numbers, superseding the database part of org-0015.
3. **`packages/db`**: the Drizzle schema for the tables that exist today, with a root cruiser row so `drizzle-orm` is
   imported only there, and a fixture that proves it.
4. **Better Auth on the Drizzle adapter**: drops `kysely` and `pg` from `apps/server` and their cruiser rows.
5. **The server's own queries on Drizzle**, one adapter at a time.

Recommendation, pending the spike: keep our migration runner (`src/adapters/postgres/migrate.ts`). It already has
checksums, the expand-phase lint, the advisory lock and the `migrator` role check. Use Drizzle for schema types and
queries only. Questions for Alex: does Better Auth keep its own role and pool? (Recommended yes: least privilege, and
the role already exists.) And should step 5 happen at all, or should `Bun.sql` stay for the tables that only the
server owns?

### B. One config loader and scrubber for both apps

`apps/server/src/shared/config/` and `apps/web/src/lib/server/config/` are byte-identical copies, and so are their
tests. `scrub.ts` is the same in both. The loggers differ only by their event catalogs. Proposal: one package,
`packages/config` (`load`, `schema`, `secret`), moved with history from `apps/server` by `git mv`. Web's copy is
deleted, and both apps import it. The logger core (`createLogger`, `scrub`) could move too, with each app passing in
its own event catalog. Questions for Alex: the package name, and whether the logger moves now or later. This is
structural, so it gets its own pull request after he answers.

### C. Rendering on the workspace brand

`packages/rendering` still takes `@unset-sh/brand` 0.1.0 from GitHub Packages, so a full `bun install` still needs
the token (web's image no longer does; unset #15). Switching to `workspace:*` is a migration, not a version bump.
Brand 0.1.1 replaces `tokens.json`'s `color.tokens`/`type.fonts`/`mark.tokens` with the new contract (its CHANGELOG
says "Migration required from 0.1.0"). Rendering reads the old shape in `src/brand.ts`, and the contract no longer
has a `plum` role, which rendering draws with. A port would read `resolved.json` (`palette.*` per theme) and the
contract's `typography.families` and `mark.dimensions`. It has to pick a replacement for `plum`, and it redraws
`gallery/expected/`, which is a reviewed change. This belongs with the brand and rendering release move that's
still on Alex's card in "Set up the unset monorepo".

### D. Report: the server boots only with a loopback web origin

`apps/server/src/config.ts` requires `WEB_ORIGIN` to be `http://127.0.0.1:<port>`, because this slice signs in with
the AT Protocol loopback client (https://atproto.com/specs/oauth, "Localhost Client Development"). Mutual TLS is
already required outside dev and test. Staging at `staging.unset.sh` can't complete a sign-in until the confidential
client exists: client metadata served at a public URL, plus its private key, which only Alex places. When it does,
the rule becomes an `https:` origin that matches the metadata's redirect URI, with the key as a `_FILE` secret.
Nothing changes before then.
