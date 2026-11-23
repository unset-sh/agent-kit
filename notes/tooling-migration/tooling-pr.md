Move maintained shared automation into the dedicated public `unset-sh/tooling` repository. Consumers keep small callers with their events, permissions, inputs and project commands; `.github` retains organisation defaults and native starter templates.

- Import the checked CI and protected release implementations, helpers and tests from `.github` PR #6. Release helpers and approval gates are preserved; workflow identity and attestation signer paths now name tooling.
- Keep authored category sources and generate six flat `.github/workflows/` entry points. Retain full action pins, read-only checks, isolated publication and version `0.0.0`.
- Add a reusable committed-tree documentation exporter. It takes the consumer source at `github.sha`, uses helpers from the called tooling revision, validates section/output boundaries and uploads provenance, licence and pages after source checks. It has no publishing credentials.
- Maintain human guides in `docs/site/`; AI working notes and evidence stay in agent-kit. Native templates remain in `.github`.

Validation: 138 Node tests and actionlint 1.7.12 pass. Independent review verified the release code changes are limited to repository identity; the exporter now also rejects the docs framework's reserved legacy `unset/` section. Hosted [CI](https://github.com/unset-sh/tooling/actions/runs/45052029393) and [documentation export](https://github.com/unset-sh/tooling/actions/runs/45052029407) passed. The downloaded `tooling/` artifact has valid hashes and matches the source pages; its provenance records GitHub's PR merge commit `18a51dd2b58d43fc88e9fcab690768474e95a9d2`.

This is the initial unreleased implementation. Automatic update PRs, eligible auto-merge and downstream delivery are not configured. No release environment, credentials or approval settings are changed.

Review this implementation before merging the pinned bootstrap caller in [organisation setup PR #6](https://github.com/unset-sh/.github/pull/6). The ownership record is [agent-kit PR #8](https://github.com/unset-sh/agent-kit/pull/8). The archived workflows repository retains its original review history.
