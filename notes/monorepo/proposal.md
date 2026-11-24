# One repository for the Unset product: proposal

Written 2026-11-24 for Alex, who asked (thread "Plan a move to a monorepo"): "It should be like a mono repo
... some repository heavily depend on each other's", using "those tools that like each framework that we're using
is providing to create those workspace", named by app ("apps/web, apps/API, app/worker ... eventually ...
app/mobile"), with authorization through OpenFGA planned in ("let's plan to add like FGA"), and checked against
"the official doc of each one and see where like things overlap".

Nothing has moved. This is a proposal for review; the decision it needs is drafted as
[org-0020](../../skills/org-decisions/records/org-0020-product-apps-share-one-repository.md), status proposed.

## 1. The short answer

- **Move web, backend and rendering into one new repository, `unset-sh/unset`.** They change together, they are
  one licence (AGPL-3.0-only), and two of today's hardest seams exist only because they are separate: the Eden
  types package (org-0017) and rendering's package release.
- **Keep everything else separate.** Each of the others has a reason the monorepo would make worse: a different
  licence, its own publication to the outside world, a different branch model, or it serves every repository.
- **Lay it out the way the tools lay it out.** Bun workspaces (`apps/*`, `packages/*`), `bunx sv create` for
  `apps/web`, `bun create elysia` and Elysia's feature folders for `apps/api`. Section 3 is the tree.
- **Keep the history.** Each old repository's commits are merged in unchanged, so every commit link and
  provenance citation already written still points at a real commit. The old repositories are archived, not
  deleted.
- **Do it before slice 2.** The three repositories hold about 26,000 lines today (backend 17,000, web 7,400,
  rendering 2,000, tests included). It only gets more expensive.

## 2. What goes in, what stays out

| Repository | Goes in? | Why |
| --- | --- | --- |
| backend | **Yes**, as `apps/api` | Web's only server dependency; every route change is a two-repository change today. |
| web | **Yes**, as `apps/web` | Same. The pinned `app.d.ts` copy and its hash check become a workspace link. |
| rendering | **Yes**, as `packages/rendering` | Used only by backend and web. It stops being published: nothing outside needs it. |
| deployment | No | It selects image digests that CI builds from the product. In the same repository every digest bump would rebuild the images it pins, and deploy settings (and, later, deploy credentials) would sit beside product code. Keeping it separate also lets it roll web and api back independently. |
| lexicons | No | MIT, not AGPL. Its `main` is what the network sees, and it has its own `drafts` flow. The apps keep a pinned, hash-checked copy as now. |
| brand | No | A published package with consumers outside the product (docs, and pds's theme later), its own site and Pages deploy, and fonts under OFL. The apps take it at an exact version as now. |
| profile-recipes | No | CC0 recipes, outside contributions under DCO, its own docs export. |
| pds | No | A customised upstream image with its own upstream release cadence. It talks to the product only over the protocol. |
| tooling, agent-kit, `.github`, docs | No | They serve every repository, work on `main` alone, and the product repository is one of their consumers. |

Name: `unset-sh/unset` reads best beside `apps/web` and `apps/api`. The old app is `Undefined6799/unset`, a
different owner, so there is no clash, only a familiar name for its successor. `unset-sh/app` is the alternative.
Creating the repository is Alex's action (org rule).

## 3. The tree

Where a folder comes from a tool, it says so. Everything not marked is ours.

```text
unset/                              unset-sh/unset
├── package.json                    Bun workspaces ["apps/*", "packages/*"] and a catalog of shared exact versions
├── bun.lock                        one lockfile for everything (Bun workspaces)
├── bunfig.toml                     install rules once: exact, ignoreScripts, 7-day minimumReleaseAge, @unset-sh scope
├── .bun-version
├── tsconfig.json                   shared compiler options; each app extends it (Elysia's Eden monorepo advice)
├── biome.json                      one lint and format config
├── .dependency-cruiser.cjs         the boundaries between apps and packages (section 5)
├── CLAUDE.md, AGENTS.md            the repository's rules; each app adds its own CLAUDE.md
├── .claude/                        the agent-kit copy, once, at the root
├── .github/workflows/              thin callers of tooling: one check job and one image job per app
├── docs/                           human docs, exported to unset-sh/docs as one section with a folder per app
├── apps/
│   ├── web/                        bunx sv create apps/web --template minimal --types ts --package-manager bun --no-install
│   │   ├── src/routes/             SvelteKit routes (tool)
│   │   ├── src/lib/                #lib; src/lib/server/ is server-only, enforced by SvelteKit (tool)
│   │   ├── src/app.html            (tool)
│   │   ├── static/                 (tool)
│   │   ├── vite.config.ts          (tool) SvelteKit config lives here in Kit 3
│   │   ├── server.ts, Dockerfile   ours: run the built app on Bun; the image
│   │   └── package.json            @unset-sh/web
│   ├── api/                        bun create elysia apps/api, then Elysia's recommended feature folders
│   │   ├── src/index.ts            the composition root: builds the app, mounts each module, exports `type App`
│   │   ├── src/modules/<feature>/  Elysia's layout: index.ts (routes), service.ts (logic), model.ts (schemas)
│   │   │                           identity, profile, access, sign-in, ...
│   │   ├── src/adapters/<tech>/    ours: postgres, atproto, openfga (or cerbos) behind small contracts
│   │   ├── src/utils/              Elysia's name for shared helpers: config, log, errors
│   │   ├── policies/               Cerbos policies and tests today; authz/ with the OpenFGA model later (section 7)
│   │   ├── openapi.yaml, app.d.ts  generated contracts, drift-checked as now
│   │   ├── Dockerfile              built from the repository root (Elysia's monorepo deploy guide)
│   │   └── package.json            @unset-sh/api; exports only "./app" (types)
│   ├── indexer/                    later: the Tap indexer, its own process (Alex's "apps/worker")
│   └── mobile/                     later
└── packages/
    └── rendering/                  @unset-sh/rendering, unchanged inside, no longer published
```

Notes on the tree:

- **`apps/api`, not `apps/backend`**, as Alex asked. It is the internal API web's server calls. The later public
  API (api.unset.sh) is a separate Elysia group with its own contract, so it becomes a second module set in the
  same app or a second app; that choice belongs to its own decision record, as already planned.
- **`apps/indexer` rather than `apps/worker`.** Alex offered "worker" as an example. Our principles ask names to
  say what a thing is responsible for, and the indexer is a separately privileged process (org-0007). A second
  background job (the OpenFGA outbox relay, say) would get its own name or join the process whose privileges it
  shares. Alex's call; "worker" works if he prefers one process for all background jobs.
- **Shared server code waits for a second user.** When the indexer needs backend's Postgres schema or domain
  rules, that code moves to a package named for its job (for example `packages/db` for migrations and the
  schema). Moving it earlier would be a layer with no second user, which the principles rule out.
- **Backend's current folders map onto Elysia's.** `src/domains/<x>` becomes `src/modules/<x>` (routes now in
  `index.ts`, the operations in `service.ts`, TypeBox schemas in `model.ts`); `src/server/internal-api.ts` becomes
  `src/index.ts`; `src/shared/` becomes `src/utils/`; `src/adapters/` stays. Backend's rule "each route group is
  one plain `new Elysia({ name })` chain" is exactly Elysia's module `index.ts`.
- **Web is already close to `sv create`.** Its `src/routes`, `src/lib`, `static`, `vite.config.ts`, `#lib`
  imports and `src/lib/server/` all match. What is ours stays ours: `server.ts`, the gate tests, the shadcn copy.

## 4. Where the official docs overlap, and what we pick

Read 2026-11-24: Bun docs at tag `bun-v1.4.4` (38afee6, `docs/pm/workspaces.mdx`, `catalogs.mdx`,
`isolated-installs.mdx`, `filter.mdx`, `runtime/bunfig.mdx`, `runtime/environment-variables.mdx`,
`test/discovery.mdx`); Elysia docs at `elysiajs/documentation` bb88abe (`essential/best-practice.md`,
`eden/installation.md`, `patterns/deploy.md`); SvelteKit docs at `sveltejs/kit` efced48
(`getting-started/project-structure.md`, `build-and-deploy/adapter-bun.md`); sv CLI docs at `sveltejs/cli` ced6fcd
(`commands/sv-create.md`). The SvelteKit docs are `main`, ahead of web's Kit 3.2.0; anything they say that 3.2
may not have is marked.

| Overlap | Bun says | Elysia says | SvelteKit / sv says | Pick |
| --- | --- | --- | --- | --- |
| Folder names | Workspaces "by convention ... in a directory called `packages`" | Its monorepo example uses `apps/server` and `packages/config` | `sv create [path]` works in any folder | `apps/` for things that run, `packages/` for things they import. Both tools accept it. |
| Sharing code between apps | `workspace:*` links | Path aliases "can be tricky": if the frontend cannot resolve the backend's alias, Eden's types become `any`; it recommends one root tsconfig | `#lib` (Kit's alias) is for the app's own code | Cross-app imports go only through workspace package names, never aliases. No tsconfig `paths`. Eden's gotcha cannot happen. |
| TypeScript config | `bun init` writes a root `tsconfig.json` | One root tsconfig, each module extends it | Web's tsconfig must extend the generated `.svelte-kit/tsconfig.json` | Root holds shared options; api extends the root; web extends both (tsconfig `extends` takes a list). Web keeps TypeScript 6 for Kit as today; per-workspace versions are allowed. |
| Dependency versions | Catalogs: one version list in the root `package.json`, referenced as `catalog:` | Eden needs "Elysia ... matching the server" | — | `elysia`, `@elysia/eden`, `@biomejs/biome`, `@types/bun` come from the catalog, exact. Web and api cannot drift apart, so org-0017's peer check and bump bot are no longer needed. |
| Install layout | New workspaces default to the **isolated** linker (pnpm-style: a package sees only what it declares) | — | — | Keep isolated: it blocks phantom imports, which helps the boundaries. Not yet tried with Vite and svelte-check: the first step proves it (section 8). |
| Test runners | `bun test` searches the whole folder tree for `*.test.ts` | Uses `bun test` | `sv add vitest`; web runs `bunx --bun vitest` | Never run `bun test` at the root: it would pick up web's Vitest files. Each workspace runs its own `test` script; the root runs `bun run --filter '*' check`. Root `bunfig.toml` also sets `test.pathIgnorePatterns = ["apps/web/**"]` as a guard. |
| `.env` files | Bun loads `.env` files automatically from where it runs | — | Vite and SvelteKit load their own `.env` handling | No `.env` at the root. Config comes from the environment and `_FILE` secrets as now. Worth knowing when debugging. |
| bunfig | "Put `bunfig.toml` in your project root" | — | — | One root `bunfig.toml`. Whether `bun test` run inside `apps/api` reads it is not stated: the first step checks it, and api keeps its own `bunfig.toml` with only `[test]` if needed. |
| Running scripts | `bun run --filter '*' <script>`, in dependency order; `--parallel` for dev | — | `vite dev` | Root scripts: `check` (all, in dependency order), `dev` (web and api in parallel). |
| Images | — | Put the Dockerfile in the app (`apps/server/Dockerfile`) and build from the root so the lockfile and packages are in reach | adapter-node output, or adapter-bun (on Kit `main`; not known for 3.2) | `apps/<app>/Dockerfile`, built with context `.`. Web keeps adapter-node + `server.ts` for now; adapter-bun is a separate, later look. |
| Lint and format | — | — | `sv create` offers Prettier and ESLint add-ons | Skip them (`--no-add-ons`): Biome stays, one root config. |

## 5. Keeping the parts apart

A repository wall was never a security boundary (backend's rules say so), but it did stop accidental imports.
Inside one repository three things do that job instead, and all are checks, not promises:

1. **Package `exports`.** `@unset-sh/api` exports only `./app`, a type. Anything else under `apps/api` cannot be
   resolved by name from web.
2. **dependency-cruiser at the root** (backend already uses it). Rules: web may import from `@unset-sh/api` only
   `./app`, and only as a type, only from `src/lib/server/`; no app imports another app's files by path; packages
   never import apps; browser code imports no server module (Kit already enforces `server/` folders).
3. **The isolated linker.** A workspace can import only what its own `package.json` declares.

**Eden stays clean.** Backend keeps generating `app.d.ts`, declaration only, without Better Auth's types, and
checking it for drift. Web takes it as `"@unset-sh/api": "workspace:*"` and imports
`import type { App } from "@unset-sh/api/app"`. That is Eden's own pattern (export `type App`, import it in the
client) with a generated file in the middle, so web's type check does not compile the whole API.

## 6. How the rules change

Records (drafted as org-0020, which supersedes parts of these; the rest of each stays in force):

| Record | Today | After |
| --- | --- | --- |
| org-0007 | backend, web and deployment are separate repositories | web and api are apps in `unset-sh/unset`; their ownership lines stay, enforced by section 5. Deployment stays separate. Rendering is a package there. |
| org-0010 | brand, rendering, lexicons, pds, backend, web, deployment, profile-recipes are staged | `unset-sh/unset` replaces backend, web and rendering in that list. Staged, `staging` default, Alex promotes to `main`. One promotion releases all apps at once; deployment still picks each app's digest on its own. |
| org-0014 | agents merge checked pull requests into `staging` | Unchanged, applied to `unset-sh/unset`. |
| org-0017 | backend publishes a types package; web pins Elysia to its peer; a bot bumps both | The types come over a workspace link. The catalog keeps Elysia equal. No package, no peer check, no bump bot. Points 1 and 3 (Eden from web's server only, `openapi.yaml` stays) stand. |
| org-0019 | backend's image holds `policies/` | "Backend's image" means the api image. No other change. (If OpenFGA replaces Cerbos, its own record supersedes 0018 and 0019.) |
| org-0006 | tooling is the single CI source, main-only | Unchanged. The product repository is a caller like any other. |

Shipped rules (`rules/org.md`): "One job per repository" gains one sentence: the product's apps and the packages
only they use are one job and share `unset-sh/unset`. The pinning rule is unchanged between repositories; inside
one repository a workspace link needs no pin. 150-line budget: +1 line.

Tooling needs one change: **the staging image workflow takes an image name.** Today it names the image after the
repository (`ghcr.io/unset-sh/staging/<repository>`). It gains an `image-name` input, validated as
`[a-z0-9-]+` and refused otherwise, so the product pushes `staging/web` and `staging/api`. The `context` and
`dockerfile` inputs already exist. The check workflow needs nothing: its `command` input runs
`bun run --filter @unset-sh/api check` and so on, one required check per app (`web / Check`, `api / Check`,
`rendering / Check`). All run on every pull request; no path filters, so a required check is never skipped.

Images and deployment: images become `ghcr.io/unset-sh/staging/web` and `.../staging/api` (a new package; the
old `staging/backend` stays for history). Deployment verifies attestations from `unset-sh/unset` instead of the old
repositories. The new repository needs write access to the packages, which is a package setting (Alex).

Other repositories: `.github` `repos.json` (unset active; web, backend, rendering archived); docs registers the new
export source; each app's `CLAUDE.md` moves into its folder, and a new root `CLAUDE.md` holds what is shared.

## 7. Authorization with OpenFGA in this layout

Alex wants OpenFGA planned in. The proof of concept and the switch are still open in the thread "Assess OpenFGA
as the authorization engine" (agent-kit #48, `notes` there); the switch needs its own record superseding org-0018
and org-0019. The layout is ready for it either way:

- `apps/api/authz/` holds the model (`fga.mod` and its modules, schema 1.2) and `tests.fga.yaml`. Api's `check`
  runs `fga model test`, pinned, like `cerbos compile` today. Until the switch, Cerbos's `policies/` stays
  where it is, because deployment mounts `app/policies` from the image (org-0019, deployment #11).
- `apps/api/src/adapters/openfga/` implements the existing small authorization port (`may()` in
  `src/modules/access`). Nothing outside the adapter sees OpenFGA.
- The outbox relay (domain change and tuple rows in one transaction, removals first) runs where the assessment
  puts it; if it leaves api's process, it is an app of its own (`apps/authz-relay` or inside `apps/indexer`).
- Writing the model to OpenFGA at release is a one-shot job from the api image, like `migrate` today, so one api
  digest still selects the code and the model it was tested with.
- Deployment adds OpenFGA (pinned by digest) and its own database on the shared Postgres, in the local stack
  first. That is deployment's work, unchanged by the monorepo.

## 8. Migration order

Each step is a pull request unless it is a setting. Nothing starts until Alex accepts org-0020.

1. **Prove the layout in a scratch repository** (no product repository touched): a workspace root, `sv create`,
   `bun create elysia`, the isolated linker, web's `svelte-check` and Vitest, api's `bun test` against Postgres,
   both Dockerfiles built from the root, the Eden type crossing the workspace link. Report what broke.
2. **Tooling:** the `image-name` input (section 6), reviewed by another thread, merged into tooling `main`.
3. **Alex creates `unset-sh/unset`** with `staging` as default and `main`, rulesets copied from web and backend.
4. **Short freeze** of web, backend and rendering: land or close their open pull requests (none open today in web
   or backend), then stop merging. Expected to last one working session.
5. **Import with history.** In a clone of each old repository, one commit moves everything into its folder
   (`git mv`, no other change), then the new repository merges it with `--allow-unrelated-histories`. Commit ids
   stay the same, so every provenance link and pin written so far still resolves, and `git log --follow` and blame
   go through the move. Order: backend to `apps/api`, web to `apps/web`, rendering to `packages/rendering`. The old
   per-repository `.github/workflows` and `.claude/` are dropped in the same commit.
6. **Make it one workspace** (one PR): root `package.json`, catalog, one `bun.lock`, root `bunfig.toml`, root
   tsconfig, Biome, dependency-cruiser, CI callers, image callers, root `CLAUDE.md`, the kit copy.
7. **Replace the seams** (one PR each): web takes `@unset-sh/api` over the workspace link instead of its pinned
   copy; api and web take `@unset-sh/rendering` over the link when they first use it.
8. **Adopt Elysia's folders in api** (one PR, moves only, no behaviour change, as the working rules ask).
9. **Elsewhere:** deployment points at `staging/api`, `staging/web` and the new attestation source; `.github` map;
   docs export source; agent-kit records and CHANGELOG.
10. **Alex archives** web, backend and rendering (read-only, all links keep working). `@unset-sh/rendering` 0.1.0
    stays in the registry; no new versions.

## 9. Risks

- **Isolated installs with Vite and svelte-check are untried.** Step 1 settles it. Fallback: the hoisted linker,
  which loses one of the three boundary guards but keeps the other two.
- **One promotion releases everything.** Alex reviews one bigger promotion instead of three. Deployment still picks
  each app's digest separately, so a bad web release rolls back without touching api.
- **Every pull request runs every app's check.** A few extra minutes per pull request. Path filters would save time,
  but a required check whose workflow a path filter skips stays pending and blocks the merge; not worth it at this size.
- **One lockfile.** Merging three lockfiles can move transitive versions. Every direct version is already exact;
  the 7-day rule still applies; the diff of resolved versions is reviewed in step 6.
- **Lost branches.** Work on old branches does not follow automatically. Step 4's freeze exists for that.
- **Larger blast radius for a mistake in CI.** One repository's `GITHUB_TOKEN` now builds both images. The image
  workflow's permissions are already per job and the same as today.
- **Docs and the map** need the new source registered, or the export and the map show stale repositories. Step 9.

## 10. In-flight work

- **Cerbos in backend** (org-0018, org-0019, backend #25): moves as it is into `apps/api`. No conflict.
- **deployment #11** (Cerbos PDP in the local stack): independent of the move; it can merge as it is. Its image
  references change in step 9 with everything else.
- **OpenFGA** (#48): best run its proof of concept after step 6, inside the new layout, so the switch lands once.
- **Slice 2** (public profile page): start after step 8. If it cannot wait, build it in the old repositories now;
  its history comes across in step 5 anyway.
- **Decisions waiting elsewhere** (2FA plan, public API record, lexicons `drafts`) are unaffected.

## 11. What Alex decides

1. Accept the split in section 2: web, backend and rendering in; the rest out.
2. The repository name: `unset-sh/unset` (recommended) or `unset-sh/app`.
3. `apps/indexer` (named by job) or `apps/worker` (one home for background jobs).
4. Go ahead with step 1, the scratch proof, before anything real moves.
