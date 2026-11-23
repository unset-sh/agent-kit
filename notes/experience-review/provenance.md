# Where the experience review came from

The review system arrived as PR #9 (opened 2026-11-22 from a Codex session under Alex's account). Its
description records the request:

> Alex requested a reusable review system focused on whether design advice about feelings is
> implemented, then directed that it belong in agent-kit with a `docs/` folder for human documentation
> export on 2026-11-22. The role boundaries, evidence statuses and illustrative wording are
> implementation choices for review.

Alex's own words for that request are not in this Claude project's chat, so the quote above is PR #9's
account, not his verbatim message. Nothing in it asks for named, installed subagents: the seven roles were
an implementation choice.

PR #32 took #9 over on 2026-11-23. On review, the seven perspectives moved from `agents/org-experience-*.md`
(installed into every repository, each description always loaded) into
`skills/org-experience-review/perspectives/`, and the coordinator runs each as a fresh general subagent.
Only the skill's own description is always loaded.
