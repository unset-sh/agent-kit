# Architecture chat synthesis

Recorded 2026-11-22. This is a synthesis, not a reconstructed transcript. The owner quotations below are
the recorded wording; surrounding explanations distinguish the resulting decision from implementation advice.

## From maintainability research to organisation boundaries

Alex first asked for research into proper software architecture, file conventions and maintainability as
a codebase grows. He clarified: "dont relate them to here" and "i want a focus on scaling code, best standard
to maintain a code base". The initial work therefore addressed features and contributors rather than traffic
capacity or a specific repository. It recommended cohesive capabilities, private internals, intentional
public interfaces, controlled dependencies and meaningful automated checks. It did not establish one
official universal folder tree, file-length limit, repository count or test-coverage target.

The multi-repository follow-up added explicit ownership, a discoverable catalog, versioned artifacts and
consumer/provider compatibility evidence. Repositories, packages, teams and running services are distinct
boundaries. Splitting code that always changes together can turn an ordinary edit into release coordination;
the useful criterion is understandable responsibilities and localized change, not the smallest repository.

Alex wanted proper architecture documents for future use. The resulting standards, source inventory,
adoption notes and read-only assessments are preserved in the [artifact set](artifacts.md). They remain
research and proposed mechanisms where the owner did not make a specific decision.

## Shared platform and automatic propagation

The discussion developed brand and developer-tooling as authoritative shared capabilities. Brand owns
semantic tokens and assets; consumers use generated or published artifacts through their own adapters.
Changing a token affects existing uses after delivery. Adding a token does not make every screen use it.
Svelte components, native components and rendered images may share visual roles without sharing a runtime.

Automatic propagation means source release, dependency updates, consumer checks, eligible merge, consumer
build and required delivery. A release or opened PR is not completion. Keep immutable versions and record
failures and actual consumer versions. Required approval controls remain in force. Installed mobile apps
change through their distribution and installation lifecycle unless a separately designed, constrained
runtime configuration mechanism is chosen.

Alex later confirmed "yes agreed brand remains its own". Brand is independently authoritative even if
fonts, logos or icons are delivered from S3/CDN. An optional delivery pattern selects an immutable brand
release, uploads checked copies under versioned paths, preserves hashes and configures access through the
consumer/deployment owner. Clients reference those URLs; brand does not depend on a running backend.
Tokens can stay bundled, and a web app can serve package assets directly. This is an optional delivery
design, not an implemented storage, authentication or CDN configuration.

The earlier `developer-tooling` label became accepted `unset-sh/tooling` under org-0006. It owns shared
workflow/check implementations and tests; product commands, domain-specific policies and useful local
scripts remain with their product. Current tooling exists and is unreleased. Older findings about `.github`
PR #6 are preserved as history, not the current ownership decision. The organisation's `.github` repository
continues to own its catalog and community defaults.

During implementation of this record, PR #6 merged and `.github` main advanced to `3666555`. Its map now
records tooling and lexicons as active and contains small pinned tooling callers. The supplemental tooling
audit predates that merge; its no-caller observation must not be repeated as current fact. Tooling publication
and end-to-end automatic propagation remain separate, unverified delivery milestones.

## Application inspection and permission to redesign the destination

Alex then requested a read-only inspection of the existing application's structure. The source snapshot
was `9817f1e7ed51fdd5989d6bad6261a9e167d97b80`. It showed substantial boundary enforcement, domain-owned
contracts, server adapters and separate privileged processes. It also showed route-owned profile operations,
view/component navigation split across workspaces and path-sensitive build/guard rules.

Alex clarified: "as we are moving the app into the org, we can also rewrite/ move parts of code". The proposed
destination therefore need not preserve old folder seams. Preserve the guarantees rather than their old
path strings: browser/server boundaries, operation permissions, meaningful failures, release verification
and separate process roles. The original application remains read-only; redesign belongs in the destination.

Web-specific source can become one complete SvelteKit application, including routes, SSR, browser features,
web-only session/response adapters and platform components. The inspected source uses SvelteKit 3.2.0,
Svelte 5.57.3 and adapter-node 6.0.2, with configuration in `vite.config.ts`; a destination must verify its
chosen toolchain and avoid mechanically adding configuration from another version. Existing container
paths, package mappings, build-input hashes, route policies and negative guard fixtures must migrate together.
This was not a request to make native mobile reuse Svelte components.
[Inspected web package](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/interfaces/web/package.json)

## Approved repository and capability direction

The later discussion separated complete web/mobile clients from a backend owning server operations and
private adapters. Alex approved proceeding: "ok let make the organisation follow this logic". The accepted
foundation names are backend, web and deployment. A future mobile client consumes relevant supported APIs;
it does not receive private database drivers or administrator credentials.

Alex subsequently instructed: "rename server-kit to backend, and delete standalone messaging". Inventory
confirmed both names were proposed map entries, not repositories. This means replacing the server-kit
proposal with backend and removing the standalone messaging proposal, not deleting repository history.
Messaging UI belongs in web/mobile; server-side operations belong in backend. Device-side adapters remain
valid where a technology requires them. No presentation-to-rendering rename was approved.

Alex briefly questioned whether server-kit already existed, then corrected that assumption. The refreshed
inventory still found no server-kit or messaging repository. Backend is created directly under its approved
name; this record makes no claim that an existing repository was renamed or deleted.

Name capabilities after application responsibilities, such as profile, identity and messaging. Name concrete
adapters after their technology. Keep three levels distinct: screen-facing capability interfaces, public
network contracts and private backend ports. Interfaces need actual implementations and deliberately
translated failure semantics, not a giant mirror of an SDK. Client encryption and device-to-device protocols
cannot automatically be hidden entirely behind a server adapter. The source research links
[Matrix encryption](https://spec.matrix.org/latest/client-server-api/#end-to-end-encryption) and
[Briar's architecture](https://briarproject.org/how-it-works/) as examples of runtime-specific responsibilities,
not selected implementations or a promise of protocol interoperability.

The ownership discussion first used `domains/storage/contract` for a shared capability. Alex then noted
that Postgres is also storage, making that application-level name too broad. He accepted the refinement
"assets is fine": `domains/assets` owns managed uploaded/generated content and its rules; infrastructure
groups concrete storage technologies separately. Public network schemas remain separate: AT Protocol
contracts live with lexicons; other APIs have an explicitly owned specification. A private domain interface
is not automatically exposed to clients.

Assets can include images, video, audio, PDFs, attachments and generated previews, with identifiers, owner,
content type, size, access and deletion metadata. Ordinary profile records, source code, configuration and
logs are not automatically assets. Brand artifacts retain their independent brand owner. `files` was a
possible plainer name, but the accepted capability name is assets; no existing repository was renamed.

Postgres may hold asset metadata/ownership while S3 holds bytes. Do not unify relational and blob-storage
contracts merely because both are infrastructure/storage. A profile-specific `ProfileRepository` belongs
with profile. Deployment owns bucket setup, policies, lifecycle and environment configuration.

Inject the assets capability into a profile operation. In the same backend this can be an ordinary in-process
call through its public internal interface, not another service. Profile owns avatar meaning and retains an
asset reference; assets/media resolves an allowed application media URL and applies its access rules.
Composition supplies concrete adapters. Keep profile → assets dependencies one-way. These are responsibility
examples, not a frozen API or completed authorization design.

The final illustrative folder recommendation was:

```text
backend/
  domains/
    profile/{get-profile.ts, repository.ts, get-profile.test.ts}
    assets/
      contract.ts                 # public internal assets capability
      resolve-asset.ts            # managed-content/access policy
      object-store.ts             # provider port needed by that policy
      resolve-asset.test.ts
  infrastructure/
    storage/
      postgres/profile-repository.ts
      s3/object-store.ts
  services/api/
    routes/profile.ts
    compose.ts
```

Profile consumes assets' public capability. Asset policy uses its own provider port, implemented by S3;
composition connects those pieces. This extra distinction is justified only when assets has real policy
or behavior to own. Simplify it when it would only forward calls. The example is not a created scaffold,
an accepted exact tree, or a reason to expose `object-store.ts` to every domain.

## AppView, PDS, Tap and deployment assembly

The intended backend includes Unset's domain operations, indexing/projection rules and AppView query API.
PDS hosts user repositories. Tap can provide synchronization, verification and backfill; it is not Unset's
query layer. The proposed read path is PDS/network updates → Tap, when adopted → Unset indexer → indexed
data → AppView API → clients. The inspected app initially uses `@atproto/sync` against its own PDS; Tap
remains a later integration, not a claimed deployment. See the
[AT Protocol stack](https://atproto.com/guides/the-at-stack#tap) and the
[inspected ingest decision](https://github.com/Undefined6799/unset/blob/9817f1e7ed51fdd5989d6bad6261a9e167d97b80/docs/human/decisions/0052-ingest-our-pds-with-atproto-sync.md#L1-L10).

Backend source ownership does not require copying upstream PDS or Tap implementations into it. Their
component owners produce or select artifacts; deployment assembles immutable producer images, topology,
configuration and rollout order. This is not one giant image containing every service. Keep separately
privileged processes separate, and keep backend migration/build/run contracts with the producer.

Direct end-user PDS access using OAuth is a valid architecture to evaluate separately from backend-mediated
writes. This chat does not select a new credential path. Read validation must allow protocol-permitted
extensions and account for externally authored records; an app's stricter editor rules are not universal
protocol rules. [AT Protocol OAuth](https://atproto.com/specs/oauth)

## Stable public contracts and evolving implementation

Published protocol meanings should remain compatible. Lexicons can express records and XRPC methods;
compatible optional additions differ from breaking changes needing a new NSID. A schema alone does not
prove behavior, authorization, concurrency, ordering, error or retry semantics. Record supported versions
and verify exercised consumer/provider interactions. [Lexicon evolution](https://atproto.com/specs/lexicon#lexicon-evolution),
[AIP-180](https://google.aip.dev/180)

Do not freeze every local interface as a public protocol. Private ports and database representation can
evolve, with migration/recovery proportional to risk. Publish immutable packages and generated clients from
their owner; a separate SDK repository is optional. A version number communicates a compatibility policy,
not proof of deployed compatibility. [Semantic Versioning](https://semver.org/)

The initial discovery slice should use a real profile operation, separating forms, redirects and adapter
outcomes before declaring its API. Foundation repositories and map updates are the immediate approved work;
complete product migration, protocol authority reversal, brand adoption, live cutovers and automatic delivery
remain staged implementation work requiring actual contracts and evidence.

## Documentation request

Alex explicitly requested: "remember to documents this chat in agent-kit". Org-0007 records the accepted
direction; these notes preserve the rationale, research, plan and status without presenting this synthesis
as a transcript. Maintained human docs remain source-owned and use the existing publication pipeline.

## Foundation review and handoff checkpoint

The coordinating task created public backend, web and deployment repositories, then opened their foundation
PRs and the organisation map update. Those PRs remain open and unmerged at this checkpoint; creation and
reviewable scaffolding are not a running application. The [status ledger](status.md) records links and heads.

Alex requested a Cursor fork. A Codex handoff chat, `01a20493-42ea-7140-a6b3-5d7b805295e4`, was created for
read-only review of the four PRs. This records a Codex handoff only; no launched Cursor agent was verified.
