# Cursor spike prompt: Unset two-factor sign-in after AT Protocol

Paste everything below the line into Cursor. Written 2026-11-23. Spike only: no product code, no PR to a
product repository.

---

## Your job

Alex, 2026-11-23: "2fa will be for our app rather than for atproto sign-in." Two-factor protects the **Unset
session**, not the member's PDS login. A member signs in with AT Protocol through our Better Auth `atproto`
plugin; if they turned on 2FA in Unset, they get no Unset session until they pass a TOTP code or a backup code.

The known gap: Better Auth's `twoFactor` plugin only intercepts its own sign-in paths (email, username, phone
number; read for 1.7.27 in `plugins/two-factor`). An AT Protocol sign-in would skip it unless our plugin starts
the pending second-factor step itself. Prove whether that works and how.

## Rules

The rules of the first-slice prompt still hold (agent-kit `notes/first-e2e-slice/cursor-prompt.md` §1 and §1a):
Bun 1.4.4 only; exact pins, at least 7 days old (`better-auth` 1.7.25, not 1.7.27 before 2026-11-27); cite
source with version; say "not run" for what you did not run. No real secrets: use Better Auth's development
fallback as in the first spike, never write a `BETTER_AUTH_SECRET`, and use only throwaway TOTP secrets that
exist inside a test run. No real AT Protocol account: stub the OAuth callback with a synthetic DID, as spike
(b) did. Postgres through `pg` 8.23.1 and Kysely 0.29.9 `PostgresDialect` (org-0015).

## Prove, with a small runnable test each

1. Reading the `twoFactor` source at 1.7.25: how it starts the pending step (verification record, signed
   `two_factor` cookie, its lifetime) and what `/two-factor/verify-totp` and `/two-factor/verify-backup-code`
   need. Note any difference from 1.7.27.
2. Our `atproto` plugin, for a member with 2FA enabled, starts that same pending step after the callback and
   returns **no session**. A member without 2FA still gets a session.
3. A correct TOTP code then gives a session; a wrong code does not; the pending step expires after its window;
   the lockout after repeated wrong codes works.
4. Backup codes: generated once, each works once, a used one is refused, regenerating invalidates the old set,
   and they are stored encrypted or hashed (cite where).
5. Web relays it: web holds the pending `two_factor` value inside its own `__Host-` cookie and sends it to
   backend server to server, so the browser never talks to backend. Say exactly what web must forward.
6. Enabling and disabling 2FA require a fresh session, and disabling ends the member's other sessions or says
   why not.
7. Nothing in logs: no DID, TOTP secret, code, backup code or token.

**STOP** and report if (2) or (3) can only be done by disabling a Better Auth check, patching Better Auth, or
relying on an undocumented internal that a patch release could change without a test catching it. Offer the
options you found; do not choose.

## Report

Write `notes/unset-2fa-spike/spike.md` (and `findings.md` for weak spots) in a local agent-kit branch
`cursor/unset-2fa-spike`: commands, versions, results per item, and what you could not verify.

Commit as `Alex <188017560+Undefined6799@users.noreply.github.com>`, no AI or Cursor trailer. You cannot push,
so write the commits as files with `git format-patch origin/main -o /tmp/patches/unset-2fa-spike/` and tell
Alex the folder, so he can download the `.patch` files and upload them as files (not pasted text).
