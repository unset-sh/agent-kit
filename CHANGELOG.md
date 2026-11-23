# Changelog

Each entry says what changes for a repository that takes the kit, in plain words. The kit has no releases:
a repository takes a commit of `main`, and reads here what changed since the commit in its lock.

Entries go under the date the change is merged into `main`, newest first, one heading per date.

## 2026-11-23

- Adds the skill `org-experience-review`, with seven reviewer perspectives inside it, for reviewing how a
  design supports orientation, competence, autonomy, trust, expression, comfort and satisfaction. Reports
  separate observed behaviour from emotional hypotheses and questions for later human testing. The
  coordinator runs each perspective as a fresh general subagent; none is installed as a subagent. Human
  guides live in agent-kit's `docs/` for the documentation site and are not installed.
- Adds `org-documentation`, the shared standard for human documentation: page templates, guidance for
  explaining architecture and code with worked examples, and an adoption checklist for a repository's own
  source paths and checks. Code, workflow and ownership changes come with related documentation or a
  reviewed reason it is still correct. A short pointer in the engineering principles loads the skill when
  needed. It enables no site checks, enrolls no repository and publishes nothing by itself.
- Agent-kit is managed by assistants and has no `staging`: its pull requests go straight into `main` and
  merge after a review by another thread. `org-kit-update` no longer says the owner merges kit changes.
- The kit is installed from a pinned commit of `main` instead of a release. `sync.mjs` takes a full commit
  id, fetches `main` with git, refuses a commit that is not on it, and copies the shipped files from that
  commit's tree. The lock records the commit instead of a version and a bundle hash. `org-kit-update` says
  how to pick a commit, adopt the kit from a clone checked to be on `main`, and update. Take a commit from
  this change on: an older commit brings the release-based `sync.mjs`, whose check cannot read the new lock.

The first version a repository can take. Adopting it gives:

- **Organisation rules** (`.claude/rules/org/org.md`): the licence rule, how the owner is named, how
  repositories meet, where decisions go, how releases are approved, and who handles keys and tokens.
- **Working rules** (`.claude/rules/org/working.md`): current documentation before memory, challenging a
  decision with evidence, no security shortcuts, branch and pull request habits, and when to stop and ask.
- **Engineering principles, in short** (`.claude/rules/org/principles.md`), with the three full documents in
  the skill `org-principles`.
- **Skills**: `org-new-repo` (set up a repository), `org-release` (prepare a release for approval) and
  `org-kit-update` (take a newer commit of the kit).
- **`sync.mjs`** and its lock file under `.claude/agent-kit/`, which install the kit and check the copy.

Remove from the repository's own `CLAUDE.md` any rule these files now state.

Also:

- Add org-0010: work enters `staging` and only a person merges it into `main`. That merge decides a
  release, and the repository's automation then publishes; releases are never re-tagged. tooling,
  agent-kit, `.github` and docs have no `staging` and no releases: their pull requests go straight to
  `main`, and consumers pin a `main` commit. The release rule now says this. A release environment approval
  is removed only when the owner decides it.
- Add org-0013: in agent-kit, a review thread other than the author merges pull requests into `main`
  after the checks pass; Alex no longer merges them. Every other repository keeps org-0010.
- Add org-0012: agents may press Approve for brand and rendering releases, but never approve, trigger or
  merge toward a production deploy or a lexicon publication unless the owner authorised that release.
  Lexicon drafts stay on lexicons `staging` and never reach the network. The release rule says so.
- Add org-0011: `presentation` is now `rendering`, and `unset-sh/tooling` replaces `unset-sh/workflows`.
- Add org-0007: backend, web and deployment have separate ownership behind small capability contracts.
  The proposed server-kit and standalone messaging repositories are dropped.
- Work branches are cut from the freshly fetched default branch, pull requests land on `staging`, and only
  the owner merges `staging` into `main`. The working rules, `org-new-repo` and `org-release` say so; a
  release starts when the owner's promotion reaches `main`.
- Clarify that checked, generated-only map refreshes need no separate owner approval. Source declarations and
  generator changes retain normal review. Register the dedicated organisation Markdown publisher separately
  from the JSON-only website snapshot path; neither may rewrite authored meaning or bypass merge restrictions.
- Make the AI working-material rule explicit for plans, drafts, notes, reviews and supporting artifacts in
  every format. They stay in agent-kit; a consumer's `docs/` is for maintained human documentation.
- Add `org-brand-request` and org-0008. Agents request missing shared design tokens or brand assets through
  brand issues, coordinate provider work and verify the released result in the consumer. The handoff lives
  in agent-kit, and `AGENTS.md` points to the relevant rules and skills. This does not start a queue monitor,
  publish a kit release or change installed consumer copies.
- Add `org-map-maintenance` and org-0009. Register maps with their authoritative sources and refresh them
  through shared tooling, with provenance, validation and visible freshness. Changed workflow YAML marks
  its digest-bound explanation for review. Automatic refresh does not infer ownership or rewrite human
  meaning; failed refreshes retain the previous successful output. Consumer integration remains separate.
- Add the `org-decisions` skill and preserve the accepted history in org-0001 to org-0004. Org-0003's
  separate workflows repository was superseded by org-0004's `.github` ownership; org-0006 now supersedes
  that implementation placement with the public `unset-sh/tooling` repository.
- Point current ownership to org-0006: shared CI, release and deployment implementations, helpers and
  tests live in tooling. `.github` retains organisation metadata, community defaults, workflow-picker
  templates and local metadata checks. Consumers keep small callers, build/test logic and reviewed pins.
  This kit change does not migrate callers, change signer verification, enable automatic adoption or
  publish a release. Existing owner release approvals remain required.
- Add org-0005: keep AI plans, notes and review reports in agent-kit under `notes/<task>/`, and supporting
  artifacts under `artifacts/<task>/`, outside the distributed kit. Maintained human docs belong in the
  owning repository's `docs/` and export to `unset-sh/docs` for publication. The shared standard that
  org-0005 names, `org-documentation`, is not in the kit yet.
  Historical files are not moved or deleted by this rule alone.
