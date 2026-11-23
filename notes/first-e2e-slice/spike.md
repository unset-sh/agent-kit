# First end-to-end slice: spike

Status: stopped after step 1. Item (d) did not complete a DPoP session, refresh, and revocation. No organisation decision record was opened. No product repository was changed.

Org files win where they disagree with the slice prompt:

- `unset-sh/backend` `CLAUDE.md` says not to infer permission to copy `Undefined6799/unset`. The prompt says Alex authorised that copy on 2026-11-23. This turn did not copy product code into backend, web, or any other product repository. The classifier files already in the spike directory stayed there.
- The prompt calls the spike "no PR". Organisation rules put AI notes in `unset-sh/agent-kit` and land changes through a pull request. These notes are that pull request. It stays draft. org-0013: a different thread merges agent-kit. This thread does not merge it.
- `unset-sh/tooling` `main` is `ded89d9`. `unset-sh/tooling#20` is open (head `ce41d9513224e4ea68219573462bf06bafe5805c`, base `staging`). That commit is not pinned. A later step cannot pin a merged Bun `ci-check.yml` until that workflow is on tooling `main`.
- rendering pull request 8's `.bun-version` is `1.4.4`. The proof used Bun 1.4.4.

`org-0014` is the latest accepted decision on `main` (`b2cd04f1984344ca3fc35417527fbb4e3d374b6c`). A search for `org-0015` in this repository returned no issues. `org-0015` was not created.

## Runtime

| Piece | Version |
| --- | --- |
| Bun | 1.4.4, docs tag `bun-v1.4.4` commit `38afee6c84fcf48c0edb2466aa4b27d287a59c30` |
| PostgreSQL | 16.15, database `spike` and `spike_adapter`, OS role `ubuntu`, peer auth on the unix socket, no password |
| Elysia | 1.4.32 |
| `@elysia/openapi` | 1.4.17 |
| better-auth | 1.7.25 |
| `@better-auth/test-utils` | 1.7.25, published 2026-11-14 |
| Kysely | 0.29.9 |
| `pg` | 8.23.1, published 2026-09-30 |
| Vitest | 5.1.0, published 2026-11-02 |
| `@atproto/oauth-client-node` | 0.5.16 |
| `@atproto-labs/fetch-node` | 0.4.5 |
| `@sveltejs/kit` | 3.2.0 |
| `@sveltejs/adapter-node` | 6.0.2 |
| `svelte` | 5.57.3 |
| `vite` | 8.3.8, published 2026-11-11 |
| `@sveltejs/vite-plugin-svelte` | 7.3.1, published 2026-09-23 |
| `typescript` | 6.0.2, published 2026-03-23 |
| Chrome | 157.0.8103.50 at `/usr/local/bin/google-chrome` |
| Firefox | 160.0.1 from the Mozilla linux64 tarball, not apt and not snap |
| Safari | cannot run on this Linux VM |

Package ages were checked against 2026-11-16Z. `NODE_ENV=development` and `TEST` unset for the auth proofs. Those proofs were `bun file.ts`, not `bun test`. No `BETTER_AUTH_SECRET` was set. The library's development fallback was left in place and is not copied here.

Spike tree: `/agent/repos/unset-sh/spike`. Bun is `$HOME/.local/bin/bun`.

## Results

| Item | Result |
| --- | --- |
| (a) Elysia mounts `auth.handler` and the bearer plugin | Pass |
| (b) `atproto` plugin, memory adapter, bearer token on the next call | Pass |
| (c) server-to-server bearer call, origin and CSRF flags left on | Pass, with the conditions below |
| (d) loopback OAuth client, DPoP, refresh, revocation | Fail. Construction of the default client throws. A guarded fetch can reach a public entryway and a pushed authorization request. Refresh and revocation were not run |
| (e) egress guard | Pass |
| (f) Kysely on `Bun.sql`, then the adapter suites | Dialect smoke passes. Published adapter suites: Bun.sql 358 passed / 110 failed; `pg` 8.23.1 468 passed / 468 |
| (g) `__Host-` cookie on `http://127.0.0.1:8080` | Pass in Chrome and Firefox. Safari cannot run here |
| (h) OpenAPI JSON and `Bun.YAML.stringify` | JSON stable. `stringify` exists and matched across two generations of this document. It is not stable across key insertion order. The yaml doc at this tag documents `parse` only |
| (i) telemetry | Default init sends nothing. An explicit `telemetry.enabled: false` does not stay off once `BETTER_AUTH_TELEMETRY` and `BETTER_AUTH_TELEMETRY_ENDPOINT` are both set |

## (a) (b) (c)

Command, from `/agent/repos/unset-sh/spike`:

```sh
NODE_ENV=development bun auth-run.ts
```

Exit 0. `isTest()` was false. `skipOriginCheck` and `skipCSRFCheck` were false. Elysia served `GET /health` and `GET /api/auth/ok` (`{ "ok": true }`) with `auth.handler` mounted and `bearer()` registered.

The plugin `POST /api/auth/atproto/session` takes a synthetic `did:plc` value, not a person's handle. It stores a user whose email is the SHA-256 hex of that DID plus `@user.invalid`, an account with `providerId` `atproto` and `accountId` equal to the DID, and a session. `account.accountLinking.disableImplicitLinking` was true on the auth context. The database option was the memory adapter function. No database option was passed. The response token and the `set-auth-token` header were both accepted by a following bearer call, including `GET /api/auth/get-session`. Values are not recorded.

(c) used `POST /api/auth/atproto/whoami` with `disableBody: true`. The call that succeeded had `Authorization: Bearer` and neither a `Cookie` header nor an `Origin` header. The same call with a dummy `Cookie` header and no `Origin` returned 403 `MISSING_OR_NULL_ORIGIN`. A bearer token plus a dummy `Cookie` header and no `Origin` also returned 403. The bearer before-hook therefore does not make `headers.has("cookie")` true for `validateOrigin`: that middleware runs on the request headers before the hook, and the hook writes a different header object (`better-auth/dist/api/middlewares/origin-check.mjs`, `better-auth/dist/plugins/bearer/index.mjs`, `better-auth/dist/api/index.mjs` router middleware, `better-auth/dist/api/dispatch.mjs`).

`skipOriginCheck` comes from `better-auth/dist/context/create-context.mjs`: it is true when `isTest()` is true (`NODE_ENV === "test"` or a truthy `TEST`, `@better-auth/core/dist/env/env-impl.mjs`). This process was not in that state.

What the server-to-server call needs: `Authorization: Bearer` with the session token from the establish response (the raw token or the signed `set-auth-token` value), no `Cookie` header, and `NODE_ENV` not `test`. It does not need an `Origin` header, and it does not need `disableOriginCheck` or `disableCSRFCheck`.

A bearer call with `Origin: https://evil.example` and no `Cookie` was also accepted. `validateOrigin` returns before checking the origin when the request has no cookie and `forceValidate` is false. A `Sec-Fetch-Site: cross-site` header on this POST did not change that. `formCsrfMiddleware` is not mounted on this route.

## (d)

Command:

```sh
NODE_ENV=development bun oauth-run.ts
```

Exit 2.

`process.versions.undici` is null on Bun 1.4.4. The default `NodeOAuthClient` constructs `AtprotoHandleResolverNode`, which calls `safeFetchWrap` in `@atproto-labs/fetch-node` 0.4.5. `dist/dispatch.js` throws `Unicast SSRF protection requires Node.js 20.6+` when `process.versions.undici` is missing or older than 6.11.1. No request was made on that path. No client key was created.

Passing `handleResolver` skips that default parameter. The client then constructs with `buildAtprotoLoopbackClientMetadata` (`@atproto/oauth-types`): client id origin `http://localhost` (the redirect is carried in the query, because `http://127.0.0.1:8080/auth/callback` is not the library default), `token_endpoint_auth_method` `none`, `keyset` absent. The guard's fetch was passed in. `authorize("https://bsky.social")` is a service URL, not a person's handle. The guard saw:

| Path | Status |
| --- | --- |
| `/.well-known/oauth-protected-resource` | 404 |
| `/.well-known/oauth-authorization-server` | 200 |
| `/oauth/par` | 400, then 201 |

The 400-then-201 pair matches the DPoP nonce retry in `@atproto/oauth-client/dist/fetch-dpop.js`. A `DPoP` header was present on an outbound request. The returned URL was `https` on `bsky.social` and had `request_uri` and `client_id`. `abortRequest` succeeded. The stub handle resolver was not called. Refresh was not run. Revocation was not run. No account, password, or consent screen was used.

That is a failure of the full loop. Options actually observed are in `findings.md`. Node is not proposed.

## (e)

Command:

```sh
NODE_ENV=development bun egress-run.ts
```

Exit 0. Plain fetch did not classify the 11 cases. The guard refused all 11 (`egress.private_address` or `egress.internal_name`). Classes: `127.0.0.1` loopback, `169.254.169.254` reserved (the copied table, not a separate link-local class), `10.0.0.1` private, `192.0.2.1` reserved, `::ffff:127.0.0.1` loopback. A stub fetch of `https://pinned.example/path` was called with URL host `1.2.3.4`, `Host: pinned.example`, and `tls.serverName` `pinned.example`.

Citations: `docs/runtime/networking/fetch.mdx` "Connecting to a specific address" and `docs/runtime/networking/dns.mdx` at tag `bun-v1.4.4`. Classifier copy: `Undefined6799/unset` `60228f5e60ead58c359f798519816fc3e8ec3fa4`.

## (f)

Smoke command:

```sh
NODE_ENV=development bun db-run.ts
```

Exit 0. Insert, select, update, rollback, and commit through Kysely 0.29.9 on `Bun.sql` (`sql.reserve()` and `sql.unsafe` with `$1`). `docs/runtime/sql.mdx` at `bun-v1.4.4`. `PostgresQueryCompiler`, `PostgresAdapter`, and `PostgresIntrospector` were imported from `kysely/dist/dialect/postgres/` because kysely 0.29.9 does not export them. Dates round-tripped as `Date`.

Adapter suites, the seven suites exported by `@better-auth/test-utils/adapter` at 1.7.25 (the same list the tag's `e2e/adapter/test/kysely-adapter/adapter.kysely.pg.test.ts` imports from that package). Tag `v1.7.25` is commit `3fa26c979160914ce8e1c0e8786b1f48aa2552e5`. The schema-reference, SCIM HTTP, and compound-index suites live only in that e2e tree and were not run. The monorepo was cloned and not installed (`packageManager` `pnpm@12.18.0`; this machine has pnpm 10.33.4).

```sh
bun node_modules/vitest/vitest.mjs run adapter.bun-sql.test.ts --reporter=dot
```

358 passed, 110 failed, exit 1. The failing uuid suite reports `column "id" is of type uuid but expression is of type text` and `operator does not exist: uuid = text`. A first run also died with `sorry, too many clients already` because each migration constructed another `Bun.SQL` pool; `init` now keeps the pool it already opened. The uuid failures remained after that fix.

```sh
bun node_modules/vitest/vitest.mjs run adapter.pg.test.ts --reporter=dot
```

468 passed, exit 0, after `onFinish` stopped calling `pool.end()` a second time (`db.destroy()` already ends it). Pool: unix socket `/var/run/postgresql`, database `spike_adapter`, user `ubuntu`, no password. Migrations used `getMigrations` with that `pg` pool, which is the shape in the upstream file. Kysely's public `PostgresDialect` wrapped the same pool.

Both outcomes are recorded. No choice is written into a decision record.

## (g)

Kit 3.2.0 rejects `svelte.config.js` (`config_file_unsupported`). The adapter is passed to `sveltekit({ adapter: adapter() })` in `vite.config.ts`, which is the configuration shown in `@sveltejs/kit` 3.2.0. Build:

```sh
cd cookie-app && bun install && NODE_ENV=production bun run build
HOST=127.0.0.1 PORT=8080 ORIGIN=http://127.0.0.1:8080 NODE_ENV=production bun build/index.js
```

`build/index.js` is the adapter-node server (`@sveltejs/adapter-node` reads `HOST` and `PORT`). A previous `bun build/index.js` from `spike/web` was already bound to port 8080 and was stopped so this server could listen.

`GET /set` emitted `__Host-unset=<redacted>; Path=/; HttpOnly; Secure; SameSite=Lax` and no `Domain`. Chrome 157, headless, CDP: after navigation from `/set` to `/check`, the server reported the cookie name present and a value held, and `document.cookie` did not show the name.

Firefox 160.0.1 tarball, `--headless --remote-debugging-port 9224`. Bun's `WebSocket` client was rejected (`Upgrade` header undefined). A `node:http` upgrade to `/session` with protocol `webdriver-bidi` worked. The same page result: name present, value held, `document.cookie` hidden.

```sh
NODE_ENV=development bun cookie-browser.ts
NODE_ENV=development bun firefox-browser.ts
```

Both exited 0. Safari cannot be run on this machine.

## (h)

```sh
NODE_ENV=development bun openapi-run.ts
```

Exit 0. Elysia `@elysia/openapi` 1.4.17 at `/openapi/json`, with Better Auth paths merged by the hand copy described at https://elysiajs.com/integrations/better-auth (`auth.api.generateOpenAPISchema()`, prefix `/api/auth`, tag `Better Auth`). Two fetches were byte-identical (69694 bytes). `/health` and `/api/auth/get-session` were present (30 `/api/auth/` paths). `typeof Bun.YAML.stringify` is `function`. Stringifying the two documents matched. Stringifying `{ b, a: { d, c } }` and `{ a: { c, d }, b }` did not match, so stringify follows insertion order. `docs/runtime/yaml.mdx` at `bun-v1.4.4` documents `Bun.YAML.parse` only.

## (i)

```sh
NODE_ENV=development bun telemetry-run.ts
```

`@better-auth/telemetry/dist/index.mjs` `createTelemetry`: if `BETTER_AUTH_TELEMETRY_ENDPOINT` is unset and the context has no `customTrack`, it returns `{ publish: noop }` before the enabled check. Observed: default init, and `BETTER_AUTH_TELEMETRY=1` with no endpoint, fetched nothing.

`telemetry.enabled` defaults to false in `init-options.d.mts`. With `BETTER_AUTH_TELEMETRY=1`, `telemetry.enabled: false`, and the endpoint pointed at a listener on `127.0.0.1`, init did fetch that listener. The same happened when `enabled` was left unset and the endpoint and env var were set. Explicit false does not override the env var once an endpoint exists. `isEnabled` is `(env || telemetry.enabled) && !isTest()`. Nothing left the machine: the only host contacted was the local listener, and only in those two armed cases.

`experimental.instrumentation.enabled` defaults to true. The comment in `init-options.d.mts` says it does not affect usage reporting. `@better-auth/core/dist/instrumentation/api.mjs` dynamic-imports `@opentelemetry/api` and ignores failure. That package is not installed (`otelImport` `absent`). Default init performed no fetch.

## Commands, in order

```sh
export PATH="$HOME/.local/bin:$PATH"
cd /agent/repos/unset-sh/spike
NODE_ENV=development bun egress-run.ts
NODE_ENV=development bun auth-run.ts
NODE_ENV=development bun db-run.ts
NODE_ENV=development bun telemetry-run.ts
NODE_ENV=development bun openapi-run.ts
NODE_ENV=development bun oauth-run.ts
cd cookie-app && bun install && NODE_ENV=production bun run build
HOST=127.0.0.1 PORT=8080 ORIGIN=http://127.0.0.1:8080 NODE_ENV=production bun build/index.js
cd .. && NODE_ENV=development bun cookie-browser.ts
NODE_ENV=development bun firefox-browser.ts
bun node_modules/vitest/vitest.mjs run adapter.bun-sql.test.ts --reporter=dot
bun node_modules/vitest/vitest.mjs run adapter.pg.test.ts --reporter=dot
```
