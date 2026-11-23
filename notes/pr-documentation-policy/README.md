# Documentation impact in every pull request

Recorded 2026-11-22. This is the discussion and approval record for a rule already present in the proposed
shared documentation standard. It does not introduce a second standard or an executable CI check.

## Owner direction

Alex asked whether documentation should be enforced alongside architecture, then clarified:

> so each pr's come with a small documentation in docs/

The proposed rule was that every PR addresses documentation: update the relevant existing source-owned
pages when the change affects them, or give an explicit reason that no documentation update is needed.
The explanation distinguished the PR, which describes a change, from maintained documentation, which
describes the current system. It discouraged a separate document for every PR.

Alex accepted that as sufficient instruction for agents:

> yes that would be good enough for AI agents

## Application of the agreed rule

- Include the relevant documentation update with the change. Link the updated pages in the PR and state
  how they were checked. Maintain existing pages where possible rather than accumulating per-PR documents.
- When no update is needed, explain specifically why the existing documentation remains correct. An
  internal refactor or formatting change can qualify; the reason remains subject to review.
- API or configuration changes belong in their reference or guide; operational changes belong in the
  relevant runbook; consequential architecture decisions follow the owning repository's decision process.
- Maintained documentation stays with its source owner, normally under `docs/`; existing root READMEs and
  contribution files remain legitimate. AI task notes and supporting artifacts stay in agent-kit under
  `notes/` and `artifacts/`, outside the distributed kit and public documentation exports.

## Existing proposal and enforcement status

[Agent-kit PR #7](https://github.com/unset-sh/agent-kit/pull/7), inspected at
[`adf461d`](https://github.com/unset-sh/agent-kit/tree/adf461d260972ea1c8c56b2e8ea4f169c108a009), already contains
the update-or-explain requirement in the documentation standard's
[Maintenance and review section](https://github.com/unset-sh/agent-kit/blob/adf461d260972ea1c8c56b2e8ea4f169c108a009/skills/org-documentation/standard.md#maintenance-and-review).
Its [adoption instructions](https://github.com/unset-sh/agent-kit/blob/adf461d260972ea1c8c56b2e8ea4f169c108a009/skills/org-documentation/repository-rules.md)
distinguish written guidance from checks that consumers have actually adopted. PR #7 was open and unmerged
when inspected; this record does not claim that its skill has been released or installed in consumers.

The existing organisation
[PR template](https://github.com/unset-sh/.github/blob/36665552fe5d95005ddfdac1a8276333d479f103/.github/PULL_REQUEST_TEMPLATE.md)
already asks for updated documentation links or an explanation that no update is needed. That prompt is
not an automated documentation-impact gate.

Future CI may verify the declaration, documentation changes, links, builds and generated-reference
freshness where those checks are implemented. Review still judges accuracy and sufficiency. Shared
executable tooling belongs in `unset-sh/tooling`; source repositories own their local impact mappings,
commands and adoption. The older PR #7 reference to a check planned in `unset-sh/docs` needs reconciliation
with accepted org-0006 before implementation; this approval does not move tooling ownership.

This record changes no shipped rules, skills, version, check, release setting or consumer installation.
No application code is copied or moved, and the original `Undefined6799/unset` repository remains untouched.
