Import maintained developer-tooling guides into `tooling/` and align the framework's authored explanations with the merged foundation.

The section comes only from `unset-sh/tooling:docs/site/` and root `LICENSE` at merged commit `838a965d14d0887291046c279422becb7b0228f3` ([tooling #1](https://github.com/unset-sh/tooling/pull/1)). `tooling/source.json` preserves the exact revision and file hashes. Other source sections remain unchanged.

Separate authored updates in `content/updates.md`, `.github/DOCS-UPKEEP.md` and `.github/CUTOVER.md` point to that merged implementation and preserve the distinction between the landed foundation, unreleased workflows and later consumer adoption. The docs-impact checker remains docs-owned.

Three AI working plans move out of `.github/`; their exact bytes, source revision and hashes are preserved on main through merged [agent-kit #8](https://github.com/unset-sh/agent-kit/pull/8). Maintained human runbooks stay here.

Earlier validation passed clean install, 176 Node tests, 19 Python tests, production/publication and preview builds, navigation checks and provenance. Final refreshed source references are independently checked before merge. This import adds no credentials or workflow adoption. [Docs #2](https://github.com/unset-sh/docs/pull/2) independently imports the organisation-owned `github/` section.
