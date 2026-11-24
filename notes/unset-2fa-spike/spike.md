# Unset two-factor after AT Protocol: spike

Status: the seven proofs ran. No product repository was changed. No organisation decision was opened. `notes/first-e2e-slice/cursor-prompt.md` is not in this repository (absent on `main` at `9c4661b4e24acc9a422533fece64bb223874189b`). The runtime rules used here are the ones in that prompt's place: this spike's own instructions, and the runtime notes in `notes/first-e2e-slice/spike.md`.

Two-factor protects the Unset session. The member's PDS login is not the second factor. The callback in this spike takes a synthetic `did:plc` and never talks to a PDS.

## Runtime

| Piece | Version |
| --- | --- |
| Bun | 1.4.4, revision `1.4.4+38afee6c8` (docs tag `bun-v1.4.4`) |
| PostgreSQL | 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), database `spike_2fa`, role `ubuntu`, peer auth on the unix socket, no password |
| better-auth | 1.7.25, published 2026-11-14, tag `v1.7.25` commit `3fa26c979160914ce8e1c0e8786b1f48aa2552e5` |
| `@better-auth/utils` | 0.5.1, published 2026-10-24 |
| `@better-auth/core` | 1.7.25, published 2026-11-14 (dependency of better-auth) |
| `better-call` | 1.4.5, published 2026-11-03 (dependency of better-auth) |
| `@noble/ciphers` | 2.2.0, published 2026-04-11 (dependency of better-auth) |
| Kysely | 0.29.9, published 2026-11-12 |
| `pg` | 8.23.1, published 2026-09-30 |
| zod | 4.6.7, published 2026-10-12 |

Ages were checked against 2026-11-16Z. better-auth 1.7.26 was published 2026-11-18 and 1.7.27 on 2026-11-20. Neither was installed. 1.7.27's two-factor sources were read at tag commit `9faf6f6a1155a6cdaf8ba2d25ce53e4f5a3fda72` and were not executed. `NODE_ENV=development`. `TEST` was unset. The proof was `bun prove.ts`, not `bun test`, so `isTest()` stayed false (`@better-auth/core` `dist/env/env-impl.mjs`, same rule as the first spike). No `BETTER_AUTH_SECRET` was set. The library's development fallback stayed inside the installed package and is not copied here. `create-context.ts` lines 176-189 at tag `v1.7.25`: an empty secret becomes `DEFAULT_SECRET` from `src/utils/constants.ts`.

Database option: Kysely `PostgresDialect` around a `pg` `Pool` on `/var/run/postgresql`, passed as `{ dialect, type: "postgres" }`. That is the shape `getMigrations` accepts in `src/db/get-migration.ts` and `createKyselyAdapter` in `packages/kysely-adapter/src/dialect.ts` (`"dialect" in db`, then `new Kysely({ dialect })`). Migrations came from `better-auth/db/migration` `getMigrations`.

Spike tree: `/agent/repos/agent-kit/notes/unset-2fa-spike`. Command, from that directory:

```sh
export PATH="$HOME/.bun/bin:$PATH"
bun install
NODE_ENV=development bun prove.ts
```

Exit 0. The JSON below is the redacted summary the script printed. It does not contain a DID, a TOTP secret, a code, a backup code, a session token, or a cookie value.

## Results

| Item | Result |
| --- | --- |
| 1. How the pending step starts, and what verify needs | Read at 1.7.25 and observed on `/sign-in` replacement. 1.7.27 runtime not run |
| 2. `atproto` callback with 2FA returns no session; without 2FA it does | Pass |
| 3. Correct TOTP, wrong TOTP, expiry, lockout | Pass |
| 4. Backup codes | Pass |
| 5. What web must forward | Pass as a server-to-server header relay. Browser storage of the `__Host-` cookie was not run |
| 6. Fresh session, and other sessions on disable | Enable and disable do not require a fresh session. Disable does not end other sessions |
| 7. Logs | Pass at logger level `debug` |

### 1. How 1.7.25 starts the pending step

Source: `packages/better-auth/src/plugins/two-factor/` at tag `v1.7.25`.

`signInPaths` is only `/sign-in/email`, `/sign-in/username`, and `/sign-in/phone-number` (`index.ts` lines 55-59). `shouldRequireTwoFactor` returns false for every other path (lines 184-189) and is marked `@internal`. The after-hook matcher uses the same set (line 545). Docs at that tag, `docs/content/docs/plugins/2fa.mdx` lines 136-138: non-credential sign-in (OAuth, email OTP, magic link, passkey, anonymous) is not gated unless the app adds its own hook.

On a gated sign-in, when `newSession.user.twoFactorEnabled` is true and the trust-device cookie does not validate, the hook (`index.ts` lines 596-671):

1. Expires the session cookie the credential handler just set (`deleteSessionCookie`) and deletes that session row.
2. Sets `newSession` to null.
3. Writes a verification row: identifier `2fa-` plus 20 random characters, value the user id, `expiresAt` now plus `twoFactorCookieMaxAge` (default `10 * 60` seconds, line 610).
4. Writes a second row: identifier `2fa-attempts-` plus that same identifier, value `"0"`, same expiry. `verify-two-factor.ts` `beginAttempt` consumes it as the race gate. `DEFAULT_TWO_FACTOR_ALLOWED_ATTEMPTS` is 5 (`constant.ts` line 6).
5. Sets a signed cookie whose name is `createAuthCookie("two_factor")` (`constant.ts` line 1). The signed value is the identifier, not the user id.
6. Returns `{ twoFactorRedirect: true, twoFactorMethods }`. `totp` is included only when a `twoFactor` row exists and `verified !== false`.

Observed on the atproto callback after the hook ran: `better-auth.two_factor` with `Max-Age=600; Path=/; HttpOnly; SameSite=Lax`, no `Domain`, no `Secure` (base URL is `http://127.0.0.1:8080`, so `createCookieGetter` in `src/cookies/index.ts` lines 66-76 does not set the secure prefix). Lifetime read from the verification row was 600 seconds. The attempts row's value was `"0"`. `twoFactorMethods` was `["totp"]`.

`POST /two-factor/verify-totp` body is `{ code, trustDevice? }` (`totp/index.ts`). `POST /two-factor/verify-backup-code` body is `{ code, disableSession?, trustDevice? }` (`backup-codes/index.ts`). Neither route takes a session. `verifyTwoFactor` (`verify-two-factor.ts`) reads the signed `two_factor` cookie, loads the verification row, and loads the user from `verification.value`. A correct code calls `consumeVerificationValue` on that identifier and only then `createSession`. An expired row makes `consumeVerificationValue` return null (`internal-adapter.ts` lines 1618-1621: the row is deleted and null is returned). A missing or bad cookie is `INVALID_TWO_FACTOR_COOKIE`.

Difference from 1.7.27, source only, not run: `index.ts` is identical. `verify-two-factor.ts` adds an `expiresAt` check when the challenge row is first read, so an expired challenge is `INVALID_TWO_FACTOR_COOKIE` before an OTP is sent and before a failure is counted. Changelog 1.7.26, `#12626`. The 1.7.27 security test adds "sends no OTP for an expired challenge". On 1.7.25 the TOTP path in this spike still refused an expired challenge (see item 3), because `beginAttempt` consumes the attempts row and that consume already treats an expired row as null.

### 2. atproto callback

The plugin is `notes/unset-2fa-spike/prove.ts`. `POST /api/auth/atproto/callback` takes `{ did }` matching `did:plc:` plus 24 characters from `a-z2-7`. Email is the SHA-256 hex of that DID plus `@user.invalid`. Account `providerId` is `atproto`, `accountId` is the DID. `account.accountLinking.disableImplicitLinking` is true. No password is stored.

The endpoint creates a session and calls `setSessionCookie` (`better-auth/cookies`). An after hook on `/atproto/callback` then does what `two-factor.test.ts` lines 2968-3000 do for email OTP: find the two-factor after hook whose matcher accepts `{ path: "/sign-in/email" }`, call that handler with `returnHeaders: true`, copy `Set-Cookie`, and if the body has `twoFactorRedirect` return that body instead. The handler itself does not check `signInPaths`. The matcher does. Calling the handler is what their test does.

A member without 2FA: status 200, a token, one session row, `GET /api/auth/get-session` with `Authorization: Bearer` and no cookie accepted (the `bearer()` plugin is registered).

A member with 2FA enabled and a verified TOTP row: status 200, body `{ twoFactorRedirect: true, twoFactorMethods: ["totp"] }`, no `token`. Session count for that user did not change (the row the callback had just inserted was deleted). `Set-Cookie` was:

- `better-auth.session_token` `Max-Age=0`
- `better-auth.session_data` `Max-Age=0`
- `better-auth.two_factor` `Max-Age=600`

`get-session` with the expired session cookie returned no session.

An earlier run of this script invoked that same handler inside the endpoint, before returning, instead of from the after hook. That response still carried a `better-auth.session_token` with `Max-Age=604800` ahead of the `Max-Age=0` entry. `get-session` with that cookie also returned no session (the row was already deleted). `deleteSessionCookie` only scrubs the header lists it can see (`cookies/index.ts` `removeSetCookieEntries`, lines 429-460). The after-hook placement is the one their test uses, and it is the one `prove.ts` runs now.

### 3. TOTP, expiry, lockout

Wrong code: 401, session count unchanged. Correct code on the same cookie: 200, a token, bearer `get-session` accepted. `trustDevice` was not sent.

Expiry: a second auth instance with `twoFactorCookieMaxAge: 1`. After 1.5 seconds a correct code returned 401 `INVALID_TWO_FACTOR_COOKIE` and did not add a session.

Challenge lockout, rate limit left at the development default (off): five wrong codes returned 401, 401, 401, 401, 401. The next request, carrying the correct code, returned 400 `TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE` and did not add a session. That matches `beginAttempt`: the counter starts at `"0"`, five failures raise it to 5, and the following attempt sees `attempts >= 5`, consumes the challenge, and expires the cookie (`verify-two-factor.ts`).

Account lockout was not run. `constant.ts` lines 8-10: default 10 failed verifications across challenges, lock for `15 * 60` seconds, enabled unless `accountLockout.enabled` is false. `recordTwoFactorFailure` increments `twoFactor.failedVerificationCount`.

Rate limit, a separate instance with `rateLimit.enabled: true`, after an 11 second pause so the window was empty: wrong codes returned 401, 401, 401, 429. The plugin's own limit is window 10, max 3, on every path starting with `/two-factor/` (`index.ts` lines 685-692). `create-context.ts` line 359: `enabled` defaults to `NODE_ENV === "production"`. With the default off, five attempts fit in one burst. With it on, the fourth `/two-factor/` call in the window is 429 before the fifth failure can be recorded. The attempts row lives until the challenge expires, so the five can still add up across windows. That interaction past the first 429 was not run.

### 4. Backup codes

`enable` with `allowPasswordless: true` and an empty body returned `method: "totp"`, a `totpURI`, and 10 codes. Enrollment `verify-totp` on the session cookie set `twoFactorEnabled`. Codes are `generateRandomString` of length 10 from `a-z`, `0-9`, `A-Z`, shown as `xxxxx-xxxxx` (`backup-codes/index.ts` `generateBackupCodesFn`). Default `storeBackupCodes` is `"encrypted"` (`index.ts` line 128).

The `twoFactor.backupCodes` column was hex, not the `$ba$` envelope, and did not contain a plaintext code. `symmetricDecrypt` with `secretConfig` returned the same ten codes. `src/crypto/index.ts` lines 40-67: a string key is SHA-256'd and used as an XChaCha20-Poly1305 key (`managedNonce` from `@noble/ciphers` 2.2.0); the ciphertext is hex. The `$ba$<version>$` envelope is used only when the key is a versioned `SecretConfig`. This process had the development string, so the column is hex. The TOTP secret is encrypted with the same function (`index.ts` around line 358) and stored in `twoFactor.secret`. Neither column is a hash. Anyone who can read the table and the auth secret can decrypt both.

One code on a pending cookie: 200. The same code on a new pending cookie: 401 `INVALID_BACKUP_CODE`. A second unused code: 200. `POST /two-factor/generate-backup-codes` with the session and an empty body: 200 and a new set. An old code then: 401. A new code: 200. The column was hex again after that. `verifyBackupCode` removes the matched code and `incrementOne` writes the re-encoded remainder only when the stored ciphertext is still the one just read, so two racing uses of the same snapshot conflict.

### 5. What web must forward

Web does not give the browser a Better Auth cookie. For the pending step it keeps the signed `two_factor` value and sends it server to server.

From the callback response, take the `Set-Cookie` whose name is `better-auth.two_factor` and keep the value (the signed identifier). Ignore `better-auth.session_token` and `better-auth.session_data` on that response; in the after-hook run both were `Max-Age=0` and the session cookie did not authenticate. Store the signed value in web's own `__Host-` cookie. The script built `__Host-unset-pending=<signed value>; Path=/; HttpOnly; Secure; SameSite=Lax` and checked that the string has no `Domain`. The name is web's. A browser was not asked to store it. The first spike already stored a different `__Host-` cookie on `http://127.0.0.1:8080` in Chrome and Firefox. That check was not repeated.

The next call, from web's server:

```http
POST /api/auth/two-factor/verify-totp
Origin: http://127.0.0.1:8080
Content-Type: application/json
Cookie: better-auth.two_factor=<signed value>

{"code":"<six digits>"}
```

Backup codes are the same request with path `/api/auth/two-factor/verify-backup-code` and the backup code as `code`. Do not send `trustDevice` unless web is ready to hold a second signed cookie, `better-auth.trust_device`. This spike did not.

`Origin` is required because the request has a `Cookie` header. `validateOrigin` (`src/api/middlewares/origin-check.ts` lines 231 and 247) checks the origin when `headers.has("cookie")` and `forceValidate` is false. Observed: cookie and no origin, 403 `MISSING_OR_NULL_ORIGIN`; cookie and `Origin: https://evil.example`, 403 `INVALID_ORIGIN`; cookie and `Origin` equal to `baseURL` / `trustedOrigins`, 200 and a token. `trustedOrigins` in this process was only `http://127.0.0.1:8080`.

On 200, the JSON `token` is the session token. `Set-Cookie` will also carry `better-auth.session_token`. Web keeps the token and later sends `Authorization: Bearer`, with no `Cookie`, which is the call the first spike already showed is not origin-checked. Web does not put the Better Auth cookies on the browser.

If `baseURL` is `https` or `advanced.useSecureCookies` is true, `createCookieGetter` prefixes `__Secure-` and the cookie name becomes `__Secure-better-auth.two_factor`. This run did not use https. Web has to forward the name the response actually set.

### 6. Enabling, disabling, other sessions

`POST /two-factor/enable` uses `sessionMiddleware` (`index.ts` line 225), not `freshSessionMiddleware`. `POST /two-factor/disable` uses `sensitiveSessionMiddleware` (line 434), which re-reads the session from the database (`session.ts` lines 567-577) and does not look at `session.freshAge`. `freshSessionMiddleware` (lines 604-617) rejects a session whose `createdAt` is older than `freshAge` (default 86400 seconds, `create-context.ts` lines 317-320) with 403 `SESSION_NOT_FRESH`. `GET /list-sessions` uses that middleware.

A session whose `createdAt` was set two days back: `enable` returned 200, and `list-sessions` with the same cookie returned 403 `SESSION_NOT_FRESH`. `disable`, also on a session backdated two days, returned 200. So neither enable nor disable requires a fresh session. The fresh check exists and was not wired to them.

`disable` deletes the calling session and inserts a replacement (`index.ts` around the `createSession` / `deleteSession` pair in that handler). It does not call `deleteUserSessions`. Observed: two live sessions, disable from one, count stayed 2, the caller's old cookie no longer authenticated, the other session's bearer token still did. `POST /revoke-sessions` and `POST /revoke-other-sessions` (`session.ts`) do delete the other rows. `disable` does not call them.

`shouldRequirePassword` (`src/utils/password.ts` lines 112-124) returns true whenever `allowPasswordless` is not set, including when the user has no credential account. This spike's atproto users have no password. With `allowPasswordless: true`, enable, disable, and `generate-backup-codes` accepted an empty body. A second instance with `allowPasswordless` left false: empty body was 400 `VALIDATION_ERROR` (the schema requires `password`); body `{ password: "not-a-password" }` was 400 `INVALID_PASSWORD`.

### 7. Logs

The auth logger was level `debug` and every line was kept, and `console.log`, `info`, `warn`, `error`, and `debug` were captured. The scan's haystack included the development fallback secret, both DIDs, TOTP secrets, TOTP codes, backup codes, session tokens, signed `two_factor` values, and verification identifiers. None of those strings appeared.

What did appear: two debug lines naming the Postgres schema and the five table names; one error and one info line for `Origin: https://evil.example` (the info line repeats `trustedOrigins`); and two console lines, `Missing or null Origin` and `Invalid origin`. No member value was in them.

## Not run

- better-auth 1.7.26 and 1.7.27 as a process. Source diff only, above.
- Account lockout (10 failures, 15 minutes).
- Email OTP as a second factor (`otpOptions.sendOTP` was not set).
- `trustDevice: true`. Their test at `two-factor.test.ts` lines 3027-3075 covers the trusted-device renewal on a custom path. This script did not send the flag.
- A real AT Protocol account, a consent screen, or a PDS. The callback is a synthetic DID.
- A browser accepting the `__Host-` cookie. The relay was headers.
- https, so the `__Secure-` cookie prefix was not observed.
- `BETTER_AUTH_SECRET` was not set, and the fallback string was not printed.
