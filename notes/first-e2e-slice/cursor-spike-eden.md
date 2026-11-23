# Cursor spike prompt: Eden Treaty across repositories

Paste everything below the line into Cursor. Written 2026-11-23. Spike only: no product code, no PR to a
product repository.

---

## Your job

Alex still has to choose how web calls backend: (A) Eden Treaty, with backend publishing its Elysia `App` type
as a versioned package that web installs, or (B) a client generated from backend's `openapi.yaml` and
published by backend. The plan recommends B (language-neutral, mobile later; Eden's cross-repository use is
unofficial and needs web on backend's exact Elysia version). Your job is to give him evidence, not to choose.

## Rules

The rules of the first-slice prompt still hold (agent-kit `notes/first-e2e-slice/cursor-prompt.md` §1 and §1a):
Bun 1.4.4 only, no Node; exact pins, third-party packages at least 7 days old; no secrets; cite the docs or
source you read with version; say "not run" for anything you did not run. Never edit `Undefined6799/unset`.

## Set-up

Two separate scratch folders, each with its own `package.json` and `bun.lock`, so nothing is shared by a
workspace or a path import:

- `backend-api/`: Elysia 1.4.32 with three routes like the slice's (`GET /me/profile`,
  `PUT /me/profile`, `POST /auth/sign-in/atproto`), TypeBox request **and** response schemas, the OpenAPI
  plugin (`@elysia/openapi` 1.4.17) writing `openapi.yaml` with `yaml` 2.9.1 after a key sort.
- `web-app/`: SvelteKit 3.2.0 on Bun, calling backend only from a `+page.server.ts`.

Publish backend's artefacts to a local registry (Verdaccio or `bun publish` to a local folder registry), never
to GitHub Packages.

## What to measure, for A and for B

1. **A, Eden.** Package backend's `App` type as a bundled `.d.ts` (no source, no runtime code) with Elysia as an
   exact peer dependency. Install it in `web-app` with `@elysia/eden` 1.4.10 and call the three routes.
   Check: are the request, response and error types exact, or do any turn into `any`? What happens when web
   has a different Elysia patch or minor version than backend (try one older and one newer)? Does a renamed
   field in backend break web's typecheck after a package bump? What else leaks into the `.d.ts` (internal
   types, Better Auth types, file paths)?
2. **B, generated client.** Generate a TypeScript client from the same `openapi.yaml` with one established,
   maintained generator (say which and why), publish it the same way, and call the same routes. Check the same
   four things. Add runtime validation of responses and note what it costs.
3. **Both.** Typecheck time in `web-app` (`tsc` cold and warm), package size, what backend's release would
   have to run, and how a breaking change is caught (web's typecheck, and for B also an OpenAPI diff check).
4. TypeScript 7.0.2 and SvelteKit 3.2.0 do not build together (first spike, (g)). Use the same workaround the
   first spike used and say so; do not change the pinned TypeScript.

**STOP** and report if either option needs a security compromise (for example a token in a file, or web
importing backend source).

## Report

Write `notes/web-client-spike/eden-vs-openapi.md` in a local agent-kit branch `cursor/web-client-spike`: a
table comparing A and B on each point above, the commands, versions and results, and what you could not
verify. No recommendation is needed, but say plainly if one option failed.

Commit as `Alex <188017560+Undefined6799@users.noreply.github.com>`, no AI or Cursor trailer. You cannot push,
so write the commits as files with `git format-patch origin/main -o /tmp/patches/web-client-spike/` and tell
Alex the folder, so he can download the `.patch` files and upload them as files (not pasted text).
