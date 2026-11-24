# How the old app authorizes today, and how each rule maps to Cerbos

Input for [org-0018](../../skills/org-decisions/records/org-0018-authorization-decisions-through-cerbos.md).
Read from `Undefined6799/unset` at `0bb11e951abf2d6ffdb89b733f66c69837c47e80` (read only, on Alex's computer,
2026-11-24). Paths below are in that repository.

## What exists

The old app has no roles, no admin and no moderator in the web process (`scripts/guards/web-no-moderator.ts`
keeps it that way). Every decision is about one member acting on their own data, or a visitor reading public
data. The rules sit in six places:

| # | Rule | Where it lives | Fails how |
| --- | --- | --- | --- |
| 1 | A route says whether it needs a session: `required`, `writes` (POST needs one), `onboarding`, `optional` | `interfaces/web/src/lib/server/policy.ts`, one `policy.ts` per route folder, gathered by `route-table.ts`; enforced by the request kit (ADR 0045) | Closed: a `required` route with no gate refuses to start; a gate that throws is an error, never an admission |
| 2 | The app gate: onboarding finished (age, terms, chat), current terms version, not `blocked_underage`, confirmed e-mail rechecked against the PDS | `domains/identity/auth/gates.ts` (pure), `interfaces/web/src/lib/server/app-gate.ts` (redirects) | Closed, with a capped grace on a transient PDS answer (`CACHED_RECHECK_CAP_MULTIPLE`, P2.11d) |
| 3 | Self only: every write acts on the session's DID, never a DID from the request | Each `+page.server.ts` reads `locals.did`; handlers 500 if the gate let no session through | Closed |
| 4 | Visibility: a private profile answers exactly like a missing one (D7, ADR 0003); the owner alone gets a live PDS read (`[did=did]/own-profile.server.ts`) | Readers and route handlers | Closed (404) |
| 5 | Invites: a member may issue only for themselves (`actor_did == target`), at most 5 per window | `interfaces/pds-admin/` (ADR 0060): signed single-use envelope, its own limits | Closed |
| 6 | Least-privilege database roles | `infrastructure/postgres/grant-matrix.json`, tested on real Postgres | Closed |

Not authorization in this sense, and staying where they are: OAuth scopes the PDS enforces (ADR 0039), rate
limits (`limits.ts`), the egress guard, CSRF and Origin checks.

## Mapping

| Old rule | New home | Cerbos? |
| --- | --- | --- |
| 1 Session required | Backend resolves the Better Auth session; no session means the principal is `anonymous` | The role (`member` or `anonymous`) is an input; the route's resource and action are declared beside it |
| 2 App gate | Backend's identity domain computes `onboarded`, `blocked`, `emailConfirmed` (keeping the recheck cache and cap) and passes them as principal attributes | Yes: a member action requires `onboarded && !blocked && emailConfirmed`. Where to send the browser stays in web |
| 3 Self only | `/me` routes resolve the caller; resources carry `ownerDid` read from our own data | Yes: `request.resource.attr.ownerDid == request.principal.id` |
| 4 Visibility | Resource attribute `visibility` read from our data | Yes: `read` allowed for `public` or owner; a deny maps to the same 404 as missing |
| 5 Invites | Backend asks Cerbos before it signs the envelope; `pds-admin` keeps its own check and limits | Yes for "may issue"; the envelope check and limits stay as a second, independent wall |
| 6 Database roles | Unchanged | No: defence in depth below the application |

## Weak spots seen, to improve with the new stack

- The rules are spread over route flags, a gate, handler checks, readers and a second service. No single test
  shows the whole matrix of who may do what. Cerbos YAML test suites give one place, run in CI.
- Handlers re-check `locals.did === undefined` and answer 500. With every route declaring its resource and
  action, a route-coverage test can fail a route that declares neither, as the old route-registration guard did.
- Visibility is enforced by each reader. Cerbos `PlanResources` can later turn a policy into a query filter for
  lists (directory, feeds) so a list cannot show what a single read would refuse. Not needed for the first slice.
