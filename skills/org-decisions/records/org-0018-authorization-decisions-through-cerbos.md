# org-0018. Backend's authorization decisions go through Cerbos

Status: proposed (2026-11-24). Alex asked for it on 2026-11-24: "we may find way to improve it as well with our
new stack. I also want to include cerbos". Asked the three main choices, he answered on 2026-11-24 at 04:01Z: a
separate process ("i think as a separate services with back end"), one engine ("I think it should be the only rule
engine, unless there is a better option"), and policies in backend ("yes"). Points 1, 4 and 7 follow those answers;
the alternatives are weighed below. The record is not accepted until Alex accepts it.

## Context

Alex's authorization proposal (`notes/unset-core/security-architecture.md`, agent-kit #34) asks for one
server-side, default-deny authorization service behind a small interface, with Cerbos as an optional later
engine. He now wants Cerbos in the stack. Four things had to be settled: where the decision point runs, what it
decides, where its policies live and how they are tested, and how the first slice's routes use it.

The old app (`Undefined6799/unset` at `0bb11e9`) has no roles. Its rules are about a member acting on their own
data and a visitor reading public data, spread over route session flags, an onboarding and e-mail gate, handler
checks, readers and the `pds-admin` service. The mapping is in `notes/cerbos-authorization/old-app-authorization.md`.

What was checked (2026-11-24):

- **Cerbos PDP** is a Go server, Apache-2.0 (`cerbos/cerbos`, `LICENSE`). Releases 0.57.0 (2026-10-23) and 0.58.0
  (2026-11-23, inside the 7-day wait until 2026-11-30). It reads policies from disk, serves HTTP and gRPC, and can
  listen on a Unix socket (`docs/modules/configuration/pages/server.adoc`). It sends anonymous telemetry unless
  `telemetry.disabled: true` or `CERBOS_NO_TELEMETRY=1` (`.../telemetry.adoc`).
- **The embedded PDP** is a 23.5 MB WebAssembly build of the same engine (`@cerbos/embedded-server` 0.7.4,
  `lib/server.wasm`, with Go's `wasm_exec` glue). Its client, `@cerbos/embedded-client` 0.8.4, lists "a Cerbos Hub
  account" as a prerequisite and loads "policy bundles ... from Cerbos Hub". It also accepts the bytes of a bundle
  already downloaded (`lib/options.d.ts`, `PolicySource`), but the bundle is a Hub rule table
  (`cerbos/cloud/epdp/v2`). Whether open-source tools can build one is unverified. Whether it runs under Bun is
  unverified.
- **Clients**: `@cerbos/http` 0.30.3 (fetch, depends on `@cerbos/core`) and `@cerbos/grpc` 0.29.4 (`@grpc/grpc-js`).
  Both declare `node >= 22`. Neither is verified on Bun 1.4.4.
- **CI**: the `cerbos` npm package (0.57.0, 0.58.0) ships the binary as per-platform optional dependencies with no
  install scripts, so it installs under `ignoreScripts`. `cerbos compile <dir>` validates policies and runs their
  YAML test suites, exiting non-zero on a failure (`docs/modules/cli/pages/cerbos.adoc`).

## Decision

1. **Cerbos PDP runs as its own process beside backend, not embedded.** The official image, pinned by digest,
   reachable only by backend: a Unix socket or the backend-only private network. Telemetry off, the admin API off,
   policies read from disk. The embedded PDP is not used, because it ties policy builds to Cerbos Hub, a hosted
   service outside our infrastructure, and adds 23.5 MB of WebAssembly to the process.
2. **Cerbos decides whether a principal may perform an action on a resource, and nothing else.** Better Auth
   still authenticates; 2FA still verifies; rate limits, feature availability, PDS scopes, the egress guard and
   the database grants stay where they are. Feature flags never grant what a policy denies.
3. **Backend computes every attribute it sends**, from the session and its own data: the principal is the DID with
   role `member` (or `anonymous` without a session) and attributes such as `onboarded`, `emailConfirmed` and, later,
   `secondFactorAt`; a resource carries `ownerDid`, `visibility` and similar read from our tables. Nothing a request
   claims is passed through. The member's UUID never goes to Cerbos, as it never leaves backend.
4. **The application depends on a small `Authorizer` port** in backend (`may(principal, action, resource)` returning
   allow, or deny with no detail), with one Cerbos adapter and a test double. Routes and domains never import a
   Cerbos package. There is no second, native engine to keep in step.
5. **It fails closed.** A PDP that cannot be reached, times out or errors is a deny, answered as 503 for the
   operations that need it. Backend's `/health` reports not ready while the PDP is not. Routes that need no
   decision (health, sign-in) keep working.
6. **Every route declares its resource and action, or that it is public.** A backend test fails any route that
   declares neither. A deny on a read of something private answers exactly like a missing one (404), as the old
   app's D7 rule does.
7. **Policies live in backend**, in `policies/`, with their YAML test suites beside them, and ship in backend's
   release: backend builds a policy image on the pinned Cerbos image, so a backend release and its policies carry
   one version, and deployment selects both by digest. `bun run check` runs `cerbos compile policies` through an
   exact `cerbos` dev dependency; tooling's Bun check needs no change. A shared step moves to tooling only when a
   second repository has policies.
8. **The first slice is not blocked.** It merges as it is. Cerbos arrives in the next backend pull request, which
   puts `GET /me/session`, `GET /me/profile` and `PATCH /me/profile` behind the port, after the spike below passes.

For the first slice that pull request adds one resource policy, its test and the call:

```yaml
# policies/profile.yaml
apiVersion: api.cerbos.dev/v1
resourcePolicy:
  version: default
  resource: profile
  rules:
    - actions: [read, update]
      effect: EFFECT_ALLOW
      roles: [member]
      condition:
        match:
          expr: request.resource.attr.ownerDid == request.principal.id
```

```ts
// src/server/internal-api.ts, PATCH /me/profile (sketch)
const caller = await sessions.current(request.headers);
if (caller === null) return status(401, problem(401, "unauthorized"));
const decision = await authorizer.may(member(caller), "update", { kind: "profile", id: caller.did, ownerDid: caller.did });
if (decision === "unavailable") return status(503, problem(503, "unavailable"));
if (decision === "deny") return status(403, problem(403, "forbidden"));
```

On `/me` the owner check always holds. It is there so the route already goes through the one decision point when
the onboarding and e-mail conditions, and later routes that take another member's DID, arrive.

## Alternatives

Alex asked for Cerbos as the only engine "unless there is a better option". These were weighed (npm metadata and
READMEs read 2026-11-24):

- **Cedar** (`@cedar-policy/cedar-wasm` 4.15.0, Apache-2.0). The strongest alternative: a policy language with a
  formal analyser, run in process from WebAssembly with no hosted service, so no extra process. Not chosen
  because Alex prefers a separate service, and Cerbos brings policy test suites in its CLI and query plans for
  filtering lists, which Cedar would need us to build or offers only as partial evaluation. Revisit Cedar if the
  spike shows the sidecar's latency or running cost is too high.
- **OpenFGA or SpiceDB** (Zanzibar-style relationship engines; `@openfga/sdk` 0.9.8, Apache-2.0). Good for deep
  sharing graphs, but each needs its own datastore holding a copy of relationships that our database already
  holds. Too much for owner and visibility rules; worth a look again if sharing grows into groups and spaces.
- **OPA** (Rego). General-purpose and widely used, but Rego is harder to read and review than Cerbos's YAML and
  CEL, and its JavaScript WebAssembly loader (`@open-policy-agent/opa-wasm` 1.10.0) was last released in 2024.
- **Casbin** (`casbin` 5.51.1). An in-process library with model files; its rules are less expressive for
  attribute conditions and it has no test-suite tool of its own.
- **Oso**. Its open-source library is deprecated in favour of Oso Cloud (`oso` README).
- **Native TypeScript rules**, as Alex's first proposal had them. Simple to start, but it is the scattered pattern
  the old app already shows, and Alex wants Cerbos.

## Consequences

- One more process per backend instance, one more image to pin and bump, and a local round trip per decision.
  The spike measures the latency before the first route depends on it.
- A PDP outage refuses authorized operations instead of allowing them. That is the intended trade.
- The whole who-may-do-what matrix is in one folder with tests that run in CI, where today it is spread over six
  places. Later list routes can use Cerbos query plans to filter in SQL, so a list never shows what a read refuses.
- Backend gains two exact dependencies: `@cerbos/http` (or `@cerbos/grpc`, whichever the spike shows working on
  Bun) and the `cerbos` binary package for CI. Third-party versions keep the 7-day wait.
- Cerbos's own decision log stays off at first; backend logs denials by route and reason, with no DID or personal
  data. Turning on an audit trail is its own decision.
- Unverified until the spike (`notes/cerbos-authorization/cursor-spike-cerbos.md`) runs: the client on
  Bun 1.4.4 against a pinned PDP over a Unix socket and over TCP, its latency, `cerbos compile` from `bun run`, and,
  for the record only, whether an embedded bundle can be built without Cerbos Hub and loaded under Bun.
