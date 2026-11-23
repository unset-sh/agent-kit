# Review of Cursor's step 1 spike (2026-11-23)

Reviewed from Cursor's summary as Alex pasted it into the project thread. The files (`spike.md`,
`findings.md`, commits 7068170 and 5b74a78 on Cursor's local `cursor/first-e2e-slice-spike-dd02`) were not
pushed, so their text, the scripts and the commit metadata are not verified here.

## Verdict

Good spike. It ran what it could, marked what it did not run, stopped on the failed item as told, and did not
propose Node. Cursor can continue once Alex answers the two decisions below; step 2's decision record then
records them.

| Item | Result | Note |
| --- | --- | --- |
| a | Pass | |
| b | Pass | `.invalid` email from a DID hash, implicit linking off |
| c | Pass | Bearer without Cookie and Origin accepted; Cookie without Origin refused |
| d | Partial | Default `NodeOAuthClient` cannot construct on Bun (`@atproto-labs/fetch-node` needs Node's undici). With our resolver and guard `fetch`, PAR and DPoP worked. Consent, refresh and revocation not run |
| e | Pass, with a gap | Proven against a stub `fetch`; a real TLS connection to the pinned address (SNI and Host kept) is not proven yet |
| f | Split | Bun.sql dialect 358/468 (uuid sent as text); `pg` 468/468 |
| g | Pass except Safari | Safari needs Alex's Mac |
| h | Pass, with a gap | `Bun.YAML.stringify` is not in Bun 1.4.4's docs and is key-order sensitive |
| i | Not fully off | `telemetry.enabled: false` is bypassed when an endpoint and `BETTER_AUTH_TELEMETRY=1` are both set |

## Recommendations

- **d:** use the runtime-neutral base `@atproto/oauth-client` (0.9.3 is ≥7 days old; `oauth-client-node`
  0.5.16 depends on it) with our handle and DID resolvers, our guard `fetch` and the Postgres stores, instead
  of `NodeOAuthClient`. The egress guard becomes the only SSRF layer, which the slice already requires. Then
  Alex does one real consent on his account so Cursor can finish refresh and revocation. Needs Alex's yes.
- **f:** `pg` 8.23.1 with Kysely's `PostgresDialect` for Better Auth's tables only (the plan's fallback);
  `Bun.sql` for backend's own tables, with explicit `::uuid` casts and a test for them. The three e2e suites
  only in Better Auth's repository are not required for the slice. Needs Alex's yes.
- **c:** accept. CSRF needs a credential the browser sends by itself; a bearer token is not one, browsers
  never reach backend, and web enforces the exact Origin. Keep tests for both outcomes and set
  `trustedOrigins` to web's origin only.
- **i:** backend config refuses to start when `BETTER_AUTH_TELEMETRY` or a telemetry endpoint variable is set,
  with a test; keep `enabled: false`. Report the bypass upstream.
- **h:** write YAML with the `yaml` package (2.9.1, pinned) after a canonical key sort, or use
  `Bun.YAML.stringify` only with that sort and a snapshot test, marked unverified. Prefer `yaml`.
- **e:** step 6 must prove the pinned connection with a real TLS endpoint before the guard is trusted.
- **tooling #20:** wait for it to merge on tooling `main` (the Bun tooling thread is doing it), then pin.
- **Reuse conflict:** Cursor was right to follow backend's `CLAUDE.md`. unset-sh/backend#5 and unset-sh/web#5
  change that rule to Alex's 2026-11-23 decision.
- **Push:** Cursor's machine has no GitHub credentials; Alex sets up GitHub access for Cursor or Cursor prints
  `git format-patch` output for another session to apply.
