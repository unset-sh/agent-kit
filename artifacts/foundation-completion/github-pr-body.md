Make `.github` the organisation metadata, community-default and native starter-template repository. Shared execution is maintained in the merged [tooling foundation](https://github.com/unset-sh/tooling/pull/1).

- Add contribution, conduct, security, support and accessibility defaults, public issue forms, a private vulnerability-report form and a general PR template. Conduct reports use GitHub's reporting tools.
- Keep local map validation and directly authored `workflow-templates/`. The small documentation caller pins merged tooling commit `838a965d14d0887291046c279422becb7b0228f3`, runs source checks first and exports with read-only permissions.
- Refresh the map for merged tooling and [ownership records](https://github.com/unset-sh/agent-kit/pull/8). Reconcile the already-created lexicons repository against its actual description, MIT licence and manual synchronization status. The public metadata drift check now matches GitHub.
- Maintain human guides under `docs/site/`, with evergreen import-history wording and verified source links. AI working material remains in agent-kit.

Validation: 22 map tests, generated-map freshness, actionlint and the live metadata drift check pass. Earlier hosted cross-repository execution succeeded; the final merged-commit pin is checked again on this head. Private vulnerability reporting was enabled and verified separately.

Tooling remains unreleased at `0.0.0`. This limited read-only bootstrap does not enable broader consumer adoption, automatic pin updates, auto-merge or release publication. [Docs PR #2](https://github.com/unset-sh/docs/pull/2) imports the exact merged source after this PR lands. The old workflows repository remains archived.
