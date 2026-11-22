# Organisation setup

Alex asked on 2026-11-22 to make `unset-sh/.github` a proper organisation setup after reviewing GitHub's recognised
default files. The existing workflow implementation remains in `.github` PR #6. This follow-up extends that same
reviewable branch; it does not merge its own work.

## Decisions and scope

- Add GitHub-recognised security, support, accessibility and conduct policies, public issue forms, a private
  vulnerability form and a general inherited PR template. Preserve the established contribution/DCO policy.
- Alex selected **Use GitHub’s reporting tools for now** for conduct reports. No conduct mailbox is invented.
- The existing committed application security policy names `security@unset.sh`. Use it as the security fallback
  without extending that application's response-time commitments to the organisation.
- No funding configuration without an established destination; no discussion forms while Discussions is disabled.
- Keep human explanations under `.github/docs/site/`, export only that selected section to `docs:github/`, and
  keep working material here in agent-kit. Native GitHub policy/template files remain at their recognised paths.

## Current-state reconciliation

The organisation documentation site became live during this work. Fetched `.github` main at
`b3c1b3d120915b046ec149b5f33de3c6900e9b1e` and merged it into the owned workflow branch. Resolved map/profile conflicts
using current main as the authoritative map and regenerated its views. Preserved actual profile-recipes publishing,
live docs ownership and the new documentation-key guide. Updated earlier pending-cutover language.

The existing docs import branch now includes current docs main `301bfd5` and its explicit `.github` → `github/`
source-section exception. It remains an additional source import, separate from the existing live sections.

## Settings

GitHub CLI read confirmed private vulnerability reporting on `unset-sh/.github` was disabled. After preparing and
reviewing the policy/form, enabled that repository's private-reporting setting through the documented PUT endpoint.
A subsequent GET returned `{"enabled":true}`. No other repository's setting, release environment, permission or
credential was changed. GitHub's built-in form applies until the custom form reaches the default branch.

## Validation and limits

- All six YAML files parse; used form keys, field types, IDs and required flags match GitHub's published schema.
- Independent review found no blockers in policies, forms, generic PR template or organisation-defaults guide.
- Existing repository check passes 152 tests after the main reconciliation; no workflow logic changed.
- After merge, check native GitHub form rendering and inheritance in a repository without local overrides.
  Source validation and a PR preview do not establish default-branch adoption.
- Private reporting enablement does not enable the feature across the organisation. Code ownership, licences,
  rulesets and workflow callers also remain scoped as documented.

## Primary sources checked

- https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository
- https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository
- https://docs.github.com/en/communities/maintaining-your-safety-on-github/reporting-abuse-or-spam
- https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-an-accessibility-page-to-your-repository
- https://docs.github.com/en/rest/repos/repos#enable-private-vulnerability-reporting-for-a-repository

Read 2026-11-22. Evidence belongs in `artifacts/organisation-setup/`.

## Delivery

- Organisation setup: .github PR #6 at a364702ca70ce6b8de4c28de233613a6ea47f420. Hosted CI, map and docs-export runs succeeded (45047565115, 45047565075, 45047565083).
- Documentation: docs PR #2 now imports eight source files from that exact revision, including the organisation-defaults and publishing-key guides. The source section remains draft pending source review/merge.
- Current docs checks pass 176 Node tests and 19 Python tests, plus workflow/map checks. The production build validates 16 HTML pages and their local assets.
- A pre-existing framework test asserts that an error stack contains no word `private`, which also matches the local `/private/tmp` checkout path. The unchanged source passes from a clean checkout outside that path. That temporary checkout was removed after validation; no framework test was weakened.
- Source guide links use the checked setup revision 0ad6db5b25ba484a1812b16bdbdbf5c266c0ee53; final export provenance records a364702ca70ce6b8de4c28de233613a6ea47f420.
- Native GitHub defaults/forms remain inactive until PR #6 reaches main. Private-report enablement on the organisation repository is already confirmed. No own PR was merged and no Pages deployment was performed.
