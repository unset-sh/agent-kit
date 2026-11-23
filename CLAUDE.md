# CLAUDE.md: unset-sh/agent-kit

## Where this repository fits

This is `unset-sh/agent-kit`: the rules, skills and templates every unset.sh repository's assistant needs,
copied into each repository from a pinned commit of `main`.

- **Belongs here:** the organisation's rules, the engineering principles, skills and subagents for jobs that
  repeat across repositories, the organisation's decision records in `skills/org-decisions/records/`, the
  `CLAUDE.md` and `AGENTS.md` templates, the text of the Claude project instructions, and `sync.mjs`, which
  installs the kit at one commit of `main` in a repository and checks the copy; AI working notes in
  `notes/<task>/` and supporting artifacts in `artifacts/<task>/` (org-0005), kept here but excluded from the
  distributed kit.
- **Does not belong here:** a repository's own rules (its `CLAUDE.md`); the map of repositories (that is
  `unset-sh/.github`); a repository's own decision records; shared developer-tooling implementations
  (`unset-sh/tooling`, org-0006); another repository's maintained human documentation (its own `docs/`,
  exported to `unset-sh/docs`; the shared standard `org-documentation` is not released yet); anything
  written for members' assistants (that is `unset-sh/profile-recipes`).
- **Uses:** nothing. **Used by:** every organisation repository, as a committed copy under `.claude/` pinned by
  `.claude/agent-kit/lock.json`.
- **Licence:** follows the organisation rule.

The map of every unset.sh repository is <https://github.com/unset-sh/.github/blob/main/MAP.md>. Read it before
moving work between repositories or starting work that might belong elsewhere.

**Keep the map current.** When a change here adds, removes or moves a responsibility, changes what this
repository uses or ships, or renames or archives it, open a pull request on `unset-sh/.github` that updates
`repos.json` (run `bun run map` there) and update this section to match.

## The organisation's rules

Other repositories load a copy of these. Here they are the source, so they are imported, not copied:

@rules/org.md
@rules/working.md
@rules/principles.md

## Rules

- **The test for what ships:** would an assistant working in any organisation repository need it, whatever
  that repository is? Task-specific AI notes and artifacts stay here under `notes/` and `artifacts/`, outside
  the kit. Product-specific rules and maintained human documentation stay in the repository that owns
  the product and export to `unset-sh/docs` (the `org-documentation` standard is not released yet).
- **What ships is text a person can review in a diff.** Only `.md` files under `rules/`, `skills/` and
  `agents/`, plus `sync.mjs`. No hooks, no MCP server definitions, no settings files, no scripts inside skills,
  no skill line that runs a shell command, no `@path` import, and no front matter that grants tools. A
  subagent may set only `model` and `effort` beyond its name and description. The kit's own checks enforce
  this on what reaches `main`; `sync.mjs` does not re-check content when it installs. Changing it needs the
  owner's decision first: whoever can change this repository can steer every assistant in every repository.
- **Every always-loaded line is paid for in every session of every repository.** The files in `rules/` share
  a budget of 150 lines. A new rule has to earn its lines; anything longer belongs in a skill.
- **A rule states something Alex decided.** When you add or reword one from your own judgment, say so in the
  pull request so he can strike it. Write what to do and why, in plain words.
- **Nothing shipped may depend on one repository.** No step ids, folder names or tools that only one repository has.
- **Everything shipped carries an `org` name** (`skills/org-*`, `agents/org-*`), so a repository's own files
  never clash with the kit's.
- **`sync.mjs` uses only `node:` built-in modules, which Bun provides, and runs with `bun`**, and reads as an ordered sequence of checks. Every refusal has a test
  that shows it refusing. Changing where it may write, what it accepts or where it downloads from is a
  security decision: stop and ask.
- **A change that alters what a repository's assistant does** gets an entry in `CHANGELOG.md` under the
  date it merges, newest first. The kit has no releases and no `staging`: pull requests go straight into
  `main`, and whatever `main` holds is what a repository can take.
- **Assistants manage this repository** (Alex, 2026-11-23: "For the agent kit, you're allowed to manage it
  yourself"; "agent can merge ... to main without me"). This replaces the organisation rule that only the
  owner merges into `main`, here only. A pull request merges once its checks pass and a thread other than its
  author has reviewed its diff; the author never merges its own. Two kinds of change still need Alex's own
  words, quoted in the pull request, before it merges: one to what `sync.mjs` accepts, where it writes or
  where it fetches from; and one that relaxes a gate, an approval, or an identity, key or secret rule, here
  or in the shipped rules.
- Bun (`.bun-version`; Alex, 2026-11-23: "Bun is actually going to be replacing Node"), no dependencies, `bun test`
  only. Actions are pinned by full commit SHA.

## Commands

```sh
bun run check   # every check and test
```
