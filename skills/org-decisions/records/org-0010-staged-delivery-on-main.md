# org-0010. Staged delivery onto main, with four repositories working on main

Status: accepted (2026-11-23, Alex: "The stage delivery, that's fine. We can do that. The draft says master, but
we'll be using the main branch."; on which repositories work on main alone, "Yeah, okay, I agree with those. make
them similar, make them like the appropriate way."; on release approvals, 2026-11-23: "for the production deploy, and
then for the push to the lexicon, uh, let's make it a rule that the AI is not going to do it under unless I authorize
it")

## Context

On 2026-11-22 Alex chose staged delivery. These are his words from that discussion, as drafted in agent-kit pull
request 14, which was never merged:

> Yes — staging is the default development branch; master is the stable production/release branch

> PR's on staging can be automatically approved by AI but anything going on prod need 1 click of a human to merge staging into master

> Yes — human merge is the single approval; release and deployment run automatically afterward

> it can just be a rule in claude.md
>
> for the identity issue with github

> also we will require a separate staging release that can be automated

Every organisation repository was then given a `staging` default branch and a protected `main`. On 2026-11-23
Alex confirmed the policy but kept the name `main` for production. He expects a merge into `main` to run through
the repository's own automation: "once I approve the merge onto main, I'm expecting the code to like run through
its own automation. So likely like publish its release as well once it reaches main."

He also found that a staging branch does not fit every repository. On tooling: "we're gonna like uh, create tools
and then use them right away … I think it's important that we can test the tool as we are building them. So may
as well not have a staging bench." On agent-kit: "it's going to be your kind of your memory, so I don't feel like
we need like releases there." Asked which other repositories are like tooling, he agreed with the proposal:
agent-kit, `.github` and docs as well.

## Decision

1. **Staged repositories.** brand, rendering, lexicons, pds, backend, web, deployment and profile-recipes use
   `staging` as their default development branch and `main` as their production branch. Ordinary work enters
   `staging` through pull requests, which a reviewer other than the author may merge after the required checks.
2. **Promotion.** Production changes only through a same-repository `staging` to `main` pull request, and only
   a person merges it. Agents may prepare, test and review a promotion. They never merge it, enable auto-merge,
   queue it, or go around it by direct push, cherry-pick or tag. Because agents act through the owner's account,
   this is a written rule in the shared rules, not something GitHub can enforce.
3. **That merge is the release decision.** After it, the repository's own automation builds and publishes what
   the repository ships. A bad release is fixed by a new version; tags never move. Where a `release` environment
   asks for an Approve click:
   - for brand and rendering, an agent may press it after the owner's merge ("in brand and rendering and stuff,
     it's not that much of a big deal to me");
   - for a production deploy and for publishing lexicons to the network, no agent approves, triggers or merges
     anything that leads to it unless Alex has authorised that release himself.
4. **Staging prereleases.** A repository that publishes something has a separate, automated staging prerelease
   channel. It never updates a stable channel or a production deployment. A repository that ships nothing does
   not invent a package or an image.
5. **Lexicon drafts.** Whatever reaches lexicons `main` is published to the network, where it can no longer be
   changed, so drafts for the next app or feature must stay off the network. Alex: "it will be nice to have a draft
   branch for when we're designing the next app or feature of the app. So that way we know we can draft like some
   lexicon, but we don't submit it right away on the network." Lexicons `staging` is that draft branch. Its
   prereleases serve staging consumers only, and nothing on it is published to the network.
6. **Main-only repositories.** tooling, agent-kit, `.github` and docs have no `staging` branch and publish no
   releases. Work goes straight into `main` by pull request, and only a person merges it. Their consumers pin a
   full commit on `main`: tooling's reusable workflows, the kit's files, the organisation map and the docs site.
7. This supersedes the separate release-environment approval kept by org-0006 decision 5, and the `master`
   name in the unmerged staged-delivery draft. org-0006's ownership, pinned references and reviewed consumer
   updates remain in force.

## Consequences

- Promotions use merge commits, never squash, so every commit on `staging` stays reachable from `main`. Caller
  pins taken from `staging` keep resolving after promotion. In a repository that drops `staging`, the branch is
  deleted only after a promotion that merged it into `main`.
- The main-only cutover runs in order for each of the four repositories:
  1. Promote `staging` to `main`.
  2. Make `main` the default branch and remove the staging ruleset.
  3. Re-pin callers to tooling commits that accept `main`, which is tooling pull request 17.
- How the kit installer pins a commit is a separate reviewed change, so this record names no mechanism.
- The environment's Approve click is the one step GitHub reserves for Alex by name, because agents act through
  his account. It stays on the release environments for lexicons and production deploys, and an agent never
  presses it there. For brand and rendering it may stay or go; an agent may press it. No approval gate is removed
  without the owner's decision.
- Whether lexicon drafts sit on `staging` or on a separate draft branch was put to Alex on 2026-11-23, with
  `staging` recommended. This record states the recommended option; a different answer is recorded before merge.
- What each repository ships, as proposed on 2026-11-23 and not separately decided:

  | Ships | Repositories |
  | --- | --- |
  | npm packages | brand now; rendering once it has a consumer; lexicons later |
  | Container images | pds, backend, web |
  | Deploys selected versions | deployment |
  | Nothing published | profile-recipes, plus the four main-only repositories |

  Each repository's first release workflow confirms its row.
- Bootstrapping a repository and switching it to this policy are explicit work. This record does not claim that
  any switch has happened.

References consulted 2026-11-23: [GitHub merge methods](https://docs.github.com/en/pull-requests/reference/pull-request-merges#squashing-and-merging-a-long-running-branch)
and [scheduled workflows run on the default branch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
