# Proposed decision: backend, clients and stable public contracts

**Status:** Proposed destination design. **Date:** 2026-11-22.  
**Decision owners:** Backend, web and platform maintainers; responsibilities to assign.

## Context

The organization should provide reusable capabilities to web and future mobile clients, with a shared backend for product operations and data access. The move into the organization permits deliberate restructuring. This proposal refines the destination ownership in the [application assessment](app-structure-assessment.md); its read-only source evidence remains valid. It changes no repositories, guards, deployments or accepted decisions.

The existing application separates domains, adapters and privileged processes, but some operations remain coupled to web routes. Profile saving imports a route-owned contract, and card-write orchestration includes adapter-specific outcomes and redirects. These are useful starting points for discovering an API boundary, not evidence that a native-client API is already ready. [Save contract dependency](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/lib/server/profile-save.ts#L5-L18), [card-write boundary](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/src/routes/%5Bdid%3Ddid%5D/card-writes.server.ts#L32-L74)

## Decision

Separate the **backend** from a complete **web application**, with mobile consuming supported public interfaces when introduced. Begin with a modular backend repository containing multiple existing processes where their privileges differ. Do not create a service or repository for every database adapter.

This focused map supplements the organization; it does not absorb existing documentation, profile-recipes or other independently useful repositories.

| Proposed repository | Owns | Boundary |
| --- | --- | --- |
| `backend` | Product operations, domain rules, private Postgres/PDS/storage adapters, migrations, process entries and image builds | Published APIs; private implementation stays inside |
| `web` | Complete SvelteKit app: routes, SSR, browser features, components and web session/edge adapters | Calls backend operations; owns web presentation |
| `mobile` — future | Native screens, navigation, platform integration and client state | Calls supported APIs; owns its release lifecycle |
| `lexicons` | Authoritative protocol definitions and reproducible generated artifacts | Published schemas/types/validators with compatibility evidence |
| `brand` | Semantic tokens, fonts, icons and approved assets | Versioned platform-consumable artifacts |
| `rendering` — currently `presentation` | Reusable rendering with explicit inputs and outputs | Rendering API; renaming remains optional |
| `developer-tooling` | Reusable CI engines, actions, workflow helpers and tests | Versioned implementations with declared inputs |
| `deployment` | Environment topology, desired artifact versions, infrastructure definitions and rollout orchestration | Consumes backend/client deployment contracts |

“Shared” means discoverable, owned capabilities in the organization catalog. It is not a destination for arbitrary helpers. Generated clients can be published from `lexicons` or `backend`; a separate SDK repository is unnecessary unless independent ownership warrants it.

### Agreed direction: capability contracts and technology adapters

Alex agreed to this design direction on 2026-11-22: name contracts after product capabilities, such as profile, identity and messaging, and name adapters after the technologies they integrate, such as AT Protocol or Matrix. This records the working direction; source repositories and accepted ADRs remain unchanged.

Keep three boundaries distinct. UI capability interfaces describe what screens need. Published network contracts describe operations exchanged between independently running clients and services. Private backend ports describe dependencies required by domain operations. They may share selected data definitions, but are not automatically one interface or one permanent protocol.

For example, a profile screen consumes the public profile API. A backend profile operation uses a domain-owned storage port, implemented by an AT Protocol adapter. The adapter contains working integration code, not only declarations. Keep SDK types and provider-specific error translation behind the relevant adapter. Publish externally consumed contracts from their authoritative owner; keep private ports local. Explicitly choosing protocol identifiers as public product concepts makes them compatibility commitments.

Place adapters according to their runtime and trust needs. Messaging screens can use a stable Unset interface while a device-side implementation manages protocol-specific behavior. Matrix end-to-end encryption has client responsibilities, and Briar synchronizes between devices; neither should be assumed to fit wholly inside a server adapter. A common UI does not establish equivalent capabilities or interoperability. [Matrix encryption](https://spec.matrix.org/latest/client-server-api/#end-to-end-encryption), [Briar architecture](https://briarproject.org/how-it-works/)

### AppView, PDS and Tap: source ownership versus deployed services

The backend repository contains Unset's application code. The deployed backend includes that code plus separately operated services. Repository ownership and runtime placement are different decisions.

| Component | Source responsibility | Deployment responsibility |
| --- | --- | --- |
| Unset AppView | Backend owns indexing rules, query APIs, feature projections and visibility rules | Deployment runs released API and indexer artifacts with their separate roles |
| PDS | Upstream implementation; any maintained packaging or customization has an explicit component owner | Deployment selects its released image, configuration, volumes and network access |
| Tap, when adopted | Upstream implementation; backend owns its consumer/integration code | Deployment selects the released Tap image and configures its connections and state |
| AT Protocol adapters | Backend owns protocol integration used by its operations | Included in the corresponding backend artifact |

An illustrative backend layout is `services/appview/`, `services/indexer/`, feature-owned `domains/`, and `infrastructure/` adapters. These represent responsibilities, not a requirement to create an extra API process if the existing backend API already serves the AppView contract. Configuration for running PDS and Tap belongs in the deployment repository; importing or copying their entire upstream implementations into backend is unnecessary. Custom image build definitions remain with the component owner and produce artifacts consumed by deployment.

The PDS hosts user repositories. Tap can handle synchronization, verification and backfill. Unset's indexer then interprets relevant records and maintains queryable projections, which the AppView API serves to clients. Tap is not the application's query layer. [AT Protocol stack](https://atproto.com/guides/the-at-stack#tap)

The target data flow is `PDS/network updates → Tap → Unset indexer → indexed data → AppView API → web/mobile`. It describes the read side; authorized record writes still follow the chosen PDS write path. Preserve authoritative application decisions separately from rebuildable index data, and do not introduce a new database just because processes are separate.

**Current-state limit:** the inspected application initially ingests its own PDS through `@atproto/sync`; Tap is later scope. This proposal does not claim that Tap is deployed or that existing ingestion has been replaced. [Accepted ingest decision](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/docs/human/decisions/0052-ingest-our-pds-with-atproto-sync.md#L1-L10)

### Keep privileged responsibilities behind the right boundary

Backend owns authoritative product authorization, account/data operations and private credentials. Web retains framework routing, SSR, form parsing, browser sessions and response presentation. Mobile uses public operations rather than importing database drivers, storage administration or PDS-admin credentials. Preserve separate process roles and capability restrictions when relocating code.

AT Protocol supports clients obtaining end-user authorization through OAuth; direct authorized PDS access is therefore a possible client architecture. It is not selected by this proposal, and existing guards remain unchanged. Decide it separately from backend-mediated operations. [AT Protocol OAuth](https://atproto.com/specs/oauth)

Regardless of this application's client choice, externally authored protocol records cannot be assumed to have passed its editor. Keep read validation and unknown-data preservation distinct from stricter authored-write policy. A native client must not turn convenient local validation into the authoritative permission check.

### Stabilize public commitments without freezing internals

Lexicons can describe records and XRPC interfaces. Preserve existing meanings; evolve through compatible optional additions and retain deprecated fields. Breaking designs need a new NSID. Readers must tolerate permitted extensions, and updates should preserve unknown data. These obligations require behavior checks as well as schema comparisons. [Lexicon evolution](https://atproto.com/specs/lexicon#lexicon-evolution)

Do not publish every internal port as a permanent protocol. Private function signatures, adapter interfaces and database schemas can evolve behind the public boundary. Database migration ownership remains with backend, including compatibility with supported application versions. Deployment executes the documented migration procedure; it does not independently redesign tables.

Public API contracts need more than matching types: compatibility includes source usage, exchanged representation and observable meaning. [Google AIP-180](https://google.aip.dev/180) For each published operation, specify:

- Inputs, outputs, meanings, defaults and validation limits.
- Authentication, authorization and disclosure rules.
- Error categories and whether retry is safe.
- Concurrency, idempotency and duplicate-request behavior where relevant.
- Pagination and ordering guarantees where relevant.
- Supported consumer/provider versions, deprecation commitments and retirement ownership.

Publish a machine-readable schema alongside examples and executable positive/negative fixtures. Keep the schema with its authoritative owner. A generated client is a derivative, not another independent specification.

Publish immutable artifacts. For stable SemVer packages, incompatible public changes require a major version; compatible additions use a minor version. State pre-1.0 expectations explicitly. Package versions do not themselves establish compatibility of deployed APIs. [Semantic Versioning](https://semver.org/)

### Separate tooling implementation from product and deployment policy

Move reusable checking mechanisms into developer-tooling while keeping application-specific dependency policies, fixtures and meaningful product scripts local. Consumers retain small workflow callers, supported build commands and required-check expectations. Reconcile the existing shared-workflow proposal before choosing its final home.

Backend owns image build definitions, migrations, health/readiness behavior and its configuration contract. Deployment owns environment wiring, selected immutable versions and rollout order. Local development recipes may remain with the product when that improves independent setup. Classify subprocess and build-path dependencies before moving scripts; their directory alone does not establish ownership.

## Options considered

| Option | Benefit | Cost and disposition |
| --- | --- | --- |
| One application repository with internal modules | Simple local changes and integration | Viable baseline, but does not provide the requested independent backend/client ownership |
| Backend plus complete client repositories | Reuses operations across web/mobile with clear responsibility | Recommended; requires deliberate API, authentication and release compatibility |
| Repositories/services per adapter or small feature | Very narrow source ownership | Reject as a default: introduces coordination without demonstrating independent lifecycle needs |

## Consequences

The split adds network calls, authentication boundaries, latency, partial failures and release coordination. SSR must handle backend unavailability explicitly. It also enables clients to evolve independently once their contracts are reliable.

Start with one proven operation and small extension points, not a speculative API covering every future screen. If routine changes repeatedly require lockstep backend/client releases, improve the contract or reconsider the boundary. Shared types alone will not solve that coupling.

## Acceptance and migration sequence

1. **Discover a representative profile operation.** Separate its product inputs/results from forms, redirects and private adapter outcomes. Identify permission, concurrency and failure behavior before specifying its public endpoint.
2. **Prove the boundary in an isolated destination.** Run provider checks and real consumer interactions through the intended API. Preserve useful existing tests and translate guards so known-bad imports still fail. Keep the original application read-only.
3. **Verify supported combinations.** Test positive and negative contract fixtures, old supported clients, candidate backend releases and permitted rollback combinations. Require the named checks at the appropriate merge/release gates and verify their configured enforcement. Database and record changes need explicit coexistence or forward-recovery plans; rollback must not silently destroy newer data.
4. **Exercise automatic delivery.** Publish an immutable release, update registered consumers, run their checks, merge eligible changes under the agreed policy, and complete their normal build/delivery path. Record actual versions and failures, rather than counting opened PRs as adoption.
5. **Preserve older mobile clients.** Distribution and installation are distinct from publishing an SDK or merging an update. Support the declared installed-client versions until their retirement conditions are met, then expand extraction based on demonstrated reuse.
