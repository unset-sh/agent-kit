# CLAUDE.md: unset-sh/<name>

<!-- Copy this file to the repository root as CLAUDE.md, fill the angle brackets from the repository's entry in
     repos.json (unset-sh/.github), then delete this comment. Keep it short: the organisation's rules already
     load from .claude/rules/org/, and the map holds the detail. -->

## Where this repository fits

This is `unset-sh/<name>`: <one-line summary from repos.json>.

- **Belongs here:** <the owns list, shortened>.
- **Does not belong here:** <what> (that is `unset-sh/<repo>`); <what> (that is `unset-sh/<repo>`).
- **Uses:** <repo> through <how>. **Used by:** <repo>.
- **Licence:** <"follows the organisation rule", or name what here is not AGPL-3.0-only and why>.

The map of every unset.sh repository is <https://github.com/unset-sh/.github/blob/main/MAP.md>. Read it before
moving work between repositories or starting work that might belong elsewhere.

**Keep the map current.** When a change here adds, removes or moves a responsibility, changes what this
repository uses or ships, or renames or archives it, open a pull request on `unset-sh/.github` that updates
`repos.json` (run `bun run map` there) and update this section to match.

## Rules

<!-- Only what is specific to this repository. Do not restate the organisation's rules. -->

- <rule>

## Commands

```sh
<the one command that runs every check>
bun .claude/agent-kit/sync.mjs --check
```
