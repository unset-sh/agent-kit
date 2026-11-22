# org-0002. docs.unset.sh shows only the organisation's docs

Status: accepted (2026-11-22, Alex: "I want it to be from the organisation docs only", "meaning the
documentation from the app repo should not be there", "its going to be documentation coming from the repos
within the unset-sh"; and his card choice at 02:49Z, "Keep it up until replaced")

## Context

docs.unset.sh is built in `unset-sh/docs` from what other repositories push into it. Today the only thing
pushed there is the app repository's (`Undefined6799/unset`) documentation, together with the site's framework
(Hugo setup, theme, front page) and its Pages workflow, all copied from the app by the app's docs-mirror job.
The app will be largely rewritten, and the organisation's repositories are where its lasting documentation
will come from.

## Decision

1. docs.unset.sh shows documentation from `unset-sh` repositories only. The app repository's documentation
   does not belong on it, and it stops sending its docs there. Its docs stay readable in the app repository.
2. The current site stays up until the organisation-only version is ready to replace it, so the site is never
   taken offline in between.

## Consequences

- The app's ADRs, runbooks and settings pages leave the public site at the switch.
- Planned by the docs pipeline thread, not decided by the owner, and open to change in review: the site's
  framework and Pages workflow move into the root of `unset-sh/docs`, written there by reviewed pull requests;
  each source repository keeps pushing only its own top folder, named after it, with its own deploy key; the
  switch waits until at least one organisation repository sends docs (first candidates `unset-sh/lexicons` and
  `unset-sh/profile-recipes`); then the app's job is removed first and the `unset-sh/docs` change follows, after
  which the owner deletes the app's deploy key and its `docs-mirror` environment.
- Until the switch, docs.unset.sh keeps serving the app's docs, updated on every app docs merge.
