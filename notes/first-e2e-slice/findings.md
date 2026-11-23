# Findings while reading the old app and the spike

The old app stayed read-only at `60228f5e60ead58c359f798519816fc3e8ec3fa4`. These are notes, not fixes. A security item was not copied forward as product code.

## Better Auth treats bearer calls as cookie-less

File: `better-auth@1.7.25` `dist/api/middlewares/origin-check.mjs`, `validateOrigin`.

A bearer `POST` with `Origin: https://evil.example` returned 200. The same foreign origin with the session cookie returned 403. The check is on. It keys off the cookie, and the bearer plugin's injected cookie is not visible to it.

Suggested fix when this is product code: web never forwards the browser's `Cookie` to backend, and backend's own routes still require the bearer session. Do not set `disableOriginCheck`. Say in the decision record that a foreign `Origin` does not reject a bearer call.

## Better Auth logs the origin it rejects

The 403 above was logged by Better Auth as `Invalid origin: https://evil.example`. An origin can be a person's site. Our allowlisted logger must not pass that line through. Suggested fix: leave Better Auth's logger at `disabled: true` on the product config, or a wrapper that drops the message, and test that the line is absent.

## Default atproto handle resolver does not start on Bun 1.4.4

`@atproto-labs/fetch-node` `dist/dispatch.js` throws unless `process.versions.undici` parses as at least 6.11.1. Bun 1.4.4 reports `undici` as absent. `NodeOAuthClient`'s default `handleResolver` constructs that resolver even when `fetch` is passed.

Suggested fix: do not use `AtprotoHandleResolverNode`. Resolve handles through the egress guard. The prompt already says every handle, DID and PDS call uses that fetch.

## `fetchMetadata` fetches the client id

`@atproto/oauth-client@` the copy with oauth-client-node 0.5.16, `dist/oauth-client.js` `fetchMetadata`, does `fetch(new Request(clientId))`. A localhost client id is a virtual document in the AT Protocol spec, and that fetch is a loopback URL the public guard refuses.

Suggested fix: build the loopback metadata in process. Do not send `http://localhost` through the guard.

## The guard must accept a `Request`

The same `fetchMetadata`, and later PDS calls, pass a `Request`, not a string. The first guard only read `input.href` and threw `egress.scheme`. Suggested fix: read `input.url` when `input` is a `Request`, and copy its method, headers and body. The spike guard does this now. It is still scratch.

## TypeScript 7.0.2 and SvelteKit 3.2.0

`typescript@7.0.2` `package.json` `exports["."]` is `lib/version.cjs`. Kit `src/core/sync/write_tsconfig/index.js` imports `typescript` and calls `ts.sys.readFile`. The build throws. Kit 3 also refuses `svelte.config.js`; the adapter is an argument to `sveltekit()` in the Vite config.

Suggested fix: decide this before the web PR. Options are in `spike.md` (g). Do not pin Kit 3.4.0 before 2026-11-25.

## Kysely's Postgres compiler is not a public export

`kysely@0.29.9` `dist/index.d.ts` does not export `PostgresQueryCompiler` or `PostgresAdapter`. They exist at `dist/dialect/postgres/`. Importing that path will break if they move it. Suggested fix: if the dialect stays, copy the two small classes we need or ask whether a public import exists in a later Kysely that is old enough. Their adapter suite was not run.

## Link-local is `reserved` in the old table

`infrastructure/net-guard/src/ranges.ts` classifies `169.254.0.0/16` as `reserved`, not a fourth class. The guard refuses it. No change needed. Worth one refusal test so a later edit does not drop it.

## tooling Bun check is not on main

`unset-sh/tooling` `main` `ci-check.yml` still installs Node from `.nvmrc`. The Bun workflow is `unset-sh/tooling#20`, open, base `staging`, head `ce41d9513224e4ea68219573462bf06bafe5805c`. Do not pin it. Backend and web CI cannot call a Bun check until that lands on `main`.

## Old-app copy permission

`unset-sh/backend` `CLAUDE.md` says not to infer permission to copy `Undefined6799/unset`. The slice prompt says Alex authorised the copy on 2026-11-23. Those disagree. No product file was copied in this spike. The classification files were copied only into the scratch spike.
