# Cerbos PDP beside Bun: spike results

Run by Cursor on 2026-11-24 (2026-11-23 23:24–23:29 America/Toronto) from
[`cursor-spike-cerbos.md`](cursor-spike-cerbos.md). Alex pasted the report into the project thread. This is a
summary of it. No product repository was changed. No Cerbos Hub account, token or upload was used. The policy
was org-0018's `profile` policy at agent-kit #46 `8212bc5`.

## Versions

| Piece | Version |
| --- | --- |
| Bun | 1.4.4 (`38afee6c8`) |
| Image | `ghcr.io/cerbos/cerbos:0.57.0`, `sha256:e5e3b150b3cb0090975605254f255164567d67e233634199fb20972e3eaff300` |
| Binary | 0.57.0, commit `43125124efe4b50b83d894635fb2f691e980dc62`, Go 1.27.3 |
| npm | `cerbos` 0.57.0, `@cerbos/http` 0.30.3, `@cerbos/grpc` 0.29.4, `@cerbos/core` 0.33.3, `@cerbos/api` 0.11.3, `@grpc/grpc-js` 1.14.7, `@bufbuild/protobuf` 2.17.0, `protobufjs` 7.6.6, `uuid` 14.0.3 |

Every installed package was older than 7 days.

## Results

| Item | Result |
| --- | --- |
| 1. CI binary | `bun install --frozen-lockfile --ignore-scripts` installed the linux-x64 ELF. `compile` passed 6 tests. A broken test: binary exit 4; the 0.57.0 wrapper exit 1 (`execFileSync`; 0.58.0 uses `process.exit(status)`, not run). `bun run cerbos` and `bunx cerbos` ran `bin.js` on Node because of its `#!/usr/bin/env node`; `bun ./node_modules/cerbos/bin.js` ran on Bun. The blocked `protobufjs` postinstall was not needed. |
| 2. `@cerbos/http` | TCP: correct. `unix:` URL: failed closed (`ENOTFOUND unix`). Over a socket only by replacing `globalThis.fetch` with Bun's `unix` option; the client takes no `fetch`. |
| 3. `@cerbos/grpc` | TCP and Unix socket (`unix:/path`, `tls: false`): correct. |
| 4. Latency | Below. |
| 5. Fail closed | Stopped, paused, garbage: every call errored (2–18 ms, or the 200 ms `AbortSignal` timeout). None allowed; none denied either. |
| 6. Embedded | Not built: the 0.57.0 binary has no bundle command; `@cerbos/embedded-client` loads bundles from Hub. WebAssembly not loaded. |

Telemetry was logged as disabled. Two packet captures (25 s and 12 s) showed no traffic beyond the Docker bridge
and no DNS. The admin API answered 404. The image has no user, so the PDP ran as root; the sockets were created
with mode `0o666` so the host user could connect.

### Latency, warm PDP, milliseconds

| Transport | Run | p50 | p95 | p99 | max |
| --- | --- | --- | --- | --- | --- |
| HTTP TCP | 10,000 sequential | 0.610 | 0.822 | 1.408 | 12.424 |
| gRPC TCP | 10,000 sequential | 0.504 | 0.708 | 1.174 | 6.702 |
| HTTP Unix (replaced fetch) | 10,000 sequential | 0.544 | 0.779 | 1.309 | 10.071 |
| gRPC Unix | 10,000 sequential | 0.425 | 0.663 | 1.015 | 16.699 |
| HTTP TCP | 1,000 at once | 195.1 | 239.0 | 239.5 | 242.6 |
| gRPC TCP | 1,000 at once | 135.5 | 148.6 | 149.6 | 150.7 |
| HTTP Unix | 1,000 at once | 90.5 | 132.7 | 133.1 | 133.7 |
| gRPC Unix | 1,000 at once | 126.1 | 140.1 | 141.5 | 142.4 |

## Not run

Cerbos 0.58.0; the embedded server under Bun; a long traffic capture; a second machine; a non-root PDP.
