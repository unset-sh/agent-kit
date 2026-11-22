Import the maintained developer-tooling guides into `tooling/` and align the framework's authored workflow explanations with the approved repository split.

The exported section comes only from `unset-sh/tooling:docs/site/` and root `LICENSE` at `0366edb2d04d5c24c19319770893b413d172567b`, proposed in [tooling PR #1](https://github.com/unset-sh/tooling/pull/1). `tooling/source.json` records the exact source revision and SHA-256 hashes. The import preserves other source sections and framework implementation files.

Separate authored documentation edits update the shared-CI and publishing-key references in `content/updates.md`, `.github/DOCS-UPKEEP.md` and `.github/CUTOVER.md`. The documentation-impact checker remains docs-owned until a separately reviewed integration. Automatic adoption, credentials and release approvals are unchanged.

Move three AI working design/plan notes out of `.github/` into `agent-kit:notes/docs-site/`, byte-for-byte with source revision and hashes, as required by the owner's notes policy. Their preservation is included in [agent-kit PR #8](https://github.com/unset-sh/agent-kit/pull/8); review that alongside the deletions. Maintained human runbooks stay here.

Validation against docs main `c8ff515f13d9291cc5552bbac059fa172c153e6a`: clean dependency install, 176 Node tests, 19 Python tests, workflow/map guards, documentation-impact gate, production/publication builds (17 HTML pages), preview build (24 pages), navigation checks and all imported provenance hashes pass.

This is a documentation import, not workflow adoption or a live deployment. Review the tooling implementation before merging this source snapshot. [Docs PR #2](https://github.com/unset-sh/docs/pull/2) independently narrows the organisation-owned `github/` section.
