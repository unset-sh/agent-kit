# Unset vision recap

[vision-2026-11-25.md](vision-2026-11-25.md) is the "Master Vision, Product Strategy & Development Roadmap" recap
Alex posted in the migration project on 2026-11-25 at 22:47 UTC, copied verbatim below a short provenance comment.
His own note after posting it: "some of the stuff in there, like it's mostly like ideas and vision. Some of the stuff
here may not line up, but that's kind of the idea."

So read it as direction, not as decisions. Where it differs from what is decided, the decisions win: the accepted
organisation records in `skills/org-decisions/records/`, the Unset Core scope (2026-11-23, in agent-kit PR #34 at
`notes/unset-core/scope.md`) and the monorepo's `CLAUDE.md`. Known differences at the time of copying:

- Its development checks name Prettier and Nx; the monorepo uses `bun fmt`, ESLint and dependency-cruiser.
- It lists Cerbos as considered; Cerbos was removed and OpenFGA is the engine (org-0022).
- It describes a `__Host-sid` session cookie and a `GET /verify-email` flow from the old app; the monorepo signs in
  with AT Protocol OAuth and a Better Auth session, and has no email verification route.
- It puts the Privacy Center among the main pillars; the Core scope makes it an optional module, with privacy
  controls in Core.
- Its status table (section 13) is empty and says it needs repository verification.

The repository-facing summary is the root `README.md` of `unset-sh/unset` (unset PR #36). Alex wants to review
section 15's Phase 1 next and find what is missing to finish it.

When the vision changes, add Alex's new text as a new dated copy rather than editing this one.
