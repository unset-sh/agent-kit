# Developer tooling migration

Alex selected “Create unset-sh/tooling (recommended)” on 2026-11-22 after proposing that maintained CI live in a developer-tooling repository and `.github` retain organisation metadata and community defaults. The public repository was created with initial main commit `02350e6412fea7653c0cf69cfae70d6ac81e6270`. The archived workflows repository remains unchanged.

## Reviewed boundary

- Tooling owns shared check/release/export implementations, helpers, tests, generated flat entry points and human docs/site pages. The initial version remains 0.0.0.
- `.github` owns profile/map/community defaults and directly authored native templates. Its read-only documentation caller pins tooling and requires source checks before export.
- Consumers retain events, permissions, inputs, project commands and immutable pins. Automatic release propagation, eligible merging and downstream delivery remain separate integrations; no new write credential or release approval change was made.
- Source human pages export to their own docs sections. AI records and validation artifacts remain in agent-kit, outside the distributed bundle.

## Review and verification

Independent review compared release workflows and helper files against `.github` source `a364702ca70ce6b8de4c28de233613a6ea47f420`. Only repository/signer identity changes affect release code; approval and hostile-archive gates are preserved. The review found the exporter needed to reject reserved legacy `unset/`, and the template-copy guide needed to explain `$default-branch`. Both were corrected. The organisation overview now provides both learning and contributor routes.

- Tooling implementation checkpoint: `aad4a03c5db3d6d762c59543e1340744a941828a`; final source/docs commit: `0366edb2d04d5c24c19319770893b413d172567b`. 138 tests and actionlint pass.
- Organisation source commit: `0e49c58b61370a33429c802064c205589f0619ce`. 22 map tests, generation freshness, actionlint, YAML and links pass.
- Hosted tooling CI: https://github.com/unset-sh/tooling/actions/runs/45052029393 ; export: https://github.com/unset-sh/tooling/actions/runs/45052029407 . Both passed.
- Hosted organisation map: https://github.com/unset-sh/.github/actions/runs/45052100902 ; pinned cross-repository caller: https://github.com/unset-sh/.github/actions/runs/45052101303 . Both passed.
- Downloaded artifacts record PR merge commits `18a51dd2b58d43fc88e9fcab690768474e95a9d2` (tooling) and `f213eec4b86d95aec3f044de804eb5b90d7e6ba8` (github). Every hash matches, and all exported source file bytes match the corresponding local committed-source export. See artifacts/tooling-migration/hosted-export-verification.json.
- Docs validation uses current framework `c8ff515f13d9291cc5552bbac059fa172c153e6a`: both imports pass 176 Node and 19 Python tests plus production and preview builds. Tooling import also passes publication-mode build and local docs-impact check. The source-only github import requires the framework's documented PR-body no-framework-update explanation; its local SHA-only docs-impact command intentionally cannot accept that explanation. Hosted validation uses the current PR event. Both documentation imports passed: tooling https://github.com/unset-sh/docs/actions/runs/45052336670 and github https://github.com/unset-sh/docs/actions/runs/45052396154 .
- GitHub source export has six files plus provenance; tooling has seven plus provenance. Only their respective sections are copied by the exporter.

Three existing AI working files from docs main were preserved byte-for-byte in notes/docs-site/ and removed by the separate docs migration proposal. notes/docs-site/source.md records their source SHA and hashes. Maintained human operational guides remain with their owner.

## Review sequence

1. [Tooling implementation #1](https://github.com/unset-sh/tooling/pull/1).
2. [Organisation defaults and pinned callers #6](https://github.com/unset-sh/.github/pull/6), after tooling review/merge.
3. [Ownership records #8](https://github.com/unset-sh/agent-kit/pull/8), including preservation of the moved working notes.
4. [Tooling docs #5](https://github.com/unset-sh/docs/pull/5) and [organisation docs #2](https://github.com/unset-sh/docs/pull/2), after their source reviews. The docs website is already live; these imports have not been deployed.

No implementation PR was merged, release published, environment configured or credential added by this migration.
