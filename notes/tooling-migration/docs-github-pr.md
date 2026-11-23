Import only the organisation-owned guides into `github/`: community defaults, native workflow templates, the read-only export caller and a pointer to the maintained publishing-key guide in tooling. Shared implementation and release guides now belong in the separate tooling section.

The export is from `unset-sh/.github:docs/site/` and root `LICENSE` at `0e49c58b61370a33429c802064c205589f0619ce`, proposed in [organisation setup PR #6](https://github.com/unset-sh/.github/pull/6). `github/source.json` preserves that exact source revision and SHA-256 hashes. The `.github` → `github/` reserved-name exception is recorded in the framework contribution policy; the export never replaces the framework's `.github/` directory.

Validation against current docs main `c8ff515f13d9291cc5552bbac059fa172c153e6a`: clean dependency installation, 176 Node tests, 19 Python tests, workflow/map guards, production build (16 HTML pages), preview build (23 pages), navigation checks and all six source-file hashes pass. The source's hosted cross-repository export also passed with matching page hashes.

Keep this draft until organisation setup PR #6 and its [tooling dependency](https://github.com/unset-sh/tooling/pull/1) are reviewed. The website is already live; this additional section has not been deployed. Shared tooling has its own source-owned import. No publishing credential or automatic delivery is added.

Docs impact: no update needed — This change refreshes only a source-owned documentation section; framework behaviour and instructions remain unchanged, and the section carries its own maintained explanations.
