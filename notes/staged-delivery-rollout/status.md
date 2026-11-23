# Staged delivery audit ledger

Date: 2026-11-22. This is a point-in-time record. Refresh source revisions and browser observations before
each cutover. The coordinating task owns settings through the user-approved API fallback; Brave failed before
any mutation. The independent source auditor owns the wider workflow-filter inventory. This checkout adds
agent-kit CI prerequisites and these notes, with separate rendering/lexicons CI PRs coordinated alongside it.

## Evidence checkpoints

| Item | Observed state | Implication |
| --- | --- | --- |
| Documentation base | Agent-kit staging created at main `a98152cd5391ffd84776dc7c5eee7ff3994d5e57` | Fresh checkout, own `claude/staging-branch-checks` branch |
| Target delivery proposal | PR #14 head `411280a0e3df512d4038c22efe8436cdefdc5c9d` | Accepted target recorded; operational cutover explicitly pending |
| Latest branch-name decision | Alex retained main for production and staging for development | No main-to-master rename; PR #14's historical master wording requires owner reconciliation |
| Decision numbering | Accepted main org-0009 is maps; PR #14 org-0009 is delivery | PR owner must resolve unmerged record/references; neither edited here |
| Existing shared rules | Feature work starts from main; release requires owner environment approval | Do not treat branch creation as completed policy/release migration |
| Agent-kit baseline CI | PR trigger unfiltered; push filter main | This PR adds staging/main product CI coverage and a separate branch-policy caller |
| Agent-kit release source | Tags `v*`; tagged commit must be ancestor of origin/main; publish uses release environment | No separate staging channel or guarded promotion publisher in this source; unchanged here |
| Shared-account identity | Target explicitly uses agent instructions for human-only promotion | Account identity and native review counts cannot prove a separate human/agent |
| Application scope | Original application excluded; new product foundations have no migrated runtime | No application execution, code migration or deployment claim |
| Wider source audit | Pending independent auditor report | Do not infer all repositories share agent-kit's filters |
| Live branch/environment settings | Coordinating task owns API inspection/configuration | No release-approval change or overall settings completion claimed by these CI PRs |

## Consumer prerequisite branches

| Repository | Verified staging/base SHA | Prepared change |
| --- | --- | --- |
| agent-kit | `a98152cd5391ffd84776dc7c5eee7ff3994d5e57` | Existing kit checks retained; product CI staging/main filters; shared guard and these notes |
| rendering | `f4597ce765007c28c0fd0aadbd3f9f0333939229` | Existing type/lint/build/test/gallery jobs retained; product CI staging/main filters; shared guard |
| lexicons | `52cfb6990f3833e4bdd260cd5bb520fc4446e122` | Existing schema/docs checks retained; product CI staging/main filters; shared guard |

All three use their own `claude/staging-branch-checks` branch. The guard caller has no checkout or secret
inheritance and permits only contents read at the job. They pin tooling commit
`5f47dbe68fc8c8860e99eccd1edc882aba65bf63`, prepared in [tooling PR #8](https://github.com/unset-sh/tooling/pull/8).
The exact context `policy / Validate branch policy` passed in the
[tooling caller run](https://github.com/unset-sh/tooling/actions/runs/45097154985/job/137439396126).
Verify each consumer's own run before requiring it. These are dependent prerequisite PRs: review the shared
implementation and caller together before adoption. No publishing or release workflows are edited.

Source links:
[main rules](https://github.com/unset-sh/agent-kit/blob/a98152cd5391ffd84776dc7c5eee7ff3994d5e57/rules/working.md),
[main release rule](https://github.com/unset-sh/agent-kit/blob/a98152cd5391ffd84776dc7c5eee7ff3994d5e57/rules/org.md),
[CI](https://github.com/unset-sh/agent-kit/blob/a98152cd5391ffd84776dc7c5eee7ff3994d5e57/.github/workflows/ci.yml),
[release](https://github.com/unset-sh/agent-kit/blob/a98152cd5391ffd84776dc7c5eee7ff3994d5e57/.github/workflows/release.yml),
[accepted map record](https://github.com/unset-sh/agent-kit/blob/a98152cd5391ffd84776dc7c5eee7ff3994d5e57/skills/org-decisions/records/org-0009-maps-refresh-through-shared-tooling.md)
and [delivery PR](https://github.com/unset-sh/agent-kit/pull/14).

## Per-repository evidence to append

For each active repository, record: baseline/source SHA; staging/main SHAs; actual default; check names and
producing App; review/merge/bypass settings; environment eligibility; branch-filter migration PR; passing and
rejected-path evidence; publication/runtime applicability; remaining owner/action. Use these separate states:

`inventoried → replacement prepared → branches protected → default switched → checks demonstrated → delivery verified`

A repository may have branch setup complete while release migration remains pending. Do not collapse that
into “done.” Archived repositories and the external source app retain their recorded exclusions. Existing
approvals remain until the exact prepared production guard and publisher replacement are verified.

## Documentation validation

- Agent-kit: `npm run check` passed all 46 tests.
- Rendering: typecheck, lint, build and all 77 tests passed; gallery generation passed.
- Lexicons: docs generation and checks passed, including all 19 tests and schema/source-hash validation;
  generation left tracked documentation unchanged.
- Actionlint 1.7.12 passed the changed workflows in all three repositories; diff and note-link checks passed.
- Checks used Node 26.12.0. An incomplete temporary npm installation and a sandbox cache-path failure were
  resolved with the existing complete npm CLI and a writable temporary cache, without changing tests or
  repository configuration. Final runs above passed.

The user authorized DCO-signed commits and publication of prerequisite PRs to staging. No merges, releases,
deployments or settings changes are performed by these consumer PRs. Hosted consumer results remain a
separate verification step; a passing local check does not prove the live required-rule configuration.
