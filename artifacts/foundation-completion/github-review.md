# Organisation foundation verification

Reviewed PR: https://github.com/unset-sh/.github/pull/6
Reviewed head: `36fb5dc50da302dabd4df102be7ae7856364518b`
Merged main commit: `36665552fe5d95005ddfdac1a8276333d479f103`
Merged: 2026-11-22T18:29:33Z

## Review

No blocking findings. Reviewed the full PR and final delta, community policies/forms, native templates, local map ownership and the dependency graph. The read-only check and export jobs both pin merged tooling commit `838a965d14d0887291046c279422becb7b0228f3`; export depends on check. Release publication and automatic consumer updates remain outside this bootstrap.

Native files use GitHub's documented default-community locations and inheritance boundaries. Forms avoid repository-specific labels, assignees, projects and issue types. Security and conduct routes preserve the owner's choices. Basic form schemas parsed successfully. All ten PR commits have DCO sign-offs; no comments or review threads were pending.

Verified tooling and agent-kit foundation merges, lexicons' live README manual-sync status, and public metadata through the drift check. The generated map remains acyclic and matches its source.

Sources checked 2026-11-22:
- https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file
- https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository
- https://github.com/unset-sh/lexicons/blob/main/README.md

## Fresh verification

- 22 map tests passed, zero failures; log `github-check.log`.
- Generated-map freshness, actionlint, YAML form parsing and whitespace checks passed.
- Live metadata drift check: the map matches GitHub.
- Final-head hosted checks were green and merge state clean.
- Squash merge enforced the exact expected head, retained the branch and preserved DCO sign-off. No administrator bypass or settings change was used.
- The merged Git tree exactly matches the reviewed head. All five native policies, public forms/config, PR template, vulnerability form, workflow callers and starter-template files are present in that tree.
- Main map workflow passed: https://github.com/unset-sh/.github/actions/runs/45055379497
- Main cross-repository check → export passed: https://github.com/unset-sh/.github/actions/runs/45055379853
- Run metadata confirms both referenced workflow SHAs are `838a965d14d0887291046c279422becb7b0228f3` and the source head is `36665552fe5d95005ddfdac1a8276333d479f103`.
- The main export produced the unexpired `docs-36665552fe5d95005ddfdac1a8276333d479f103` artifact.
- Private vulnerability reporting remains enabled. GitHub's tooling community-profile API now resolves the inherited code of conduct, contribution policy and PR template to `.github`.

The archived workflows repository was not changed. Workflow-picker placeholders still require a selected reviewed pin when installed; the new native defaults do not automatically migrate other consumers.
