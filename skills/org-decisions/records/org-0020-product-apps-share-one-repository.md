# org-0020. The product's apps and their packages share one repository

Status: proposed (2026-11-24). Alex asked for it the same day: "It should be like a mono repo ... some repository
heavily depend on each other's", using the frameworks' own tools "to create those workspace", named by app
("apps/web, apps/API, app/worker ... eventually ... app/mobile"). Nothing in it is decided until he accepts it.

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

1. **`unset-sh/unset` holds the product**: `apps/web` (from web), `apps/api` (from backend), `packages/rendering`
   (from rendering), and later apps such as the indexer and mobile. It is a Bun workspace (`apps/*`, `packages/*`)
   with one lockfile, laid out by `bunx sv create` for web and by `bun create elysia` and Elysia's feature folders
   for api. It is AGPL-3.0-only, like the three repositories it replaces.
2. **Everything else stays separate**: deployment, lexicons, brand, profile-recipes, pds, tooling, agent-kit,
   `.github` and docs.
3. **History is kept.** Each old repository's commits are merged in unchanged, under its new folder. The old
   repositories are archived, not deleted.
4. **Boundaries become checks.** Apps import each other only through a workspace package's `exports`; a
   dependency-cruiser config at the root enforces which app may import what; browser code imports no server code.
   org-0007's ownership lines stay: web owns screens and its server, api owns operations, deployment owns
   environments.
5. **Eden over a workspace link.** Api keeps generating its declaration-only `app.d.ts`, drift-checked; web takes it
   as `@unset-sh/api` through `workspace:*`. Elysia and Eden come from the workspace catalog at one exact version.
   This supersedes org-0017 points 2, 4 and 5 (the published types package, the peer check and the bump bot).
   Points 1 and 3 stand.
6. **One staged repository.** `unset-sh/unset` follows org-0010 and org-0014 as backend, web and rendering did: work
   merges into `staging`, only Alex promotes to `main`. In org-0010's list of staged repositories it replaces those
   three.
7. **One image per app.** Images are `ghcr.io/unset-sh/staging/<app>` (`web`, `api`), built by tooling's shared
   workflow from the repository root with each app's Dockerfile. Deployment selects each app's digest on its own.
   org-0019's "backend's image" is the api image.
8. **Rendering is no longer published.** The released `@unset-sh/rendering` versions stay in the registry.

## Consequences

- Tooling's staging image workflow gains a validated image-name input; no other tooling change is needed.
- Deployment re-points at the new image paths and verifies attestations from `unset-sh/unset`.
- `rules/org.md` gains one sentence under "One job per repository" naming this exception.
- `.github`'s `repos.json` and the docs export register the new repository; the old ones are marked archived.
- One promotion releases every app at once. Alex reviews one larger promotion instead of three.
- Every pull request runs every app's check, one required check per app.
- Creating `unset-sh/unset`, its rulesets, package access and archiving the old repositories are Alex's actions.
- A first step proves the layout in a scratch repository (isolated installs with Vite and svelte-check, both images
  built from the root, the Eden type across the link) before any product repository moves.
