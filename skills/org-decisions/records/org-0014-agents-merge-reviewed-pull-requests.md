# org-0014. Agents merge their reviewed pull requests; Alex keeps promotions

Status: accepted (2026-11-23, Alex: "Okay, stop asking me for every merge. I'm not reviewing them anyway, so
you're the one to kind of like skim them, review them, and then like push them if they're good. Anyway, you're
working on the staging branch, so what I'll do is that I'll go through a big review before I merge it into
main."; then "Yeah, let's make sure that like they check their PR before they push it, obviously.")

## Context

org-0010 lets a reviewer other than the author merge into `staging`, and says only a person merges into `main`,
including in the four main-only repositories. In practice every merge waited for Alex, who was not reviewing
them. He has said assistants should check and merge their own pull requests, and that his review happens once,
before he merges `staging` into `main`. Asked whether that covers the main-only repositories, which have no
`staging`, he confirmed through the coordinator that it does, provided each pull request is checked first.

## Decision

1. **Staged repositories.** An assistant merges its pull request into `staging` once it has checked it: it
   reads the full diff on GitHub, confirms the required checks pass, and confirms the pull request does only
   what its description says. No separate review thread is needed.
2. **Main-only repositories** (tooling, `.github`, docs; docs: see the open question below). The same check
   lets an assistant merge a pull request into `main`. agent-kit keeps org-0013: a thread other than the author
   reviews and merges.
3. **Promotions stay Alex's.** Only Alex merges `staging` into `main` in a staged repository. That merge is his
   review and his release decision, as org-0010 says.
4. **Unchanged gates.** org-0012 still applies: no agent approves, triggers or merges toward a production deploy
   or a lexicon publication unless Alex authorised that release. A pull request that relaxes a gate, an
   approval, or an identity, key or secret rule still needs Alex's own words quoted in it.
5. This replaces the "only a person merges it" part of org-0010 decision 5 for tooling, `.github` and docs, and
   the separate-reviewer requirement of org-0010 decision 1. The rest of org-0010 stays in force.

## Consequences

- The check is the author's own, so it must be real: the merged diff is the one read, and a failing, skipped or
  pending required check blocks the merge.
- Open question, for Alex: a merge into docs `main` rebuilds and publishes docs.unset.sh. Until he says whether
  that counts as a production deploy under org-0012, docs merges into `main` wait for his word.
- Merges into `main` of a main-only repository take effect at once for every caller that pins its `main`
  commits only when those callers re-pin through their own pull requests.
- Accepted records stay intact. org-0010 changes only through this record and org-0013.
