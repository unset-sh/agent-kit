Import the organisation-owned guides into `github/`: community defaults, native workflow templates, the read-only export caller and a pointer to the maintained publishing-key guide in tooling.

The section comes only from `unset-sh/.github:docs/site/` and root `LICENSE` at merged commit `36665552fe5d95005ddfdac1a8276333d479f103` ([organisation setup #6](https://github.com/unset-sh/.github/pull/6)). `github/source.json` preserves its exact source revision and SHA-256 hashes. The `.github` → `github/` reserved-name exception leaves the framework's own `.github/` untouched.

The source caller pins merged tooling `838a965d14d0887291046c279422becb7b0228f3`. Tooling guides and source ownership references have already landed through [docs #5](https://github.com/unset-sh/docs/pull/5), included in this branch's current main. This PR changes only the additional `github/` section.

Source map checks, actionlint and metadata drift validation passed. Imported bytes match the merged source and manifest; final combined documentation checks, production/preview builds and provenance are independently verified before merge. No publishing credential, automatic source delivery or release approval change is added.

Docs impact: no update needed — This change imports only a source-owned documentation section; framework behaviour and instructions remain unchanged, and the section carries its own maintained explanations.
