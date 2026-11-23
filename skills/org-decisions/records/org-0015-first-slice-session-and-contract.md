# org-0015. The first slice's session, contract and egress

Status: proposed (2026-11-23, Alex accepted the two recommendations by pasting the follow-up prompt: use `@atproto/oauth-client` rather than `NodeOAuthClient`, and use `pg` for Better Auth's tables. The rest of this record quotes that prompt and the spike. It is not accepted until he says so of the record itself.)

## Context

The first working slice is a person signing in with an AT Protocol handle, seeing their profile, editing the display name, and signing out. Alex chose Bun with no Node fallback on 2026-11-23 ("Bun is actually going to be replacing Node"). A spike on Bun 1.4.4 ran the pieces that do not need his password. The evidence is `notes/first-e2e-slice/spike.md` on `cursor/first-e2e-slice-spike-dd02` (not on `main` yet).

Two choices were recommendations. He accepted them by pasting the follow-up prompt unchanged on 2026-11-23.

## Decision

1. **Contract.** Elysia on Bun, with TypeBox request and response schemas, is the contract for web's internal API. A generated `openapi.yaml` is committed and checked for drift. It is written with the `yaml` package at 2.9.1 after a canonical key sort. `Bun.YAML.stringify` is not used: Bun 1.4.4 `docs/runtime/yaml.mdx` documents `parse` only, and a test showed `stringify` follows insertion order. Better Auth's routes are merged into that file by hand.
2. **Sessions.** Better Auth runs in backend only. Web holds an `__Host-` cookie and sends `Authorization: Bearer`. Better Auth's own cookies never reach the browser. A bearer call with no `Cookie` is accepted even when `Origin` is missing or untrusted: a bearer token is not attached by the browser on its own. Any `Cookie` without a trusted `Origin` is refused. `trustedOrigins` is web's origin only. `telemetry.enabled` is false. Backend refuses to start when `BETTER_AUTH_TELEMETRY` or `BETTER_AUTH_TELEMETRY_ENDPOINT` is set (`@better-auth/core` `dist/env/env-impl.mjs` also reads `BETTER_AUTH_TELEMETRY_DEBUG` and `BETTER_AUTH_TELEMETRY_ID`). The env var bypasses `enabled: false` when an endpoint is also set; that is noted for an upstream report and is not filed from here.
3. **AT Protocol OAuth.** Use `@atproto/oauth-client` (0.9.3, the newest build at least 7 days old on 2026-11-23), not `NodeOAuthClient`. The default node client throws on Bun 1.4.4 because `process.versions.undici` is absent and `@atproto-labs/fetch-node` requires undici >= 6.11.1. Supply our handle resolver (DNS TXT and `/.well-known/atproto-did`), our DID resolver (`did:plc` and `did:web`), the egress guard's `fetch`, a WebCrypto digest with `@atproto/jwk-jose` for DPoP keys, and Postgres state and session stores. The guard is the only SSRF layer. The local client is the loopback client (`http://localhost`, no client key). This was a recommendation; Alex accepted it by pasting the prompt.
4. **Database.** Better Auth's tables use `pg` 8.23.1 and Kysely 0.29.9 `PostgresDialect`. That passed the published adapter suites, 468 of 468. A Kysely dialect on `Bun.sql` passed 358 and failed 110, all uuid parameters sent as text. Do not keep that dialect for Better Auth. Backend's own tables use `Bun.sql`, with explicit casts such as `$1::uuid`, and a test that a uuid parameter round-trips. The three adapter suites that exist only in Better Auth's e2e tree are not required for this slice. This was a recommendation; Alex accepted it by pasting the prompt.
5. **Egress.** Resolve with `node:dns`, refuse any answer that is not public, and connect to the checked address. TLS server name and the `Host` header stay the original name. A request to `https://example.com/` on Bun 1.4.4 did that and passed the certificate check.
6. **Email.** `user.email` is a hash of the DID at a name under `.invalid`. It is not the DID, and it is not used to match or contact anyone.
7. **Copying the old app.** Alex decided on 2026-11-23 to reuse its code where it fits. `unset-sh/backend#5` and `unset-sh/web#5` change the repository rules that still forbid inferring that permission. Until those merge into `staging`, the files as they are win, and the old app is not copied.

## Consequences

- Web calls backend only from the server, behind a capability interface. The client library is still not chosen.
- A real sign-in, refresh and revocation wait for Alex to approve a consent screen himself. No agent types or stores his password.
- tooling's Bun check reached `main` through `unset-sh/tooling#22` at `7cd2e8c3d284cd9bb90c54f336adc0834b515d97` (2026-11-23). `unset-sh/tooling#20` had merged only into the retired `staging`. Callers pin that `main` commit or a later one.
- This record is proposed. Another thread merges it (org-0013). It does not by itself start the backend or web implementation.
