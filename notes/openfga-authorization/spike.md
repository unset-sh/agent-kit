# OpenFGA spike, 2026-11-24

What was run to back `assessment.md`. Cloud container, Linux amd64, Bun 1.4.4, Postgres 16, no Docker daemon, so
the release binaries ran directly. Files: `artifacts/openfga-authorization/`.

## Setup

- OpenFGA server v1.23.0 from the GitHub release `openfga_1.23.0_linux_amd64.tar.gz`,
  `sha256:06a02dc0034188eb35004aed0a010f41d332e31a6b4db4c75e1d89de05fc1441`, matching the release's
  `checksums.txt`. Built from `d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251` on 2026-11-20. Still inside the 7-day
  wait, used here only as a spike; v1.22.1 (2026-10-28) is the usable release today.
- CLI `fga` v0.9.0, `fga_0.9.0_linux_amd64.tar.gz`,
  `sha256:c09b7e843d7015200b91d6a072c2667d04baa8b1792720700ab7c3f99e23a1e9`, matching `checksums.txt`.
- `@openfga/sdk` 0.9.8 (2026-11-12, Apache-2.0) via `bun add`; it depends on `axios` 1.21.1, `jose`,
  `tiny-async-pool` and `@opentelemetry/api`, and declares `node >=20.19.0`. It ran on Bun unchanged.
- Server: `OPENFGA_DATASTORE_ENGINE=postgres`, `openfga migrate`, then `openfga run` with
  `OPENFGA_AUTHN_METHOD=preshared`, playground off, JSON logs.

## Results

1. **Migration** created `store`, `authorization_model`, `tuple`, `changelog`, `assertion`, `goose_db_version`.
2. **Modular model** (`model/fga.mod`, schema 1.2, five modules including an `extend type profile`) and
   `tests.fga.yaml`: `fga model test` → Tests 5/5, Checks 23/23, ListObjects 1/1 passing. Covers owner/admin/member
   inheritance, an org-defined role editing a document and moderating a community, module grants limited to one
   profile, and a plan entitlement expiring through a CEL condition.
3. **DIDs**: a user `member:did:plc:alice` was refused ("the 'user' field is malformed"); `did%3Aplc%3Aalice`
   passed. Object ids with colons were accepted.
4. **SDK on Bun** (`spike.ts`): wrote the model and tuples, checked, deleted, checked again.
   - Revocation: allowed before the delete, refused immediately after (caching is off by default).
   - Duplicate write fails ("cannot write a tuple which already exists") unless `onDuplicateWrites: "ignore"`;
     a missing delete fails unless `onMissingDeletes: "ignore"` (`del.ts`). Both options work.
   - Unknown relation and a type the model does not allow are refused with validation errors.
   - 2,000 sequential checks over HTTP on loopback: default consistency p50 1.85 ms, p99 3.77 ms;
     `HIGHER_CONSISTENCY` p50 1.72 ms, p99 3.28 ms (no cache, so the same path).
   - `batchCheck` results are keyed by correlation id, not request order.
   - `listObjects` returned the expected document.
5. **Failure** (`down.ts`), server stopped: the SDK threw after 1,959 ms with its default retries, after 3 ms with
   `retryParams: { maxRetry: 0 }`. Never an allow.
6. **Transport**: `openfga run --help` offers only `host:port` addresses for HTTP and gRPC (defaults `0.0.0.0`), no
   Unix socket. Metrics listened on `0.0.0.0:2112`.
7. **Privacy**: with the preshared key, `POST /stores/{id}/read` with an empty body returned every tuple. The
   `changelog` table kept both the write and the delete of a removed member. No retention setting was found in
   v1.23.0's `.config-schema.json` or the docs.
8. **Telemetry**: no phone-home code was found by a source search of v1.23.0 (`telemetry/` holds Grafana and
   collector configs). Not checked with a packet capture.

## Not tested

Docker image and non-root running, TLS, OIDC, load beyond sequential calls, the check cache, ListObjects at scale,
an outbox relay, and anything against a real spaces PDS.
