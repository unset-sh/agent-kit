# shadcn-svelte styled only by `@unset-sh/brand`, on Bun, under a strict CSP

Status: spike only, run 2026-11-24. No product repository was edited. Brief:
`notes/first-e2e-slice/cursor-spike-shadcn-brand.md` (project copy), run by Claude instead of Cursor because
Cursor's environment had no package token.

**Result: it works.** A SvelteKit 3.2.0 app built and served with Bun 1.4.4 renders Button, Input, Label,
Card, Dialog, Dropdown Menu, Tooltip, Sonner and a server-validated form entirely from brand 0.1.1's CSS, in
both themes, under `default-src 'self'; script-src 'self' 'nonce-…'; style-src 'self'` with no
`'unsafe-inline'`, `'unsafe-hashes'` or `'unsafe-eval'`. Nothing needed `'unsafe-inline'`. Four setup
details are required and are not in brand's README; they are listed under "What the slice must copy".

The scratch app's own files, the measuring scripts, raw results and screenshots are in
`artifacts/web-ui-spike/`. The 64 shadcn-svelte files are not duplicated there (see "Components").

## What the slice must copy

1. **`$lib` alias.** SvelteKit 3 removed `$lib` (build error `module_removed_lib`, "Use `#lib` instead").
   Every shadcn-svelte file imports `$lib/utils.js`. Keeping them unchanged needs
   `alias: { '$lib': 'src/lib' }` in `sveltekit({…})`, which works but warns `config_option_deprecated_alias`
   ("will be removed in a future version"). Source: `@sveltejs/kit` 3.2.0
   `src/messages/build-errors.js` `module_removed_lib`, `src/messages/build-warnings.js`
   `config_option_deprecated_alias`. The alternative, rewriting `$lib/` to `#lib/` when copying, changes
   upstream files. Decide this before the slice; I recommend the alias until Kit removes it.
2. **`ssr: { noExternal: ['tw-animate-css'] }` in `vite.config.ts`.** Without it the SSR build fails:
   `"." is not exported under the conditions ["node", "module-sync", "import"] from package tw-animate-css`.
   `tw-animate-css` 1.4.0 exports only a `style` condition (its `package.json`). In the SSR environment Vite
   8.3.5 treats the package as external and resolves it with `externalConditions`, not the `style` condition
   `@tailwindcss/vite` 4.3.5 asks for (`vite/dist/node/chunks/node.js` `oxcResolvePlugin`;
   `@tailwindcss/vite/dist/index.mjs`). Adding `style` to `environments.ssr.resolve.conditions` did not help.
   Brand's gallery never hits this because it is a client-only Vite build.
3. **Replace `mode-watcher` with a five-line shim.** The upstream `sonner.svelte` imports
   `mode` from `mode-watcher` for its theme. Reading `mode.current` makes mode-watcher 1.1.0 write
   `style.colorScheme` on `<html>` from the operating-system preference, so a dark brand page on a light OS
   got `color-scheme: light` (`mode-watcher/dist/states.svelte.js` lines 46 and 56). Rendering its
   `<ModeWatcher>` to control it is worse: it also writes `data-theme=""` on `<html>`
   (`states.svelte.js` line 83, `mode.js` line 50), wiping brand's theme attribute, and on change it inserts a
   `<style>` element that `style-src 'self'` blocks (`without-transition.js`). The fix keeps `sonner.svelte`
   unchanged: alias `'mode-watcher'` to `src/lib/theme/mode.svelte.ts`, which exports `mode.current` read from
   `data-theme` and updated by a `MutationObserver`. With it, `color-scheme` follows `data-theme` in all four
   OS/server combinations tested (`scripts/cs.mjs`), and `mode-watcher` is not installed.
4. **CSP details.**
   - Replace SvelteKit's default `<div style="display: contents">` in `app.html` with
     `<div class="contents">`. The inline `style` attribute is blocked (`style-src-attr`).
   - SvelteKit's route announcer `#svelte-announcer` is created from a template with an inline `style`
     attribute (`@sveltejs/kit` 3.2.0 client root, via Svelte's `create_fragment_from_html`), so the browser
     blocks the style and logs one violation per page load. Unfixed, the announcer would be visible after a
     client navigation. `app.css` repeats the same declarations for `#svelte-announcer`; after navigation it
     measured 1×1 px and held the new title. The console violation remains; there is no Kit option to avoid it
     that I found. If a `report-to` endpoint is added, expect this one report per load.

## Setup

Versions (third-party ages from the npm `time` field, 2026-11-24; all older than 7 days):

| Package | Version | Published |
| --- | --- | --- |
| Bun | 1.4.4 (`38afee6c8`) | |
| `@unset-sh/brand` | 0.1.1 | GitHub Packages |
| `@sveltejs/kit` | 3.2.0 | 2026-11-10 |
| `@sveltejs/adapter-node` | 6.0.2 | 2026-11-10 |
| `svelte` | 5.57.3 | 2026-10-26 |
| `vite` | 8.3.5 | 2026-10-21 |
| `@sveltejs/vite-plugin-svelte` | 7.3.1 | 2026-09-23 |
| `tailwindcss`, `@tailwindcss/vite` | 4.3.5 | 2026-11-06 |
| `bits-ui` | 2.20.6 | 2026-11-05 |
| `tailwind-variants` | 3.3.1 | 2026-08-03 |
| `tw-animate-css` | 1.4.0 | 2025-09-24 |
| `svelte-sonner` | 1.2.0 | 2026-08-14 |
| `cn` | 0.5.0 | 2026-10-16 |

`cn` and `svelte-sonner` are not in the brief's list; they are what the pinned components import (`utils.ts`
re-exports `cn` from `cn`, as brand's gallery does). `bun add` without a version pulled `typescript` 7.0.2;
I removed it. No type check (`svelte-check`, `tsc`) was run: **not run**.

`bunfig.toml` (committed form; exactly the brief's scope line, plus brand's own install policy with the one
exemption the organisation rule allows):

```toml
[install]
exact = true
ignoreScripts = true
minimumReleaseAge = 604800
minimumReleaseAgeExcludes = ["@unset-sh/brand"]

[install.scopes]
"@unset-sh" = { url = "https://npm.pkg.github.com", token = "$GITHUB_PACKAGES_TOKEN" }
```

No `.npmrc`. Token: `GITHUB_PACKAGES_TOKEN` was **not set** in this environment. The environment's outbound
proxy injects a read-only credential for `npm.pkg.github.com`, so I ran installs with the variable set to a
placeholder string, and `@unset-sh/brand@0.1.1` installed (`bun.lock` records the GitHub Packages tarball and
its sha512). How Bun 1.4.4 behaves with Alex's real token, or with the variable unset and no proxy, is
**unverified here**.

`vite.config.ts`, `src/app.html`, `src/app.css`, `src/lib/theme/mode.svelte.ts` and the rest are in
`artifacts/web-ui-spike/app/`. The CSS order, as brand's README gives it:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@unset-sh/brand/tokens.css";
@import "@unset-sh/brand/shadcn.css";
@import "@unset-sh/brand/tailwind.css";
@import "@unset-sh/brand/recipes.css";   /* with data-recipes="true" on <html> */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

then brand's README base rules (`html` ground/ink, `body` font, links) and the announcer rule. The
`@custom-variant` line is required, not optional: `shadcn.css` uses `dark:` throughout (for example
`.cn-input` `dark:bg-input/30`). Brand's gallery imports in a different order (`shadcn.css` first,
`tw-animate-css` last; `site/gallery/src/theme.css` at `v0.1.1`); the README order worked.

`<html lang="en" class="style-vega" data-recipes="true" data-theme="dark|light">`. The spike's
`hooks.server.ts` picks the theme from `?theme=` so both themes are server-rendered; the slice decides how a
member's choice is stored.

### Components

Copied, not generated. All 64 files of `button`, `input`, `label`, `card`, `dialog`, `dropdown-menu`,
`tooltip`, `sonner`, `field` and `separator` came from brand `v0.1.1` `site/gallery/src/lib/registry/ui/`,
and each matched its sha256 in `site/gallery/upstream.json`, which pins shadcn-svelte commit
`c3b21a62055c7d7b97a220eb5a9efb4d1b7fc8fc`. The icon adapter (`src/lib/components/icon`, `icon-placeholder`)
and `$brand-icons` alias (to `@unset-sh/brand/icons/tabler`) also came from the gallery, because `sonner`
and `dialog` import `icon-placeholder`.

The shadcn-svelte CLI cannot add components "at that commit". `shadcn-svelte` 1.8.1 (read from its npm
tarball, not run) fetches built registry JSON from a URL, `https://shadcn-svelte.com/registry` by default
(`components.json` `registry`), and defaults to style `nova`. A source commit is not a served registry, so
using the CLI at the pin would mean building and hosting the registry ourselves. **CLI not run.**

The form uses `Field` (`Field.Field`, `Field.Label`, `Field.Description`, `Field.Error`) with a SvelteKit
form action and `use:enhance`; the older `form` component needs Formsnap and Superforms, which I did not add.

## Results

Commands, all with Bun only (`node` was not used):

```sh
bun install                          # bunfig above
bunx --bun vite build                # exit 0; warns config_option_deprecated_alias
PORT=4173 ORIGIN=http://localhost:4173 bun build/index.js
bun scripts/csp.mjs | measure.mjs | nav.mjs | cs.mjs | fonts.mjs | attrib.mjs   # Playwright 1.63.0
```

Browser: Playwright's Chromium 158.0.8127.36, headless. **Firefox: not run** (not installed here, and the
environment forbids installing Playwright browsers). **Safari: not run.**

1. **Build and run on Bun.** Build exit 0; `bun build/index.js` served the page and the form action. Fonts
   come from the bundle: `SpaceGrotesk-Variable.*.woff2` and `JetBrainsMono-Variable.*.woff2` are emitted
   under `_app/immutable/assets/`, the page requested only `http://localhost:4173` URLs, and
   `document.fonts` reported Space Grotesk `loaded`.
2. **Brand drives everything** except Sonner's description text. `artifacts/web-ui-spike/states.md` lists
   58 states across both themes with the brand palette token each computed colour equals (matched against
   `dist/resolved.json`), WCAG contrast and font. Summary: primary actions are `ink` on `ground` inverted;
   secondary and dialog surfaces `surface-raised`; inputs `surface-sunken` with `line-strong` borders;
   muted text `ink-muted`; errors and destructive `danger`; focus a 2 px `ink` outline (recipes) or a 3 px
   `ink`/50 % ring plus `ink` border (no recipes).
   **Override test:** a copy of `tokens.css` under `src/` with dark `--ink: #ff00ff`, imported in place of
   the package file, turned every `ink`-derived state magenta (buttons, labels, titles, inputs' text, focus,
   tooltip, menu, dialog, toast title): `screenshots/override-ink-dark.png`. The only text that did not
   follow was the toast description. The copy was removed afterwards.
3. **Strict CSP** (`kit.csp` `mode: 'nonce'`; header as sent:
   `default-src 'self'; connect-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none';
   script-src 'self' 'nonce-…'; style-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`).
   With the setup above, the only violation in either theme across load, hover, focus, form error, tooltip,
   menu open/close, dialog open/trap/close, toast and theme toggle is the announcer's one `style-src-attr`
   per load (`csp-chromium.json`).
   - Bits UI floating content (Dialog, Dropdown, Tooltip) is not server-rendered while closed, and its
     positioning writes styles through CSSOM (`element.style`), which CSP allows. No violation.
   - Svelte 5 sets dynamic `style={…}` through `style.cssText` (CSSOM), so Sonner's `--normal-bg` style on
     its `<ol>` and per-toast variables apply without violation; they render client-side only.
   - A static `style="…"` in a Svelte template is blocked (that is the announcer's case), because Svelte
     builds templates with `innerHTML`. Bits UI's Command components contain such attributes
     (`command-item.svelte`, `command-group-items.svelte`, `command-link-item.svelte`: `display: contents`);
     they were not in this spike and would need the same treatment.
   - Svelte transitions (`transition:fly`, `in:fade`) run through the Web Animations API: two animations
     ran, no `<style>` element was added, no violation. Component `<style>` blocks compile to external CSS
     (SvelteKit's default), checked on `/other`.
   - shadcn-svelte's own motion is `tw-animate-css` classes, so it is plain CSS.
4. **Accessibility basics** (Chromium, measured from computed colours composited over the nearest opaque
   background, WCAG 2.1 relative-luminance formula; disabled controls excluded as WCAG allows):
   - Focus visible in both themes: recipes give a 2 px `ink` outline, 9.5:1 to 16.4:1 against its
     background. Without recipes, the 3 px `ring`/50 % ring measured 3.70:1 (dark) and 3.34:1 (light), above
     the 3:1 non-text minimum, plus a solid `ink` border.
   - Dialog: six Tabs from the first field stayed inside the dialog; Escape returned focus to the trigger.
   - Text: lowest pairs were destructive button text 5.05:1 (dark) and 5.36:1 (light), field error 6.06:1 and
     6.81:1, muted text 6.53:1 to 7.16:1. All pass 4.5:1.
   - Not checked: screen-reader output, zoom/reflow, reduced motion, touch target size.

## Hard-coded values found

App source: none outside brand variables (`grep` for hex, `rgb`, `hsl`, `oklch`, `font-family` over `src/`;
the only hit is `font-family: var(--font-sans)`). The 64 shadcn files contain none.

Built CSS (`scripts/attrib.mjs` attributes each literal to its source file):

| Source | What | Effect |
| --- | --- | --- |
| `@unset-sh/brand` `tokens.css` | 57 palette values, both font families | expected |
| `@unset-sh/brand` `shadcn.css` | `#000` masks in scroll-fade gradients; `oklch(from var(--primary) …)` for chat bubbles | not visible colour; bubbles unused here |
| `tailwindcss` 4.3.5 `theme.css` | shadow colours `rgb(0 0 0 / .05–.25)` (`--shadow-*`), `#0000` resets | `shadow-xs` on inputs and outline buttons, `shadow-md` on menus and dialogs: black at low alpha, not brand |
| `tailwindcss` preflight | `--default-font-family` system stack | overridden by `body { font-family: var(--font-sans) }` |
| `svelte-sonner` 1.2.0 `Toaster.svelte` | about 40 colours (`--gray1`–`--gray12`, rich-colour `hsl()` sets, `#3f3f3f` and `hsl(0, 0%, 91%)` description text) and a system font stack | toast description colour is Sonner's, not brand's; font is brand's only with `recipes.css` (without it the toast used `ui-sans-serif`) |
| shadcn `dropdown-menu-content` + brand `shadcn.css` `.cn-menu-translucent` | not a literal: `**:data-[variant=destructive]:text-accent-foreground!` | a `variant="destructive"` menu item is drawn in `ink`, not `danger`, in both themes |

Without `recipes.css`, an `aria-invalid` input has a `danger` border. **With** recipes its border stays
`line-strong` and only a faint `danger` ring shows (2.25:1 dark, 1.33:1 light). The label and error text
still turn `danger`, so the state is not conveyed by colour alone, but the field itself barely changes.

## Brand requests

Following `org-brand-request`, these would go to `unset-sh/brand` issues. None was filed by this spike.

1. **Sonner adapter in the package.** Map Sonner's variables (`--normal-*`, `--success-*`, `--warning-*`,
   `--error-*`, `--info-*`) and its description colour to brand roles in `shadcn.css` or `recipes.css`. Today
   the gallery does this with an inline `style` string in `site/gallery/src/samples/sonner.svelte`, which a
   consumer must copy and which a CSP-safe app should not repeat as an attribute.
2. **Invalid inputs under recipes** keep a visible `danger` border, as the non-recipe adapter does.
3. **Destructive menu items** in translucent menus: confirm that drawing them in `ink` is intended, or
   restore `danger`.
4. **Shadows**: decide whether `shadow-xs`/`shadow-md` should come from a brand token, since Tailwind's
   black shadows are the remaining non-brand colour on components.
5. **README**: document the `@custom-variant` line as required, the `$brand-icons` alias the copied
   components need, and `ssr.noExternal` for `tw-animate-css` in SvelteKit. Note that the upstream Sonner
   wrapper depends on `mode-watcher`, which conflicts with `data-theme`.

## Not verified

- Firefox and Safari: not run. Chrome (branded) not run; Chromium headless only.
- Behaviour with the real `GITHUB_PACKAGES_TOKEN` and no proxy.
- Type checking, lint, and any dev-server (`vite dev`) CSP behaviour; only the production build was served.
- The shadcn-svelte CLI.

### Check for Alex on a Mac (Safari, and Firefox if installed)

1. Make a folder from `artifacts/web-ui-spike/app/` at this commit. Copy the ten component folders listed
   under "Components", plus `src/lib/components/icon` and `icon-placeholder`, from
   `unset-sh/brand` tag `v0.1.1` `site/gallery/src/lib/` into the same paths under `src/lib/`.
2. With `GITHUB_PACKAGES_TOKEN` exported in the shell (never pasted anywhere):
   `bun install && bunx --bun vite build && PORT=4173 ORIGIN=http://localhost:4173 bun build/index.js`.
3. In Safari, enable Develop › Show Web Inspector, open `http://localhost:4173/?theme=dark`, keep the
   Console open, and: Tab through the page; hover "Hover me"; open the menu and use the arrow keys; open the
   dialog, Tab six times, press Escape; submit "x" in the form; press "Show toast"; press "Toggle theme";
   follow "Other page" and press "Toggle transition". Repeat with `?theme=light`.
4. Expected: one CSP message per page load about an inline style (the announcer), nothing else; focus
   outlines visible; the dialog keeps focus and returns it to "Open dialog"; fonts are Space Grotesk.
   Report any other console line.
