# Architecture documentation

**Status:** proposed baseline for staged adoption. **Prepared:** 22 November 2026.

This documentation defines how to keep an application understandable and safe to change as its features, repositories, and contributors grow. The recommended baseline is cohesive modules, intentional public interfaces, explicit ownership, controlled dependencies, and automated verification.

It records the research behind that baseline, a snapshot of how unset-sh applies it, and a read-only assessment of the application being moved into the organization. It does not prescribe a framework, a service count, a repository count, or a universal directory tree. Traffic capacity and infrastructure sizing are outside its scope.

The intended organization model is a shared platform assembled by applications: authoritative brand and protocol definitions, focused reusable capabilities, and centralized developer tooling. Supported consumers should receive compatible changes through an automatic, verified release and adoption process. Publication alone is not completion; the rollout must account for consumer builds and delivery.

## Read and use the documents

| Document | Purpose | Use it when |
| --- | --- | --- |
| [Architecture standard](architecture-standard.md) | Module boundaries, dependency direction, file placement, tests, and verification | Designing a feature, changing internal structure, or reviewing a change |
| [Multiple repository standard](multi-repository-standard.md) | Repository ownership, public contracts, shared artifacts, compatibility, and releases | Adding a repository, sharing code, or changing an interface used elsewhere |
| [Shared platform and automatic adoption](shared-platform-and-automation.md) | Brand reuse, portable capabilities, centralized CI, and automatic consumer updates | Designing the workflow that carries one shared change into every supported application |
| [Adoption plan and audit baseline](adoption-plan.md) | Dated evidence, priorities, prerequisites, and completion criteria for unset-sh | Turning the standard into small, verifiable implementation changes |
| [Application structure assessment](app-structure-assessment.md) | Current application boundaries, proposed destination layout, and staged migration | Moving the application into the organization or refactoring its structure |
| [Repository boundaries and contracts](repository-boundaries-and-contracts.md) | Follow-up proposal separating backend, web, mobile, tooling and deployment, with contract evolution rules | Deciding the organization repository map and shared backend boundary |
| [Research basis](research-basis.md) | Primary sources, their relevance, and the limits of the conclusions | Evaluating a rule or reconsidering a trade-off |

Read the two standards and the shared-platform direction first. Use the adoption plan and application assessment for current evidence, and the repository-boundaries proposal for the latest destination direction; their findings describe the inspected revisions, not an automatically refreshed view of GitHub.

## Policy and adoption

The standards distinguish requirements that apply after adoption from defaults and optional mechanisms. Their rule identifiers support review and tracking; they do not imply that enforcement already exists.

Existing accepted architecture decisions and repository instructions remain authoritative until deliberately amended through their normal decision process. Record a conflict or justified exception, its owner, and when it should be reconsidered. Do not silently replace an accepted decision with this document.

For each adopted rule, record its scope, implementation, verification evidence, and remaining exceptions. A written rule, a passing check, and an enforced merge requirement are different states. Claim adoption only at the level demonstrated by the evidence.

## Maintaining this documentation

Choose one authoritative source location when these documents enter the organization. Publish or mirror from that source with revision provenance rather than maintaining independent copies. The organization-wide standard should be discoverable from its repository map; each component should retain its own interface documentation and significant decisions.

Update the relevant standard when its intended rule changes. Preserve dated audit findings as history, and record subsequent resolutions against the original finding instead of rewriting history to imply that the problem never existed. Keep research citations beside the claims they support.

This set contains documentation only. It does not implement migrations, change repository protection, publish packages, or modify application behavior.
