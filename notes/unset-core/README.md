# Unset Core: product scope

[scope.md](scope.md) is Alex's Unset Core product scope, copied verbatim from the migration project on
2026-11-23. It is the product's source of truth for what Core must do. It is not a decision record and does
not by itself change an accepted organisation decision.

How each Core area maps onto repositories, contracts and migration phases, and where the scope goes beyond
or conflicts with decisions already taken, is worked out in the migration plan:
<https://claude.ai/artifact/D8nEFmJXKfz2A1CkrKpoLh>, section "Unset Core: where each area lives". That plan
moves to `notes/unset-migration/` once Alex approves it (org-0005).

[security-architecture.md](security-architecture.md) is the security architecture proposal Alex uploaded to the
same project on 2026-11-23 at 19:28 UTC, kept byte for byte (SHA-256
`2c8d9b0c88e669322dd6229671f3e6d8e4b319960ca81acaf8d9d9b6f2f2d505`, CRLF line endings as uploaded). It is plain
text, not Markdown, and holds four proposals, each marked "Status: Proposed": end-to-end encryption and
zero-knowledge storage (line 1), the API gateway and policy enforcement (line 889), authorization (line 1678), and
authentication and sessions with Better Auth (line 2286). Proposals are not decisions: the plan's section
"Security architecture proposals" lists where they agree with or differ from decisions already taken.

When the scope changes, add Alex's new text as a new dated copy rather than editing this one, so later readers
can see what was asked and when.

Why it is kept here: the scope is planning input for assistants working across every product repository, and
org-0005 keeps AI working material in agent-kit. A maintained human page for the product, if one is wanted,
belongs in the repository that owns the behaviour and exports to `unset-sh/docs` (org-documentation).
