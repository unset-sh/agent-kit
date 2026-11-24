# org-0022. OpenFGA replaces Cerbos as backend's authorization engine

Status: accepted (2026-11-24, Alex: "oh yea and we would use openfga for policy engine"). He chose it knowing
the trade-off org-0018 weighed: OpenFGA keeps its own copy of relationships in a datastore. It supersedes
org-0018 points 1 and 7 and the whole of org-0019, which are about Cerbos. The rest of org-0018 stands.

## Context

org-0018 put a Cerbos PDP beside backend, and org-0019 shipped its policies inside backend's image. Backend
`staging` has had that since `0a3586e` (backend #25): the `Authorizer` port in `src/domains/access`, a Cerbos adapter
in `src/adapters/cerbos`, `policies/profile.yaml`, and a required `CERBOS_SOCKET`. Deployment's local-stack change
(deployment #11) was not merged.

org-0018 had set OpenFGA aside because it needs its own datastore holding relationships our database already holds.
Alex chose it anyway, and the integration is first tried in a separate test repository, behind the same port.

What was checked (2026-11-24):

- **OpenFGA server**: Apache-2.0 (`openfga/openfga`, `LICENSE`), a CNCF project. Latest image `openfga/openfga:v1.23.0`
  (2026-11-20, inside the 7-day wait until 2026-11-27); v1.22.1 (2026-10-28,
  `sha256:b852071314f1fda1194d341a6ebac0a4f619b3cd87a6626d2ccc7048af4ec671`) is outside it.
- **Storage**: `memory`, `postgres`, `mysql` and `sqlite` (`.config-schema.json` at v1.22.1). The README says memory
  is for development only and lists PostgreSQL 14+ as supported, with SQLite in beta.
- **Serving**: gRPC on `0.0.0.0:8081` and HTTP by default (`grpc.addr`, `http.addr`). The built-in Playground is off
  by default and deprecated. Whether it listens on a Unix socket has not been checked.
- **Client**: `@openfga/sdk` 0.9.8 (2026-11-12, Apache-2.0) speaks HTTP through `axios` 1.21.1, with `jose`,
  `tiny-async-pool` and `@opentelemetry/api`.
- **Tests**: the `fga` CLI runs model tests from `*.fga.yaml` files (`fga model test --tests ...`, `openfga/cli` README).

openfga.dev could not be reached from here. A separate assessment read it and OpenFGA v1.23.0's source, and ran a
spike model with `.fga.yaml` tests (agent-kit #48, `notes/openfga-authorization/`); it is input to the spike below.

## Decision

1. **OpenFGA is backend's only authorization engine**, in place of Cerbos. It runs as its own process beside
   backend, the official image pinned by digest, reachable only by backend, with authentication on.
2. **What carries over from org-0018:** backend decides through the small `Authorizer` port (`may(principal,
   action, resource)`) and never imports the engine outside its adapter. Any error or timeout becomes `unavailable`
   and a 503, never an allow, and `/health` is not ready while the engine is not. Backend computes every input from
   its own data and never passes through what a request claims. Every route declares what it needs or that it is
   public. A deny on a read of something private answers 404, like a missing one. The member's UUID never goes to
   the engine.
3. **The authorization model and its tests live in backend**, checked in `bun run check` from a pinned `fga` CLI.
4. **Our database stays the source of truth.** OpenFGA's tuples are a copy that backend writes as the data changes
   and can rebuild from our tables. They are never the only record of who owns or can see what.
5. **The Cerbos adapter stays on backend `staging` until the OpenFGA adapter replaces it** behind the same port.
   There is no revert in the meantime. Deployment #11 is not merged.

Open, to be settled by the test repository's spike before backend takes it:

- the datastore: OpenFGA's own database, or a separate database on our PostgreSQL, with its own role;
- how tuples stay in step with our tables (the same transaction, an outbox, or contextual tuples sent with each
  check), and how a rebuild runs;
- the transport and how backend authenticates to it (a preshared key file or mTLS; Unix socket if supported);
- whether owner and visibility checks use stored tuples, contextual tuples or conditions;
- latency, and how it fails when it is stopped, paused or slow;
- telemetry and any outbound traffic.

## Consequences

- One more process per backend instance, as with Cerbos, plus a datastore to run, back up and migrate, and a sync
  path to test. A tuple that misses a write leaves a stale permission, so the sync design and its tests decide how
  safe this is.
- Relationship rules (groups, spaces, shared content) fit the model directly, and `ListObjects` can answer "what
  may this member see" for lists.
- Backend drops `@cerbos/grpc`, `cerbos`, `policies/` and `CERBOS_SOCKET` when the OpenFGA adapter lands. It gains
  `@openfga/sdk` (and `axios` through it) at exact versions, unless the spike shows a smaller client is better.
- org-0018's alternatives section no longer describes the choice. This record replaces it for the engine.
