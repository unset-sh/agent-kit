# Multi-repository architecture standard

Status: proposed for adoption. Date: 2026-11-22.

This standard addresses growth in features, contributors and independently maintained repositories. It complements [the codebase architecture standard](./architecture-standard.md); [the adoption plan](./adoption-plan.md) separates existing evidence from work still needed. Writing a rule here does not establish that a repository follows it.

**Required when adopted** means a participating repository must satisfy the rule or record a scoped exception, owner and review trigger. **Default** means the normal starting point, changeable with a documented reason. **Conditional** means the requirement applies only when its stated trigger exists. Create supporting files when needed, not empty scaffolding.

## M01 — Separate ownership, packaging and deployment decisions

**Required when adopted.** A repository is a source-control boundary; a package is a distributed artifact; a service is a running deployment boundary; a team is an ownership boundary. They need not correspond one to one. A repository can contain several cohesive packages, and several repositories can contribute to one application.

**Default.** Split repositories around responsibilities that can evolve, be reviewed and be released with limited coordination. Keep frequently co-changing implementation together. Separate deployment for an actual operational or isolation need, not because a folder became large. Before splitting, identify the public boundary, expected cross-repository changes and who will maintain migration work. There is no fixed team-size or file-count threshold.

## M02 — Maintain an ownership and dependency catalog

**Required when adopted.** Each repository has an accountable owner or ownership group, a purpose, public interfaces, outgoing dependencies, known consumers and its build/release entry points. A central catalog links to these authoritative local records instead of duplicating their full contents.

Distinguish **planned**, **implemented**, **released**, **adopted by named consumers**, and **deployed**, with evidence appropriate to each claim. A workflow file proves an implementation exists; a successful run proves that run completed; neither alone proves deployment or organization-wide adoption. Record the relevant version or commit for consumer adoption.

Changes to ownership, published interfaces or dependency direction update the catalog in the same delivery sequence. Review ownership for availability and expertise rather than requiring every change to pass through one central person.

## M03 — Make every repository independently understandable

**Required when adopted.** Explain how to develop, verify and consume the repository without reconstructing another repository's internals. Keep business features cohesive as described in the companion standard. Consumers use declared entry points, not another repository's internal source paths.

**Default baseline**, adapted to framework and language conventions:

```text
README.md               purpose, owner, status, setup and public interface
CONTRIBUTING.md         verification and change/release process
src/                   feature-oriented implementation
tests/                 cross-module/integration tests; unit tests may colocate
contracts/             public schemas, when applicable
docs/decisions/         consequential decisions and exceptions
scripts/               repository tooling
<ownership file>       platform-specific path ownership, when supported
```

Existing conventional names are acceptable. A contracts directory is unnecessary for a package whose public API is defined clearly in code. An `index` file is only an entry point convention: enforce allowed imports using package exports, dependency checks or equivalent tooling. Node's exports mechanism restricts ordinary package subpaths but is not a security sandbox. [Node package entry points](https://nodejs.org/api/packages.html#package-entry-points)

## M04 — Share narrow, reproducible artifacts

**Default.** Share focused libraries and public contracts: a design system, a service client or a generic logging utility. Avoid an organization-wide `common` package containing unrelated business models, database entities and service internals. Shared business code requires explicit joint ownership and compatible release expectations.

**Required when adopted.** Published artifacts are immutable and traceable to source, build instructions and their dependency resolution. Consumers record the selected release and reproducible resolution through exact versions, lockfiles or ecosystem equivalents. Updates enter review and consumer verification; a mutable runtime `latest` reference is insufficient.

**Conditional: copied schemas or assets.** Reviewed snapshot mirrors are permitted when packaging is unsuitable. Record the authoritative source, full source revision, file inventory, hashes, license, supported contract revision and refresh procedure. Checks detect local inventory or byte drift. An upstream comparison or update process detects freshness; local hashes alone cannot. Clearly label any deliberate lag and its support implications. Do not call a mirror the authority unless ownership has actually transferred.

## M05 — Define authority and compatibility at each boundary

**Required when adopted.** Every API, event or shared schema has an authoritative owner. The provider maintains its promised interface; consumers document the interactions they rely on. Schema source may live with the producer or in a separately owned contract repository, but there must be one authoritative revision for each released contract.

Assess three dimensions: **source compatibility** of consumer code, **wire compatibility** of exchanged data, and **behavioral compatibility** of meanings, defaults and outcomes. A type-preserving change can still break consumers. Google's compatibility guidance makes these distinctions and warns that format-specific rules and consumer control affect the requirements. [AIP-180](https://google.aip.dev/180)

**Conditional: generated clients.** Publish or reproduce them from a recorded schema and generator version. OpenAPI supports language-independent interface descriptions and client generation; generated shapes do not establish that consumer behavior still works. Pair schema checks with exercised consumer interactions and provider verification. [OpenAPI](https://openapis.org/what-is-openapi/), [Pact](https://docs.pact.io/getting_started/how_pact_works)

## M06 — State version and support policy explicitly

**Required when adopted.** Declare the public API and compatibility policy before consumers depend on it. For stable SemVer packages, incompatible API changes require a major release; compatible additions and deprecation require a minor release; compatible fixes use patch releases. Never replace an already published version. [Semantic Versioning](https://semver.org/)

For pre-1.0 artifacts, state exactly how breaking changes are numbered, announced and migrated. SemVer permits instability in `0.y.z`; a patch-looking number alone is not a compatibility guarantee. Package versions, schema format versions and deployed API versions are distinct identifiers. Document their supported relationships rather than assuming identical numbers.

**Conditional: independent releases.** Maintain a small support record identifying consumer/provider versions that must coexist, deprecation commitments and the retirement decision owner. Record exceptions explicitly; do not infer readiness from a successful producer build.

## M07 — Expand, migrate and retire safely

**Required when adopted for incompatible cross-repository changes.** Plan coexistence, consumer migration and rollback before removing the old contract. For example, changing response field `name` to `display_name`:

1. Add the new field while preserving the old field and its meaning. Verify supported consumers tolerate the addition; strict decoders can make an apparently additive change incompatible.
2. Verify and release provider support, then migrate consumers through their own reviewed releases. New consumers either retain a tested fallback or constrain rollback to provider versions supporting the new field.
3. Record migration evidence, announce deprecation and retire the old field only under the agreed support policy. For externally controlled consumers, provide an appropriate new API version and retirement window.

Renaming removes an old interface as well as adding a new one; version numbers do not remove the need for coexistence. [AIP-180](https://google.aip.dev/180)

## M08 — Standardize guardrails and verify affected consumers

**Required when adopted.** Each repository runs meaningful local checks. Cross-repository changes additionally verify the affected consumer/provider pairs and supported version combinations. Consumer contract tests exercise actual request generation and response handling; provider verification checks those expectations. Keep functional tests for behavior outside that contract. [Pact](https://docs.pact.io/getting_started/how_pact_works)

**Default.** Maintain common tooling, workflow templates and standards centrally as versioned products with owners and migration notes. Pin adopted revisions and review upgrades. Local repositories retain domain-specific tests and justified configuration; central consistency must not require simultaneous changes everywhere.

**Conditional: mandatory merge or release gates.** Inspect actual repository rules, required status names, review requirements and publication environments. Record what is configured and what was tested. Merely defining CI or mentioning approval in prose does not prove enforcement. Route review to the owners of affected contracts, consumers and security boundaries rather than adding every team to every change.

## M09 — Automate consumer adoption through delivery

**Required when adopted for supported shared products.** Declare the consumers that must follow a release and the policy that permits automatic adoption. A compatible shared release triggers dependency updates, consumer verification, eligible automatic merges and the consumer's normal build/release/deployment path. Record the resulting versions and outcomes. Opening update PRs alone does not complete propagation.

Keep consumers on identifiable immutable artifacts while automation advances those selections. Failures stop the affected rollout and produce an actionable exception with an owner; unrelated consumers may continue where compatibility permits. Breaking changes follow M07 rather than a version-number shortcut. The detailed brand and tooling workflow, including mobile delivery limits, is in [Shared platform and automatic adoption](./shared-platform-and-automation.md).

## Contract change record

For changes affecting another repository, attach the following concise evidence to the normal PR or decision record. Existing links can satisfy fields; a second document is unnecessary.

- **Owner and interface:** authoritative schema/API, current and proposed revisions.
- **Consumers and compatibility:** affected consumers, source/wire/behavior assessment, supported combinations.
- **Artifacts:** immutable release or snapshot provenance and dependency updates.
- **Verification:** producer checks, exercised consumer contracts, relevant functional tests and results.
- **Delivery:** order of changes, coexistence, rollback, deprecation and retirement criteria.
- **Completion:** adopted/deployed versions and evidence, remaining work with owners, catalog/documentation updates.

Mark unverified claims and pending actions explicitly. Completion means the required consumers and support commitments are accounted for, not merely that the producer change merged.
