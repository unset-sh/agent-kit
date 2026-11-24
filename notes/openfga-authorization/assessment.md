# OpenFGA as Unset's authorization engine: Phase 1 assessment

Status: assessment for Alex, 2026-11-24. Nothing here is decided. org-0018 (Cerbos) and org-0019 stay in force
until Alex decides otherwise, and the Cerbos work in backend and deployment is left untouched.

Asked for by Alex on 2026-11-24 (a handoff brief written with ChatGPT, proposing OpenFGA instead of Cerbos, Phase 1
only: "The immediate task is architectural validation and a proof-of-concept proposal, not a full implementation").
He added: "I feel like OpenFGA has a very clean config file format".

Every section marks what **exists** today, what is **proposed**, and what is an **assumption**. The spike that
backs the measured claims is in `spike.md` beside this file; its model, tests and scripts are in
`artifacts/openfga-authorization/`.

## The short answer

- **OpenFGA fits Unset's roadmap better than Cerbos does**, for the reasons the brief gives: organisations,
  communities, custom roles, sharing and module grants are relationships, and OpenFGA answers both "may X do Y
  to Z?" and "which Z may X see?" over chains of them. Cerbos answers only the first, and only from facts backend
  looks up and hands it on every call. The spike's Unset model (orgs, custom roles, communities, modules, expiring
  plans) passed 23 of 23 checks, and the DSL does read cleanly.
- **It costs more to run than Cerbos.** OpenFGA keeps its own copy of every relationship in its own database, so
  each membership change has to reach it reliably, and a removal has to reach it before anything else. It cannot
  listen on a Unix socket, it needs a shared key that reads the whole graph, and it keeps a history of every
  relationship ever written, deletions included, with no retention setting that I found.
- **Today Unset has one rule** ("a member may read and update their own profile"). Neither engine is needed for it.
  The choice matters because it gets more expensive with every policy written, and the cheapest moment to switch
  is now, before slice 2 adds visibility rules.
- **Atmospheric groups change what Unset itself must hold.** If Unset's communities are opensocial.group groups,
  their members and roles live in the group's own spaces, and the group host enforces read access. Unset then
  enforces its own features on top, from a synced copy. OpenFGA would hold a third copy. That is the strongest
  argument against it, and the reason the proof of concept should test it.
- **Do not run both.** A hybrid (Cerbos for attributes, OpenFGA for relationships) gives two policy languages and
  two places to look for every decision. OpenFGA's conditions (CEL) cover the attribute rules Unset has so far.

**Recommendation:** run the Phase 2 proof of concept (about two days, below) against the questions it has to
answer. If it passes, write a new record that supersedes org-0018 and replace the Cerbos adapter and its one policy
behind the existing `may()` port before slice 2's visibility rules are written. If the sync costs prove too high,
keep Cerbos and revisit when communities arrive (phase 9). I lean towards OpenFGA passing.

## 1. Existing repository architecture (exists)

Read from `unset-sh/backend` `staging` at `0a3586e` and `unset-sh/agent-kit` `main` at `bf319c5`.

- **Backend** (Bun, Elysia) has three domains: `src/domains/identity`, `profile` and `access`. Adapters live in
  `src/adapters/` (`atproto`, `auth` for Better Auth, `cerbos`, `egress`, `postgres`, `seal`). Routes are in
  `src/server/internal-api.ts`, private to web, which calls them through Eden Treaty (org-0017).
- **Authentication**: AT Protocol OAuth sign-in, then a Better Auth session on backend (org-0015). Web's server
  forwards the session; the browser never calls backend. 2FA on the Unset session is planned.
- **Authorization** (org-0018, org-0019, backend #25):
  - `src/domains/access/index.ts` is the port. `Authorizer.may(principal, action, resource)` returns `allow`,
    `deny` or `unavailable`; `ready()` reports health. The principal is a member DID or anonymous, never taken from
    the request. Resources are typed (`profile` with `read | update` and `ownerDid`).
  - `src/adapters/cerbos/` is the only code that talks to Cerbos, over gRPC on a Unix socket, failing closed at
    200 ms. `unavailable` answers 503, a denied private read answers 404.
  - `ROUTE_ACCESS` in `src/server/internal-api.ts` makes every route declare its check or that it is public; a test
    fails an unlisted route.
  - `policies/profile.yaml` (owner may read and update) and `policies/tests/profile_test.yaml`, compiled in
    `bun run check`. They ship inside backend's image (org-0019).
  - Deployment #11 (Cerbos in the local stack) is open, waiting on Alex.
- **Data**: Postgres, Better Auth tables via Kysely, Unset's own via `Bun.sql`. Member UUID is internal; DID is the
  public key. An indexer (Tap) is planned for slice 2.
- **Product scope** (`notes/unset-core/scope.md`, on agent-kit #34's branch): communities and moderation, group
  conversations (Matrix), privacy controls, a module system with an SDK, and "Enforce module permissions and user
  authorization". Communities are phase 9, modules phase 13 in the plan.

**Existing authorization inventory**: one resource (`profile`), two actions, one rule (owner only), three routes
behind it (`GET /me/session`, `GET/PATCH /me/profile`). Everything else that gates a request is outside the
engine and stays there: the session check, PDS OAuth scopes, the egress guard, database grants, and rate limits.

## 2. OpenFGA and Cerbos, for Unset

Checked 2026-11-24: OpenFGA server v1.23.0 (2026-11-20, inside the 7-day wait until 2026-11-27; v1.22.1 of
2026-10-28 is usable now), CLI v0.9.0, `@openfga/sdk` 0.9.8 (2026-11-12, Apache-2.0); docs from
`openfga/openfga.dev` at its default branch. Cerbos facts are from org-0018.

| | Cerbos (today) | OpenFGA |
| --- | --- | --- |
| Model | Policies over attributes (ABAC, roles), CEL conditions | Relationships (Zanzibar ReBAC), plus CEL conditions |
| Where facts come from | Backend sends them on every call | Stored in OpenFGA as tuples, plus optional per-call context |
| "May X do Y to Z?" | Yes | Yes |
| "Which Z may X do Y to?" | Query plan: a filter backend turns into SQL | `ListObjects` (default cap 1,000 results), `ListUsers` |
| Chains (org → community → post) | Backend must look up the chain first | Native (`moderator from organization`) |
| Custom roles defined by orgs | Possible with derived roles, but roles are data, so awkward | Native pattern (`role#assignee`), tested in the spike |
| State to keep in sync | None | Every relationship |
| Process | Stateless sidecar, policies from backend's image | Server plus its own Postgres database |
| Transport | gRPC on a Unix socket, no key | HTTP or gRPC on `host:port` only; preshared key or OIDC |
| Policy format | YAML + CEL, one file per resource | FGA DSL, modular (`fga.mod`, `module`, `extend type`) |
| Tests | `cerbos compile` runs YAML tests | `fga model test` runs `.fga.yaml` tests |
| Measured latency (local) | p50 0.43 ms (socket) | p50 1.7 to 1.9 ms, p99 3.3 to 3.8 ms (HTTP, loopback, Postgres) |
| Licence, governance | Apache-2.0, company-led | Apache-2.0, CNCF (incubation proposed in 2025) |

**On the format.** Alex is right that the DSL is cleaner for relationships. The same "owner may update" rule:

```yaml
# Cerbos, policies/profile.yaml today
rules:
  - actions: [update]
    effect: EFFECT_ALLOW
    roles: [member]
    condition:
      match:
        expr: request.resource.attr.ownerDid == request.principal.id
```

```fga
# OpenFGA
type profile
  relations
    define owner: [member]
    define can_update: owner
```

For attribute rules (age gates, "2FA within ten minutes") both fall back to CEL, and Cerbos's YAML is then no worse.
OpenFGA's DSL shines for the chains Unset will have: `define moderator: [member, role#assignee] or admin from
organization` says in one line what Cerbos needs a database lookup and a derived role for.

**Where Cerbos is better.** No state to sync, so no stale permissions; a socket with no key; faster; and the
one policy already works in staging. If Unset's groups end up living entirely in atmospheric groups (section 4),
Unset's own relationships may stay shallow enough for Cerbos.

**Where OpenFGA is better.** Organisations, communities, custom roles, sharing with people and groups, module
grants and "list what I can see" are its native shape. Writing those in Cerbos means writing the graph walks in
backend's SQL and passing the results, which is the scattered pattern the old app had.

## 3. ATProto and OpenFGA: who does what

| Concern | Owner | Notes |
| --- | --- | --- |
| Identity (DID, handle) | ATProto | Exists. Unset never issues identities. |
| Data in a member's repo, portability | ATProto (PDS) | Exists. |
| What Unset may do in a member's PDS | ATProto OAuth scopes | Exists (`repo:sh.unset.*`, re-consent to widen). |
| Who may read a space | Space authority (PDS or group host) | Spaces public beta from 2026-12-01 (section 4). |
| Group members and roles (atmospheric groups) | Group host, in the group's `members` space | Proposal, not a standard. |
| Unset session, 2FA | Better Auth on backend | Exists / planned. |
| Who may do what inside Unset's features | Unset's engine (Cerbos today, OpenFGA proposed) | The only part this choice affects. |
| Unset-only relationships (Unset orgs, module grants, shares) | Unset's Postgres, mirrored into OpenFGA | Proposed. |
| Payment and subscription status | Billing provider | Not chosen yet. |

**The rule that must hold** (the brief's, and I agree): an allow from Unset's engine never overrides a deny from a
PDS, a space authority, an OAuth scope or another boundary. In code this falls out naturally: those checks happen
first and stop the request; the engine is asked last, about Unset's own features.

## 4. Spaces and atmospheric groups: what exists

Primary sources read 2026-11-24: `bluesky-social/proposals` `0016-permissioned-data/README.md` (last merged
2026-11-12), atproto.com blog posts in `bluesky-social/atproto-website` ("The Atproto Spaces Alpha is Live",
2026-08-20; "An Intro to Atmospheric Groups", 2026-10-22; "Open Social Groups, the Vision", 2026-10-29; "Getting
Ready for the Spaces Public Beta", 2026-11-13), and the opensocial.group proposal at
`tangled.org/opensocial.group/proposal/blob/main/proposal.md` (read through a fetcher, latest commit `81f0e6f3`).

**Atproto spaces** (verified):

- Maturity: alpha since 2026-08-20, "you absolutely should not run production code against it". **Public beta on
  2026-12-01**: "changes to the protocol will be minimized and managed as though production software depends on
  it", the reference PDS and Bluesky's PDS fleet gain spaces that day. The proposal still says "Details,
  terminology, and behaviors are all likely to change." The implementation PR (atproto #5187) is marked WIP.
- What it gives: a space is "an authorization and sync boundary", identified by authority DID, type and key.
  Records live in per-member space repos on each member's PDS. Reading needs a **space credential** from the space
  authority. It is "access control, not confidentiality": not end-to-end encrypted.
- Access policies every PDS supports: `memberspace` (a member list with `read` and `write` booleans per DID, managed
  by `putMembers`/`removeMembers`), and `managedspace`, which **delegates the decision to a managing app** through a
  `checkAccess` query ("dynamic policies (e.g. follower-gating or paid subscriptions)").
- What it does not give: roles, hierarchies, or per-record permissions. "The protocol does not define how that
  decision is made and carries no member list." And: "Application services are responsible for appropriately
  restricting access to space data that they serve." OAuth scopes gain `space:` permissions with `read`,
  `read_self`, `manage=create|update|delete`.

**Atmospheric groups (opensocial.group)** (verified as a proposal):

- A community proposal featured by the atproto team, not a Bluesky specification. The proposal states no version or
  status. Prototypes: Grain, opensocial.fyi ("a set of prototypes ... not their final form"), pckt.blog.
- "An atmospheric group is a network identity (DID) with a bunch of permissioned spaces under it." Spaces:
  `group.opensocial.meta` (profile, rules), `group.opensocial.members` (roles, memberships, space index),
  `group.opensocial.invites` in each user's repo, and one space per app modality.
- Membership is two-sided: the group writes `group.opensocial.membership` granting roles; the member writes
  `group.opensocial.acceptance`. Invitations and join requests are specified.
- Roles are **flat RBAC**: group-defined, "no deny rules or caveats", grants are the union of a member's roles,
  "no precedence, hierarchy, or evaluation order". A role's `assignable` list limits which roles its holders may
  grant. Each space has a `group.opensocial.policy` granting read and write per role.
- The group host enforces space read access when issuing credentials and acts as an OAuth server for the group
  DID. What members' records mean (who may pin, post announcements, moderate) is "an app feature".

**What this means for Unset** (proposed):

- Unset should not rebuild what spaces and groups give. Private community content belongs in spaces; community
  membership and roles, if Unset adopts the standard, belong in the group's `members` space.
- Unset still has to authorize its own features over that data, because the protocol leaves app-level rules to apps.
  That is where an engine sits, either one.
- With OpenFGA, synced group roles become tuples (`role:<group>/<role>#assignee`) mirrored from the indexer, and
  Unset-specific permissions refer to them. With Cerbos, backend reads the synced roles from Postgres and passes
  them as principal attributes.
- `managedspace` gives Unset a clean hook: Unset can be the managing app for spaces it creates (paid content,
  private profiles), answering `checkAccess` from its own engine. Worth a proof of concept after spaces' beta.
- Decide before building communities whether Unset communities **are** atmospheric groups. My recommendation: yes,
  for interoperability, which shrinks what Unset itself must model.

## 5. Proposed architecture

```text
 Browser ──> web (SvelteKit server) ──mTLS──> backend (Elysia)
                                                 │
       1. session (Better Auth) ─────────────────┤ refuse 401
       2. PDS / space checks (ATProto) ──────────┤ refuse what they refuse
       3. may(principal, action, resource) ──────┤ domains/access port
                    │                            │
             adapters/openfga ──HTTP/gRPC──> OpenFGA server ──> Postgres database "openfga"
                    ▲                                              (own role, own database)
                    │ relay (idempotent writes, deletes first)
       Postgres "unset": domain tables + authz_outbox  <── indexer (Tap): synced group roles
```

- The port stays where it is (`src/domains/access`). Only `src/adapters/openfga/` imports `@openfga/sdk`.
- OpenFGA runs as its own service in deployment, on a private network next to backend, never public.
- The model (`.fga` files and tests) lives in backend, like `policies/` today. Backend's release pins the model
  version it was tested with.

## 6. Proposed relationship model

The spike's model (`artifacts/openfga-authorization/model/`), split with modular models (schema 1.2):

| Module | Types | Purpose |
| --- | --- | --- |
| `core` | `member`, `profile` | Members by DID; owner and public visibility (`member:*` wildcard) |
| `organizations` | `organization`, `role`, `org_document` | Owner ⊃ admin ⊃ member; org-defined roles |
| `communities` | `community` | Owner, moderators (people or roles), members, public read |
| `modules` | `module`, `storage_folder`, `extend type profile` | Grants to a module per resource |
| `entitlements` | `plan`, `feature`, condition `not_expired` | Feature access from a plan, expiring without a second write |

Modular models were verified: `fga.mod` lists files, each file declares one `module`, `extend type` adds relations
to a type owned by another module, and the CLI combines them for tests and for writing the model.

**Not every fact becomes a tuple.** Facts about the request (time, 2FA age, onboarding done) go in as per-call
context to conditions, computed by backend as today. Only durable relationships are tuples.

**DIDs need encoding.** OpenFGA rejected `member:did:plc:alice` as a user ("the 'user' field is malformed"); an id
with colons is accepted as an object but not as a user. The spike percent-encodes `%` then `:`, which is reversible
and keeps `did:web` ids with `%3A` distinct. The member UUID still never leaves backend.

## 7. Organisations and custom roles

```fga
type organization
  relations
    define owner: [member]
    define admin: [member] or owner
    define member: [member] or admin
    define can_manage_members: admin

type role                                     # "Developer", defined by the org
  relations
    define organization: [organization]
    define assignee: [member]
    define can_assign: admin from organization

type org_document
  relations
    define organization: [organization]
    define editor: [member, role#assignee]     # grant to a person or to a whole role
    define viewer: [member, role#assignee] or editor or member from organization
    define can_update: editor or admin from organization
```

Tested: owners inherit admin and member; admins manage members but cannot delete the org; a member assigned the
custom "Developer" role may edit a document and moderate a community the org owns; `ListObjects` returned the
communities a role holder moderates. "Within boundaries established by Unset" holds by construction: orgs choose
who gets a role and which resources a role is granted on, but only Unset's model defines what `can_update` means.
Assigning a role is itself checked (`can_assign`).

## 8. Third-party modules

Proposed, building on the plan's open recommendation of server-enforced per-module tokens:

- A module has an identity (`module:<id>`) known to backend from the marketplace, and calls Unset only with a
  scoped token Unset issued for one member's installation. It never talks to OpenFGA.
- Installing grants named capabilities, written as tuples on the resources the member chose
  (`module:photos` is `module_reader` of `profile:<did>`; `module_writer` of one `storage_folder`).
- Backend allows a module's request only when **both** hold: the member may do it, and the module was granted it.
  Two checks in one `batchCheck`, combined in backend. (An intersection inside the model is possible but couples
  module and member types; two checks are easier to read.)
- Never grantable to a module: messages (Matrix, outside Unset's engine anyway), bookmarks, drafts, identity and
  session routes. Those routes simply have no module capability in the model.
- Revoking an installation deletes its tuples (deletes-first, section 11). Tested: a module granted one profile
  could not read another, and a module could not be written as an owner ("type 'module' is not an allowed type").
- Not solved by any engine: running module code inside Unset's origin with the member's session. That needs the
  sandboxing decision record the plan already asks for before phase 13.

## 9. Subscription entitlements

```fga
type plan
  relations
    define subscriber: [member with not_expired, organization#member with not_expired]
type feature
  relations
    define plan: [plan]
    define can_use: subscriber from plan
condition not_expired(current_time: timestamp, expires_at: timestamp) { current_time < expires_at }
```

The billing provider stays the source of truth. A billing webhook updates Unset's subscription table, which
writes the tuple with `expires_at` through the outbox. Backend passes `current_time`, so an expired plan stops
working even if the cancellation event is late. Tested both sides of expiry. Organisation plans cover every member
through `organization#member`. Feature flags still never grant what a policy denies (org-0018's rule).

## 10. TypeScript interface (proposed)

The existing port barely changes; resource attributes become per-call context where a condition needs them.

```ts
// src/domains/access/index.ts (sketch; extends what exists)
export type Authorizer = {
  may<K extends ResourceKind>(principal: Principal, action: Resources[K]["actions"], resource: Resource<K>): Promise<Decision>;
  /** Several decisions in one round trip, in the order asked. */
  mayEach(checks: readonly Check[]): Promise<readonly Decision[]>;
  /** Ids of resources of one kind the principal may act on, capped; `unavailable` when it cannot answer. */
  visible<K extends ResourceKind>(principal: Principal, action: Resources[K]["actions"], kind: K): Promise<readonly string[] | "unavailable">;
  ready(): Promise<boolean>;
};

/** Written only by domain operations, in the same transaction as the domain change (outbox). */
export type Relationship =
  | { readonly kind: "orgRole"; readonly org: string; readonly did: Did; readonly role: "owner" | "admin" | "member" }
  | { readonly kind: "moduleGrant"; readonly module: string; readonly capability: "read" | "write"; readonly resource: Resource };
export type Relationships = {
  grant(tx: Transaction, relationship: Relationship): Promise<void>;
  revoke(tx: Transaction, relationship: Relationship): Promise<void>;
};
```

`visible` and `Relationships` are added only with the first route that needs them. Relationships are a closed
union of domain facts, not raw tuples, so a route cannot write an arbitrary relationship. Note from the spike:
`batchCheck` results come back keyed by correlation id, not in request order, so the adapter must map them.

## 11. Postgres and synchronization (proposed)

- **Separate database.** OpenFGA's docs recommend a database "used exclusively for OpenFGA". Run it as its own
  database with its own role on the same Postgres server at first, migrated by `openfga migrate` (it created
  `store`, `authorization_model`, `tuple`, `changelog`, `assertion`). Separate server later if load needs it.
- **Outbox.** A domain change and its `authz_outbox` rows commit in one transaction. A relay (a loop in backend's
  worker process) writes them to OpenFGA in order and marks them done. Writes use
  `onDuplicateWrites: "ignore"` and deletes `onMissingDeletes: "ignore"`, both verified, so retries are idempotent.
- **Removals go first.** A late grant is safe; a late revocation is not. Removing a member, a role or a module grant
  deletes the tuple in OpenFGA within the request, and the request fails (nothing commits) if OpenFGA cannot be
  reached. Grants go through the outbox. Verified that a check right after a delete sees the delete when caching
  is off, which is the default ("all queries will have strong consistency").
- **Caching off** at first. With the check cache on, a `MINIMIZE_LATENCY` check may miss a recent write; sensitive
  checks would then need `HIGHER_CONSISTENCY`. Turn it on only after measuring.
- **Reconciliation.** A daily job compares Postgres (the truth) with OpenFGA's tuples and repairs drift, logging
  counts only. Rebuilding the store from Postgres is the recovery path, so OpenFGA needs no backup of its own beyond
  the database's.
- **Synced protocol data.** Group roles read by the indexer go through the same outbox. They are only as fresh as
  the indexer; a removal seen by the indexer is applied deletes-first like any other.

## 12. Docker deployment (proposed)

- `openfga/openfga` by digest, a release past the 7-day wait, as a non-root user, on a private network shared
  only with backend. No public port; metrics (`:2112`) and the playground (on by default) disabled or internal.
- An init job runs `openfga migrate`; a deploy step writes the model from backend's release and records the
  returned model id, which backend pins. Rollback is pointing backend at the previous model id; tuples are kept.
- Authentication with a preshared key, read from a secret file. **This is a token that can write, so Alex creates
  and places it**, by the keys rule. It grants every API, including reading all tuples in every store, so it is as
  sensitive as the database password. TLS between backend and OpenFGA in staging and production, like web's mTLS.
- The SDK retries by default: a stopped server took 1.96 s to fail. The adapter sets `maxRetry: 0` and a 200 ms
  timeout (3 ms failure measured) and turns every error into `unavailable`.
- Health: `GET /healthz` answered `{"status":"SERVING"}`; backend's `ready()` uses it as it uses Cerbos's today.
- Resource use: one 67 MB Go binary; horizontal scaling is stateless servers over the shared database.

## 13. Security and privacy

- **Fail closed**: same as today. Errors and timeouts are `unavailable`, answered 503; private reads denied as 404.
- **The tuple store is sensitive.** It holds who belongs to which private community and who shares what with whom,
  keyed by public DIDs. Treat its database like the main one: own role, no other reader, encrypted backups.
- **History is kept.** The `changelog` table recorded every write and delete (the spike shows a removed member
  still listed). I found no retention setting in v1.23.0's config or docs. Proposed: our own pruning job, run
  after the reconciliation, deleting changelog rows older than a short window; verify it is safe in the PoC.
- **No enumeration by modules or browsers.** `ListUsers` and `Read` are never exposed. `visible()` answers only for
  the caller, only for kinds a route allows.
- **Minimal tuples**: DIDs and Unset ids only, never names, e-mails or content. No tuples from private activity
  (messages, bookmarks, drafts), and authorization never feeds personalization.
- **Logging**: OpenFGA at `info` in JSON; check requests are not logged at that level by default (to verify in the
  PoC). Backend logs denials by route and reason, without DIDs, as today.
- **Not covered by any engine**: authentication, OAuth, encryption, database isolation, network security, module
  sandboxing, rate limiting, moderation. These stay where they are.
- **Built-in access control** inside OpenFGA (per-client permissions) is marked "experimental and is not
  recommended for production use", so the single key is the only option today.

## 14. Testing and CI

- `fga model test --tests <file>.fga.yaml` runs model tests: checks, `list_objects`, `list_users`, with tuples and
  conditions. The spike's 23 checks all pass. These replace `cerbos compile` in `bun run check`.
- Install the `fga` CLI as a release binary with a pinned checksum (it is not on npm), in tooling's Bun check or
  a backend step. The 0.9.0 linux-amd64 archive is `sha256:c09b7e84...a1e9`.
- Adapter integration tests run against a real OpenFGA on Postgres in CI, as the Postgres tests do today, and fail
  rather than skip without one.
- Tests that matter most: revocation is visible immediately; a relay retry is idempotent; an unreachable server is
  `unavailable` within 200 ms; every route still declares its check (`ROUTE_ACCESS` stays).

## 15. Phases and estimates

| Phase | Work | Size |
| --- | --- | --- |
| 1 | This assessment | Done |
| 2. Proof of concept | Below | About 2 days |
| Decision | New org record superseding org-0018 (and org-0019's policy mount), Alex's words | Hours |
| 3a. Swap | `adapters/openfga` behind the existing port, the profile model and tests, remove the Cerbos adapter and policy, deployment service (replaces deployment #11) | 2 to 3 days |
| 3b. Sync | Outbox table, relay, deletes-first, reconciliation, changelog pruning | 3 to 4 days, with the first relationship that needs it (slice 2's visibility or later) |
| 4. Expansion | Communities (with the atmospheric-groups decision), sharing, modules, entitlements | Per feature |

**Phase 2 proof of concept**, local, in a throwaway branch of backend, never merged:

1. OpenFGA (v1.22.1 or later past the wait) on Postgres in Docker, beside backend.
2. `adapters/openfga` implementing today's `Authorizer`, with the existing route tests passing unchanged.
3. The organisations model: owner, admin, member, one custom role, one resource; the tests in the spike.
4. An outbox and relay for org membership; deletes-first removal; a test that a removed member is refused at once.
5. Failure: server stopped, slow, wrong key; database stopped. Every case `unavailable`, none allow.
6. Mirror one synced atmospheric-group role into a tuple from a fixture, to see the protocol path end to end.
7. Measure: p50 and p99 for `may`, the relay's lag, and changelog growth; try the pruning job.

It passes if 2, 4 and 5 hold and the code stays as easy to read as the Cerbos adapter.

## 16. Risks and open decisions

**Risks**

- Sync bugs become permission bugs. Mitigated by deletes-first, idempotent relay and reconciliation, but it is new
  code Cerbos does not need.
- Two sources for group roles (group host and OpenFGA) can disagree. The group host stays authoritative for space
  access; OpenFGA only decides Unset features.
- `ListObjects` caps at 1,000 by default and gets slow on wide graphs; feeds and search still filter in SQL or
  OpenSearch, with OpenFGA only for the final check.
- Spaces' public beta starts 2026-12-01 and the groups proposal has no stated version; both may change.
- One key reads everything, and history is kept by default (section 13).

**Decisions for Alex**

1. OpenFGA or Cerbos, after the proof of concept. (Recommendation: run the PoC; switch if it passes.)
2. Are Unset communities atmospheric groups? (Recommendation: yes, decided before phase 9.)
3. OpenFGA's database: its own database on the shared Postgres first? (Recommendation: yes.)
4. May Unset act as a `managedspace` managing app for spaces it creates? (Recommendation: explore after the beta.)
5. Until decided, slice 2's visibility rule: write it in Cerbos now (cheap to port) or wait. (Recommendation: write
   it behind the port as planned; it is one rule either way.)

## Sources

- OpenFGA: `openfga/openfga` tag v1.23.0 (commit `d67ba7b1`, `README.md`, `.config-schema.json`); docs in
  `openfga/openfga.dev` (`docs-site/modeling/modular-models.mdx`, `conditions.mdx`, `testing.mdx`,
  `interacting/consistency.mdx`, `best-practices/running-in-production.mdx`,
  `getting-started/setup-openfga/access-control.mdx`, `configure-openfga.mdx`); `@openfga/sdk` 0.9.8 on npm;
  `openfga/cli` v0.9.0 release archive and checksums.
- ATProto: `bluesky-social/proposals` `0016-permissioned-data/README.md`; `bluesky-social/atproto-website`
  `src/app/[locale]/blog/{atproto-spaces-alpha,atmospheric-groups-intro,open-social-groups-vision,getting-ready-for-the-spaces-public-beta}/en.mdx`;
  atproto PR #5187 page (WIP banner).
- opensocial.group: `tangled.org/opensocial.group/proposal/blob/main/proposal.md`, latest commit `81f0e6f3`.
- Unset: backend `staging` `0a3586e`; agent-kit `main` `bf319c5` (org-0018, org-0019,
  `notes/cerbos-authorization/`); `notes/unset-core/scope.md` on agent-kit #34's branch.
