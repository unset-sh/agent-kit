# Research basis

**Research date:** 22 November 2026. **Scope:** maintainability as code, features, repositories, and contributors grow.

The recommended baseline combines information hiding, feature ownership, controlled dependencies, and reliable feedback. It is a practical synthesis, not a single published standard or evidence that one folder tree is universally best. The companion standards turn that synthesis into proposed rules; the sources below do not mandate every local policy choice.

## Primary sources and their use

| Source | What it supports | Boundary of the claim |
| --- | --- | --- |
| [Parnas, On the Criteria To Be Used in Decomposing Systems into Modules](https://ckrybus.com/static/papers/decomposing_systems_into_modules_1972.pdf) | Hide changeable implementation decisions behind module interfaces | A foundational design argument, not a prescribed modern repository structure |
| [Cockburn, Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture) | Isolate application behavior from external technologies through useful contracts and adapters | Does not require a fixed layer count or an interface for every function |
| [Angular style guide](https://angular.dev/style-guide) | Feature-oriented organization, related-file colocation, descriptive naming | Its exact filenames and casing are ecosystem conventions |
| [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure) and [server-only modules](https://svelte.dev/docs/kit/server-only-modules) | Preserve framework entry points and enforce browser/server separation | Specific filename and directory behavior depends on the framework version |
| [Node package entry points](https://nodejs.org/api/packages.html#package-entry-points) | Define supported package entry points and restrict ordinary subpath imports | Package exports are not a security boundary or complete filesystem encapsulation |
| [TypeScript erased types](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types) | Static annotations do not validate runtime input | Does not prescribe a particular schema library or duplicated model layers |
| [Spring Modulith verification](https://docs.spring.io/spring-modulith/reference/verification.html) | Demonstrates automated checks for module cycles, internal access, and permitted dependencies | An implementation example, not a requirement to adopt Spring |
| [DORA code maintainability](https://dora.dev/capabilities/code-maintainability/) | Discoverability, safe changes, ownership, dependency traceability, and reproducible builds | Does not establish an optimal repository count or file length |
| [DORA test automation](https://dora.dev/capabilities/test-automation/) | Fast, reliable tests maintained by developers and integrated into delivery | Does not supply a universal coverage target |
| [DORA loosely coupled teams](https://dora.dev/capabilities/loosely-coupled-teams/) | Reduce coordination needed to change, test, and release capabilities | Applying these criteria to repository boundaries is our synthesis |
| [Google Engineering Practices, Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html) | Review self-contained changes and separate substantial refactoring where useful | Change size is conceptual, not determined by a fixed line count |
| [Nygard, Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | Preserve context, decisions, status, and consequences in short records | Routine implementation choices do not all need a decision record |
| [Semantic Versioning](https://semver.org/) | Declare a public API and communicate compatibility through immutable release versions | A version label does not prove compatibility; pre-1.0 expectations need an explicit policy |
| [OpenAPI overview](https://openapis.org/what-is-openapi/) | Describe HTTP interfaces independently of implementation and support generated tooling | A schema does not establish all behavioral compatibility |
| [Google AIP-180](https://google.aip.dev/180) | Distinguish source, wire, and semantic compatibility; preserve consumer expectations during change | Its detailed conventions target Google's API context, primarily protobuf and JSON |
| [Pact contract testing](https://docs.pact.io/getting_started/how_pact_works) and [version compatibility checks](https://docs.pact.io/pact_broker/can_i_deploy) | Verify represented consumer/provider interactions and relevant version combinations | These checks do not replace functional tests or cover unrepresented consumers |
| [GitHub reusable workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations) and [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) | Share maintained automation and route reviews to owners | Review routing alone does not require approval; enforcement depends on repository settings |
| [Backstage software catalog](https://backstage.io/docs/features/software-catalog/) | Make component ownership and metadata discoverable across repositories | A catalog product is optional; repository, component, and team boundaries can differ |
| [AT Protocol Lexicon evolution](https://atproto.com/specs/lexicon#lexicon-evolution) | Compatible evolution of existing NSIDs and tolerance of extension fields | Schema compatibility does not prove application behavior or feature support |
| [GitHub workflow updates](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/auto-update-actions) and [Dependabot automation](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions) | Automated dependency updates and policy-based merging | Update PR creation alone does not deliver a consumer release or deployment |

## Conclusions used in the standards

Useful architecture limits the knowledge needed to make a change. Folder conventions support navigation, while public interfaces and dependency rules control the consequences of changes. Feature-oriented modules are the default starting point, with boundaries adjusted to actual responsibilities and change patterns.

Multiple repositories add version and coordination boundaries. Compatibility therefore needs evidence about the combinations consumers actually use, not just separate green builds. Reusable packages, copied snapshots, and live APIs have different release and verification obligations; the standard makes those obligations explicit.

Automation should enforce repeatable rules and make failures actionable. Review remains necessary for responsibility placement, contract meaning, and justified exceptions. Written policy, implemented checks, required checks, and observed compatibility must be reported separately.

## Limits and reconsideration

This research does not establish an optimal number of repositories, services, layers, files, or lines. It does not justify a blanket rewrite, mandatory microservices, a fixed test-coverage threshold, or replacing an existing structure solely to match the example tree.

The unset-sh audit is evidence about the revisions listed in [the adoption plan](adoption-plan.md). It is separate from the general research and does not verify deployed behavior, private components, or every possible integration. Recheck implementation and settings before executing a migration based on that snapshot.

Revisit a rule when repeated changes expose misplaced responsibility, persistent coordination costs, slow or unreliable feedback, or enforcement that adds cost without protecting a meaningful boundary. Record the evidence and the trade-off rather than treating a familiar pattern as sufficient justification.
