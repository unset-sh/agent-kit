# Eden Treaty and an OpenAPI client, across two packages

Status: spike only. No product repository was edited. Nothing was published except to a registry on `127.0.0.1:4873`. No choice between the two options is recorded here.

The two packages were separate directories, each with its own `package.json` and `bun.lock`. Neither was a workspace of the other, and neither imported the other by path. Scratch tree, not committed: `/tmp/web-client-spike/` (`backend-api/`, `web-app/`, `registry/`).

## TypeScript 7.0.2 and SvelteKit 3.2.0

`typescript` stays `7.0.2`. `bun ./node_modules/typescript/bin/tsc --version` printed `Version 7.0.2` after the workaround below.

SvelteKit 3.2.0 loads the user's `tsconfig.json` with `ts.readConfigFile` and `ts.sys.readFile` (`@sveltejs/kit` 3.2.0 `src/core/sync/write_tsconfig/index.js` lines 19-24 and 193). The `typescript@7.0.2` package exports `"."` as `./lib/version.cjs`, and that file exports only `version` and `versionMajorMinor` (observed by importing it). With a `tsconfig.json` present:

```text
TypeError: undefined is not an object (evaluating 'ts.sys.readFile')
```

`svelte-kit sync` and `vite build` both exit 1 on that line. The first spike's cookie app installed `typescript@6.0.2` (published 2026-03-23; `notes/first-e2e-slice/spike.md` on `cursor/first-e2e-slice-spike-dd02`). This spike keeps the 7.0.2 pin and gives Kit that same compiler API:

- `@spike/typescript6` is the npm alias `typescript@6.0.2` (`ts.version` is `6.0.2`, `readConfigFile` is a function).
- `node_modules/typescript/lib/version.cjs` is replaced, after `bun install`, with `module.exports = require("@spike/typescript6")`. `lib/tsc.js` is not edited. It still execs the 7.0.2 binary.
- A Bun `--preload` plugin that swaps the same file (`docs/runtime/plugins.mdx` at tag `bun-v1.4.4`, `onLoad`) made `svelte-kit sync` exit 0 and did not make `vite build` exit 0. A later config pass in that build still evaluated `ts.sys` as missing. The on-disk entry is what the build used.

After the entry replacement, `import("typescript")` reports version `6.0.2` and `readConfigFile` is a function. `vite build` exits 0. The same build exits 0 with `node` absent from `PATH`. The log line `(node:…)` comes from Rolldown calling `node:util` `styleText`; the frames are Bun's `internal:tty` and `internal:util/colors`.

Kit 3.2.0 still rejects `svelte.config.js`. The adapter is passed to `sveltekit({ adapter: adapter() })` in `vite.config.ts`, as in the first spike's item (g).

## Versions

Ages were read from the npm registry `time` field on 2026-11-23. The wait is 7 days, so a release published after 2026-11-16 was not installed.

| Package | Version | Published |
| --- | --- | --- |
| Bun | 1.4.4 (`1.4.4+38afee6c8`) | tag `bun-v1.4.4` |
| `elysia` | 1.4.32 | 2026-11-11 |
| `elysia` older patch | 1.4.31 | 2026-11-05 |
| `elysia` newer line | 2.0.0-rc.4 | 2026-11-08 |
| `@elysia/eden` | 1.4.10 | 2026-04-23 |
| `@elysia/openapi` | 1.4.17 | 2026-11-04 |
| `yaml` | 2.9.1 | 2026-09-11 |
| `better-auth` | 1.7.25 | 2026-11-14 |
| `orval` | 8.48.0 | 2026-11-14 |
| `zod` | 4.6.7 | 2026-10-12 |
| `@redocly/cli` | 2.79.0 | 2026-11-16 |
| `@sveltejs/kit` | 3.2.0 | 2026-11-10 |
| `@sveltejs/adapter-node` | 6.0.2 | 2026-11-10 |
| `@sveltejs/vite-plugin-svelte` | 7.3.1 | 2026-09-23 |
| `svelte` | 5.57.3 | 2026-10-26 |
| `vite` | 8.3.8 | 2026-11-11 |
| `typescript` | 7.0.2 | 2026-07-08 |
| `typescript` (Kit's API) | 6.0.2 | 2026-03-23 |
| `@types/bun` | 1.4.4 | 2026-10-23 |

There is no `elysia` 1.4.33. The only release after 1.4.32 is `2.0.0-rc.5` (2026-11-22). That was not installed. `orval` 8.49.0 (2026-11-22) and `@redocly/cli` 2.80.0 (2026-11-18) were not installed. `@hey-api/openapi-ts` latest stable is 0.99.0 (2026-06-22). `openapi-typescript` 7.13.0 (2026-02-11) declares a peer of `typescript` `^5`.

Current Elysia docs name the packages `@elysia/openapi` and `@elysia/eden` (https://elysiajs.com/patterns/openapi and https://elysiajs.com/eden/overview.html, read 2026-11-23). The Eden page imports `App` from `./server`. It does not describe a published type package.

## Comparison

| Point | A. Published `App` type, Eden 1.4.10 | B. orval 8.48.0 client from `openapi.yaml` |
| --- | --- | --- |
| Request, response, error types | Exact on Elysia 1.4.32. See below. No `any`. | Exact for the three JSON operations, after the spec was reduced to `application/json`. No `any`. The 401 type is not what the function does at runtime. |
| Other Elysia on web | 1.4.31: `tsc` exit 0, exact assertions still hold. 2.0.0-rc.4: the route names are gone. | 1.4.31 and 2.0.0-rc.4: `tsc` exit 0. The client does not import Elysia. Web typechecks with Elysia not installed. |
| Renamed response field | After `@spike-local/api-types@1.0.1`, `tsc` exit 1. On 1.0.0, `tsc` exit 0. | After `@spike-local/api-client@1.0.1`, `tsc` exit 1. On 1.0.0, `tsc` exit 0. Redocly diff exit 1. |
| What else is in the artefact | One `.d.ts`, 3588 bytes. The only import is `elysia`. No Better Auth names, no file paths. Mounted Better Auth routes are absent. `unknown` appears on unspecified query, GET body, POST headers, and the 422 `found` field. | `client.ts` plus `schemas/index.zod.ts`. Header comment carries the spec's title "Elysia Documentation" and description "Development documentation". Base URL is the string passed to orval. One `unknown` in the generated header merger. No Better Auth names, no file paths. 422 is not in the spec, so it is not in the client. |
| `tsc` in `web-app` | 596 files, about 95 MB. Check time 0.018s, then 0.005s, then 0.006s. Wall 0.167s, 0.162s, 0.168s. | 418 files, about 90 MB. Check time 0.010s, 0.015s, 0.010s. Wall 0.157s, 0.157s, 0.155s. |
| Packed size | 0.81 KB (unpacked 3.95 KB). Peer `elysia` `1.4.32`. | 1.89 KB (unpacked 7.92 KB), plus `zod@4.6.7`. The installed `zod` directory is 6148944 bytes (`src` 3087749, `v4` 2568960, `v3` 462395). |
| What a backend release runs | `tsc -p tsconfig.types.json` (declaration only), then `bun publish` of that directory. | Write `openapi.yaml` with `yaml` 2.9.1 `sortMapEntries: true`, drop non-JSON request bodies, `orval`, `bun publish`, and `redocly diff` against the previous yaml. |
| How a break is caught | Web `tsc`, after the package bump. | Web `tsc`, after the package bump. `redocly diff` on the two yaml files exits 1 (2 major, 2 minor, 29 ms). |

`tsc` was `typescript` 7.0.2 with `--noEmit --incremental false --extendedDiagnostics`. The page cache was not dropped. Wall time is mostly process start. The three runs are consecutive.

## Registry

`bun publish` sends the package to the registry URL in `.npmrc` or `bunfig.toml` (`oven-sh/bun` tag `bun-v1.4.4`, `docs/pm/cli/publish.mdx`). The documented example is `http://localhost:4873/`. A folder path is not a registry URL in that page. Verdaccio was not started.

`registry/server.ts` is `Bun.serve` on `127.0.0.1:4873`. It stores the packument and the tarball under `registry/store/`. A later publish merges versions into the existing packument. The scope `@spike-local` points at that URL with token `local`. The server does not check the token. `publish.mdx` says a scope registry on a different origin than the default registry fails closed when no credential is configured. `local` is a placeholder for that check, not a credential for any other system.

Published tarballs contained only the intended files. `@spike-local/api-types@1.0.0` was `package.json` and `app.d.ts`. `@spike-local/api-client@1.0.0` was `package.json`, `client.ts`, and `schemas/index.zod.ts`. Web's `bun.lock` records the tarball URL `http://127.0.0.1:4873/...`.

`bunfig.toml` in each package sets `exact = true`, `ignoreScripts = true`, `minimumReleaseAge = 604800`, and `minimumReleaseAgeExcludes` for the two `@spike-local` names (`docs/runtime/bunfig.mdx` at `bun-v1.4.4`).

## A. Eden

Backend routes, TypeBox request and response schemas, matching the first-slice contract: `GET /me/profile`, `PUT /me/profile` `{displayName}` , `POST /auth/sign-in/atproto` `{handle}` to `{url}`. Profile responses are 200 `{did, handle, displayName?}` and 401 `{error: "unauthorized"}`. Better Auth 1.7.25 is mounted with `memoryAdapter({})`, `bearer()`, and `telemetry: { enabled: false }` (`@better-auth/memory-adapter` 1.7.25 `dist/index.d.mts`; `@better-auth/core` 1.7.25 `dist/types/init-options.d.mts`). OpenAPI is `@elysia/openapi` 1.4.17 with `provider: null`. No `BETTER_AUTH_SECRET` was set. `NODE_ENV=development`.

`openapi.yaml` is `yaml` 2.9.1 `stringify(spec, { sortMapEntries: true })`. The option is in `yaml` 2.9.1 `dist/options.d.ts` (default `false`). Two stringifies of the spec matched. Two objects built with opposite key order matched. The file is 3929 bytes and does not contain `/api/auth/`.

Declaration emit: `tsc` 7.0.2, `declaration` and `emitDeclarationOnly`. The result is one file. `export type App = typeof app`, and `app` is `Elysia<..., routes, ...>` with the three operations in the route slot (`elysia` 1.4.32 `dist/index.d.ts`, `'~Routes': Routes` is that slot). Eden reads `~Routes` (`@elysia/eden` 1.4.10 `dist/treaty2/types.d.ts`).

On Elysia 1.4.32, web's assertions hold (`tsc` exit 0):

- GET data `{ did: string; handle: string; displayName?: string }`
- GET error `{ status: 401; value: { error: "unauthorized" } }` or the 422 validation object (`type: "validation"`, `on: string`, optional `summary`, `message`, `found`, `property`, `expected`, and `found` is `unknown`)
- PUT body `{ displayName: string }`
- POST data `{ url: string }`, body `{ handle: string }`, error the 422 object only
- `"displayTitle" extends keyof` the profile data is false
- `IsAny` is false for those types (`0 extends 1 & T`)

`unknown` is not `any`. It is the unschematised query, the GET body, the POST headers, and `found` on the automatic 422.

Runtime, from `+page.server.ts` `load`, backend on `127.0.0.1:3000`:

```text
get-401:401 get-200:did:plc:spike:Spike put-200:Ada post-200:invalid-url
```

`GET /api/auth/ok` returned 200 `{"ok":true}`. `GET /api/auth/get-session` returned 200 `null`. Those paths are not in `app.d.ts`.

Elysia 1.4.31 on web: `bun install` exit 0, `tsc` exit 0, the same assertions. Elysia 2.0.0-rc.4: `tsc` exit 1. `api.me` and `api.auth` do not exist. Eden's inferred routes are the empty ephemeral object (`derive`, `resolve`, `schema`, `standaloneSchema`, `response`). The profile-field assertion also fails (`Type 'false' does not satisfy the constraint 'true'`).

Renaming the response field `displayName` to `publicName` and publishing `@spike-local/api-types@1.0.1`: web still on 1.0.0 typechecks. After the bump, `tsc` exit 1:

```text
Type 'false' does not satisfy the constraint 'true'.
Property 'displayName' does not exist on type '{ did: string; handle: string; publicName?: string | undefined; }'.
```

The `.d.ts` diff is those two property names (GET and PUT responses).

## B. Generated client

orval 8.48.0 is the generator. It is still being released (8.38.0 through 8.48.0 from September to 2026-11-14), it emits a fetch client, and `override.fetch.runtimeValidation` parses the response with the zod schema (`@orval/core` 8.48.0 `dist/index.d.mts`; the v8 page https://orval.dev/docs/versions/v8 describes `runtimeValidation: true`). `openapi-typescript` 7.13.0 peers TypeScript 5, so it is outside this pin.

Against the plugin's yaml, orval's zod client imports `PostAuthSignInAtprotoBodyOne` and `PutMeProfileBodyOne`. The schema file exports `PostAuthSignInAtprotoBody` and `PutMeProfileBody`. `tsc` 7.0.2 on that client:

```text
error TS2724: '"./schemas/index.zod.ts"' has no exported member named 'PostAuthSignInAtprotoBodyOne'. Did you mean 'PostAuthSignInAtprotoBody'?
error TS2724: '"./schemas/index.zod.ts"' has no exported member named 'PutMeProfileBodyOne'. Did you mean 'PutMeProfileBody'?
```

The plugin writes `application/json`, `application/x-www-form-urlencoded`, and `multipart/form-data` for the same object body. Reducing each request body to `application/json`, then generating with `schemas.type: "zod"`, `client: "fetch"`, `runtimeValidation: true`, and `baseUrl: "http://127.0.0.1:3000"`, produces imports that match the exports. That client typechecks in web (`tsc` exit 0) with these assertions:

- 200 data `{ did: string; handle: string; displayName?: string }`
- 401 data `{ error: "unauthorized" }`
- PUT body `{ displayName: string }`
- POST data `{ url: string }`, body `{ handle: string }`
- status 422 is not in the GET result
- `IsAny` is false
- `"displayTitle"` is not a key of the profile data

The generated `getMeProfile` always runs `GetMeProfile200.parse` on a JSON body, then casts the result to the 200-or-401 union. Runtime of `load`:

```text
get-401:ZodError get-200:did:plc:spike:Spike put-200:Ada post-200:invalid-url
```

A 401 body does not come back as `{ status: 401 }`. It throws `ZodError`. A missing `did` throws `ZodError`. An extra property is dropped: `parse` of `{...profile, extra: true}` returns the three profile keys. That is zod 4.6.7's default object, not a strict object.

In-process, 20000 calls after a warmup: `GetMeProfile200.parse` 1.030 microseconds, `JSON.parse(JSON.stringify(sample))` 0.271 microseconds. Fifty localhost calls: the generated function 0.087 ms, `fetch` plus `res.json()` 0.025 ms. The gap is the generated function, not only the 1 microsecond parse. `zod`'s installed tree is the large part of the cost.

Elysia is not a dependency of the client. Adding `elysia@1.4.31` or `elysia@2.0.0-rc.4` to web and typechecking again: both exit 0. Removing them leaves web without an `elysia` directory, and `tsc` had already passed in that state.

`@redocly/cli` 2.79.0 `diff` on the two plugin yaml files (displayName renamed to publicName), `--format markdown`:

```text
2 major · 2 minor · 0 patch
property-removed displayName on GET 200 and PUT 200
publicName added on both
exit 1, "Diff failed with 2 major changes.", 29 ms
```

The command is marked experimental in `diff --help`. After publishing `@spike-local/api-client@1.0.1` and installing it, web `tsc` exit 1 with the same two shapes as Eden: the exactness assertion is false, and `displayName` is not on `{ did: string; handle: string; publicName?: string | undefined }`. Before that install, web was still on 1.0.0 and `tsc` exited 0.

orval's `clean: true` deletes `package.json` when that file sits in the output directory. The publish `package.json` has to be written after generation.

## What failed

Eden on Elysia 1.4.32, and the orval client generated from the JSON-only document, both typecheck and both perform the three calls. Two narrower failures:

- Eden's published type does not survive Elysia 2.0.0-rc.4. The routes are not `any`. They are gone. Elysia 1.4.31 still typechecks.
- orval 8.48.0 does not emit a typechecking client from `@elysia/openapi` 1.4.17's unmodified yaml, because of the `BodyOne` / `Body` mismatch above. It does after non-JSON request bodies are removed. The generated 401 branch is not honoured at runtime: the 200 schema is parsed and a 401 throws.

Neither option required web to import backend source. The type package has no runtime file. The client package is generated TypeScript plus `zod`.

## Not run

- Dropping the page cache, so the first `tsc` of each trio is only the first consecutive run.
- `elysia` 2.0.0-rc.5 and `orval` 8.49.0 (both published 2026-11-22).
- Verdaccio, and any registry other than `127.0.0.1:4873`.
- A hand merge of Better Auth's OpenAPI into `openapi.yaml`.
- A browser walk of the Svelte page. `vite build` exited 0, and `load` was executed under Bun.
- `redocly diff --check-version`. Both documents have `info.version` `0.0.0`.
