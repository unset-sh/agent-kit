# Pull request size and reviewability

Sources checked 2026-11-22. This research recommends policy; it does not change an existing rule, label, workflow or repository setting.

Scope distinction: the current organization rule in `agent-kit/rules/working.md` asks for one purpose and a change reviewable in one sitting; it has no numerical cutoff. The separate, read-only original app's `CLAUDE.md` D3 targets under about 400 changed source lines, excludes tests/lockfile/generated code/lexicon JSON, and states that CI fails above 800 without a `large-pr` label and reason. Those app rules remain unchanged. The recommendations below concern future organization policy.

## Does research support a universal 400- or 800-line limit?

### Takeaway

The evidence supports focused, understandable changes, but does not establish 400 or 800 source lines as a universal acceptance boundary. Keep the organization's non-numeric approach and make its reviewability criteria explicit; keep counts available as information.

### Cited Findings

- Google's canonical guidance defines a useful unit as a self-contained change and explicitly leaves size to reviewer judgment. Its 100- and 1,000-line examples are contextual illustrations, not universal thresholds; file spread also matters. It keeps related tests and a usage of a new API with the change rather than rewarding incomplete slices. — [Google Engineering Practices: Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- A 2015 Microsoft study analyzed approximately 1.5 million review comments from five projects. The proportion classified as useful decreased as the number of changed files increased. This measures comment usefulness, not a causal defect threshold in lines. The authors identify single-company/mature-project generalizability limits and an approximately 15% classifier error rate. — [Bosu, Greiler and Bird, Characteristics of Useful Code Reviews, sections VI-B and VII](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf)
- Google's 2018 case study used nine million reviewed changes, interviews and a survey. It observed a median of 24 changed lines and about 90% of changes touching fewer than ten files. These describe Google's historical population and process; they are not experimentally established limits for other teams. The paper also observes that some very large changes contain generated code or deletions. — [Sadowski et al., Modern Code Review: A Case Study at Google, sections 3 and 5](https://storage.googleapis.com/gweb-research2023-media/pubtools/4476.pdf)
- GitHub recommends small PRs with one purpose and clear explanations of the problem, result, review order and important files. This guidance does not impose a universal line limit. — [GitHub: Helping others review your changes](https://docs.github.com/en/pull-requests/concepts/helping-others-review-your-changes)

### Inferences

- Recommendation for future organization policy: do not introduce automatic rejection or a mandatory `large-pr` exception solely because a PR crosses 800 lines. The original app's separate existing gate is outside this research's change scope.
- A line count can flag possible review burden, but cannot establish it alone. A short permission change can need more scrutiny than a large, reproducible file regeneration.
- Prefer displaying raw additions/deletions, changed files and an author explanation of substantive versus mechanical changes. Do not turn them into a synthetic risk score.
- Advisory size bands are optional. Begin without numeric bands; if review queues later need them, calibrate to the organization's observed review time, rework and defects, and keep them non-blocking. A category must not authorize approval or override a reviewer's request to split an incoherent change.

### Gaps

- No reviewed source establishes a universally optimal 400- or 800-line threshold, or validates the original app's particular limit. It is not an organization-wide numerical gate.
- These empirical studies concern human review in older organizational settings. They do not establish a larger safe limit for present-day AI review. Neither large model context nor fast generation proves comprehensive review.
- No local data on review latency, escaped defects or abandoned changes was analyzed. A local numerical threshold would presently be a convention, not a measured optimum.

## How does the supplied DeployHQ article compare with the primary sources?

### Takeaway

Use its practical review advice as supporting guidance, not as proof of universal line thresholds. Its strongest quantitative claims need better sourcing before they could justify an organization rule.

### Cited Findings

- DeployHQ's article (updated April 12, 2026) recommends clear intent, review order, verification and deployment context. It offers line-count bands, attributes declining effectiveness after 200–400 lines to SmartBear/Cisco, and asserts that Google's median review time doubles per extra 100 lines with more defects above 500. It provides no primary citation for those Google claims. Its sample size check warns rather than blocks, while a later section demands stacks over 400 lines. — [DeployHQ: Pull Request Best Practices](https://www.deployhq.com/blog/the-perfect-pull-request-best-practices-for-collaborative-development)
- SmartBear's own guidance recommends reviewing 200–400 lines **at a time**, based on its Cisco study. A review-session recommendation is not, by itself, proof of a maximum PR size across languages, generated changes, teams or review methods. — [SmartBear: Best Practices for Code Review](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)
- Google's own guidance explicitly avoids a universal cutoff, includes related tests/API usage and permits larger suitable mechanical changes. Its published case study above describes a historical population; the reviewed paper does not establish DeployHQ's two precise Google claims. — [Google: Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html), [Google case study](https://storage.googleapis.com/gweb-research2023-media/pubtools/4476.pdf)

### Inferences

- Adopt the practical context and review-map advice because it agrees with Google's and GitHub's direct guidance. Treat the article's size/time bands as the author's suggested conventions, not empirical acceptance criteria. Do not reproduce its unverified numerical Google claims as facts.
- Do not make a mandatory schema/service/API split. Google allows vertical decomposition; GitHub's stacked workflow helps when dependencies justify it. Keep one cohesive capability together when splitting would hide context or leave unsafe intermediate states.
- The article's deployment and approval examples are not authority to replace the owner's chosen staging-to-master workflow. Likewise, its commit-attribution suggestion does not override the owner's prohibition on AI attribution.

### Gaps

- This review did not reproduce the Cisco study or validate the article's proposed review-time bands. The cited vendor guidance and the peer-reviewed studies answer different questions.

## What should make a PR acceptable instead of its line count?

### Takeaway

A PR should tell one complete, reviewable story, carry suitable evidence, and leave a supported integration state. Judge whether its purpose, consequences and verification are understandable without forcing arbitrary file or layer splits.

### Cited Findings

- Google's review guidance covers design, behavior, concurrency, tests, complexity and relevant documentation. It expects substantive code to be understood, asks reviewers to disclose limited review coverage, and recommends involving suitable expertise for specialized concerns. Major formatting changes should not obscure functional edits. — [Google: What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
- GitHub calls out dependencies, authentication, permissions, workflows and sensitive-data handling as changes deserving security attention. It also recommends authors inspect their own diff and verify applicable builds/tests before requesting review. — [GitHub: Helping others review your changes](https://docs.github.com/en/pull-requests/concepts/helping-others-review-your-changes)
- Google's overarching review standard balances forward progress with long-term maintainability: a definite improvement need not be perfect to merit approval. — [Google: The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)

### Inferences

Recommended acceptance criteria, stated as a proposed local policy rather than a research finding:

1. **One coherent outcome.** The title and opening description name the behavior, correction or structural improvement. Every substantive change supports it; unrelated cleanup is split out.
2. **Enough context to assess the outcome.** Explain important before/after behavior, affected interfaces and why the boundary is appropriate. Keep the implementation, relevant tests and documentation together when they form the same reviewable story. Update docs or explain why current docs remain correct.
3. **A safe integration state.** The PR passes its meaningful checks and can land without depending on an unspecified future fix. A dependent stack states prerequisite PRs and merge order; every landed stage retains a supported state.
4. **Risk addressed in proportion to the change.** For public contracts, persistent data, permissions, production workflows or cross-repository compatibility, state the impact and the applicable compatibility/migration/recovery evidence. A small diff receives no exemption from these obligations.
5. **Reviewable evidence.** Provide appropriate tests or concrete verification, identify generated/moved content, and explain how reproduction or behavior preservation was checked. Do not add shallow tests merely to satisfy a form.
6. **Review coverage is clear.** Reviewers can explain the result, important dependencies and failure cases. Split the PR if independent purposes or excessive context prevent that; do not split merely to reduce a counter. If coverage is divided, say who reviewed which part and who checked the whole integration.

Atomic means logically complete, not microscopic. A useful split yields a buildable, testable integration part and preserves the context needed to assess it. More PRs are not inherently better: each adds description, review, coordination and integration work. Do not impose a PR-per-day quota or fragment a coherent change merely to create separate ownership-path PRs. These are proposed process judgments, not measured claims about a universal optimal PR count.

Suggested short rule:

> Keep each PR focused on one reviewable outcome, with the context and verification needed to assess it. Split unrelated work and changes that cannot be reviewed coherently. Line counts are advisory; required tests, documentation and cohesive implementation must not be separated merely to meet a size target.

This rule concerns review quality, not permission to deploy. The coordinator reports the owner's separate decision: AI may approve staging work; only the human merges staging into master, which is the sole production approval. That is an agent behavior rule under the accepted shared account, not a claim that GitHub can distinguish a human click from automation using the same identity.

### Gaps

- CI can verify tests, declared dependencies and documentary fields; it cannot prove that a narrative is coherent or that a review was intellectually complete. Those remain reviewer responsibilities.
- A fixed review-duration promise would have the same evidential weakness as a universal line cap. No mandatory number of minutes is proposed.

## How should large mechanical changes and multi-repository work be handled?

### Takeaway

Organize by coherent behavior and safe integration boundaries. Do not confuse a repository boundary, directory owner or generated diff volume with an obligation to create a separate fragmentary PR for every path.

### Cited Findings

- Google's small-change guidance allows larger trusted automated refactors and deletions, normally separates substantial refactoring from behavior changes, and describes both horizontal and vertical decomposition. Its requirement is that the submitted system still works, not that every layer must be its own review. — [Google: Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- GitHub's stacked-PR guidance recommends planning coherent dependent layers, checking each layer, linking the stack context and reviewing prerequisites first. It offers a method for organizing dependencies rather than a requirement to split every feature by file or owner. — [GitHub: Stack code changes in pull requests](https://docs.github.com/en/pull-requests/tutorials/stack-code-changes-in-pull-requests)
- GitHub supports marking generated files with `linguist-generated` so they are hidden in diffs by default. That is a presentation feature, not a guarantee of correctness. — [GitHub: Customizing how changed files appear](https://docs.github.com/en/repositories/working-with-files/managing-files/customizing-how-changed-files-appear-on-github)

### Inferences

- **Generated output:** identify the authoritative input, generator/version and reproducibility check. Keep required generated output with its source. Review the input/generator and consequential output changes; do not count all generated lines as new design, or hide manually edited logic as generated.
- **Moves and formatting:** isolate substantial mechanical work from functional changes where practical. Show evidence that a move preserves content/behavior, including imports and build paths. A rename can affect runtime loading, ownership or packaging even when the body is unchanged.
- **Tests and docs:** they consume review effort and are not automatically harmless, but should not become separate PRs solely to meet a source-line budget. Generated reference pages need source freshness; handwritten tests still need correctness review.
- **A complete capability:** a profile operation may reasonably span its domain operation, assets interface usage, persistence adapter, composition, route, tests and guide in one repository PR. One ownership boundary is not one directory. Split a truly independent prerequisite or unrelated behavior, not the explanatory thread of the operation.
- **Multiple repositories:** use linked repository PRs under one concise change plan. Name owners, dependency versions, compatibility states and merge/release/adoption order. Avoid assuming simultaneous merges or deployments. Prefer a compatible producer addition, verified release, consumer adoption and eventual cleanup over an undocumented lockstep cutover. This is a proposed coordination policy, not a measured PR-size formula.
- **Large cohesive work:** explain why the boundary is cohesive, where substantive changes are, which parts are mechanical and how reviewers should traverse it. The reviewer may request a clearer split, but an arbitrary `large-pr` permission label adds no correctness evidence.
- **Staging-to-master promotion:** do not apply an implementation-PR line cap to the accumulated promotion diff. Review the included PRs/commits, exact selected artifacts, combined checks and production consequences. Previously reviewed constituents are useful evidence; they do not excuse unreviewed additions or changed release inputs.

### Gaps

- These sources do not establish an optimal number of repositories, reviewers or stack layers per change. Coordination boundaries must follow the actual contracts and release topology.
- No changes to organization or original-app PR rules, labels, release rules or CI were made by this research.
