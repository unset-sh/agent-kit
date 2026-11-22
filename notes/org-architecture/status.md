# Organisation architecture status ledger

Recorded 2026-11-22. Entries distinguish owner direction, implementation, verification, release, adoption
and deployment. This ledger is task evidence; `.github/repos.json` remains the organisation catalog.

## Baseline and authorization

| Item | State at this task's start | Evidence or next verification |
| --- | --- | --- |
| Backend/web/deployment direction | Approved by Alex | org-0007 records "ok let make the organisation follow this logic" |
| Server-kit proposal | Replace with backend | Exact later direction recorded in org-0007; inventory found no server-kit repository to rename |
| Standalone messaging proposal | Remove from map | Exact later direction recorded in org-0007; inventory found no messaging repository to delete |
| Mobile | Future client scope | No mobile repository creation or client implementation claimed |
| Presentation | Existing rendering responsibility/name | Rendering rename discussed, not approved or performed |
| Tooling | Existing implementation, unreleased | org-0006 accepted on agent-kit main; current release/caller audit is coordinated separately |
| Refreshed organisation map | `.github` main advanced during this task | [Revision `3666555`](https://github.com/unset-sh/.github/tree/36665552fe5d95005ddfdac1a8276333d479f103): PR #6 merged; tooling/lexicons active and small pinned tooling callers present |
| Original application | Read-only reference | Inspected revision `9817f1e7ed51fdd5989d6bad6261a9e167d97b80`; no application edits or execution in this task |
| Docs-site framework | Outside this task | Keep maintained documentation/export ownership intact |

## Work in this coordinated task

| Work | State | Evidence / remaining work |
| --- | --- | --- |
| Agent-kit decision and chat record | Prepared for a local DCO-signed commit on `claude/org-architecture` | Based on freshly fetched `origin/main` at `ca8a1f6`; publication and PR creation pending |
| Research preservation | Eight documents copied without modification | `artifacts/org-architecture/snapshot.json` records bytes and hashes |
| Organisation catalog changes | [PR #11](https://github.com/unset-sh/.github/pull/11) open, unmerged | Reviewed head `deaca1d`; replaces obsolete proposals and records the three active foundations |
| [Backend](https://github.com/unset-sh/backend) repository | Created publicly; [foundation PR #1](https://github.com/unset-sh/backend/pull/1) open, unmerged | Repository ID `1467866773`; PR head `ac0d7de`; initial main has README/AGPL, no running backend |
| [Web](https://github.com/unset-sh/web) repository | Created publicly; [foundation PR #1](https://github.com/unset-sh/web/pull/1) open, unmerged | Repository ID `1467866856`; PR head `f2f785a`; initial main has README/AGPL, no migrated web app |
| [Deployment](https://github.com/unset-sh/deployment) repository | Created publicly; [foundation PR #1](https://github.com/unset-sh/deployment/pull/1) open, unmerged | Repository ID `1467866959`; PR head `8610876`; initial main has README/AGPL, no live rollout |
| Cursor-requested review handoff | Codex handoff chat created for read-only review of the four PRs | Chat `01a20493-42ea-7140-a6b3-5d7b805295e4`; no launched Cursor agent verified |
| Agent-kit release | Not published by this task | Pending version prepared only; owner approval and release review still required |
| Consumer kit adoption | Not performed by this task | Installed copies need a later pinned release/update |
| Complete app migration, protocol cutover and production rollout | Not implemented by this documentation change | Follow the staged plan with actual contracts and deployment evidence |

## Release-adoption prerequisite

The supplemental tooling audit found that current org-release instructions describe a tag-triggered release,
whereas tooling's publication implementation accepts a main push and creates its tag after owner approval.
This documentation task does not change either security mechanism. Before migrating a release consumer,
reconcile its instructions and owner-managed environment policy with the selected contract; retain the old
working flow until that migration is reviewed. A successful source check does not verify the first release.

## Verification

- `npm run check` passed: **46 tests, 46 passed, 0 failed**, under Node 26.12.0. The supplied temporary Node
  distribution's npm wrapper was incomplete, so the working Homebrew npm CLI ran the unchanged package
  command with Node 26 first on `PATH`. No dependencies were installed and no checks were bypassed.
  [Successful check log](../../artifacts/org-architecture/agent-kit-check.log),
  [initial npm bootstrap failure](../../artifacts/org-architecture/npm-bootstrap-failure.log).
- All eight imported research documents and the supplemental tooling audit match their recorded byte counts
  and SHA-256 hashes. The final note/artifact link pass resolved all 45 local links, including the added log
  and audit references.
- Reviewed the decision, index, pending version/changelog and task notes for approved-versus-implemented
  claims, current tooling ownership, unchanged source-app scope and release limitations. `git diff --check`
  passed for tracked changes. The existing bundle tests passed, including exclusion of task working material.
- The coordinating task reports all 22 map tests passing and a fresh live comparison with zero findings
  across 13 repositories. This is catalog/foundation evidence, not product-runtime or delivery verification.
- This agent-kit change is prepared for a DCO-signed local commit. It has not been pushed or opened as a PR
  at this checkpoint; no release, consumer installation or production action is part of this documentation
  change. The four other repository PRs above were opened by the coordinating task.

The older artifact audit is dated history. In particular, earlier pending `.github` tooling placement and
draft schema snapshots must not be reused as current status without reinspection. No failing application
secret-scan logs were inspected and no diagnosis of that historical result is asserted here.
