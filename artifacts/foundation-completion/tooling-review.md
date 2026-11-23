# Tooling foundation verification

Reviewed PR: https://github.com/unset-sh/tooling/pull/1
Reviewed head: `0366edb2d04d5c24c19319770893b413d172567b`
Merged main commit: `838a965d14d0887291046c279422becb7b0228f3`
Merged: 2026-11-22T18:24:12Z

## Review

No blocking findings. The reusable check is read-only; the documentation exporter reads committed Git objects from the caller while running helpers at the workflow's exact repository/revision. Export paths, reserved sections, filenames, symlinks and collisions fail closed. It uploads an artifact without cross-repository credentials.

The release plan/build/publish separation, owner/environment gate and hostile-artifact refusals are preserved. Seven release source/helper files match the earlier reviewed implementation after only the repository identity substitution `unset-sh/.github` → `unset-sh/tooling`. Generated entry points match category sources. Version remains `0.0.0`.

No review threads or comments were pending. Exact-head hosted checks were successful and merge state was clean. The current main branch had no ruleset protection; protected main, release environment setup and first release remain the separately documented release-activation prerequisites.

## Fresh verification

- Node26.12.0/npm11.20.0: 138 tests passed, zero failures; log `tooling-check.log`.
- Generation freshness and actionlint1.7.12 passed; only the documented job.workflow_repository/workflow_sha type suppression was used.
- Whitespace check passed. The merged Git tree is identical to the reviewed PR tree.
- Main CI passed: https://github.com/unset-sh/tooling/actions/runs/45054877409
- Main check → documentation export passed: https://github.com/unset-sh/tooling/actions/runs/45054877465
- Initial self-release run passed its plan and skipped build/publication at0.0.0: https://github.com/unset-sh/tooling/actions/runs/45054877371
- No release environments or releases exist. No settings or credentials were changed.
- Repository remains public/unarchived; GitHub detects AGPL-3.0.

The connector could read but could not merge (integration403). Authenticated gh merged with an exact expected head and squash method, preserving the existing DCO sign-off, without an administrative bypass or branch deletion.
