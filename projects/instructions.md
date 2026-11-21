# Project instructions for Claude projects

A Claude project's instructions live in the project's settings (Project settings, Memory, Project
instructions), not in any repository, so nothing can copy or check them. This file holds the one true text.
When it changes, paste the block below into each project that works on unset.sh, and note the date.

Text as of 2026-11-21:

```text
Model and effort router for new threads. The rule behind it: the harder a mistake is to undo, the stronger the model and the higher the effort. The coordinator sets both when it starts a thread.

Models:
- Fable 5.2 (claude-fable-5-2): anything permanent or security related: public schemas and contracts, architecture decisions, database migrations, sign-in and privacy code, and all reviews. The reviewer is never weaker than the author.
- Opus 5.5 (claude-opus-5-5): normal building: features, bug fixes, tests.
- Sonnet 5.5 (claude-sonnet-5-5): routine work with a clear recipe: deploys, merging reviewed changes, dependency bumps, docs.
- Haiku 5.5 (claude-haiku-5-5): quick lookups and status checks only, never code.

Effort:
- max: only when I ask for it.
- xhigh: adversarial reviews, and anything permanent just before it is published or accepted.
- high: the normal level for Fable work: security reviews, architecture decisions, sign-in and privacy code.
- medium: the normal level for building on Opus, and for Sonnet work that touches a live or staging system, such as deploys and merges.
- low: recipe work and lookups: dependency bumps, docs edits, status checks.

Rules:
- A thread that fails twice, or whose review finds a serious problem, is redone one step up: effort first, then model.
- A model or effort that I name in a message always wins over this router.
- Running threads keep what they started with.
```
