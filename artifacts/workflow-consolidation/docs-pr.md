Import the maintained workflow guides exported from `unset-sh/.github` at `b998c0ac303fa32b1752908ef58cb25968e4061a`, prepared in [the workflow consolidation PR](https://github.com/unset-sh/.github/pull/6). Only `github/` changes. Its `source.json` records the exact revision and file hashes; the source licence is included.

The source owns `docs/site/`; edits belong there and are re-exported. This import explicitly records the section-name exception **`.github:docs/site/` → `docs:github/`** because `.github/` is reserved for GitHub configuration. Align the pending framework contribution policy with this mapping when reconciling docs #1. No framework, workflow, or other repository's export is replaced here.

Keep this PR draft until the source is reviewed and the [organisation docs cutover](https://github.com/unset-sh/docs/pull/1) is ready. This is an additional source section; it does not replace the planned profile-recipes export or satisfy the requirement to verify that source's autonomous publishing job. No production deployment was performed.

Validation: source check **152/152 tests pass**; deterministic export from the committed tree; the exact exported section builds with docs framework `0d8d3ad903dd42718d0168e97836baaef8deb769` and pinned Hugo 0.168.0. Output validation checked nine HTML pages and local assets. Provenance hashes match all six exported source files. Diff check passes.

AI working notes and supporting evidence are maintained in agent-kit, not in this documentation section.
