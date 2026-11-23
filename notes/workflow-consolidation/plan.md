# Organisation workflows implementation plan

**Goal:** Keep organisation automation in `unset-sh/.github`, authored in purpose-based folders, and preserve the existing shared implementation before retiring `unset-sh/workflows`.

**Authority:** Alex approved this layout and implementation on 2026-11-22 in the accompanying chat. Category folders are the authored source; GitHub entry points are committed generated files. The separate workflows repository will be retired after its unpublished implementation is preserved.

**Architecture:** Node-only generation copies category YAML to flat `.github/workflows/<category>-<name>.yml`; starter templates and metadata are copied to `workflow-templates/`. Existing scripts and security tests move with the shared check/release workflow. Repository callers keep events, permissions and pinned revisions.

**Stack:** Node 26.12.0, npm 11.20.0, Node built-ins, `node:test`, GitHub Actions.

## Constraints

- No new dependencies, no attribution trailers, no commits to main.
- Preserve the existing release trust boundary: main-only plan, read-only build, protected publish, checked artifacts, no stored secrets, exact signer identity.
- Never claim a pending migration or release has already happened. Consumer pins require a reviewed, merged central commit.
- Preserve the map and community files. Update repos.json and regenerate its views.
- Do not overwrite other open branches. Companion PRs must name related pending work.
- Generated output is deterministic, cannot follow symlinks, and cannot overwrite unmanaged files. Check mode makes no changes and refuses stale/missing/orphan output.
- Existing work is from workflows PR #1 at 4cdb60eab9d4e8d6f00ffc8521531b56a00a75b4. Keep its unverified live release behavior documented.

## Review focus

1. A stale or hand-edited executable must fail the repository check.
2. Renamed/deleted sources must not leave an executable orphan; writes must preserve unrelated files.
3. Generated callers and documented signer identities must agree with actual emitted paths.
4. Self-release must stay inactive at version 0.0.0 and run only the intended workflow contract.
5. Template consumers must never receive an unreviewed moving branch or a fabricated pin.

## Tasks

### 1. Import existing automation and preserve its behavior

- [x] Copy shared release/check scripts and tests into this repository without overwriting map tooling.
- [x] Adapt only repository identity, documented paths and workflow output names; retain all security refusals.
- [x] Keep check source at ci/check.yml, release source at releases/package.yml, self-callers in ci/self.yml and releases/self.yml, and existing map workflow at automation/org-map.yml.
- [x] Run the preserved tests on Node 26.12.0 and fix integration differences.

### 2. Generate and validate GitHub entry points

Files: scripts/workflows.mjs, scripts/workflows.test.mjs, templates/*, generated entry points.

Interface: `node scripts/workflows.mjs --write|--check`; exported `generate(root, {write})` returns discrepancy paths and throws for unsafe source/output layouts.

- [x] Write real temporary-directory tests for deterministic copy, read-only checks, stale/missing/orphan outputs, source collisions, symlinks, unmanaged output protection and valid template metadata.
- [x] Run tests and record the expected failures before implementation.
- [x] Implement the copy/check behavior using built-ins. One generated header identifies owned files; no YAML rewriting or custom workflow engine.
- [x] Add starter sources containing an explicit full-commit placeholder, with instructions to choose a reviewed release before installation. They are onboarding templates, not live consumers.
- [x] Generate entry points; wire generation freshness into npm run check and self CI.

### 3. Document ownership and migration

- [x] Maintain the public guides and release reference under docs/site/; keep AI working material in agent-kit and export only public pages.
- [x] Update organisation map ownership and record the still-existing workflows repository as pending retirement, not already archived.
- [x] Add a companion decision in agent-kit preserving accepted history and superseding the old hosting choice.
- [x] Inventory current consumers and stale in-flight references; preserve the old source/PR before archive.

### 4. Validate and deliver

- [x] Run npm run check on Node 26.12.0, workflow lint if available, and git diff --check.
- [x] Get an independent code/security review of the full change and address material findings.
- [x] Commit on this task's branch; open PRs with evidence and deployment prerequisites.
- [x] Retire the old repository reversibly only after preservation and reference checks; do not delete history.

## Progress

- Baseline `.github`: 22/22 tests and generated map freshness pass on Node 26.12.0.
- No live calls to unset-sh/workflows found in organisation main branches; old repository has no releases. Pending PR references require reconciliation.

- The public source export reads an exact Git tree, retains licence and deterministic hashes, and packages only docs/site/. The initial import is docs PR #2; publication remains pending docs PR #1.
- 152 local tests and actionlint pass. Independent review found and resolved Renovate matching. The exact export renders against the pending docs framework with Hugo 0.168.0.
- Workflow implementation is preserved in .github PR #6. GitHub confirms workflows archived on 2026-11-22. No source release, consumer adoption or live website deployment was performed.
