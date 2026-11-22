# Engineering Workflow & Change Management

## 1. Change Management

Before making significant changes, understand the existing implementation, conventions, dependencies, and constraints.

Keep changes focused, incremental, and easy to review. Avoid mixing unrelated changes in the same change set.

Prefer the smallest change that correctly solves the problem while preserving existing behavior unless the change explicitly requires otherwise.

Before considering work complete:
- Review the resulting diff.
- Check for unintended changes.
- Remove unnecessary complexity or unrelated modifications.
- Confirm existing behavior has not been accidentally broken.
- Ensure new code follows established project conventions.

Do not make broad refactors merely because you are touching an area of code. Separate necessary improvements from unrelated cleanup unless the cleanup is small and clearly beneficial.

### Pull request readiness

Each PR has one coherent, reviewable purpose and declares its readiness in the description.

Line counts are advisory. This organisation guidance has no fixed PR line limit or PR-count quota.
Split work when it improves review or provides a useful integration step, not to satisfy a size counter.

- **Independent:** it can merge and, where applicable, release or deploy on the current target branch once
  its required checks and review pass, without another unmerged change or unavailable artifact. Documentation
  or other changes without a deliverable need their applicable checks, not an artificial release or deployment.
- **Dependent:** it links the prerequisite PRs and states the exact condition that makes it ready. Across
  repositories, name the required published version or artifact as well; a producer PR merging does not
  make an unreleased dependency available. It may be reviewed early, but must not merge while blocked.

Every merge into staging must leave a working, releasable state. A dependency declaration does not permit
merging broken intermediate code while waiting for a later PR to repair it. A partial capability may land
when its current behavior is deliberately valid and compatible, without depending on unfinished follow-up work.

When prerequisites become available, update the PR against its actual target and exact dependency pins,
rerun the relevant checks, and obtain any review needed for the changed result before merging. A green
check against an earlier stack or a different dependency selection is not evidence for the new result.

Stacked PRs are optional when they make review clearer. Land them in dependency order; update only branches
you own and are authorised to rewrite, then recheck each resulting PR. Do not force a stack into arbitrary
folder or architectural-layer slices. Keep necessary implementation, tests and documentation together when
they are one reviewable change. Refactoring and behavior changes remain separate commits.

Apply the canonical [PR labels](https://github.com/unset-sh/.github/blob/main/docs/site/pull-request-labels.md)
from `unset-sh/.github`, choosing one primary kind by the intended outcome. Keep readiness and dependency
links in the PR description; a label is not proof that a dependency is satisfied or permission to merge.


## 2. Git Discipline

Treat version control as part of the engineering workflow.

- Keep commits focused and logically coherent.
- Do not mix unrelated features, refactors, formatting changes, or fixes unnecessarily.
- Review diffs before committing.
- Do not commit generated files, secrets, credentials, local configuration, or other unintended artifacts.
- Preserve useful project history.
- Write commit messages that clearly communicate the purpose of the change.
- Do not rewrite or discard existing history unless explicitly requested.
- Do not use destructive Git operations casually.

When investigating a problem, use Git history when it can provide useful context rather than assuming the current implementation tells the whole story.


## 3. Codebase Reconnaissance

Before introducing a new pattern, dependency, abstraction, or subsystem, inspect the existing codebase.

Look for:
- Existing implementations solving similar problems.
- Established naming and structural conventions.
- Existing utilities or shared components.
- Existing dependencies that already provide the required capability.
- Existing tests and test patterns.
- Configuration and deployment conventions.
- Relevant architectural boundaries.

Prefer extending or reusing an existing approach when appropriate.

Do not create a second mechanism for something the project already handles well without a clear reason.


## 4. API and Contract Design

When designing, changing, or reviewing APIs, published schemas, SDK surfaces, or cross-repository contracts,
identify their consumers, governing protocol, supported versions, and existing compatibility commitments.

Use applicable, approved [Google AIPs](https://google.aip.dev/1) as the default API design and review reference.
Check each AIP's scope and replacement status. The governing protocol takes precedence: apply AT Protocol's
Lexicon and XRPC rules to AT Protocol interfaces, and the supported Matrix specification to Matrix interfaces.
Do not substitute Google's resource naming, REST mappings, protobuf/gRPC conventions, or internal approval
process for a protocol's requirements. Explain material deviations from applicable guidance.

In the design note or pull request, cite the AIP numbers and URLs, relevant protocol sections and supported
protocol/SDK versions, and the source revision or consultation date. Cite the source actually read; AIPs do
not all have independently numbered releases.

For each contract:

- Keep contracts clear, minimal, and intentional.
- Validate inputs at trust boundaries.
- Use consistent error behavior.
- Avoid exposing internal implementation details unnecessarily.
- Respect published compatibility commitments and plan migrations deliberately.
- Consider idempotency where operations may be retried.
- Design pagination, filtering, and resource boundaries deliberately where applicable.
- Translate external API concepts into internal domain concepts at appropriate boundaries rather than allowing external models to spread throughout the system.

Review compatibility using [AIP-180](https://google.aip.dev/180):

- **Source:** existing consumer code still compiles and runs against the changed library.
- **Wire:** existing consumers and providers can still exchange and interpret data correctly.
- **Semantic:** existing consumers continue to receive the behavior they reasonably rely on.

Additions are not inherently safe. New required fields, changed defaults, response enum values, or pagination
added to a previously unpaginated response can break consumers. Check supported consumer/provider combinations
with meaningful tests; passing generated types or schema validation alone does not establish compatibility.

Follow the owning protocol's evolution rules. [Lexicon evolution](https://atproto.com/specs/lexicon#lexicon-evolution)
requires compatibility between old and new schemas and data; incompatible changes need a new Lexicon name.
[Matrix versioning](https://spec.matrix.org/v1.19/#specification-versions) has its own endpoint and deprecation
rules. Use the version the implementation supports; this reference does not mandate a protocol upgrade.

Private ports and other internal interfaces may evolve with their consumers. Do not impose permanent public
compatibility on every function, or design elaborate versioning machinery without a real requirement.

References checked on 2026-11-22: AIP-1 and AIP-180 (approved), AT Protocol Lexicon language version 1, and
Matrix specification v1.19. Recheck the relevant source for each API change.


## 5. Database and Data Modeling

Treat persistent data as a long-lived contract.

- Model data around actual domain needs.
- Use appropriate constraints and indexes.
- Preserve data integrity through database constraints where appropriate.
- Treat migrations as deliberate changes to a production system.
- Consider existing data, deployment order, rollback implications, and compatibility when changing schemas.
- Avoid destructive migrations unless explicitly required and safely planned.
- Keep application and database assumptions consistent.
- Test important migration and data-transition paths.

Prefer simple, understandable schemas over clever designs.


## 6. Performance

Treat performance as an engineering concern, but do not optimize based on speculation.

Prefer:

Measure → identify the bottleneck → make a targeted change → measure again.

- Avoid premature optimization.
- Consider algorithmic complexity and obvious performance risks during design.
- Profile or measure meaningful workloads when performance matters.
- Optimize real bottlenecks rather than arbitrary code.
- Consider database queries, network calls, I/O, memory usage, concurrency, and external dependencies where relevant.
- Preserve readability unless the performance improvement justifies additional complexity.

Performance improvements should be evidence-driven.


## 7. Documentation

Documentation should explain things that are important to understand, operate, or change.

Keep documentation:
- Accurate.
- Concise.
- Close to the relevant code when appropriate.
- Updated when behavior, configuration, architecture, or operational procedures change.

Document why when the reasoning is not obvious.

Avoid documenting implementation details that are already clear from well-written code.

Important architectural and dependency decisions should be documented lightly rather than buried in comments or left entirely implicit.


## 8. Higher-Risk Changes

For changes that affect persistent data, external contracts, deployment, infrastructure, or other systems outside the immediate code:

Increase the level of planning and verification proportionally to the risk and reversibility of the change.

Consider:
- Existing consumers.
- Existing data.
- Deployment order.
- Compatibility.
- Failure and recovery behavior.
- Rollback or migration strategy.
- Operational impact.
- Security implications.

Do not apply heavyweight planning to routine, reversible changes.


## 9. General Change Principle

Prefer changes that are:

Small → understandable → testable → reversible → easy to review.

When a change becomes difficult to reason about, stop and reassess the design rather than continuing to add complexity.

The goal is not to minimize the number of files, abstractions, commits, or lines changed.

The goal is to make correct changes with controlled complexity and clear reasoning.
