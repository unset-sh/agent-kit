# Application structure assessment and migration proposal

**Status:** Read-only assessment; proposed changes only. **Date:** 2026-11-22.  
**Baseline:** [`Undefined6799/unset` at `9817f1e7ed51fdd5989d6bad6261a9e167d97b80`](https://github.com/Undefined6799/unset/tree/9817f1e7ed51fdd5989d6bad6261a9e167d97b80).

**Recommendation:** Use the move into the organization to consolidate the two web workspaces into one SvelteKit application, improve profile-operation ownership, and adopt shared platform artifacts. Keep the useful domain/infrastructure separation and independently privileged processes. Preserve their guarantees while translating path-dependent checks to the new structure. The destination can improve the layout without reproducing every existing seam.

This assessment inspected a clean, tracked-file snapshot, not the user's working tree. The original `Undefined6799/unset` application remains read-only; changes below are proposed for an isolated organization destination. No application files changed; no dependencies were installed and no application scripts, builds or tests ran. Organization comparisons use earlier reviewed immutable revisions linked below; later release compatibility remains unverified. This document extends the [architecture standard](architecture-standard.md), [multi-repository standard](multi-repository-standard.md) and [shared-platform direction](shared-platform-and-automation.md). Accepted decisions require explicit replacement where the destination changes them.

**Subsequent design refinement:** Alex clarified that the organization should support separate web and mobile clients sharing backend capabilities. The [repository-boundaries proposal](repository-boundaries-and-contracts.md) now recommends a separate backend repository. It refines the destination below: consolidate web-specific concerns in the web application, and move product operations and server adapters into the backend. This assessment remains the read-only source evidence and initial migration proposal; no existing repository decision has been changed.

## What the structure already does well

The snapshot contains **1,949 tracked files and 31 npm workspaces**: one app, five interfaces, four domains, ten infrastructure packages and eleven shared packages. Major directory counts are `apps` 133, `interfaces` 294, `domains` 70, `infrastructure` 213, `shared` 277, `scripts` 295, `docs` 307, `tests` 156 and `deployment` 155. These include tests, fixtures and assets; they are inventory counts, not complexity measurements. [Workspace manifest](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/package.json)

Keep the following foundations:

- **Enforced import boundaries.** Dependency rules protect domain purity and public entry points, restrict browser/server imports, prevent routes importing Postgres, and detect cycles with documented exceptions. Preserve the policies and their failure fixtures. [Boundary rules](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/scripts/lint/.dependency-cruiser.cjs#L300-L318), [web rules](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/scripts/lint/.dependency-cruiser.cjs#L475-L503)
- **Domain-owned contracts and infrastructure adapters.** Identity declares required capabilities; the Postgres account adapter implements a domain contract. This provides a useful existing model for profile operations. [Identity contract](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/domains/identity/contract.ts#L1-L28), [account adapter](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/infrastructure/postgres/accountRepository.ts#L4-L63)
- **Deliberate trust and process separation.** ADR 0056 assigns SvelteKit to `interfaces/web` and components to `apps/web`, with the browser/server boundary enforced by file kind. Consolidating those web workspaces can simplify navigation while retaining that boundary. Record a superseding destination ADR; retain separately privileged indexer, media, review and PDS-administration processes. [ADR 0056](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/docs/human/decisions/0056-web-boundary-by-file-kind.md)

## Keep, move, replace and avoid

| Area | Recommended action | Ownership after migration |
| --- | --- | --- |
| `domains`, infrastructure adapters and process composition | Keep; narrow dependencies around individual operations | Application owns product rules, account lifecycle, permissions, persistence and orchestration |
| `interfaces/web` plus `apps/web` | Consolidate into destination `apps/web` | One SvelteKit workspace owns routes, web features, server bindings and build configuration |
| Other `interfaces/*` processes | Proposed destination `services/*` | Preserve each executable, role, container and capability boundary; the folder name is optional |
| Profile route-owned operations/contracts | Untangle transport concerns, then move reusable operations into the profile domain | Web owns forms, HTTP mapping and redirects; profile owns operation semantics |
| Feature components and view code | Colocate inside `apps/web/src/lib/features` | Application owns Svelte components and presentation models |
| `shared/ui` assets and necessary generation | Replace with pinned brand artifacts and local consumer adapters | Brand owns tokens/assets; application owns their integration |
| `shared/lexicons` | Transfer schema authority deliberately; replace generation/validation through a tested facade | Lexicons owns protocol; application retains product and authorization policy |
| Reusable workflow/check mechanisms | Extract selectively after separating configuration and fixtures | Developer-tooling owns engines; application owns its rules and delivery policy |
| `deployment` | Keep application topology and trust decisions; assess PDS packaging separately | Application remains responsible for its deployed system |
| Rendering integration | Add only when a concrete output is needed | Rendering, currently `presentation`, supplies an image API; application owns eligibility and routes |

Avoid moving all `shared/` or `scripts/` into another repository, exporting the entire domain as a mobile SDK, or creating mandatory layers for small functions. Rewriting a route-owned operation or replacing a duplicated generator is justified when it simplifies ownership. Merely renaming `domains` and `infrastructure` adds little. ADR 0057 already favors reducing owned complexity. [ADR 0057](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/docs/human/decisions/0057-small-and-auditable-means-the-code.md#L29-L52)

## First internal improvement: profile operation ownership

`card-writes.server.ts` coordinates useful product operations, but lives under a route, imports PDS-specific outcomes and returns a web redirect. Another server interface would need to reach into that route or duplicate its orchestration. Separate transport-independent inputs, results and storage capabilities before relocating anything. Keep form parsing, HTTP status translation and navigation in web; preserve concurrency, ownership and picture-settlement behavior. [Store and imports](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/routes/%5Bdid%3Ddid%5D/card-writes.server.ts#L32-L74), [operation surface](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/routes/%5Bdid%3Ddid%5D/card-writes.server.ts#L136-L176)

A small operation-refactoring slice, after the web relocation, addresses `lib/server/profile-save.ts` importing `SaveProfile` from its route. Proposed destination files are:

- `domains/profile/application/contracts.ts`: a transport-independent save contract, after checking its dependency closure.
- `apps/web/src/routes/profile/save.server.ts`: consume that contract; retain form parsing and redirects.
- `apps/web/src/lib/server/profile/save.ts`: relocate the binding and depend on the owning contract rather than the route.

Associated exports, references and tests must follow the change. This is a proposal, not an implemented patch. [Current reverse dependency](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/lib/server/profile-save.ts#L5-L18), [form boundary](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/routes/profile/save.server.ts#L43-L67)

Retain the composition root, but give operations narrow dependencies rather than its complete `Services` object, which includes the database pool and unrelated capabilities. [Current services](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/lib/server/compose.ts#L110-L173)

The intended **source-import** direction is `web adapter → profile operation → profile-owned contract`, with `infrastructure adapter → profile-owned contract`. Composition connects implementations. At runtime the operation calls its supplied adapter; it need not import that adapter. Transport-independent server orchestration remains server code, not a mobile-client capability.

## Proposed organization application layout

```text
apps/web/
  src/routes/                    # framework entries, forms, navigation
  src/lib/
    features/
      profile/{components/, view.ts, types.ts, index.ts}
      notifications/{components/, view.ts, index.ts}
      settings/{components/, index.ts}
    components/ui/               # stock web primitives
    server/
      compose.ts                 # web process wiring
      profile/                   # bindings and response translation
  vite.config.ts                 # current SvelteKit configuration model
  server.ts                      # preserve current boot behavior
services/{indexer,media,review,pds-admin}/
domains/profile/
  application/                   # server operations and owned contracts
  ...                            # product rules and colocated tests
domains/{identity,content,notifications}/
infrastructure/{postgres,pds,session,net-guard,...}/
shared/                          # remaining purposeful app-owned packages
scripts/                         # local policy, adapters and fixtures
deployment/                      # application deployment ownership
docs/human/architecture.md        # current canonical map
```

Create only needed subdivisions. Current components and supporting view code occupy different paths; the consolidated feature folders bring them together. Keep intentional presentation shapes: profile view types contain sanitized links and rendered README blocks, so not every similar record should collapse into one type. The `services` name describes executable processes; retaining `interfaces` is acceptable if renaming would distract from consolidation. [Web exports](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/apps/web/package.json#L7-L18), [view types](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/apps/web/lib/profile/types.ts#L43-L85)

Treat web consolidation as a coherent toolchain migration. Keep the installed SvelteKit configuration model in `vite.config.ts`; do not introduce a conventional-looking configuration file from another version. Update workspace manifests, package exports, TypeScript references, dependency fixtures, container copy/build paths, integration-server build inputs and CI budgets together. Translate path guards to protect the same properties, including meaningful negative cases. [Web configuration](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/vite.config.ts), [container paths](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/deployment/images/node-app.Dockerfile#L54-L57), [built-server inputs](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/tests/integration/web/built-server.ts#L29)

The current app-only-shared restriction cannot apply unchanged once `apps/web` contains server code. Replace it with explicit file-kind and server-only rules before retiring old paths; do not remove the protection. Preserve the web package's `#kit/handler` and `#kit/manifest` mappings, request gate, route policies and CSS/UI checks. Assert that relocated guards inspect expected files and still reject known-bad fixtures: a check matching no files is not a successful migration. The superseding ADR changes placement, not these trust guarantees. [Package mappings](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/package.json#L6-L20), [dependency policy](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/scripts/lint/.dependency-cruiser.cjs)

If non-web processes move from `interfaces/` to `services/`, migrate their path-dependent protections in the same change: admin isolation and zero-dependency rules, cross-process imports, composition-root discovery, trusted paths and CODEOWNERS. Require negative fixtures and evidence that each expected entry point is scanned. Otherwise retain `interfaces/`; this optional rename does not justify weakening a process boundary. [Admin isolation rules](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/scripts/lint/.dependency-cruiser.cjs#L384-L392), [composition discovery](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/scripts/guards/composition-root.ts#L2), [process ownership](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/.github/CODEOWNERS#L66)

For mobile reuse, select protocol types, validation and pure transformations individually. The profile barrel also exports crawler functionality using Node's `Buffer`; the whole package is not proven portable. Build each selected entry point and its dependency closure under the chosen mobile runtime. Keep database access, OAuth custody, sessions and network enforcement server-side. [Crawler dependency](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/domains/profile/crawlers.ts#L64)

## Shared-platform cutovers

**Brand requires adapter work.** `shared/ui` exports theme, fonts and icon data; Svelte components live in `apps/web`. The current icon adapter expects Iconoir's data shape, while the reviewed brand migration changes icons and token structure. Replace those contracts deliberately. Include PDS styling: its build combines theme and adapter CSS before hashing. Consume resolved static artifacts while preserving font paths, CSP and meaningful visual tests. [Shared UI exports](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/shared/ui/package.json#L7), [brand migration](https://github.com/unset-sh/brand/blob/8c998a2990ae477daf5ac1636028f6cbf379577b/docs/migration.md#L16), [PDS build](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/deployment/pds/pds.Dockerfile#L4)

**Lexicons needs an authority transfer and a usable release.** The reviewed central repository is a manual mirror, not a replacement runtime SDK. Transfer schemas, generation and compatibility evidence deliberately. Keep product editor limits, OAuth grant selection and authored-write policy outside protocol definitions. Current validation permits unknown fields on reads but applies stricter authored-write checks; compare behavior before replacing it. Preserve optional-field evolution, unknown data and absent-field meanings; breaking protocol designs require the agreed new-NSID route. [Mirror policy](https://github.com/unset-sh/lexicons/blob/52cfb6990f3833e4bdd260cd5bb520fc4446e122/docs/maintenance.md), [validator behavior](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/shared/lexicons/src/validate.ts#L27), [application scope selection](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/shared/lexicons/src/scope.ts#L6)

**Rendering is a new integration.** No existing image renderer was found to extract; search preview is a UI mock. Keep visibility, URL resolution, caching and removal behavior in the application, passing approved data to a server rendering adapter. Verify the current `presentation` brand dependency before adoption. “Rendering” is a proposed broader name, not a completed repository rename. [Search preview](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/apps/web/lib/components/settings/search-preview.svelte), [existing presentation adapter](https://github.com/unset-sh/presentation/blob/f4597ce765007c28c0fd0aadbd3f9f0333939229/src/brand.ts#L28)

## Tooling and documentation boundaries

Centralize reusable engines, retaining application policy and negative fixtures. Directory names alone cannot classify dependencies: deployment preflight invokes `scripts/ci/verify-images.ts` by subprocess path, with trust-root and executable restrictions. Moving it requires an explicit replacement contract and local adapter. Preserve aggregate CI checks and required status identities during workflow migration. [Operational caller](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/deployment/preflight/inputs.ts#L447-L464), [CI gate](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/.github/workflows/ci.yml#L265-L314)

Correct the destination architecture map alongside relocation. Guidance still describes `interfaces/http` and islands, whereas ADR 0056 describes the current web boundary. Record the new consolidated layout through a superseding decision; retain historical ADRs and label planned structures. Keep documentation publishing owned by `unset-sh/docs`, rather than recreating independent authoritative copies. [Outdated tree](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/docs/human/engineering/architecture-and-development-guideline.md#L16-L58), [publishing boundary](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/docs/human/runbooks/docs-site.md#L3-L22)

## Staged delivery and acceptance

1. **Establish an isolated destination baseline.** Keep the original application unchanged. Record source provenance, owners, supported revisions and imports plus subprocess/build dependencies. Approve the destination architecture and resolve central tooling's location through the existing decision process.
2. **Consolidate web coherently.** Relocate routes, components, server bindings and configuration into `apps/web`; migrate all build paths and guards. Keep this change behavior-preserving and validate the built server, browser boundary, container build and important journeys. New features then use the destination structure directly.
3. **Improve operation ownership.** Complete the small save-contract slice, then refactor card-write orchestration and transport-shaped validation. Keep useful tests while replacing assertions tied only to obsolete internals. Require preserved product outcomes and rejected forbidden dependencies.
4. **Adopt shared artifacts separately.** Prove brand adapters and Lexicon validator behavior through consumer fixtures. Switch via temporary facades, with prior immutable artifacts available for recovery; do not destructively roll back stored records.
5. **Extract one tooling mechanism.** Preserve app policy, failure fixtures and full check aggregation. Demonstrate a real caller before expanding shared workflows; avoid combining this extraction with web relocation.
6. **Enable verified propagation.** Register consumers and exercise release → update → checks → eligible merge → build/delivery. Report blocked versions. Add rendering and portable packages for concrete consumers; installed mobile applications still require distribution and installation.

**Verification limit:** Existing CI metadata showed code/check jobs succeeding while [CI run 45041619479](https://github.com/Undefined6799/unset/actions/runs/45041619479) failed at its secrets full-history scan. The separate [images](https://github.com/Undefined6799/unset/actions/runs/45041619485) and [end-to-end](https://github.com/Undefined6799/unset/actions/runs/45041619462) runs succeeded. No scan logs were inspected or failure diagnosis made. These observations do not establish a fully green baseline or verify any proposed migration. Each implementation change needs fresh checks against its actual revision.
