# Cursor spike prompt: Cerbos PDP beside a Bun backend

Paste everything below the line into Cursor. Written 2026-11-24 for proposed org-0018. Spike only: no product
code, no PR to a product repository.

---

## Your job

Proposed org-0018 runs the Cerbos PDP as its own process beside backend (Bun 1.4.4, Elysia 1.4.32) and calls it
through a small `Authorizer` port. Some of that only a runtime test can settle. Give Alex evidence; do not choose.

## Rules

The rules of the first-slice prompt still hold (agent-kit `notes/first-e2e-slice/cursor-prompt.md` §1 and §1a):
Bun 1.4.4 only, no Node; exact pins, third-party packages at least 7 days old (so Cerbos 0.57.0, not 0.58.0,
before 2026-11-30); no secrets; cite the docs or source you read with version; say "not run" for anything you did
not run. Never edit `Undefined6799/unset`. Telemetry off everywhere (`CERBOS_NO_TELEMETRY=1` and
`telemetry.disabled: true`); say if anything still calls out (watch the network).

## Set-up

One scratch folder `cerbos-spike/` with its own `package.json` and `bun.lock`, `bunfig.toml` with
`ignoreScripts`, and a `policies/` folder holding the policy and test in org-0018 (`profile` resource, `read` and
`update` for `member` when `ownerDid == principal.id`), plus one deny case and one `visibility` case.

Run the PDP from `ghcr.io/cerbos/cerbos:0.57.0` pinned by digest (record the digest), disk storage, admin API off.

## What to measure

1. **CI binary.** Add `cerbos@0.57.0` as an exact dev dependency. Does `bun install --frozen-lockfile` install
   the platform binary with scripts off? Does `bun run` of `cerbos compile policies` pass, and exit non-zero
   when you break a test? Is the exit status preserved (0.58.0 fixed an `npm exec` case)?
2. **HTTP client on Bun.** `@cerbos/http` 0.30.3 calling `checkResource` / `isAllowed`: over TCP on localhost,
   and over a Unix socket (`httpListenAddr: "unix:/..."`). If the client cannot use a socket, can it be given a
   `fetch` that uses Bun's `unix` option? Correct allow and deny results?
3. **gRPC client on Bun.** `@cerbos/grpc` 0.29.4 on the same calls. Does `@grpc/grpc-js` work on Bun 1.4.4?
4. **Latency.** p50, p95 and p99 of 10,000 sequential and 1,000 concurrent `isAllowed` calls for each working
   transport, with the PDP warm.
5. **Fail closed.** With the PDP stopped, hung (`docker pause`) and returning garbage: what does each client do,
   and how long until it gives up with a 200 ms timeout? Nothing may come back as an allow.
6. **Embedded, for the record only.** Can an `@cerbos/embedded-client` 0.8.4 bundle be built from these policies
   with open-source tools only, no Cerbos Hub account? If not, say so and stop there. If yes, does
   `@cerbos/embedded-server` 0.7.4's WebAssembly load and decide correctly under Bun, and what does it add to
   memory and start-up time?

**STOP** and report if any step needs a Cerbos Hub account, a token, or sending policies outside the machine.

## Report

Write `notes/cerbos-authorization/spike.md` in a local agent-kit branch `cursor/cerbos-spike`: a table of each
point above with the commands, versions, digest and results, and what you could not verify. No recommendation is
needed, but say plainly if a transport failed.

Commit as `Alex <188017560+Undefined6799@users.noreply.github.com>`, no AI or Cursor trailer. You cannot push,
so write the commits as files with `git format-patch origin/main -o /tmp/patches/cerbos-spike/` and tell Alex the
folder, so he can download the `.patch` files and upload them as files (not pasted text).
