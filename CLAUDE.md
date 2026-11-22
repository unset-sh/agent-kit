# CLAUDE.md: unset-sh/agent-kit

## Where this repository fits

This is `unset-sh/agent-kit`: the rules, skills and templates every unset.sh repository's assistant needs,
released as one version and copied into each repository.

- **Belongs here:** the organisation's rules, the engineering principles, skills and subagents for jobs that
  repeat across repositories, the `CLAUDE.md` and `AGENTS.md` templates, the text of the Claude project
  instructions, and `sync.mjs`, which installs a release in a repository and checks the copy.
- **Does not belong here:** a repository's own rules (its `CLAUDE.md`); the map of repositories (that is
  `unset-sh/.github`); decision records (the organisation's decision set); CI workflows other repositories
  run; anything written for members' assistants (that is `unset-sh/profile-recipes`).
- **Uses:** nothing. **Used by:** every organisation repository, as a committed copy under `.claude/` pinned by
  `.claude/agent-kit/lock.json`.
- **Licence:** follows the organisation rule.

The map of every unset.sh repository is <https://github.com/unset-sh/.github/blob/main/MAP.md>. Read it before
moving work between repositories or starting work that might belong elsewhere.

**Keep the map current.** When a change here adds, removes or moves a responsibility, changes what this
repository uses or ships, or renames or archives it, open a pull request on `unset-sh/.github` that updates
`repos.json` (run `npm run map` there) and update this section to match.

## The organisation's rules

Other repositories load a copy of these. Here they are the source, so they are imported, not copied:

@rules/org.md
@rules/working.md
@rules/principles.md

## Rules

- **The test for what goes in:** would an assistant working in any organisation repository need it, whatever
  that repository is? If only one repository needs it, it stays in that repository.
- **What ships is text a person can review in a diff.** Only `.md` files under `rules/`, `skills/` and
  `agents/`, plus `sync.mjs`. No hooks, no MCP server definitions, no settings files, no scripts inside skills,
  no skill line that runs a shell command, no `@path` import, and no front matter that grants tools. A
  subagent may set only `model` and `effort` beyond its name and description. The kit's own checks enforce
  this on what it releases; `sync.mjs` does not re-check content when it installs. Changing it needs the owner's decision first: whoever can change this repository can
  steer every assistant in every repository.
- **Every always-loaded line is paid for in every session of every repository.** The files in `rules/` share
  a budget of 150 lines. A new rule has to earn its lines; anything longer belongs in a skill.
- **A rule states something Alex decided.** When you add or reword one from your own judgment, say so in the
  pull request so he can strike it. Write what to do and why, in plain words.
- **Nothing here may depend on one repository.** No step ids, folder names or tools that only one repository has.
- **Everything shipped carries an `org` name** (`skills/org-*`, `agents/org-*`), so a repository's own files
  never clash with the kit's.
- **`sync.mjs` uses Node built-ins only** and reads as an ordered sequence of checks. Every refusal has a test
  that shows it refusing. Changing where it may write, what it accepts or where it downloads from is a
  security decision: stop and ask.
- **A change that alters what a repository's assistant does** gets an entry in `CHANGELOG.md` under the next
  version, and `package.json` carries that version. Releases follow `skills/org-release/SKILL.md`, and a
  separate thread reviews the full diff since the last release before the tag.
- Node 26 (`.nvmrc`), no dependencies, `node:test` only. Actions are pinned by full commit SHA.

## Commands

```sh
npm run check                                              # every check and test
node scripts/bundle.mjs --commit "$(git rev-parse HEAD)"   # build dist/agent-kit.json as a release would
```
