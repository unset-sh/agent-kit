# Organisation architecture: chat record and implementation tracking

Recorded 2026-11-22. This is a readable synthesis of the architecture chat, not a verbatim transcript.
Only explicitly attributed quotations reproduce Alex's words. It separates decisions from research,
recommendations, inspected state and work still to perform.

## Authority and navigation

- [org-0007](../../skills/org-decisions/records/org-0007-backend-web-and-deployment-boundaries.md) records
  the owner-approved backend/web/deployment direction and replacement of the server-kit/messaging proposals.
- [org-0006](../../skills/org-decisions/records/org-0006-developer-tooling-lives-in-tooling.md) remains the
  accepted tooling decision. The implementation home is `unset-sh/tooling`, not `developer-tooling` or `.github`.
- [Chat synthesis](chat-synthesis.md) records the questions, corrections, conclusions and unresolved choices.
- [Implementation plan](plan.md) separates the approved organisation foundation from later product migrations.
- [Status ledger](status.md) tracks evidence and pending work without treating plans as deployed state.
- [Artifact provenance](artifacts.md) explains the eight preserved research/design documents and their limits.

Maintained human documentation belongs with each owning repository and exports to `unset-sh/docs` under
org-documentation. This task does not edit that publishing framework or write to the original application.
The live repository catalog belongs to `.github`; the tables here describe this task's decisions and dated
observations, not a replacement catalog.

## How to continue

Read org-0007, then the status ledger and the current organisation map. Verify the affected revision before
implementing an old finding. Update the ledger with exact commits, checks and consumer versions as work lands.
Preserve the imported documents and their snapshot hashes; explain later resolutions here rather than
rewriting the historical audit to imply those resolutions already existed.
