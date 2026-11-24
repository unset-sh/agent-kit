# Unset two-factor spike: findings

The proofs are in `notes/unset-2fa-spike/spike.md`. This file is the weak spots. Nothing here is a product decision.

## The pending step is their hook, not a named function

Items 2 and 3 did run, without a patch and without turning a check off. The atproto after hook calls the two-factor after handler. That is the call in `two-factor.test.ts` at tag `v1.7.25`, the test named "trusted device on a custom-gated sign-in path" (about lines 2968-3000): `getPlugin("two-factor").hooks.after`, find the hook whose matcher accepts path `/sign-in/email`, call `handler` with `returnHeaders: true`. The docs (`docs/content/docs/plugins/2fa.mdx` lines 136-138) say to add a hook for other sign-in methods and do not show this call. `shouldRequireTwoFactor` is `@internal` and returns false unless the path is one of the three credential paths, so calling it does not start the step. The handler itself does not re-check the path.

Their test would fail if that hook disappeared or stopped honouring a trusted device on a foreign path. It would not fail if the only change was a cookie prefix or the `2fa-` identifier shape, but the verify tests would, because they go through the same handler. A patch release can still move the hook. `prove.ts` is the check that would catch that at this pin.

Options that were read and not taken:

1. The call above. This is the one `prove.ts` runs, because it is the one their test runs.
2. Re-implement the verification rows and the signed cookie in our plugin. `verify-totp` would keep working only while the identifier prefix, the attempts row, the cookie name, and the signature input stay the same. Their tests would not compile against our copy.
3. A public "start challenge" endpoint. There is not one in 1.7.25. The endpoints are enable, disable, verify, get URI, and backup codes.
4. Add `/atproto/callback` to `signInPaths`. That is a patch of Better Auth. It was not done.

No choice is recorded past "the proof used option 1".

Calling the handler inside the endpoint, instead of from an after hook, left the discarded session token on the response as `better-auth.session_token` with `Max-Age=604800`, followed by `Max-Age=0`. `get-session` with that first cookie returned nothing, because the row was already deleted. `deleteSessionCookie` scrubs only the header lists on the context it is given (`cookies/index.ts` `removeSetCookieEntries`). The after-hook placement scrubbed the live cookie. The final script uses the after hook. A later edit that inlines the call brings the discarded token back onto the wire.

## Freshness and the other sessions

Enable and disable do not require a fresh session. A session with `createdAt` two days ago, past the default `freshAge` of 86400 seconds, got 200 from both. The same cookie got 403 `SESSION_NOT_FRESH` from `GET /list-sessions`, which uses `freshSessionMiddleware`. Enable uses `sessionMiddleware`. Disable uses `sensitiveSessionMiddleware`, a database re-read, not an age check. Wiring freshness onto enable and disable would be our check, or a wrapper. The library does not do it.

Disable does not end the member's other sessions. It deletes the calling row and inserts a replacement. Observed: the caller's old cookie died, the other session's bearer token still worked, the row count stayed 2. `POST /revoke-sessions` and `POST /revoke-other-sessions` would end the others. Disable does not call them. There is no flag on disable to ask it to.

## Passwordless

An atproto account has no credential password. With `allowPasswordless` left unset, enable rejected an empty body as `VALIDATION_ERROR` and a made-up password as `INVALID_PASSWORD` (`shouldRequirePassword` returns true whenever the flag is off, even if no credential row exists). The proofs that enabled 2FA set `allowPasswordless: true`. With the flag on, a user who does have a password is still asked for it. Our users do not.

## Encryption, not a hash

Backup codes and the TOTP secret are XChaCha20-Poly1305 under SHA-256 of the auth secret (`src/crypto/index.ts` `rawEncrypt`), stored as hex when the secret is a string. The `$ba$` version envelope is only used for a versioned secret list. This process used the development string, and the column was hex. `symmetricDecrypt` returned the original codes. A database read plus the auth secret reveals every code and the TOTP secret. Rotating the secret without a versioned key list makes the rows unreadable. The codes are not independently hashed, so a leak of the table is a leak of the codes once the secret is known.

## Rate limit in front of the lockout

The challenge allows five wrong codes, then `TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE`, and that was observed with rate limiting off (the development default). With `rateLimit.enabled: true`, which is the production default, the fourth `POST /two-factor/*` in a 10 second window was 429. The fifth failure was not reached inside that window. The attempts row lasts as long as the challenge (10 minutes by default), so a later window can still finish the five. That second window was not run. Account lockout, 10 failures and 15 minutes across challenges (`constant.ts`), was not run.

## Cookie name follows the base URL

On `http://127.0.0.1:8080` the cookie was `better-auth.two_factor`, not `__Secure-` and not `__Host-`. `createCookieGetter` adds `__Secure-` when the base URL is https or `useSecureCookies` is set. Web has to forward the name on the `Set-Cookie` it received, as `Cookie: <that name>=<signed value>`, plus `Origin` set to web's origin. A cookie with no origin was 403 `MISSING_OR_NULL_ORIGIN`. A cookie with `https://evil.example` was 403 `INVALID_ORIGIN`, and that origin string was written to the log. The signed value is what must be stored. The raw `2fa-…` identifier is not enough; verify checks the signature.

The `__Host-` cookie web keeps for the browser was built as a string and not stored by a browser in this spike.

## Logs

Debug logs and captured console output did not contain a DID, a TOTP secret, a code, a backup code, a token, or a cookie value. They did contain the schema name, the table names, and the rejected origin. The development fallback secret was part of the scan and was not printed.

## 1.7.27

Not run. `plugins/two-factor/index.ts` matches 1.7.25. `verify-two-factor.ts` rejects an expired challenge before OTP send and before counting a failure (changelog 1.7.26, `#12626`). 1.7.27 was published 2026-11-20, so it is inside the seven-day wait until 2026-11-27. The pin stays 1.7.25.
