# org-0016. Agents merge checked docs pull requests into main

Status: accepted (2026-11-23, Alex: "yes have agent publish docs into main since its what allows it to be update")

## Context

org-0014 lets an assistant merge its checked pull request into `main` in tooling and `.github`, but held docs
back: a merge into docs `main` rebuilds and publishes docs.unset.sh, and org-0012 keeps production deploys for
Alex. org-0014 left that as an open question. Asked whether agents may merge docs pull requests into `main`,
Alex said yes, because that merge is what keeps the site up to date.

## Decision

1. docs joins tooling and `.github` under org-0014 decision 2: an assistant that has checked its pull request
   (full diff read, required checks green, it does only what it says) merges it into docs `main`.
2. Publishing docs.unset.sh after that merge is not a production deploy under org-0012. org-0012 still covers
   the product's production deploys and lexicon publication.
3. This answers org-0014's open question. The rest of org-0014 stays in force.

## Consequences

- Imported source documentation and docs-owned changes reach the public site without waiting for Alex. What a
  source repository exports is still reviewed in that repository first, and the import receiver only proposes
  pull requests; each import pull request is checked like any other before it merges.
- A wrong page is fixed by the next merge.
