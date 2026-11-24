# Two-factor after AT Protocol sign-in: plan for a later step

Not built yet. This is the design that the step after the first e2e slice follows. The evidence is in `spike.md`
and `findings.md` in this folder (Cursor spike, better-auth 1.7.25). Two-factor protects the Unset session. The
member's PDS login is not the second factor.

## Where it lands

- **backend:** Better Auth's `twoFactor()` plugin next to the `atproto` plugin (`src/adapters/auth/`), plus our own
  wrapping routes under `/me/two-factor` and `/auth/sign-in/two-factor`, as `docs/api-conventions.md` requires. Web
  never calls a raw Better Auth route.
- **web:** the pending step's screen, and the cookie relay below.

## Design

1. **Gate the AT Proto callback with the plugin's own after hook.** Better Auth 1.7.25 gates only the three
   credential sign-in paths. Our callback's after hook finds the two-factor after hook whose matcher accepts
   `/sign-in/email`, and calls its handler with `returnHeaders: true`. This is what Better Auth's own test does
   ("trusted device on a custom-gated sign-in path", `two-factor.test.ts` around lines 2968-3000 at `v1.7.25`).
   - Call it from an after hook, never inline in the endpoint. Inlined, the discarded session token stays on the
     response with a live `Max-Age` (findings, "The pending step is their hook").
   - Pin a test that fails if that hook moves, is renamed or stops matching. It runs on every Better Auth upgrade.
   - Not taken: re-implementing the verification rows and signed cookie, or patching `signInPaths`.
2. **Freshness on enable and disable is our check.** The library's enable uses `sessionMiddleware`, and disable uses
   `sensitiveSessionMiddleware`. Neither checks the session's age. Our wrapping routes refuse a session older than
   the fresh window with `403 session_not_fresh`, before calling `auth.api`.
3. **Disabling ends the member's other sessions.** The library's disable replaces only the calling session. Our
   route calls revoke-other-sessions after a successful disable, in the same request, and reports failure if that
   call fails.
4. **`allowPasswordless: true`.** AT Proto accounts have no password, so enable, disable and backup-code
   regeneration take an empty body.
5. **A versioned secret list for the auth secret.** Backup codes and the TOTP secret are encrypted (not hashed)
   under the auth secret. With a plain string secret, rotating it makes every row unreadable. Configure Better
   Auth's versioned `SecretConfig` so the rows carry the `$ba$<version>$` envelope and the secret can rotate. Alex
   places the secret files. Rotation is his.
6. **Web relays the signed `two_factor` value in its own `__Host-` pending cookie.** From the callback's
   `Set-Cookie`, web keeps only the value of the `two_factor` cookie, under the name the response actually used
   (`__Secure-` appears on https). It stores the value in its own `__Host-` cookie (`Path=/; HttpOnly; Secure;
   SameSite=Lax`, no `Domain`). For verify, web's server sends it back as `Cookie:` with `Origin` set to web's
   origin. It never puts a Better Auth cookie on the browser. On success it keeps the returned token and uses
   bearer only. `trustDevice` is not sent until we decide to hold a second signed cookie.
7. **Stay on better-auth 1.7.25 until 1.7.27 clears its 7-day wait on 2026-11-27.** 1.7.26 refuses an expired
   challenge before an OTP is sent or a failure is counted (#12626). Upgrade then, and re-run the hook test.

## Still to prove when it is built

- Account lockout (10 failures across challenges, 15 minutes), and the rate limit (production default on) across
  more than one window.
- A browser storing the `__Host-` pending cookie, and the `__Secure-` name on https.
- The whole flow against a real PDS. That is Alex's consent sign-in check.
