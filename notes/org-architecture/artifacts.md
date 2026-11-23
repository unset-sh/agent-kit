# Research artifact provenance and current meaning

The eight Markdown documents in [artifacts/org-architecture](../../artifacts/org-architecture/) were copied
without modification from the architecture chat's working documents on 2026-11-22. The
[snapshot manifest](../../artifacts/org-architecture/snapshot.json) records each filename, byte count and
SHA-256 digest. They are task artifacts, excluded from the distributed kit by org-0005.

| Artifact | What it records |
| --- | --- |
| [README](../../artifacts/org-architecture/README.md) | Original navigation and proposed adoption framing |
| [Architecture standard](../../artifacts/org-architecture/architecture-standard.md) | Module boundaries, file placement, dependency direction and verification |
| [Multi-repository standard](../../artifacts/org-architecture/multi-repository-standard.md) | Ownership, public contracts, compatible releases and automatic adoption |
| [Shared platform](../../artifacts/org-architecture/shared-platform-and-automation.md) | Brand, protocol and tooling reuse; complete update-to-delivery lifecycle |
| [Adoption plan](../../artifacts/org-architecture/adoption-plan.md) | Earlier organisation snapshot, findings and staged recommendations |
| [Research basis](../../artifacts/org-architecture/research-basis.md) | Primary sources and limits of the general conclusions |
| [Application assessment](../../artifacts/org-architecture/app-structure-assessment.md) | Read-only application snapshot and destination restructuring considerations |
| [Repository boundaries](../../artifacts/org-architecture/repository-boundaries-and-contracts.md) | Backend/client/deployment proposal, capability adapters, AppView/PDS/Tap and stable public contracts |

## Read these as dated evidence, not current repository status

The original organisation audit used the immutable revisions listed in its adoption plan. Its references
to pending `.github` tooling consolidation, absent kit releases and review settings are observations at that
inspection, not an automatically refreshed status report. The current foundation work starts with org-0006
already accepted and tooling implemented in its own repository but unreleased. Implementation and adoption
must still be verified separately; do not revive the older `.github` destination from an imported artifact.

During the task, `.github` PR #6 merged and main advanced to `3666555`. That refreshed map names tooling and
lexicons as active and records small pinned tooling callers. The supplemental
[tooling audit](../../artifacts/org-architecture/tooling-audit-before-map-refresh.md) inspected earlier
`.github` main `b3c1b3d`; its PR-open and no-caller statements are therefore historical. Its inspected tooling
implementation is `838a965d14d0887291046c279422becb7b0228f3`, version 0.0.0 and unreleased. The manifest records
the audit separately from the eight original documents. No claim of a first successful tooling release,
broader caller adoption or automatic delivery follows from the map merge.

The application assessment inspected `Undefined6799/unset` at
`9817f1e7ed51fdd5989d6bad6261a9e167d97b80`. It counted 1,949 tracked files and 31 npm workspaces, inspected
tracked source/configuration and recorded selected existing CI metadata. It did not run application scripts,
install dependencies, execute deployments or alter the original application. The full CI run was not green;
successful individual checks were not presented as a complete successful baseline.

The earlier proposal to consolidate web-specific code inside an application workspace is refined by the
subsequent backend/web repository split. Its source findings remain useful. The `developer-tooling` name
in research is superseded by accepted `tooling`; `rendering` remains a possible descriptive name for
presentation, not an approved rename. Future mobile, Tap adoption and API specifics are not implemented
merely because their roles appear in a diagram.

The application and organisation snapshot revisions can differ without proving a broken deployed system.
In particular, recipes explicitly used a draft pinned schema, and lexicons had a later schema snapshot;
their supported-version and cutover relationship was unverified. Validate intended combinations before
declaring a defect. Protocol-permitted extension fields must not be rejected simply to create a negative
compatibility fixture.
