# Spike: first end-to-end slice

Run on 2026-11-23 against Bun 1.4.4 (binary from the `bun-v1.4.4` GitHub release, commit `38afee6c84fcf48c0edb2466aa4b27d287a59c30`). Docs cited below are that tag's `docs/` tree. Postgres is Ubuntu's PostgreSQL 16.15, started locally, peer auth on the unix socket, database `spike`. No password and no `BETTER_AUTH_SECRET` were created.

`Undefined6799/unset` was checked out read-only at `60228f5e60ead58c359f798519816fc3e8ec3fa4`. The worktree is mode `444`, push URL is `DISABLED`, and `pre-commit` / `pre-push` refuse. Nothing in that repository was edited.

Scratch scripts live outside the org repos, under a local `spike/` folder. They are not a product change.

## Versions

| Piece | Version | Published (npm) |
| --- | --- | --- |
| Bun | 1.4.4 | release tag `bun-v1.4.4` |
| elysia | 1.4.32 | 2026-11-11 |
| @elysia/openapi | 1.4.17 | 2026-11-04 |
| better-auth | 1.7.25 | 2026-11-14 |
| kysely | 0.29.9 | 2026-11-12 |
| @atproto/oauth-client-node | 0.5.16 | 2026-11-06 |
| @sveltejs/kit | 3.2.0 | 2026-11-10 |
| @sveltejs/adapter-node | 6.0.2 | 2026-11-10 |
| svelte | 5.57.3 | 2026-10-26 |
| vite | 8.3.8 | 2026-11-11 |
| @sveltejs/vite-plugin-svelte | 7.3.1 | 2026-09-23 |
| typescript | 7.0.2 | 2026-07-08 |

`process.versions` on this Bun: `bun` 1.4.4, `node` 26.3.0, `undici` absent.

## (a) Elysia mounts Better Auth — pass

`env -u TEST -u NODE_ENV bun auth-run.ts`

Elysia 1.4.32 `.mount(auth.handler)` with the bearer plugin served `GET /health` → 200. Mount shape is the current Elysia guide, <https://elysiajs.com/integrations/better-auth>, fetched 2026-11-23. The OpenAPI plugin package is `@elysia/openapi`, which is the name on <https://elysiajs.com/plugins/openapi> the same day. `@elysiajs/openapi@1.4.17` also exists and was not used.

## (b) Unset atproto plugin session — pass

The same script, still with no database (Better Auth's memory adapter, `dist/db/adapter-base.mjs`) and no secret (the library's own development fallback; not copied here).

A plugin endpoint `POST /api/auth/sign-in/atproto` created a user, an `account` row with `providerId = "atproto"` and `accountId` equal to a synthetic DID, and a session. `account.accountLinking.disableImplicitLinking` was true. The email was a SHA-256 hex of the DID at `@member.invalid`. The response's `set-auth-token` (bearer plugin, `dist/plugins/bearer/index.mjs`) was accepted on the next `POST /session-check` via `Authorization: Bearer`. The same DID reused the user. A second synthetic DID created a different user.

Not printed here: the DID, the email, the token.

## (c) Origin and CSRF with a bearer call — pass, with one behaviour to keep

Same process, `NODE_ENV` unset, so `isTest()` is false and `skipOriginCheck` stays false (`dist/context/create-context.mjs`). `disableOriginCheck` and `disableCSRFCheck` were not set.

| Call | Result |
| --- | --- |
| `POST /api/auth/sign-out` with bearer, no `Origin`, no `Cookie` | 200 |
| same, bearer and `Origin: https://evil.example` | 200 |
| same, the sign-in `Set-Cookie` and `Origin: https://evil.example` | 403 |
| bearer and `Origin` equal to `baseURL` | 200 |

What it needs: a bearer token and no cookie. Source: `validateOrigin` in `better-auth@1.7.25` `dist/api/middlewares/origin-check.mjs` returns before comparing `Origin` when the request has no cookie and `forceValidate` is false. The bearer plugin's before-hook copies the token into a cookie header, but that copy is not visible to this middleware: a foreign `Origin` on a bearer call was still 200. A real cookie with a foreign `Origin` is still 403. Nothing was turned off.

Web's server-to-server call can send `Authorization: Bearer` and omit `Origin`. It must not also forward the browser cookie. A foreign `Origin` does not, by itself, reject a bearer call.

## (d) AT Protocol loopback sign-in — not completed

`timeout 40 bun oauth-run.ts`

Stopped. Do not treat the rest of the slice as unblocked.

What ran:

- `process.versions.undici` is absent. `new NodeOAuthClient` without a `handleResolver` constructs `AtprotoHandleResolverNode`, which calls `@atproto-labs/fetch-node`. That throws `Unicast SSRF protection requires Node.js 20.6+` (`dispatch.js`, compare against undici 6.11.1). Passing our fetch does not stop that default resolver from being built. Passing our own `handleResolver` skips it. The client then constructed on Bun.
- `OAuthClient.fetchMetadata({ clientId })` always does `fetch(new Request(clientId))` (`oauth-client.js`). For `http://localhost?...` that is a loopback fetch. The public guard refuses it (`egress.scheme` was the first failure, because the guard did not yet accept a `Request`; after that fix it would be `egress.internal_name` / `egress.private_address`). The virtual document from <https://atproto.com/specs/oauth> "Localhost Client Development" (read 2026-11-23) was passed in instead: `token_endpoint_auth_method: none`, `dpop_bound_access_tokens: true`, redirect `http://127.0.0.1:8080/auth/callback`, scope `atproto repo:sh.unset.profile`. No client key.
- `authorize` on a documentation hostname that does not exist stopped at `Failed to resolve identity`. The guard's resolver ran (the custom resolver was called). No PAR, no DPoP proof against a PDS, no refresh, no revocation.

What did not run: a real account, the PDS consent screen, token refresh, revocation. This environment has no such account, and none was created.

Options, not chosen:

1. Alex runs the consent once against an account he controls, with this client and the guard's fetch, and we record only the status codes.
2. A local PDS (step 11a) so the loop stays on the machine. That step is later, and it stops before any admin password.
3. Do not use `AtprotoHandleResolverNode` on Bun. Identity lookup goes through the egress guard. The default resolver's undici version check cannot be satisfied here.

## (e) Egress guard — pass

`bun egress-run.ts`

Plain `fetch` failed all 11 refusal assertions first (it does not classify). The guard then refused loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`), private (`10/8`, `172.16/12`, `192.168/16`), link-local (`169.254.169.254`, class `reserved` in the copied table), reserved (`255.255.255.255`), `localhost`, `*.internal`, a name whose stub lookup was only private, and a name whose stub lookup mixed a public address with a private one.

A stub fetch then received `https://1.2.3.4/path` with `Host: pinned.example` and `tls.serverName: pinned.example`. That is the pinning Bun documents at `docs/runtime/networking/fetch.mdx`, "Connecting to a specific address". DNS is `node:dns` `Resolver`, which Bun documents as c-ares (`docs/runtime/networking/dns.mdx`).

Classification is the copy of `infrastructure/net-guard/src/{ranges,classify}.ts` from the old app at the commit above.

## (f) Kysely on Bun.sql — operations pass, their suite was not run

`env -u TEST -u NODE_ENV bun db-run.ts`

A Kysely 0.29.9 dialect whose driver uses `SQL.reserve()` and `sql.unsafe` (`docs/runtime/sql.mdx` at this tag) was passed as `{ dialect, type: "postgres", casing: "snake", schemaName: "auth" }`. Better Auth's `runMigrations` created `auth.user`, `auth.session`, `auth.account`, `auth.verification`. `createUser` and `createSession` round-tripped.

`PostgresQueryCompiler` and `PostgresAdapter` are not on Kysely's public export list. The spike imported them from `kysely/dist/dialect/postgres/` inside the installed package.

Better Auth's own adapter test suite at tag `v1.7.25` was not executed. GitHub code search returned 401, and the suite was not cloned. `pg` was not tried, because these operations passed. That is not the same as the suite passing.

## (g) __Host- cookie and SvelteKit on Bun — Chrome only

`Set-Cookie` from `bun build/index.js` (adapter-node output), `HOST=127.0.0.1 PORT=8080 ORIGIN=http://127.0.0.1:8080`:

```
__Host-unset=1; Path=/; HttpOnly; Secure; SameSite=Lax
```

No `Domain`. The listener command was `bun build/index.js`.

Chrome (headless, `--virtual-time-budget=2000`, `--dump-dom`) followed the page's meta refresh to `/check` and the server rendered `seen`. The value was not logged.

Firefox 160.0.1 (Mozilla's linux64 tarball; apt's Firefox package depends on snap, and snap did not configure) started headless. Its screenshot was the first page, before the refresh. `cookies.sqlite` had no rows. A WebDriver BiDi client to `ws://127.0.0.1:9224` timed out before a second navigation. Firefox storage and resend were not shown.

Safari cannot run on this Linux machine.

Build: `bun run --bun build` (Vite 8.3.8). SvelteKit 3.2.0 rejects `svelte.config.js` and takes the adapter in `sveltekit({ adapter })` (`@sveltejs/kit/src/exports/vite/index.js`, error `config_file_unsupported`). With `typescript@7.0.2` installed, that build throws `ts.sys.readFile` of undefined. TypeScript 7.0.2's package root export is `lib/version.cjs` (`version` and `versionMajorMinor` only). Kit 3.2.0 still `import('typescript')` and calls the old compiler API (`src/core/sync/write_tsconfig/index.js`). The build completed only after that package was hidden from resolution and `tsconfig.json` was removed. One Vite log line was prefixed `(node:<pid>)` while the command was `bun run --bun`. Whether that was a real Node process or Bun's compat warning was not separately proved.

Options, not chosen:

1. Keep `tsc` at 7.0.2, and keep Kit from importing that package (it only needs `ts.sys` to validate a tsconfig). Typecheck stays `tsc`. This is what the spike did, and it is easy to get wrong if `typescript` sits where Kit can import it.
2. Wait for a Kit release that reads TypeScript 7's API. 3.4.0 is inside the 7-day wait until 2026-11-25, so it was not installed.
3. Confirm in Chrome is enough for this spike, and repeat Firefox (and Safari, on a Mac) before the web PR. I would not call (g) done for all three browsers.

## (h) OpenAPI YAML — pass on this runtime

Two `GET /openapi/json` responses, merged with Better Auth's schema by the hand merge in the Elysia guide (paths prefixed `/api/auth`, tag `Better Auth`), then `Bun.YAML.stringify`. Both strings were equal, 66015 bytes, and the paths included the auth routes.

`docs/runtime/yaml.mdx` at `bun-v1.4.4` documents `Bun.YAML.parse` and does not document `stringify`. `stringify` exists on this runtime and was stable for this document. That stability is a test result, not a documented guarantee.

## (i) Telemetry — off for this config

`@better-auth/telemetry@` the copy installed with better-auth 1.7.25, `dist/index.mjs` `createTelemetry`: if `BETTER_AUTH_TELEMETRY_ENDPOINT` is unset and there is no `customTrack`, `publish` is a noop before the enabled flag is read. `telemetry.enabled` defaults to false; the spike set `false`. A fetch spy during init and the calls above saw no host other than `127.0.0.1:18081`.

`experimental.instrumentation.enabled` defaults to true in `@better-auth/core` `src/types/init-options.ts`, with the comment that it does not affect usage reporting. `@better-auth/core/src/instrumentation/api.ts` dynamically imports `@opentelemetry/api`. That package was not installed. No separate outbound call from it was observed. Not proved: what happens if that package is later installed and the flag is left at its default.

## Stop

(d) did not complete a real sign-in, refresh, or revocation. (g) is proved in Chrome only, and the pinned TypeScript plus Kit 3.2.0 do not build together. Step 2 (the decision record) is not opened from this run. tooling `main` is still the Node `ci-check.yml`. `unset-sh/tooling#20` (head `ce41d9513224e4ea68219573462bf06bafe5805c`) is open and was not pinned.
