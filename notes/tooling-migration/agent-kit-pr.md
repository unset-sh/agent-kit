Record the approved division between developer tooling, organisation defaults and agent working material.

- Add accepted org-0006: shared CI/release/deployment implementations and helpers live in public `unset-sh/tooling`; `.github` retains metadata, community defaults, native templates and local metadata checks. Consumers retain small pinned callers and project commands.
- Preserve accepted history: org-0004 changes only its status prefix; org-0001/2/3/5 remain unchanged. Keep org-0005's AI notes/artifacts boundary and human documentation/export rules.
- Update current ownership guidance and the unreleased changelog without expanding the 148-line shared rules. No caller migration, automatic adoption, release approval or credential change is performed by the kit.
- Store this migration's notes, exports and validation evidence outside the distributed kit. Preserve three docs AI working notes byte-for-byte under `notes/docs-site/`, with original revision and hashes, alongside their removal in [docs PR #5](https://github.com/unset-sh/docs/pull/5).

Validation: 46 kit tests pass; bundle includes org-0006 and excludes all notes/artifacts. Tooling checks, hosted cross-repository execution and documentation builds are recorded in `notes/tooling-migration/migration.md` with supporting artifacts.

Related: [tooling #1](https://github.com/unset-sh/tooling/pull/1), [organisation setup #6](https://github.com/unset-sh/.github/pull/6), [organisation docs #2](https://github.com/unset-sh/docs/pull/2), [tooling docs #5](https://github.com/unset-sh/docs/pull/5). Consumers receive the new decision through a later approved kit release.
