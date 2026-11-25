# org-0020. The product's apps and their packages share one repository

Status: accepted (2026-11-24). Alex asked for it the same day: "It should be like a mono repo ... some repository
heavily depend on each other's", using the frameworks' own tools "to create those workspace", named by app
("apps/web, apps/API, app/worker ... eventually ... app/mobile"). His review of the first draft (17:23Z) added brand,
named the server app, made `apps/worker` "the one home for the background jobs", and said that where the tools'
docs disagree, "follow what Bun says". After the scratch proof passed (`notes/monorepo/proof.md`) he accepted it
(23:31Z): "ok create the monorepo on git, what should we call it?", and on the name `unset-sh/unset`, "allright
let's make it that". Point 2 is superseded by org-0023 for deployment only: it moves into
`unset-sh/unset` as `deploy/`.

## Context

org-0007 split the product into backend, web and deployment, and rendering became its own package. Two of the
seams that followed exist only because of the split: backend publishes its `App` type as a package so web can use
Eden, with an exact Elysia peer, a CI check and a bump bot to keep them equal (org-0017); and rendering is published
to GitHub Packages for two consumers that are both product code. Each route change is two pull requests in two
repositories. org-0007 itself said "repeated lockstep changes are evidence to revisit a boundary".

Bun workspaces, Elysia's monorepo guidance and SvelteKit's `sv create` give a standard layout for one repository
holding several apps and packages. The full proposal, with the documentation read and where those tools overlap, is
`notes/monorepo/proposal.md`.

## Decision

1. **`unset-sh/unset` holds the product**: `apps/web` (from web), `apps/server` (from backend; its API is an
   Elysia group inside it), `apps/worker` (background jobs, one entry and one database role per job),
   `packages/brand` (from brand, still published for consumers outside), `packages/rendering` (from rendering),
   `packages/db` and `packages/authz` once two apps need them, and later `apps/mobile`. It is a Bun workspace
   (`apps/*`, `packages/*`) with one lockfile, laid out by `bunx sv create` for web and by `bun create elysia` and
   Elysia's feature folders for server. Where the tools' documentation disagrees, Bun's way is followed. Each
   folder keeps its current licence.
2. **Everything else stays separate**: deployment, lexicons, profile-recipes, pds, tooling, agent-kit, `.github`
   and docs.
3. **History is kept.** Each old repository's commits are merged in unchanged, under its new folder. The old
   repositories are archived, not deleted.
4. **Boundaries become checks.** Apps import each other only through a workspace package's `exports`; a
   dependency-cruiser config at the root enforces which app may import what; browser code imports no server code.
   org-0007's ownership lines stay: web owns screens and its server, api owns operations, deployment owns
   environments.
5. **Eden over a workspace link.** Api keeps generating its declaration-only `app.d.ts`, drift-checked; web takes it
   as `@unset-sh/server` through `workspace:*`. Elysia and Eden come from the workspace catalog at one exact version.
   This supersedes org-0017 points 2, 4 and 5 (the published types package, the peer check and the bump bot).
   Points 1 and 3 stand.
6. **One staged repository.** `unset-sh/unset` follows org-0010 and org-0014 as backend, web and rendering did: work
   merges into `staging`, only Alex promotes to `main`. In org-0010's list of staged repositories it replaces
   backend, web, rendering and brand.
7. **One image per app.** Images are `ghcr.io/unset-sh/staging/<app>` (`web`, `server`, `worker`), built by tooling's shared
   workflow from the repository root with each app's Dockerfile. Deployment selects each app's digest on its own.
8. **Rendering is no longer published**; brand still is. Released versions stay in the registry.
9. **Lint and format**: ESLint from `sv add eslint`, one root config, and `bun fmt`, replacing Biome in this
   repository. `bun test` runs every test from the root, web's included; Vitest is removed (all 257 web tests passed
   under `bun test` on 2026-11-24).

## Consequences

- Tooling's staging image workflow gains a validated image-name input, and its package release workflow a
  working-directory input for brand.
- Deployment re-points at the new image paths and verifies attestations from `unset-sh/unset`.
- `rules/org.md` gains one sentence under "One job per repository" naming this exception.
- `.github`'s `repos.json` and the docs export register the new repository; the old ones are marked archived.
- One promotion releases every app at once. Alex reviews one larger promotion instead of three.
- Every pull request runs every app's check, one required check per app.
- Creating `unset-sh/unset`, its rulesets, package access and archiving the old repositories are Alex's actions.
- Drizzle for the database replaces org-0015's Kysely, `pg` and raw `Bun.sql` only through its own record.
- A scratch repository proved the layout first (`notes/monorepo/proof.md`); its seven findings are part of the
  setup, among them that each vendor is listed only by the package that uses it, so Bun's isolated install refuses
  any other import.
- `apps/mobile`, when it comes, calls the server's member API directly, not through web
  (`notes/monorepo/web-and-mobile.md`). Member routes are written for an untrusted caller from the start, and product
  logic stays in the server or `packages/*`, never in SvelteKit `load` functions.
