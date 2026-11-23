# Review of the first-slice Cursor prompt (2026-11-23)

Alex asked for a review of his Cursor prompt for the first end-to-end slice, and chose "B Bun" when asked
whether the backend runs on Node or Bun. The second draft he sent (backend on Bun, web and everything else on
Node) is the one reviewed here. The revised prompt is [cursor-prompt.md](cursor-prompt.md).

Checked against: agent-kit `main` `b2cd04f` (rules, records org-0001…0014), tooling `main` `ded89d9` and
`unset-sh/tooling#20` head `ce41d95`, rendering `#8` (`claude/project-thread-fqje85`), backend/web/deployment/
pds/lexicons/brand `staging`, profile-recipes `schemas/upstream/`, `.github` PR template, the plan doc, and the
npm registry (versions and publish dates read 2026-11-23). The old app was not read: it is outside this
session's repository access, so commit `60228f5` is unverified.

## What changed and why

| # | Draft said | Revised | Why |
| --- | --- | --- | --- |
| 1 | Backend on Bun; web, deployment and every other repo stay on Node 26.12.0, `npm ci`, `node --test`, `.npmrc` | Bun in every repo; web runs SvelteKit on Bun with `bunx --bun vitest`; `bunfig.toml`, `bun.lock`, `.bun-version` | Alex: "Bun is actually going to be replacing Node", everywhere including web, no Node fallback (plan doc, Decisions). Vitest-on-Bun spike passed 2026-11-23. rendering #8 and tooling #20 already use this exact setup |
| 2 | Caddy edge routes `/api/*` and `/auth/*` straight to backend | Browser reaches web only; web relays sign-in and calls backend over a private network with a bearer token; no backend port | Alex 2026-11-23: only web's server calls backend, forwarding the member session; backend verifies it itself |
| 3 | Edge needed so the cookie stays host-only | Caddy dropped from the slice; web is the single origin | With browsers reaching only web there is nothing for the edge to route. My call, to keep the slice small; strike it if you want the edge kept |
| 4 | "Better Auth's job is the browser session only" | Better Auth runs in backend only, owns the Unset session (later 2FA, backup codes, passkeys, session list); its cookies never reach the browser; web holds its own `__Host-` cookie | Plan doc "Sign-in" section, agreed design |
| 5 | Spike 1b: a placeholder email counts as failure | Fixed DID-derived address under `.invalid`, hashed so it is not the DID in disguise; real contact email deferred | Alex accepted the `.invalid` email on 2026-11-23. Deferring the `account:email` contact email (and not asking for the scope) is my call: it stores personal data and needs an erasure path the slice does not have |
| 6 | Web uses "a small hand-written client" | Client choice left open (Eden Treaty vs generated from `openapi.yaml`); STOP before web if undecided; capability interface in web either way | Alex has not decided; the plan recommends the generated client |
| 7 | "described by `@elysia/openapi`" | Route schemas are the source of truth; `backend/api/openapi.yaml` generated, drift fails `bun run check`; response schema on every route | Alex 2026-11-23 (YAML preferred, CI blocks drift) |
| 8 | Step 3 adds Bun to tooling's `ci-check.yml` | Removed; pin the merged tooling commit that contains #20, STOP if it has not merged | tooling #20 already makes `ci-check.yml` Bun-only (setup-bun by SHA, version check, frozen install) |
| 9 | Pin tooling `ded89d9`; rules "at `86da84a`" | Read rules at current `main`; pin a merged tooling commit with Bun | `ded89d9` is Node-based; agent-kit `main` is now `b2cd04f` (org-0014 landed) |
| 10 | "You never merge"; done-when "nothing was merged by you" | Merge own checked PRs into `staging` (org-0014); tooling/.github wait for review (their CLAUDE.md); agent-kit by another reviewer (org-0013); docs Alex only | org-0014 accepted 2026-11-23. Image digests only exist after a merge to `staging`, so "never merge" would block step 10. Strike this if you want Cursor kept to drafts |
| 11 | Next record number; "org-0014 is reserved for the modules work" | org-0015 today, check open PRs | org-0014 is the accepted merge record |
| 12 | Lexicons as `github:unset-sh/lexicons#964b523` | Pinned copy with `source.json`, hash check and MIT notice, as profile-recipes does | Lexicons package is private `0.0.0`; org rule allows a copy with pin + check; git deps already failed `bun install` integrity in rendering |
| 13 | `kysely` + `pg` for Better Auth | `Bun.sql` for backend's tables; try a Kysely dialect on `Bun.sql` against Better Auth's adapter tests, else `pg` for its tables only | Plan doc: Better Auth detects Postgres only through a `pg` pool; `Bun.sql` replaces `pg` elsewhere |
| 14 | Egress rewrite "so the address it checks is the address it connects to" | Kept, with the cause (Bun's undici shim, PR 38855) and refusal tests first | Plan doc research; unchanged intent |
| 15 | Image workflow written in each repo | STOP and propose a tooling shared image workflow; Alex decides permissions and trigger | CI is tooling-centric (Alex); tooling's rules give publish and permission changes to Alex |
| 16 | Postgres "as a CI service" | tooling change for a Postgres service, or justify a self-started one | `ci-check.yml` has no service container |
| 17 | `minimumReleaseAge = "7d"`, `bun ci` | `minimumReleaseAge = 604800`, `bun install --frozen-lockfile --ignore-scripts` with a `bun.lock` existence check | Matches the reviewed rendering #8 and tooling #20 text, and tooling's note on `--frozen-lockfile` without a lockfile |
| 18 | Spike: cookie as Better Auth's | Spike: web's cookie on SvelteKit-on-Bun; added Better Auth origin check for server-to-server calls, OpenAPI YAML stability, bearer plugin | These are the new risks the relay design brings (plan doc "What the spikes must prove") |
| 19 | Fallback option "run the backend on Node after all" | Removed | No Node fallback (Alex) |
| 20 | 2FA not mentioned | Not enabled; comment that the plugin must start the pending step | better-auth 1.7.27 2FA only gates email/username/phone sign-ins (plan doc) |
| 21 | Pin list | Table with today's pins and the date each newer version becomes allowed | Registry read 2026-11-23, see below |

Smaller fixes: profile-recipes listed as a staged repo; lexicons' move to `main` + `drafts` noted; `email` added
to the never-logged list; display name limits taken from the schema (`maxGraphemes 64`, `maxLength 640`);
ADRs 0014 and 0054 added to the reading list; "web-to-backend network authentication" listed as out of scope
(phase 6, Alex).

## Pins checked (npm registry, 2026-11-23; 7-day line is 2026-11-16)

| Package | Latest (date) | Newest ≥7 days |
| --- | --- | --- |
| elysia | 1.4.32 (11-11) | 1.4.32 |
| @elysia/openapi, @elysiajs/openapi | 1.4.17 (11-04) | 1.4.17 |
| better-auth | 1.7.27 (11-20) | 1.7.25 |
| @atproto/oauth-client-node | 0.5.19 (11-20) | 0.5.16 |
| @atproto/oauth-scopes | 0.5.16 (11-20) | 0.5.14 |
| @atproto/jwk-jose | 0.2.4 (07-07) | 0.2.4 |
| kysely | 0.29.9 (11-12) | 0.29.9 |
| pg | 8.23.1 (09-30) | 8.23.1 |
| @sveltejs/kit | 3.4.0 (11-18) | 3.2.0 |
| @sveltejs/adapter-node | 6.0.5 (11-18) | 6.0.2 |
| svelte | 5.59.1 (11-20) | 5.57.3 |
| vitest | 5.1.1 (11-18) | 5.1.0 |
| @types/bun | 1.4.5 (11-20) | 1.4.4 |
| dependency-cruiser | 18.9.0 (11-22) | 18.7.2 |

The draft's `@elysia/node` is not needed on Bun and was already gone from the second draft.

## Open for Alex

- Eden Treaty or generated client: the prompt stops before web until you choose.
- Whether Cursor may merge its own checked PRs into `staging` (row 10) and whether to drop the edge (row 3).
- The image workflow's permissions and trigger (step 8 stops for you).
- tooling #20 still targets `staging`, but tooling now works on `main` alone (#21 merged): it needs retargeting
  before it can merge, and the slice's CI waits on it.
