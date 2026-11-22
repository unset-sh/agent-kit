Make `.github` the organisation's metadata, community-default and native starter-template repository. Shared CI, release helpers and documentation export now belong in [tooling PR #1](https://github.com/unset-sh/tooling/pull/1).

- Add contribution, conduct, security, support and accessibility defaults, public issue forms, a private vulnerability report form and a general PR template. Conduct reports use GitHub's reporting tools; the existing security email remains the fallback.
- Maintain starter templates directly in `workflow-templates/`, calling tooling at a reviewed full SHA selected during installation. Keep the existing local organisation-map workflow and its checks.
- Use a small read-only documentation caller pinned to tooling commit `0366edb2d04d5c24c19319770893b413d172567b`. Export depends on successful source checks and uploads pages, licence and exact source provenance without writing to docs.
- Update the repository map, ownership instructions and maintained human guides. The full publishing-key guide moves to tooling, with a pointer retained at its existing source path. AI notes and evidence remain in agent-kit.

Validation: 22 map tests, generated-map freshness, workflow/template actionlint, YAML and documentation-link checks pass. Private vulnerability reporting was enabled and verified separately; native defaults take effect only after merge. The hosted [map check](https://github.com/unset-sh/.github/actions/runs/45052100902) and [cross-repository check/export caller](https://github.com/unset-sh/.github/actions/runs/45052101303) passed. The downloaded `github/` artifact hashes match the source pages and record PR merge commit `f213eec4b86d95aec3f044de804eb5b90d7e6ba8`.

Merge dependency: review and merge tooling PR #1 before this caller. The implementation remains version `0.0.0`; this is a limited bootstrap pin, not a released or automatically adopted interface. Consumer migrations, automatic update PRs, auto-merge and delivery are separate integrations. Release approvals remain unchanged.

[Docs PR #2](https://github.com/unset-sh/docs/pull/2) imports the source-owned `github/` section, while [agent-kit PR #8](https://github.com/unset-sh/agent-kit/pull/8) records ownership. The old workflows repository remains archived with its history intact.
