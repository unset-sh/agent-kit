# Cursor prompt: first end-to-end slice of the unset-sh architecture (Bun)

Paste everything below the line into Cursor. Revised 2026-11-23 from the org repos at agent-kit `main`
`b2cd04f1984344ca3fc35417527fbb4e3d374b6c` and the plan doc "Plan: moving the unset app into unset-sh". What
changed from Alex's draft, and why, is in [review.md](review.md) next to this file.

---

## 0. Your job

Build the first working end-to-end slice of unset.sh across the `unset-sh` org repos: **a person signs in with
their AT Protocol handle, sees their own profile page, edits their display name, and signs out.** The point is
to prove the repo split works (pinned versions between repos, separate CI, separate images, a private
web-to-backend hop), not to ship features.

Stack, as Alex chose it (2026-11-23): **Bun everywhere, no Node fallback.** **SvelteKit on Bun** (web) →
private network → **Elysia on Bun** (backend) with **Better Auth** (Unset sessions, in backend only) and
**`@atproto/oauth-client-node`** (AT Protocol OAuth, wrapped by a small Unset Better Auth plugin) → the
person's PDS. Postgres for state.

You open pull requests and drive each one to done in the order of §5. Where this prompt says **STOP**, stop,
write what you found, and wait for Alex.

## 1. Rules (non-negotiable; from `unset-sh/agent-kit` `main`)

Read first, in every repo you touch: its `CLAUDE.md` and `AGENTS.md`, then agent-kit `rules/org.md`,
`rules/working.md`, `rules/principles.md`, and the records in `skills/org-decisions/records/` (org-0007,
org-0010, org-0012, org-0013 and org-0014 matter most here). The org map is `unset-sh/.github` `MAP.md`. Read
them at the current `main`, not at a commit this prompt names. If this prompt and those files disagree, those
files win; say so in the PR.

- **Branches.** Staged repos (backend, web, deployment, pds, brand, rendering, profile-recipes): branch
  `cursor/<task>` from fresh `origin/staging`, PR base `staging`. Main-only repos (tooling, agent-kit,
  `.github`; docs is being cut over): branch from `origin/main`, PR base `main`. lexicons is moving from
  `staging` to `main` + `drafts`; you open no lexicons PR in this slice anyway. Check each repo's default
  branch before you start. Never commit on `main`/`staging`, never open, merge, queue or auto-merge a
  `staging`→`main` promotion, never force-push a branch you did not create.
- **Merging (org-0014, org-0013).** In a staged repo you merge your own pull request into `staging` only after
  you have read its full diff on GitHub, every required check has passed (failing, skipped or pending blocks
  it), and it does only what its description says. tooling and `.github`: their `CLAUDE.md` says the author
  does not merge an implementation PR, so leave those for review. agent-kit: another reviewer merges
  (org-0013). docs: Alex only. A PR that relaxes a gate, an approval, or an identity, key or secret rule
  needs Alex's own words quoted in it before it merges.
- **Commits.** In every org repo, per clone: `git config user.name "Alex"` and
  `git config user.email "188017560+Undefined6799@users.noreply.github.com"`. No `Co-authored-by`, no
  Cursor/AI trailer or session line. If Cursor adds one, amend it out before pushing. Subject: capitalised
  imperative, no trailing period, ≤72 chars, no Conventional Commits prefix. Blank line, body wrapped at 72
  saying what and why. Refactors and behaviour changes in separate commits.
- **PRs.** Fill the org PR template (`What changes`, `Why`, `Validation`, `Documentation`, `Checklist`) and
  add exactly one label: `kind:feature`, `kind:fix`, `kind:refactor`, `kind:docs` or `kind:maintenance`
  (tooling's `pr-policy` check reads both). One purpose per PR, reviewable in one sitting (~400 changed
  source lines; tests and lockfiles excluded). Assign `Undefined6799`. Draft until checks are green.
- **Pins.** Exact versions only. GitHub Actions pinned by full commit SHA. Anything from another org repo comes
  as an exact package version, a release asset, or a full commit SHA; a copy of another repo's files needs a
  pin and a check that it still matches. Third-party packages must be ≥7 days old; `@unset-sh/*` are exempt.
- **Runtime: Bun in every repo you touch.** Follow the Bun setup already reviewed in the org (rendering's Bun
  PR `unset-sh/rendering#8` and tooling's `unset-sh/tooling#20`; use what has merged, else copy their
  pattern):
  - `.bun-version` with the exact Bun version (1.4.4 today); no `.nvmrc`, no `engines.node`, no `.npmrc`.
  - `bun.lock` committed; installs are `bun install --frozen-lockfile --ignore-scripts`. With no `bun.lock`
    at all `--frozen-lockfile` installs from `package.json`, so check the file exists first, as tooling does.
  - `bunfig.toml` `[install]`: `exact = true`, `ignoreScripts = true`, `minimumReleaseAge = 604800`, and
    `minimumReleaseAgeExcludes` naming each `@unset-sh` package exactly (Bun takes no scope wildcard). Under
    `[install.scopes]`, `"@unset-sh" = { url = "https://npm.pkg.github.com", token = "$NPM_CONFIG_TOKEN" }`.
    No `trustedDependencies` entry without Alex's approval.
  - Scripts run with `bun`. Tests: `bun test` in backend and deployment. **web uses Vitest run on Bun:
    `bunx --bun vitest`** (plain `bunx vitest` or `bun run test` silently runs it on Node), forks or threads
    pool (not vmThreads/vmForks), and never `bun test` in web (it picks up the Vitest files). Typecheck with
    `tsc` (TypeScript 7.0.2), lint/format with Biome 2.5.15, as the other org repos do.
  - Bun's own docs: read them from a sparse clone of `oven-sh/bun` at the tag you pin (`docs/`) when the web
    pages are unreachable, and cite the path and tag.
- **CI is tooling's.** Every workflow is a thin caller of a tooling reusable workflow pinned by full commit
  SHA; no repo carries its own check, release or image implementation. tooling's Bun check
  (`ci-check.yml`: setup-bun by SHA, the `.bun-version` check, frozen install with a package-read token, then
  `bun run check`) arrives with `unset-sh/tooling#20`. Pin the tooling `main` commit that contains it. If it
  has not merged when you need it, **STOP**: never pin a branch head or an unmerged commit. Keep each repo's
  `branch-policy` caller; add `pr-policy`; give `packages: read` only where `@unset-sh` packages install.
  All org repos are public: GitHub-hosted runners only.
- **Keys and secrets.** You never create, read, copy, place or rotate a private key, a signing key, a
  `BETTER_AUTH_SECRET`, a seal key, a password or a token that can write. Write the exact command for Alex to
  run, read the value only from an env var or a file path he fills, and fail closed when it is missing.
  `.env*` and `secrets/` are git-ignored. Secrets and personal data never appear in code, logs, commits, PRs.
- **Lexicons.** Never change, publish or promote lexicons. Take `sh.unset.profile` as a pinned copy, as
  `unset-sh/profile-recipes` does in `schemas/upstream/` (`source.json` with the commit, path and file hash,
  the upstream MIT `LICENSE`, and a check that fails when the copy differs). Not a `github:` dependency: the
  lexicons package is private and unpublished, and git dependencies have already failed `bun install`'s
  integrity check in this org.
- **The old app.** `github.com/Undefined6799/unset` is a **read-only reference** at commit
  `60228f5e60ead58c359f798519816fc3e8ec3fa4` (verify it exists). Rewrite what you need into the new repo's
  shape, keep its security invariants and tests, and cite the source path and commit in the commit body.
  Never edit that repo or its ADRs. Do not bulk-copy folders. Code that depended on Node behaviour is
  rewritten for Bun, never shimmed.
- **Evidence.** Before relying on how Bun, Elysia, Better Auth, SvelteKit, `@atproto/*`, Postgres or GitHub
  behaves, read its current docs or source for the pinned version and cite URL or path + version in the code
  comment or PR. If the docs are silent, call the behaviour unverified until a test proves it. Everything in
  §3 about Bun and Better Auth comes from reading docs and source, not from running code.
- **Security.** Fail closed. Browsers reach web only; backend has no public port. Every non-GET request web
  accepts passes one CSRF gate (exact `Origin` match). Backend verifies the forwarded session on every call
  itself; the private network is a second layer, never the check. Every query carries a DID predicate for the
  caller. Handle↔DID is verified in both directions; never trust self-asserted DID-doc fields.
  Caller-influenced URLs (handles, DID docs, PDS hosts) go through the egress guard. Web's cookie is host-only
  `__Host-` with `Secure; HttpOnly; Path=/; SameSite=Lax` and no `Domain`. Logs carry only allowlisted
  fields: never a DID, handle, email, IP or token. Escape all output; keep a strict CSP. Never send raw
  `getBlob` URLs to a browser. Never weaken a check to get green.
- **Records.** AI notes, plans and run results go in `unset-sh/agent-kit` under `notes/first-e2e-slice/`
  (artifacts under `artifacts/first-e2e-slice/`), never in the product repos. Human docs go in each repo's
  `docs/`. Never add or edit an ADR in the old app.

## 2. What exists today (verify; do not assume)

| Repo | Default | State on 2026-11-23 | What this slice takes from it |
| --- | --- | --- | --- |
| backend | staging | README, CLAUDE, AGENTS, LICENSE, `branch-policy` caller | everything server-side is new |
| web | staging | the same foundation | everything web-side is new |
| deployment | staging | the same foundation | local environment is new |
| pds | staging | README, LICENSE, `branch-policy` caller | nothing yet (step 11a is optional) |
| lexicons | staging (moving to main + drafts) | schemas, private package `0.0.0` | `lexicons/sh/unset/profile.json`, copied at a pinned commit (`964b52323b109846392f2907adfb379d4f6a5c0f` is staging's head today) |
| brand | staging | `@unset-sh/brand` 0.1.1 on GitHub Packages | `tailwind.css` / `tokens.css`, fonts |
| rendering | staging | `@unset-sh/rendering` 0.1.0; Bun PR #8 open | optional step 11b only if a published version exists |
| tooling | main | reusable workflows; Bun versions in PR #20 | `ci-check.yml` (Bun), `ci-pr-policy.yml` at a merged `main` commit |
| agent-kit | main | rules, records org-0001…0014, skills | your notes and the decision record |
| .github | main | `repos.json`, `MAP.md`, PR template | map update in step 12 |

Pieces of the old app worth reading before you write their new version (paths at `60228f5`):
`infrastructure/net-guard/`, `domains/identity/{resolve-handle,resolve-did,verify-handle,did-doc}.ts`,
`infrastructure/pds/oauth/{oauth-client,identity-resolvers,scopes,sign-in}.ts`,
`infrastructure/session/store.ts`, `shared/http/{headers,returnPath,config}.ts`, `shared/config/`,
`shared/log/`, `deployment/postgres/` (roles, `pg_hba.conf`), and ADRs 0014 (database client), 0021 (OAuth
client), 0023 (local PDS on the shared PLC), 0049 (a session dies with its token set) and 0054 (web's request
gate).

## 3. Architecture of the slice

```
browser ──► web  (SvelteKit on Bun, http://127.0.0.1:8080, the only published port)
              │   holds the __Host- cookie; relays sign-in; CSRF gate; CSP
              ▼   private Compose network, Authorization: Bearer <Better Auth session token>
            backend  (Elysia on Bun, Better Auth + Unset atproto plugin, no published port)
backend ──► Postgres (own schemas; migrate role ≠ runtime role; Better Auth tables in their own schema/role)
backend ──► egress guard ──► handle resolution, PLC/DID docs, the person's PDS (DPoP-bound calls)
web     ──► @unset-sh/brand@0.1.1 (tokens, fonts)    backend ──► sh.unset.profile (pinned copy)
```

- **Only web's server calls backend**, over the private network, forwarding the member's session; browsers
  never reach backend (Alex, 2026-11-23). How web and backend authenticate each other on that network is
  designed later (phase 6, deployment); until then backend's own session check is the control, and the
  local environment publishes no backend port. Say this in `docs/local.md`; do not invent a shared secret.
- **Backend owns** identity, sessions, the OAuth client, the profile operations and the database. Layout
  follows backend's `CLAUDE.md`: product capabilities as domains with their own ports (`identity`,
  `profile`), adapters for Postgres, the PDS, Better Auth and the egress guard, and an Elysia composition
  root. Domains import no framework, no Better Auth and no `@atproto/*` client; a vendor SDK lives in
  exactly one adapter. Add a dependency-cruiser boundary check with the first code.
- **Contract.** Elysia's route schemas (TypeBox, `t.*`) are the source of truth (Alex, 2026-11-23). Every
  route declares its request **and response** schema. Elysia's OpenAPI plugin writes
  `backend/api/openapi.yaml` (YAML, as Alex prefers); `bun run check` regenerates it and fails when the
  committed copy differs, so the required CI check blocks drift. Better Auth's endpoints the slice uses are
  in the same file (its `openAPI()` plugin, merged by hand: the Elysia guide says they do not merge on their
  own).
- **Web's backend client is not decided.** Alex is choosing between (A) Eden Treaty with backend publishing
  its `App` type as a package, and (B) a client generated from `openapi.yaml` and published by backend. The
  plan recommends B (mobile later, language-neutral; Eden's cross-repository use is unofficial and needs
  web on backend's exact Elysia version). Do not pick. Web calls backend only from `*.server.ts` and
  `#lib/server/`, behind a small capability interface of its own, so either client slots in. **STOP**
  before step 9 if Alex has not chosen, and ask him with the recommendation. Validate untrusted responses
  at runtime either way.
- **Better Auth runs in backend only** (Alex, 2026-11-23), mounted with `.mount(auth.handler)`. Its browser
  client is not used. It owns the Unset session (session rows, sign-out, revocation, later TOTP/2FA, backup
  codes, passkeys and the session list). AT Protocol OAuth (PAR, PKCE, DPoP, token refresh) is done by
  `@atproto/oauth-client-node`, wrapped by a small Unset-owned Better Auth plugin `atproto` in backend's
  identity capability. Do **not** use `better-auth-atproto` / `better-auth-bsky` or any community plugin.
- **Sign-in flow, web relaying every step.** (1) Web's form action posts the handle to backend's
  `POST /auth/sign-in/atproto`; the plugin calls `oauthClient.authorize(handle)` and returns the PDS URL; web
  answers 303 to it. (2) The PDS redirects to web's public callback `GET /auth/callback`; web's server passes
  the query to backend's `POST /auth/atproto/callback`. (3) The plugin calls `oauthClient.callback()`, which
  checks the token's `sub` against the issuer, DID document and PDS. Tokens and the DPoP key stay in the OAuth
  client's stores in backend's Postgres, keyed by DID. (4) The plugin finds Better Auth's `account` row with
  `providerId = "atproto"` and `accountId = <DID>`, or creates the user and that row; matching is on the DID
  only, with `account.accountLinking.disableImplicitLinking` on. (5) It creates the session with
  `internalAdapter.createSession` and returns the session token. (6) Web stores the token in its own
  `__Host-` cookie and sends it to backend as `Authorization: Bearer` (Better Auth's bearer plugin). Better
  Auth's own cookies never reach the browser.
- **Email (Alex, 2026-11-23).** Better Auth's `user.email` is required and unique, so it holds a fixed
  address derived from the DID under the reserved `.invalid` domain, which never receives mail and is never
  used to match or contact anyone. Use a hash of the DID, not the DID itself, so the value is not an
  identifier in disguise. The member's real contact email (from the PDS with `account:email`, stored only
  when confirmed, non-unique) comes in a later slice; do not request `account:email` in this one.
- **2FA is not enabled in this slice.** When it is added, the plugin must start Better Auth's pending
  second-factor step itself, because the 2FA plugin only gates the email, username and phone-number sign-in
  paths (better-auth 1.7.27 `plugins/two-factor`). Leave a comment pointing at that, nothing more.
- **Egress on Bun.** The old net-guard is built on undici's `Agent`/`buildConnector`. Bun replaces `undici`
  with its own shim, and its `Agent` hooks did nothing before oven-sh/bun PR 38855, so the old guard would
  silently stop guarding. Rewrite it for Bun: resolve with `node:dns`, check every address, connect to the
  checked address (no DNS-rebinding gap), within the request deadline. Write the refusal tests first and see
  them fail. Hand that `fetch` to `@atproto/oauth-client-node` and to every PDS, DID and handle call.
- **Databases on Bun.** Backend's own tables use `Bun.sql` (tagged templates; a lint rule allows
  `sql.unsafe` only in the migration runner). Better Auth reaches Postgres only through Kysely and detects
  Postgres only through a `pg` pool. Try a small Kysely dialect on `Bun.sql` first and run Better Auth's own
  adapter test suite against it; if it does not pass, use `pg` 8.23.1 for Better Auth's tables only and
  record why. The spike decides; the decision record says which.
- **Better Auth telemetry is off** explicitly in config (`telemetry.enabled: false`); confirm in its source
  for the pinned version that nothing else phones home.
- **OAuth client for local dev:** the atproto loopback client (`http://localhost` client_id, redirect to web's
  `http://127.0.0.1:8080/auth/callback`), which needs no client key. The confidential client with
  `private_key_jwt` that production uses is out of scope (it needs a key only Alex places).
- **Scopes:** `atproto` plus `repo:sh.unset.profile` (granular). Not `include:sh.unset.authFull`: a permission
  set must resolve on the network and our lexicons are not published.
- **Backend operations** (internal, validated with TypeBox, in `openapi.yaml`):
  `POST /auth/sign-in/atproto {handle}` → `{url}`; `POST /auth/atproto/callback {query}` →
  `{sessionToken}`; `GET /me/profile` → `{did, handle, displayName?}` or 401;
  `PUT /me/profile {displayName}` → writes `sh.unset.profile/self` on the caller's PDS, validated against the
  pinned schema (`maxGraphemes 64`, `maxLength 640`); `POST /auth/sign-out` → ends the session and revokes
  the token set; `GET /health` for readiness. Better Auth's own routes keep their mounted paths.
- **Web routes:** `/` (handle form, works without JavaScript), `/auth/callback`, `/profile` (SSR, edit display
  name, sign out), all through web's own request gate (host check, body cap, deadline, one log line) rebuilt
  from the old app's `shared/http` and ADR 0054's outcomes, and its tests passing on Bun. SvelteKit 3: `$lib`
  is gone (use `#lib`), env vars are declared in `src/env.ts` and read from `$app/env/public|private`. Keep
  the official `@sveltejs/adapter-node` output and a small `server.ts`, run with `bun`.
- A session is valid only while its OAuth token set exists (old app ADR 0049): enforce it in the schema
  (foreign key with `ON DELETE CASCADE` from Better Auth's session to the token set, or the reverse link the
  plugin needs) or prove the equivalent with a test.

## 4. Stack pins (newest version at least 7 days old on 2026-11-23; re-check age and docs when you install)

| Package | Pin today | Note |
| --- | --- | --- |
| Bun | 1.4.4 | 1.4.5 (2026-11-19) allowed from 2026-11-26 |
| `oven-sh/setup-bun` | `0c5077e51419868618aeaa5fe8019c62421857d6` (v2.2.0) | only through tooling's workflows |
| `oven/bun` base image | by digest, resolved by you from the registry for 1.4.4 | never invent a digest; non-root |
| `elysia` | 1.4.32 | |
| OpenAPI plugin | 1.4.17 | both `@elysia/openapi` and `@elysiajs/openapi` exist at 1.4.17; use the name Elysia's current docs give |
| `better-auth` | 1.7.25 | 1.7.27 (2026-11-20) allowed from 2026-11-27; the plan's source reading was 1.7.27 |
| `@atproto/oauth-client-node` | 0.5.16 | 0.5.19 (2026-11-20) allowed from 2026-11-27 |
| `@atproto/jwk-jose` | 0.2.4 | |
| `@atproto/oauth-scopes` | 0.5.14 | 0.5.16 allowed from 2026-11-27 |
| `kysely` | 0.29.9 | better-auth 1.7.25 accepts `^0.28.17 \|\| ^0.29.0` |
| `pg` | 8.23.1 | only if the Bun.sql dialect fails (§3) |
| `@sveltejs/kit` | 3.2.0 | 3.4.0 (2026-11-18) allowed from 2026-11-25 |
| `@sveltejs/adapter-node` | 6.0.2 | |
| `svelte` | 5.57.3 | |
| `vitest` | 5.1.0 | run with `bunx --bun vitest` |
| `@types/bun` | 1.4.4 | match the Bun version |
| `typescript` | 7.0.2 | |
| `@biomejs/biome` | 2.5.15 | the org's version |
| `dependency-cruiser` | 18.7.2 | |
| `@unset-sh/brand` | 0.1.1 | exempt from the wait |

Docs to read first: <https://elysiajs.com/integrations/better-auth>, <https://elysiajs.com/quick-start>,
<https://better-auth.com/docs/integrations/elysia>, <https://better-auth.com/docs/plugins/bearer>,
<https://atproto.com/specs/oauth>, <https://atproto.com/specs/permission>, <https://atproto.com/specs/handle>,
<https://atproto.com/specs/did>, Bun's `docs/runtime/bunfig`, `docs/pm/cli/install`, `docs/runtime/sql` and
`docs/test` at the pinned tag.

## 5. Steps (one PR each unless noted; stop at each STOP)

1. **Spike, no PR (≤1 day).** In a scratch folder, prove each of these with a tiny runnable script on Bun 1.4.4
   and write the results, commands and versions to agent-kit `notes/first-e2e-slice/spike.md`:
   a. Elysia 1.4 mounts Better Auth's `auth.handler`, with the bearer plugin, and serves a route.
   b. The `atproto` plugin endpoint creates a user, an `account` row keyed by DID and a session, with the
      fixed `.invalid` email and implicit linking off, and returns a session token that the bearer plugin
      accepts on the next call.
   c. Better Auth's origin and CSRF checks accept a server-to-server call from web carrying a bearer token
      (no browser `Origin`), without turning those checks off for anything else. Record exactly what it needs.
   d. `@atproto/oauth-client-node` completes a loopback sign-in on Bun against a real account, including
      DPoP, a token refresh and revocation, using the egress guard's `fetch`.
   e. The Bun egress guard refuses private, loopback, link-local and reserved addresses, including a name
      that resolves to one, and connects to the address it checked.
   f. A Kysely dialect on `Bun.sql` passes Better Auth's adapter tests against a real Postgres, or `pg` does
      on Bun (§3).
   g. Web's `__Host-` cookie is set and sent on `http://127.0.0.1:8080` in Chrome, Firefox and Safari, served
      by SvelteKit on Bun; SvelteKit's build output runs under `bun`.
   h. Elysia's OpenAPI plugin writes YAML that is byte-stable across two runs, with Better Auth's routes merged.
   i. Better Auth telemetry is off with your config (cite the source file).
   **STOP** and report to Alex if (b), (c), (d), (e) or (g) fails, or anything else forces a security
   compromise. Offer the options you found. Do not pick one yourself, and do not propose running anything on
   Node: Bun replaces Node with no fallback (Alex, 2026-11-23).
2. **agent-kit (main): decision record, status Proposed.** `skills/org-decisions/records/org-NNNN-…md` at the
   next free number (org-0015 on 2026-11-23; org-0014 is the merge record, already accepted; check open
   agent-kit PRs for a number already claimed). Record: Elysia on Bun with TypeBox schemas as the contract
   and a generated `openapi.yaml`; Better Auth in backend only with the Unset `atproto` plugin and the
   `.invalid` email; `@atproto/oauth-client-node` for AT Protocol OAuth; the Bun egress guard; `Bun.sql` and
   whichever Better Auth database path the spike proved; web relaying with a bearer token; the spike
   evidence. Quote Alex's decisions with dates. Follow the `org-decisions` skill format. Alex accepts it;
   later steps may proceed while it is Proposed. Another reviewer merges it (org-0013).
3. **tooling (main), only if needed: Postgres for the check.** tooling's `ci-check.yml` has no service
   container. Backend's tests need a real Postgres. Propose the smallest tooling change (for example an
   optional Postgres image input, pinned by digest, run as a service) through tooling's generator
   (`workflows/shared/…` then `bun run workflows`, never the generated file), with its self-test and
   description. If you would rather start Postgres from backend's own check command, say why in the PR
   instead. tooling's reviewer merges; backend pins the merged commit.
4. **backend: foundation.** `package.json`, `.bun-version`, `bunfig.toml`, `bun.lock`, tsconfig, Biome,
   dependency-cruiser, typed config that fails closed, allowlisted logger, Elysia app with `/health` and the
   generated `api/openapi.yaml` with its drift check, CI callers (tooling's Bun check, `pr-policy`, the
   existing `branch-policy`). Update `CLAUDE.md` "Commands".
5. **backend: Postgres.** `Bun.sql` migration runner and migrations (Better Auth tables in their own schema
   and role + OAuth state/session tables), separate migrate and runtime roles, tests against a real Postgres
   (official image pinned by digest; no mocks of the database).
6. **backend: egress guard and identity.** The Bun egress guard from spike (e) and handle↔DID verification,
   with tests ported from the old app's net-guard and identity tests, failing first.
7. **backend: sign-in and session.** OAuth client with Postgres stores and the guard's `fetch`, the `atproto`
   plugin, the bearer plugin, the sign-in, callback and sign-out operations. Tests: denial without a session,
   a token for one DID never reads another DID's rows, a handle whose DID doc does not point back is
   refused, a signed-out token replayed is refused, the token set row is gone after sign-out, logs hold no
   DID, handle, email or token.
8. **Images: STOP first.** tooling has no shared image workflow, and a new workflow that publishes is a
   permission and publish-behaviour change that tooling's rules give to Alex. Write the proposal (trigger:
   merge to `staging`; permissions `contents: read`, `packages: write`, `id-token: write`,
   `attestations: write`; build, push to `ghcr.io/unset-sh/<repo>` by digest with the workflow's own token,
   `actions/attest`; staging images only, no production tag) and wait for Alex's decision before you write it
   in tooling. Then add backend's Dockerfile (`oven/bun` by digest, non-root) and thin caller.
9. **backend profile operations, then web.** Backend: `GET`/`PUT /me/profile` validating against the pinned
   `sh.unset.profile` copy. Web (once Alex has chosen the client, §3): SvelteKit on Bun with brand 0.1.1
   tokens and fonts, the request gate, the CSRF gate, strict CSP, the three pages, avatar shown as initials
   (no blobs), the client behind web's capability interface, Vitest on Bun, the same image caller as
   `ghcr.io/unset-sh/web`. CI uses tooling's Bun check with `packages: read` for brand. If option A or B
   needs backend to publish a package and backend's staging prerelease channel is not set up, **STOP**: that
   setup is Alex's.
10. **deployment: local environment.** `environments/local/` with Compose: Postgres (pinned digest), the
    backend and web images by the digests steps 8 and 9 published (never `latest`, never an invented digest),
    backend on an internal network only, web on `127.0.0.1:8080`, migrations as a one-shot service, secret
    references only, a Bun `check` (Compose config validates, every image is digest-pinned, no backend port
    is published), and `docs/local.md` with the commands Alex runs to create secrets and start the stack.
11. **Optional, only after step 10 works end to end.**
    a. pds: a Dockerfile that only pins the upstream `ghcr.io/bluesky-social/pds` image by digest, plus the
       image caller; deployment adds it to the local environment. **STOP** before anything needs a PDS admin
       password, invite code, PLC publication or real DNS: those are Alex's.
    b. rendering: only if a published `@unset-sh/rendering` version exists and runs on Bun, add
       `GET /profiles/:did/preview.png` in backend. Do not publish rendering yourself.
12. **.github (main): map.** Update `repos.json` for what backend, web and deployment now use and ship; run
    `bun run map` (or `npm run map` if .github's Bun PR has not merged); commit the regenerated `MAP.md` in
    the same PR.
13. **Run sheet.** Do §6 by hand, record results (no personal data, no tokens) in agent-kit
    `notes/first-e2e-slice/run-<date>.md`, link it from each PR's Validation section.

## 6. Done when

- In backend, web and deployment, from a clean clone at the PR head: `bun install --frozen-lockfile
  --ignore-scripts` and `bun run check` pass locally and in CI on GitHub-hosted runners; `pr-policy` and
  `branch-policy` pass; `openapi.yaml` is fresh.
- After Alex places the secrets, `docs/local.md`'s commands start the stack from published digests, and:
  1. `http://127.0.0.1:8080` → enter a handle → the PDS consent screen → back on `/profile`, showing the
     verified handle and DID and the display name from `sh.unset.profile/self` (or an empty state).
  2. Changing the display name updates the record on the PDS (confirm with a public
     `com.atproto.repo.getRecord`).
  3. Sign out → `/profile` sends you to `/`; replaying the old cookie gets you `/` again and backend answers
     the old token with 401; the token set row is gone.
  4. A `POST` to web with a foreign `Origin` gets 403; backend's `GET /me/profile` without a token gets 401;
     backend is not reachable from the host.
  5. Backend and web logs from the run contain no DID, handle, email, IP or token.
- Every dependency is pinned exactly and is ≥7 days old (or `@unset-sh/*`); every Action is SHA-pinned;
  nothing runs on Node.
- No commit carries an AI trailer; no PR targets `main` in a staged repo; no promotion was opened or merged.

## 7. Out of scope

Messaging/Matrix, modules, feeds, posts, media and blobs (avatars), moderation, admin and pds-admin, invites,
age check, terms and onboarding, the PDS contact email, 2FA/passkeys, indexer/Tap, mobile, any hosted
environment (staging or production), DNS, a confidential OAuth client, web-to-backend network authentication
(phase 6), lexicon changes or publication, promotions to `main`, self-hosted runners, the Proxmox lab, and any
change to `Undefined6799/unset`. If the slice seems to need one of these, **STOP** and ask.

## 8. When you report

Each PR's Validation section lists the commands you ran and what happened, and what you could not verify. At
each STOP, and at the end, write a short summary for Alex: what works, what failed, open questions, PR links.
