# Bring the older repositories up to the organisation rules

Date: 2026-11-23. Working material, excluded from the distributed kit. Asked by Alex: "go through the repo, look at
the rendering repo and these things, and make sure that it's following like the rules that we set, and that it's
using bun as well". He asked for one pull request per repository, done autonomously overnight, for his review.

Checked against `rules/org.md`, `rules/working.md`, `skills/org-new-repo`, `skills/org-kit-update`, org-0005,
org-0007, org-0010, org-0011, org-0012, and Alex's decision that Bun replaces Node across the organisation
(2026-11-23). The split with the "Move org tooling and workflows to Bun" thread (agent-kit PR #29): that thread owns
tooling, `.github` and agent-kit's own runtime, every release workflow and every tooling pin. This thread owns
package scripts, lockfiles, `bunfig.toml`, rule conformance, and the install step of each content repository's
non-release workflows, which has to change together with the lockfile.

Every check result below was run locally on Bun 1.4.4, the version `.bun-version` pins (1.4.5 is inside the 7-day wait until 2026-11-26), and,
where stated, in a fresh clone of the pushed branch. No workflow has run on GitHub for these branches yet.

## Pull requests, in review order

| # | Repository | Pull request | What it does | Must land before promotion to `main` |
| --- | --- | --- | --- | --- |
| 1 | rendering | [#8](https://github.com/unset-sh/rendering/pull/8) | Bun; brand 0.1.0 from GitHub Packages (replaces the git pin Bun cannot install); kit copy; CLAUDE.md/AGENTS.md from the template; README names backend/web and the org-0010/0012 release flow | Tooling's release-chain PR: `release.yml` still runs `npm ci`/`npm pack` |
| 2 | brand | [#9](https://github.com/unset-sh/brand/pull/9) | Bun with the 7-day release age it lacked; kit copy; CLAUDE.md/AGENTS.md; AI plan moved out of `docs/` | Tooling's release-chain PR, as above |
| 3 | lexicons | [#5](https://github.com/unset-sh/lexicons/pull/5) | Bun with the 7-day age; CLAUDE.md (none existed); AGENTS.md from the template; kit copy; workflow permissions per `org-new-repo` | None |
| 4 | profile-recipes | [#10](https://github.com/unset-sh/profile-recipes/pull/10) | Bun with the 7-day age; setup-bun in `validate`, `dco` and `docs-mirror`; kit copy | Alex's decision on setup-bun in the deploy-key job (below) |
| 5 | docs | [#13](https://github.com/unset-sh/docs/pull/13) | CLAUDE.md and AGENTS.md (neither existed); kit copy. No Bun yet (below) | None |
| 6 | pds | [#4](https://github.com/unset-sh/pds/pull/4) | CLAUDE.md, AGENTS.md, kit copy, a CI job that checks the copy | None |
| 7 | deployment | [#5](https://github.com/unset-sh/deployment/pull/5) | Kit copy, AGENTS.md from the template, a CI job that checks the copy | None |
| 8 | .github | [#20](https://github.com/unset-sh/.github/pull/20) | Map: the adopting repositories use agent-kit (the rename landed through #19) | None |
| 9 | agent-kit | [#33](https://github.com/unset-sh/agent-kit/pull/33) | This gap list; the brand plan moved from brand | None |

Every Bun conversion migrated `package-lock.json` to `bun.lock` with `bun install`, so resolved versions did not
change; rendering's was compared entry by entry. Each CI job checks `bun --version` against `.bun-version`, requires
`bun.lock` before installing, and gives setup-bun no cache and no token, as the tooling thread found setup-bun
v2.2.0 needs.

## Gap list by repository

### rendering

| Gap | Rule | State |
| --- | --- | --- |
| Node 26, npm, `node --test`, `package-lock.json` | Bun replaces Node | Fixed in #8 |
| `@unset-sh/brand` pinned to a git commit; Bun cannot install it (integrity mismatch) | Pinned, released inputs | Fixed: #4 (merged into staging 2026-11-23) took brand 0.1.0 from GitHub Packages; #8 builds on it for Bun |
| Brand 0.1.1 (the new contract, Graphite palette, no `plum`) not taken | Use the current brand | Open: changes every drawing, needs its own PR with gallery review |
| No agent-kit copy, no `sync.mjs --check` | `org-new-repo`, `org-kit-update` | Fixed in #8 |
| CLAUDE.md names `Undefined6799/unset` as consumer and decider; says "no licence file yet"; no Rules or Commands | Template; do not design around the current app | Fixed in #8 |
| No AGENTS.md | `org-new-repo` | Fixed in #8 |
| README describes a tag-triggered release that waits for Alex | org-0010, org-0012 | README fixed in #8; `release.yml` itself is the tooling thread's |
| `docs/renderer-trial.md` reads as research material | org-0005 | Open: flagged, not moved (the rule does not authorise moves) |
| The dated `@takumi-rs` age exception ends 2026-11-28 | Its own approval | Carried over as exact `@2.22.1` entries; remove on or after 2026-11-28 |

### brand

| Gap | Rule | State |
| --- | --- | --- |
| Node, npm, `package-lock.json`; one test shells out to `npm pack` | Bun replaces Node | Fixed in #9 (the test packs with `bun pm pack` and lists the archive) |
| No 7-day release age, no `ignore-scripts` in `.npmrc` | 7-day wait for third-party packages | Fixed in #9 |
| No kit copy, no AGENTS.md | `org-new-repo` | Fixed in #9 |
| CLAUDE.md says presentation; not in template shape | org-0011; template | Fixed in #9 |
| `docs/superpowers/plans/` held an AI implementation plan | org-0005 | Fixed: moved unchanged to `notes/brand-contract-guide/plan.md` here |
| `docs/verification.md` is a dated verification record | org-0005 | Open: flagged, linked as maintained docs today |
| `release.yml` and `pages.yml` | Bun | `pages.yml` install step done in #9; `release.yml` is the tooling thread's |

### lexicons

| Gap | Rule | State |
| --- | --- | --- |
| Node, npm, no 7-day age | Bun; 7-day wait | Fixed in #5 |
| No CLAUDE.md; AGENTS.md held the repository's rules | Template | Fixed in #5 |
| Workflow had `permissions` at the top level, `ubuntu-latest`, an npm cache | `org-new-repo` workflow rules | Fixed in #5 |
| Security reports pointed at the app's policy | Organisation security policy | Fixed in #5 |
| Schemas still sourced from `Undefined6799/unset` | org-0007 names lexicons the intended authority via an explicit cutover | Open: Alex's decision |
| `main`/`drafts` branches (Alex, 2026-11-23) not recorded | org-0012 decision 3 still says `staging` | Open: needs a record superseding it, and Alex's branch settings change |

### profile-recipes

| Gap | Rule | State |
| --- | --- | --- |
| Node, npm, no 7-day age, no `ignore-scripts` | Bun; 7-day wait | Fixed in #10 |
| No kit copy | `org-kit-update` | Fixed in #10 |
| `docs-mirror` runs setup-bun (a third-party action) in the job that later holds `DOCS_DEPLOY_KEY` | Security-sensitive workflow | Open: Alex decides, or the export moves to a key-less job as tooling's exporter does |
| `AGENTS.md` here is for members' assistants, not the kit template | Template vs. repository rule | Open: kept, as CLAUDE.md requires |
| `DESIGN-REVIEW.md` reads as an AI review report | org-0005 | Open: flagged; the README sends readers to it first |
| Schemas copied from `Undefined6799/unset` | Lexicons authority | Fixed on staging by #7: schemas now come from `unset-sh/lexicons`; editor limits still from the app |

### docs

| Gap | Rule | State |
| --- | --- | --- |
| No CLAUDE.md, no AGENTS.md, no kit copy | `org-new-repo` | Fixed in #13 |
| Node 26 / npm 11.20 pinned in `engines` and `packageManager` | Bun | Open: the publishing workflow's brand update rewrites `package-lock.json`, so the lock move is part of that workflow's reviewed conversion (tooling thread). Tests already pass on Bun, 198 of 198 |
| Main-only under org-0010 but `staging` is still the default | org-0010 cutover | Open: Alex's settings change |
| Brand taken as a GitHub archive at a commit | Pinned inputs | Kept: the README records Alex's approval of this route |

### pds

| Gap | Rule | State |
| --- | --- | --- |
| No CLAUDE.md, AGENTS.md, kit copy or CI | `org-new-repo` | Fixed in #4 |
| Map says the app runs and deploys the PDS | org-0007: deployment does | CLAUDE.md fixed in #4; map entry is #11's |
| No image yet | Its own job | Open: future work |

### deployment

| Gap | Rule | State |
| --- | --- | --- |
| No kit copy; bootstrap AGENTS.md with pinned links | `org-kit-update` | Fixed in #5 |
| Not in `repos.json` on `staging` | Keep the map current | In open `.github` #11 |

### .github map

| Gap | State |
| --- | --- |
| `presentation` entry, package and references | Fixed on staging by #19 |
| Adopting repositories did not list agent-kit | Fixed in #20 |
| backend, web, deployment missing; `messaging` and `server-kit` still listed | Open `.github` #11 |

### Not in this pass

backend and web have the same kit gap as deployment, but they belong to the app-migration workstream. Workflow-level
Bun conversion, release chains and tooling pins belong to the tooling thread.
