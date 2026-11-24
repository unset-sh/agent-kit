# org-0018. Backend's authorization decisions go through Cerbos

Status: accepted (2026-11-24, Alex: "ok good, you may integrate it, seems clean", after reading the record with
the spike results folded in). He had asked for it the same day: "we may find way to improve it as well with our new
stack. I also want to include cerbos", and answered the three main choices: a separate process ("i think as a
separate services with back end"), one engine ("I think it should be the only rule engine, unless there is a better
option"), and policies in backend ("yes"). The alternatives are weighed below.

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
  (`cerbos/cloud/epdp/v2`).

A spike then ran the PDP beside Bun 1.4.4 (`notes/cerbos-authorization/spike.md`, 2026-11-24, image
`ghcr.io/cerbos/cerbos:0.57.0` at `sha256:e5e3b150b3cb0090975605254f255164567d67e233634199fb20972e3eaff300`):

- **Both clients work on Bun.** `@cerbos/grpc` 0.29.4 (`@grpc/grpc-js` 1.14.7) allowed and denied correctly over
  TCP and over a Unix socket. `@cerbos/http` 0.30.3 did over TCP. It has no socket option: a `unix:` URL failed
  closed, and it worked over a socket only when the global `fetch` was replaced.
- **Fast enough.** Warm, 10,000 sequential calls: gRPC on a Unix socket p50 0.43 ms, p99 1.0 ms; the slowest
  transport (HTTP on TCP) p50 0.61 ms, p99 1.4 ms. With 1,000 calls in flight at once, a call waited 90 to 195 ms
  at p50, so calls queue under a burst.
- **Errors are never an allow.** With the PDP stopped, paused or answering garbage, every call returned an error,
  within 2 to 18 ms or at the 200 ms timeout. None came back as an allow, and none as a deny either.
- **Nothing left the machine.** Telemetry was logged as disabled and the packet captures showed no outbound
  traffic or DNS. The admin API answered 404 when disabled. The image runs as root unless told otherwise.
- **The embedded PDP cannot be built without Hub.** The open-source 0.57.0 binary has no bundle command.
- **CI**: `bun install --frozen-lockfile --ignore-scripts` installs the `cerbos` 0.57.0 platform binary, and
  `cerbos compile` runs the YAML tests (binary exit 4 on a failed test, as `docs/modules/cli/pages/cerbos.adoc`
  says). Two catches: the 0.57.0 wrapper exits 1 for any failure (0.58.0 fixes that), and its `bin.js` starts
  with `#!/usr/bin/env node`, so `bun run cerbos` ran it on Node. `bun ./node_modules/cerbos/bin.js` ran it on Bun.

## Decision

1. **Cerbos PDP runs as its own process beside backend, not embedded.** The official image, pinned by digest, as a
   non-root user, reachable only by backend. Backend calls it with `@cerbos/grpc` over a Unix socket on a volume
   only the two share, with the socket's mode limited to them, not the world-writable mode the spike used. gRPC on
   a socket was the fastest transport and needs no change to `fetch`. Telemetry off, the admin API off, policies
   read from disk. The embedded PDP is not used, because it ties policy builds to Cerbos Hub, a hosted
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
5. **It fails closed.** The Cerbos adapter turns any error, and any call past its timeout (200 ms to start), into
   `unavailable`, never an allow, answered as 503 for the operations that need it. Backend's `/health` reports not ready while the PDP is not. Routes that need no
   decision (health, sign-in) keep working.
6. **Every route declares its resource and action, or that it is public.** A backend test fails any route that
   declares neither. A deny on a read of something private answers exactly like a missing one (404), as the old
   app's D7 rule does.
7. **Policies live in backend**, in `policies/`, with their YAML test suites beside them, and ship in backend's
   release: backend builds a policy image on the pinned Cerbos image, so a backend release and its policies carry
   one version, and deployment selects both by digest. `bun run check` runs `bun ./node_modules/cerbos/bin.js compile
   policies` from an exact `cerbos` dev dependency, so it runs on Bun, never Node; tooling's Bun check needs no change. A shared step moves to tooling only when a
   second repository has policies.
8. **The first slice is not blocked.** It merges as it is. Cerbos arrives in the next backend pull request, which
   puts `GET /me/session`, `GET /me/profile` and `PATCH /me/profile` behind the port. The spike has passed.

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

This policy covers the owner only, which is all `/me` needs. Reading another member's public profile needs its
own rule (`read` allowed when `visibility == "public"`, for `member` and `anonymous`) and tests, added with the
first route that does it. The spike's visibility test expected a deny because this policy has no such rule yet.

On `/me` the owner check always holds. It is there so the route already goes through the one decision point when
the onboarding and e-mail conditions, and later routes that take another member's DID, arrive.

## Alternatives

Alex asked for Cerbos as the only engine "unless there is a better option". These were weighed (npm metadata and
READMEs read 2026-11-24):

- **Cedar** (`@cedar-policy/cedar-wasm` 4.15.0, Apache-2.0). The strongest alternative: a policy language with a
  formal analyser, run in process from WebAssembly with no hosted service, so no extra process. Not chosen
  because Alex prefers a separate service, and Cerbos brings policy test suites in its CLI and query plans for
  filtering lists, which Cedar would need us to build or offers only as partial evaluation. The spike found the
  sidecar fast (p50 under 1 ms), so latency is no reason to switch. Revisit Cedar if running a second process
  proves costly.
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

- One more process per backend instance, one more image to pin and bump, and a local round trip per decision,
  measured at about half a millisecond. Under a burst, calls queue. A list checks many resources in one
  `checkResources` call or a query plan, not one call each.
- A PDP outage refuses authorized operations instead of allowing them. That is the intended trade.
- The whole who-may-do-what matrix is in one folder with tests that run in CI, where today it is spread over six
  places. Later list routes can use Cerbos query plans to filter in SQL, so a list never shows what a read refuses.
- Backend gains `@cerbos/grpc` and, through it, `@grpc/grpc-js` and `protobufjs`, at exact versions, plus the
  `cerbos` binary package for CI. `protobufjs` has a postinstall script; it stays blocked, and gRPC worked without it.
  Third-party versions keep the 7-day wait. When `cerbos` 0.58.0 clears the wait (2026-11-30), the wrapper passes on
  the binary's own exit code.
- Cerbos's own decision log stays off at first; backend logs denials by route and reason, with no DID or personal
  data. Turning on an audit trail is its own decision.
- Still unverified: the image running as a non-root user with a restricted socket mode (deployment checks it
  with the first environment), Cerbos 0.58.0, and long-running traffic captures.
