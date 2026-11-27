# org-0017. Web calls backend through Eden Treaty on a published App type

Status: accepted (2026-11-24, Alex. After the Eden and OpenAPI client comparison he wrote: "so its not like we
would have to maintain the openapi anyway", then "and that could be updated via ci right?", and "ok good" to the
plan below.) Points 2, 4 and 5 (the published types package, the peer check and the bump bot) are superseded
by org-0020: web takes the type over a workspace link. Point 3 is superseded by org-0024: OpenAPI is generated
by the official Elysia plugin without a committed YAML snapshot. Point 1 stands.

## Context

org-0015 made Elysia's TypeBox route schemas the contract for web's internal API, with a generated `openapi.yaml`
checked for drift. It left the client library open. A spike on Bun 1.4.4 compared two clients across two separately
installed packages (`notes/web-client-spike/eden-vs-openapi.md`):

- **Eden Treaty** (`@elysia/eden` 1.4.10) on a published declaration of backend's `App` type. The types were exact
  on Elysia 1.4.32 and still held on 1.4.31, with no `any`. On Elysia 2.0.0-rc.4 the routes disappeared from the
  type. The package is one `.d.ts` file of about 4 KB whose only import is `elysia`. It has no runtime code.
- **An orval 8.48.0 client** generated from `openapi.yaml`. It did not typecheck from `@elysia/openapi` 1.4.17's
  unmodified document until non-JSON request bodies were removed. Its 401 branch threw a `ZodError` at run time
  instead of returning the 401, and it adds `zod` to web.

Both caught a renamed response field in web's `tsc` after the package bump.

## Decision

1. **Web uses Eden Treaty, from its server only.** Browser code never imports the client or the types package.
   Web's server calls backend over the private network, as org-0015 set out.
2. **Backend publishes its `App` type as a versioned types package.** The package is declaration-only, holds no
   runtime code and no Better Auth types, and declares `elysia` as an exact peer: the version backend runs.
3. **`openapi.yaml` stays.** Backend still generates it from the same route schemas and CI still blocks drift. It is
   the contract for every consumer that is not web, and no one maintains it by hand.
4. **Web's CI checks that its `elysia` version equals the types package's peer.** A mismatch fails the check
   instead of silently weakening the types.
5. **The bump bot updates the types package and `elysia` together** in web, in one pull request, so they never
   drift apart.

## Consequences

- Web gains a dev-time dependency on `elysia` and `@elysia/eden`. A new Elysia major (2.0 is in release candidates)
  needs backend and web to move together. Points 4 and 5 make that a reviewed change, not an accident.
- Eden returns `{ data, error }` with each error's status and body typed. Web maps those to its own results behind a
  capability interface, so screens never see Eden.
- Backend's release now includes a declaration build and a package publish. Where that package is published, and
  how its version follows backend's releases, is set with the first publish, through tooling's release workflow.
- The bump bot's grouping rule is configured where the bot is configured. It does not exist until that change lands.
