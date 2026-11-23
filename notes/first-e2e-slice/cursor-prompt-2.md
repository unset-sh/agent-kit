# Cursor prompt 2: after the spike

Paste everything below the line into the same Cursor agent that ran step 1. Written 2026-11-23 after the
review in [spike-review.md](spike-review.md). The first prompt ([cursor-prompt.md](cursor-prompt.md)) still
holds; this one adds the answers to your open questions and the next steps.

**Alex: two answers below are my recommendations, not yet your decisions: (d) and (f). Pasting this prompt
as it is means you accept them. Strike or change either line first if you disagree.**

---

## 0. What this prompt does

Your spike was good: it ran what it could, marked what it did not run, stopped on (d) and did not propose
Node. This prompt answers your open questions, closes the spike's gaps, gets your work onto GitHub, and moves
you to step 2. Everything in the first prompt still applies, including its rules, its STOPs and §1a (look
things up in agent-kit as you go).

## 1. Answers to your open questions

- **(d) OAuth client on Bun (Alex accepts by pasting this).** Do not use `NodeOAuthClient`. Build on the
  runtime-neutral base package `@atproto/oauth-client` (0.9.3 is the newest ≥7 days old on 2026-11-23;
  `@atproto/oauth-client-node` 0.5.16 itself depends on it). Supply: our handle resolver (DNS TXT and
  `/.well-known/atproto-did`, both through the guard), our DID resolver (PLC and `did:web`, through the guard),
  the egress guard's `fetch`, a WebCrypto or `@atproto/jwk-jose` runtime implementation, and the Postgres
  state and session stores. The guard is then the only SSRF layer, which the first prompt already requires.
  Read `@atproto/oauth-client`'s source at the pinned version for the exact constructor options and cite it.
- **(f) Better Auth's database (Alex accepts by pasting this).** Use `pg` 8.23.1 with Kysely 0.29.9's
  `PostgresDialect` for Better Auth's tables only; it passed 468/468. Backend's own tables use `Bun.sql`, with
  explicit casts (`$1::uuid` and the like) and a test that proves a uuid parameter round-trips. Do not keep
  working on the Bun.sql dialect for Better Auth. The three suites that exist only in Better Auth's own e2e tree
  are not required for this slice; say so in the decision record.
- **(c) Bearer call with no Origin and no Cookie: accept.** Cross-site request forgery needs a credential the
  browser attaches by itself; a bearer token is not one, browsers never reach backend, and web enforces the
  exact `Origin`. Keep two tests in backend: bearer with no Cookie succeeds; any Cookie without a trusted
  Origin is refused. Set `trustedOrigins` to web's origin only.
- **(i) Telemetry.** Keep `telemetry: { enabled: false }`. Backend's typed config refuses to start when
  `BETTER_AUTH_TELEMETRY` or any Better Auth telemetry endpoint variable is set (name the exact variables
  from the source you read), with a test. Note the bypass in `findings.md` as something to report upstream;
  do not file it yourself.
- **(h) YAML.** `Bun.YAML.stringify` is not documented in Bun 1.4.4, so do not rely on it. Write
  `openapi.yaml` with the `yaml` package (2.9.1, pinned exactly) after a canonical key sort, and keep a test
  that two generations are byte-identical.
- **(e) Egress guard.** The stub test is not enough. Before step 6 is done, prove against a real TLS endpoint
  that the connection goes to the checked address while TLS (SNI and certificate check) and the `Host` header
  still use the name. If Bun's `fetch` cannot do that, **STOP** and report the options; do not weaken the check.
- **tooling #20.** Another thread is merging it into tooling `main`. Pin the merged commit once it is there.
  Until then do not write a CI caller that points at a branch or an unmerged commit.
- **Reuse of the old app's code.** Alex decided on 2026-11-23 to reuse the old app's code wherever it fits.
  You were right to follow backend's `CLAUDE.md`, which still forbade it. `unset-sh/backend#5` and
  `unset-sh/web#5` change that rule. Once they have merged into `staging`, copy and adapt as the first prompt
  says (copy and adaptation in separate commits, source path and commit cited, weak spots in `findings.md`).
  Until they merge, follow the files as they are and say so.

## 2. Finish the spike (update `spike.md` and `findings.md`)

1. Rebuild (d) on `@atproto/oauth-client` as above and run the loopback sign-in again. When you reach the
   consent screen, **STOP** and ask Alex to sign in and approve on his own account himself. Never ask for,
   type or store his password. After his consent, prove the callback, a token refresh and revocation, and
   that a token whose `sub` does not match the issuer and PDS is refused.
2. Write down for Alex the exact Safari check for (g) (the URL to open and what to look at in Web Inspector),
   since Safari cannot run on your machine. He runs it on his Mac.
3. Record every command, version and result as before. Mark anything not run as not run.

## 3. Get your work onto GitHub

Your push failed because your machine has no GitHub credentials. Never put a token in a file, a remote URL or
the repository, and never ask Alex for one in chat.

- If Alex has set up GitHub access for Cursor, push `cursor/first-e2e-slice-spike-dd02` and open a **draft**
  pull request into `unset-sh/agent-kit` `main`, filling the org PR template, label `kind:docs`, assigned to
  `Undefined6799`. Another reviewer merges it (org-0013); you do not.
- If not, print `git format-patch b2cd04f..HEAD --stdout` for the spike branch in a code block, so Alex can
  hand it to a session that can push. The commit author and message must survive the patch.

Before either, check your commits: author `Alex <188017560+Undefined6799@users.noreply.github.com>`, no
`Co-authored-by`, no Cursor or AI trailer, subject ≤72 characters in the imperative with no trailing period.

## 4. Then step 2: the decision record

Write the decision record from the first prompt's step 2 (`org-0015` unless an open agent-kit PR has taken
it), status Proposed, in its own pull request. It records the answers in §1 above with their dates, says that
(d) and (f) were recommended and accepted by Alex pasting this prompt on 2026-11-23, and links the spike
evidence. Then **STOP** and report to Alex. Do not start step 3 until he says so.

## 5. When you report

A short summary for Alex: what now works, what still fails, what he has to do (consent, Safari, GitHub
access), and PR links or the patch.
