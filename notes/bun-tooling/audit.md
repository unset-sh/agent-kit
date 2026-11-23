# Bun audit: org tooling and CI workflows

Date: 2026-11-23. Scope: every `unset-sh` repository's GitHub workflows, package scripts, shared tooling and the
kit's `sync.mjs`. Asked by Alex: "look where Bun can be applied, and then we're going to start by fixing this and
upgrading the workflows". This reorders the migration plan: tooling moves first, not last.

## How this was checked

Each repository was checked out at its current default-branch commit. Its own test files and check scripts were run
under **Bun 1.4.4**. The plan named 1.4.5, but it was released on 2026-11-19 and is still inside the 7-day wait, so 1.4.4 is what gets pinned; the release tests also pass on 1.4.5. Repositories
with dependencies were installed with `bun install --frozen-lockfile --ignore-scripts` into a scratch copy, reading
their existing `package-lock.json`. `node --test` files were run with `bun test` without editing them. Nothing ran
on GitHub. Release, publish and docs-push behaviour was **not** exercised and stays unverified until a workflow run.

The action to install Bun is `oven-sh/setup-bun`; its latest tag is `v2.2.0` at
`0c5077e51419868618aeaa5fe8019c62421857d6` (from `git ls-remote`, to re-confirm when pinning).

## Results by repository

| Repository | Node/npm today | Under Bun | Work needed |
| --- | --- | --- | --- |
| tooling | 17 workflows on `setup-node`; scripts run by `node`; `node --test` | 377 of 386 pass. The 8 failures are all release-archive tests that locate npm next to `process.execPath`, plus one that runs real `npm ci`/`npm pack` | Non-release workflows move now. The release chain (pack, attest, publish) is its own PR: archive tests must be re-proved against `bun pm pack` and Bun's extractor |
| agent-kit | `ci.yml` on `setup-node`; `node --test` | 55 of 56 pass. The failure runs `process.execPath --check sync.mjs`, a Node-only syntax-check flag | Replace that one check; change the "Node built-ins only" and "Node 26" rules (Alex's decision) |
| .github | `org-map.yml` on `setup-node`; map scripts | 29 of 29 pass | Switch workflow and scripts; update its CLAUDE.md rule |
| docs | `ci.yml`, `site.yml` on `setup-node`; Hugo + Python tests | 198 of 198 pass; map and workflow checks pass | Switch; `engines`/`packageManager` pin npm 11.20 today. Brand comes as a GitHub tarball URL |
| lexicons | `check.yml`; `tsc`, Biome, `node --test` on `.ts` | 19 of 19 pass; `check.ts` passes | Switch; Bun runs the `.ts` scripts directly |
| profile-recipes | `validate.yml`, `docs-mirror.yml`, `dco.yml` | 51 of 51 pass; 15 recipes valid | Switch; Playwright previews not exercised |
| rendering | `ci.yml`, `release.yml` with `npm pack`/`npm publish` | 77 of 77 pass once brand is present; gallery builds | **Install fails**: brand is a git dependency and Bun's GitHub tarball does not match npm's recorded integrity. Move to an exact `@unset-sh/brand` version from GitHub Packages. Release waits for the tooling release PR |
| brand | `ci.yml`, `pages.yml`, `release.yml`; changesets | 40 of 41 pass; build and syntax checks pass | The failure is `npm pack --dry-run` in a test, which moves to `bun pm pack`. Site build (Vite/Svelte, Hugo) not exercised. Release waits for the tooling release PR |
| backend, web, deployment, pds | Only `branch-policy.yml` (a tooling caller) | Nothing to run | Bump the tooling pin once tooling's branch-policy runs on Bun |

## What changes in tooling's shared contracts

These are caller-visible, so they go in tooling's `CHANGELOG.md`. Callers pin full commits, so every caller keeps
working until it moves its own pin.

- **Runtime version file.** `.nvmrc` becomes `.bun-version` (`setup-bun`'s `bun-version-file`). Shared workflows read
  the caller's file where they read `.nvmrc` today.
- **`ci-check`.** The `install` input runs `bun install --frozen-lockfile --ignore-scripts`; the default command
  becomes `bun run check`. Input and check names stay the same.
- **`branch-policy`.** `shell: node {0}` becomes `shell: bun {0}`; its pinned `node-version: 26.12.0` becomes the Bun pin.
- **Lockfiles.** `package-lock.json` becomes the text `bun.lock`. The 7-day wait moves from `.npmrc` to `bunfig.toml`
  (`minimumReleaseAge`, with `@unset-sh/*` excluded). Rendering's dated `@takumi-rs` exception ends 2026-11-28 and
  should not be carried over if the move lands after that.
- **Tests.** `bun test` runs the existing `node:test` files unchanged. Smallest step: keep the imports and change only
  the runner; moving to `bun:test` can follow repository by repository.
- **GitHub Packages.** `setup-node` wrote the registry `.npmrc`; with Bun the `@unset-sh` scope and its read-only token
  go in `bunfig.toml` / `NPM_CONFIG_TOKEN`.

## Rules that name Node today

`agent-kit/CLAUDE.md` ("Node 26", "`node:test` only", "`sync.mjs` uses Node built-ins only"), `tooling/CLAUDE.md`
("Use Node 26", "Raising Node also raises npm..."), `.github/CLAUDE.md` ("Node 26"). Tooling docs: `use-workflows.md`,
`workflow-reference.md` (generated), `release-reference.md`, `release-channels.md`, `export-docs.md`, `map-refresh.md`,
and `workflows/descriptions.json`. Alex decided "Bun replaces Node everywhere" (2026-11-23); each rule change quotes that.

## Security-sensitive points

- **Release chain.** tooling's rules make publish behaviour Alex's decision. Today's hostile-archive tests prove our
  reader agrees with npm's (pacote). After the switch, they must prove it agrees with what `bun pm pack` writes and what
  `bun install` extracts. Until that PR lands, release workflows keep npm in the publish job.
- **`sync.mjs`.** Changing its runtime changes none of what it accepts, writes or fetches, but every refusal test must
  still pass under Bun, and the replacement for `--check` must still prove the copied script parses.
- **Install scripts.** Bun skips dependency lifecycle scripts unless the package is in `trustedDependencies` or Bun's
  own default trusted list (unverified against 1.4.5 docs). CI keeps `--ignore-scripts`, which skips all of them,
  including the root package's own.

## Proposed order (one repository per PR, drafts)

1. tooling: Bun for its own CI and every non-release shared workflow.
2. tooling: release chain on `bun pm pack` → `actions/attest` → `bun publish`, after the archive tests pass (Alex decides).
3. .github and agent-kit, each on the new tooling pin, with their rule changes.
4. docs, lexicons, profile-recipes, then brand and rendering (these two after step 2, for their releases).
5. backend, web, deployment, pds: bump the branch-policy pin.

## What was opened (2026-11-23, overnight)

Alex chose "release chain first" and asked for the rest to proceed autonomously, one PR per repository.

- unset-sh/tooling#20: release chain plus every shared workflow on Bun 1.4.4. Findings it pins in tests:
  `bun publish` sends the first `package/package.json` while `bun install` unpacks the last; a scope registry in
  the publish folder's `.npmrc` wins over `--registry`; `bun pm pack` writes size/time ending in a space and the
  checksum ending NUL-space (node-tar's form differs), and PAX headers for non-ASCII names; `bun publish` needs a
  `package.json` in its working folder even for a tarball; setup-bun v2.2.0 installs the latest Bun when the
  version file is missing; `bun install --frozen-lockfile` installs from package.json when there is no lockfile.
- unset-sh/.github#21: map scripts on Bun. Depends on tooling#20 for its four tooling pins.
- unset-sh/agent-kit (this PR): kit CI, tests and shipped instructions on Bun; `sync.mjs` unchanged.
- Content repositories' package scripts and lockfiles: the "Bring older org repos up to the rules" thread.
