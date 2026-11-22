# Shared coordination and map rules

This task also records Alex's later automatic-map rule; the PR now covers shared coordination and map rules.

Alex requested on 2026-11-22 that app-building agents open brand issues for missing design tokens or assets,
with another agent able to supply them. He placed the handoff in agent-kit, required an organisation rule
against scattered AI artifacts, and asked repository `AGENTS.md` to direct agents to relevant files.

## Scope and review

- Source: agent-kit main at `5792624b2215f3d9d59ae6798b3d1df389af5b1a`.
- Add text-only skills, short rule pointers and source/template routing. Preserve org-0005 and existing
  release and consumer-adoption gates; no brand changes, speculative requests, watcher or credentials.
- PR7 proposes the shared documentation standard and one additional rules line. PR9 proposes experience
  review. Both propose 0.2.0; this change reconciles main's existing Unreleased entry into that proposed
  version and leaves their work untouched. PR11 reserves org-0007, so this decision uses org-0008.
- Human documentation remains source-owned; no raw handoff or task log is added to consumer `docs/`.
- Alex subsequently required every map to refresh automatically and asked for a shared workflow. Add
  `org-map-maintenance` and org-0009, preserving human review for meaning and workflow explanations.
  PR13 is notes-only and does not reserve a decision number. Tooling and docs own the executable integration.

## Behavioural baseline

A read-only evaluator considered a consumer on brand 0.1.0 needing a selected destructive state in both
themes, a related focus-state issue and an unmerged provider PR. It correctly retained the release boundary
and stored notes/evidence in agent-kit. It found no guidance deciding issue reuse versus a linked request,
required request facts, posting authority, provider tracking, temporary treatment or completion criteria.
The skill supplies those missing decisions without assuming that posting a request starts another agent.

## Verification

- `npm run check` on Node 26.12.0: all 46 tests passed, including bundle installation and sync verification.
- Skill front matter validation and `git diff --check`: passed.
- Rules total 149 lines, leaving one line for PR7's documentation pointer within the existing 150-line limit.
- Initial in-memory bundle inspection: 20 distributed files; the new skill and decision ship, task notes do not.
  All source AGENTS links and concrete installed-template links resolve to files in their expected layout.
- The first manual bundle inspection omitted `parseBundle`'s required version argument and failed; passing
  the documented `0.2.0` argument succeeded. No product change or relaxed check was needed.
- No release, watcher, request issue, consumer update or brand implementation was performed.
- After the map-rule addition: all 46 tests and both skill validators passed again. The 22-file bundle
  includes both skills and decisions, excludes all task material, and resolves source/installed AGENTS links.
  Rules remain 149 lines. The brand handoff and accepted org-0008 text are unchanged by this addition.

## Sources

- Existing repository instructions, bundle allowlist and sync contract at the source revision above.
- Pending documentation standard in agent-kit PR7 at `adf461d260972ea1c8c56b2e8ea4f169c108a009`.
- Pending experience review in agent-kit PR9 at `66e2305bc2e0e60dd7ebc55ed51a851a14064f68`.
- GitHub's [issue creation](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)
  and [PR linking](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
  documentation, read 2026-11-22. The skill uses plain links and existing access, not invented labels or automation.
