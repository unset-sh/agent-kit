Import maintained organisation setup and workflow guides from `unset-sh/.github` at `a364702ca70ce6b8de4c28de233613a6ea47f420`, prepared in [the organisation setup PR](https://github.com/unset-sh/.github/pull/6). Only `github/` differs from current docs `main`. Its `source.json` records the exact revision and hashes of all eight source files; the source licence is included.

The source owns `docs/site/`; edit there and re-export. The existing framework contract explicitly maps **`.github:docs/site/` → `docs:github/`** because `.github/` is reserved for configuration. This import preserves the framework and all other source-owned sections.

The organisation documentation website is already live. Keep this additional section draft until the source PR is reviewed and merged. This PR does not change publication credentials or replace the profile-recipes publisher. No production deployment was performed here.

Validation: source check **152/152 tests pass**; exact export hashes verified; current docs framework checks pass **176 Node tests and 19 Python tests**, plus workflow/map validation. The local production build with Hugo 0.168.0 validates **16 HTML pages and local assets**, including the new section. An existing test mistakenly matches `/private` in local stack paths; the unchanged source passes in a clean checkout outside that path. Diff checks pass.

Docs impact: no update needed — this change imports source-owned documentation only; the framework, source-section mapping, rendering and publication behaviour are unchanged. The imported source documentation itself explains its new organisation defaults and reporting routes.

AI notes and supporting validation evidence remain in [agent-kit #8](https://github.com/unset-sh/agent-kit/pull/8).
