# First end-to-end slice: findings

The spike stopped because (d) did not finish. Refresh and revocation need an authorization code from a consent screen. No account was created, no password was used, and no consent screen was completed. No decision record was started. Node is not a proposal here.

## (d) options that were actually run or read

1. Default `NodeOAuthClient` on Bun 1.4.4. `process.versions.undici` is null. `@atproto-labs/fetch-node` 0.4.5 `dist/dispatch.js` throws before any network call: `Unicast SSRF protection requires Node.js 20.6+`. The check wants undici `>= 6.11.1` so it can build a guarded `Agent`. This path made zero guarded requests.

2. A caller-supplied `handleResolver`, so the default `AtprotoHandleResolverNode` is not constructed, plus `createGuardedFetch()` as `fetch`. The loopback metadata helper accepts this with `token_endpoint_auth_method: "none"` and no keyset. `authorize("https://bsky.social")` talks to that entryway through the guard: protected-resource metadata 404, authorization-server metadata 200, `/oauth/par` 400 then 201. The 400/201 pair is the DPoP nonce retry in `@atproto/oauth-client/dist/fetch-dpop.js`. `abortRequest` succeeded. The stub resolver was not called, so handle DNS was not exercised. Refresh and revocation were not run.

3. `safeFetchWrap` in `@atproto-labs/fetch-node/dist/safe.js` has `ssrfProtection`, default true. Setting it false was not done.

4. Assigning `process.versions.undici` so the Node agent would construct was not done.

The guard's `redirect: "manual"` did not block this entryway. The four responses above were final statuses, not redirects.

## (c) what the bearer call actually depends on

Origin validation is armed by a `Cookie` header on the incoming request. The bearer plugin's before hook copies the token into a different header object after that middleware has already run, so a bearer call with no `Cookie` is not origin-checked. That includes a call whose `Origin` is an untrusted site. `formCsrfMiddleware` is only on sign-in, sign-up, email OTP, and magic link, not on the spike's session POST.

The successful call was a POST with `Authorization: Bearer` and no `Cookie`. Either the raw session token or the signed `set-auth-token` value worked. `NODE_ENV` must not be `test`, and `TEST` must not be set, or `skipOriginCheck` defaults to true.

## (f) both database outcomes

`Bun.sql` through the spike dialect passed insert, select, update, rollback, and commit, and 358 of 468 published adapter tests. The 110 failures are the uuid suite: Postgres received uuid values as text (`uuid = text`, and uuid columns rejecting text expressions). One earlier run also exhausted Postgres connections because every migration built a new `Bun.SQL` pool; keeping the existing pool removed that error and left the uuid failures.

`pg` 8.23.1 with Kysely's `PostgresDialect`, peer auth, no password, passed the same 468 tests. Migrations in that run used the `pg` pool, matching the upstream test file.

The upstream file also runs schema-reference, SCIM HTTP, and compound-index suites from the e2e tree. Those were not executed. The tag was checked out at `3fa26c979160914ce8e1c0e8786b1f48aa2552e5` and not installed.

## (g) browsers

Chrome 157 and Firefox 160.0.1 both stored `__Host-unset` on `http://127.0.0.1:8080` and sent the name on the next navigation. The Set-Cookie attributes were `Secure`, `HttpOnly`, `Path=/`, `SameSite=Lax`, and no `Domain`. `document.cookie` did not contain the name. The server checked the name and that a value was present, and did not log the value.

Kit 3.2.0 will not read `svelte.config.js`. The adapter-node instance is an argument to `sveltekit()` in the Vite config. Vite 8.3.8 and `@sveltejs/vite-plugin-svelte` 7.3.1 were required peers and are older than 2026-11-16Z. `7.3.2` of the Vite plugin is not; it was published 2026-11-23.

Firefox came from `firefox-160.0.1.tar.xz`. apt's Firefox package routes through snap, which is broken here. Safari has no binary on this VM.

Bun's WebSocket client could not complete Firefox's BiDi handshake. The upgrade that worked was `node:http` to `ws://127.0.0.1:9224/session` with protocol `webdriver-bidi`.

## (h) YAML

`Bun.YAML.stringify` is on the runtime. Two OpenAPI responses stringified to the same bytes. Two equal objects built with different key order did not. Stability of this document came from the producer, not from stringify sorting keys. `docs/runtime/yaml.mdx` at `bun-v1.4.4` documents `parse` only.

## (i) telemetry and instrumentation

With no `BETTER_AUTH_TELEMETRY_ENDPOINT` and no `customTrack`, `createTelemetry` returns a noop publish and init fetches nothing, including when `BETTER_AUTH_TELEMETRY=1`.

Once an endpoint is set, `telemetry.enabled: false` does not win over `BETTER_AUTH_TELEMETRY=1`. The local listener received a request in that case, and also when `enabled` was left at the default false with the env var and endpoint set. The requests stayed on `127.0.0.1`.

`experimental.instrumentation.enabled` defaults to true and the option comment says it does not affect usage reporting. With `@opentelemetry/api` absent, the dynamic import fails closed and init does not fetch.

## Other

- `unset-sh/tooling#20` is still open, so a Bun CI workflow on tooling `main` is not available to pin.
- Backend `CLAUDE.md` and the prompt disagree about copying the old app. The org file was followed. No product copy was made.
- The spike did not set a Better Auth secret. The development fallback stayed inside the installed package.
