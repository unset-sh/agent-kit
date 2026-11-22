# AGENTS.md

Every assistant working in this repository (Claude, Cursor, Codex or another) follows, in this order:

1. [`CLAUDE.md`](CLAUDE.md): what this repository is for and its own rules.
2. Every file in [`.claude/rules/org/`](.claude/rules/org/): the unset.sh organisation's rules. Tools that do
   not load that folder by themselves must read it before starting work.

The procedures in `.claude/skills/org-*/SKILL.md` describe jobs that repeat across repositories, such as
preparing a release. Read the one that fits before doing that job.

Files under `.claude/rules/org/`, `.claude/skills/org-*/`, `.claude/agents/org-*` and `.claude/agent-kit/` are
copies of a release of `unset-sh/agent-kit` and are checked by CI. Never edit them here.
