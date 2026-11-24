# Web and mobile: is `apps/web` + `apps/server` the right shape?

Research note, 2026-11-24, for Alex's question "is it the best way for having a mobile and web app?".
Builds on the monorepo proposal (agent-kit #49, `monorepo/proposal.md`). No code or repository changes.

## Short answer

Yes. Keep SvelteKit (`apps/web`) and Elysia (`apps/server`) as separate apps. That split is what makes a mobile
app cheap later, because the server is already the one place that holds sessions, AT Proto tokens and product
operations. Three things change when mobile arrives, and none of them argue for merging:

1. **Mobile talks to the server directly**, not through web. Web stays the browser's BFF.
2. **The server becomes reachable from the internet for the mobile app** (through Traefik, bearer sessions),
   while web keeps its private mTLS link.
3. **The member API needs a compatibility promise**, because installed app versions lag behind deploys.

Recommended mobile stack: **Expo (React Native)**, in `apps/mobile`, using Eden for types, Better Auth's Expo
plugin for the session, and the server as the AT Proto OAuth client. Capacitor wrapping a Svelte SPA is the
fallback if reusing Svelte UI matters more than a native feel.

## 1. Who calls what

```
browser ──cookie──> apps/web (SvelteKit SSR, BFF) ──mTLS + forwarded session──┐
                                                                               ├─> apps/server: member API group
iOS/Android ──bearer session over HTTPS (Traefik)──────────────────────────────┘        (one contract, Eden/OpenAPI)
third parties ──scoped tokens──> api.unset.sh ──> apps/server: public group (later, own record)
```

- **Web as the browser's BFF is the right call.** The AT Proto OAuth guide says "the BFF pattern is the currently
  recommended approach for building confidential-client applications", and confidential clients get long-lived
  sessions; public clients' "session lifetime will be limited" ([atproto.com/guides/oauth](https://atproto.com/guides/oauth)).
  It also keeps tokens out of the browser and gives SSR for public profile pages.
- **Don't route mobile through web.** Web's server routes would only proxy, adding a hop and a second copy of every
  endpoint. Microsoft's BFF guidance says not to add a BFF when "interfaces make the same or similar requests to
  the backend" and warns "code duplication is a probable outcome of this pattern"
  ([Microsoft Learn, updated 2026-11-09](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)).
- **Don't build a separate mobile BFF yet.** Sam Newman's "one backend per user experience" is the counter-view
  ([samnewman.io](https://samnewman.io/patterns/architectural/bff/)): he would "strongly consider" a mobile BFF from
  the outset. But his case is a team per client and heavy aggregation. Here one person owns everything, and web
  and mobile need the same operations (profile, posts, feeds, settings). A mobile-only route group can be added
  later inside the server, without a new app, if mobile ever needs different shapes.
- **Comparable products.** Bluesky's own app has no BFF in the data path: one Expo codebase for iOS, Android and
  web calls AT Proto services directly ([social-app](https://github.com/bluesky-social/social-app); its `package.json`
  on main today: Expo 58, React Native 0.88). The Expo blog's Elysia example (100cims) has the Expo app call an
  Elysia + Drizzle server through Eden with bearer auth
  ([expo.dev blog](https://expo.dev/blog/app-architecture-with-expo-router-elysiajs-and-nativewind)). Unset is
  different from Bluesky because it has its own server state (Better Auth, 2FA, OpenFGA, private content), so the
  app must go through the server, not straight to the PDS.

## 2. Auth on mobile

**Recommended: the server stays the only AT Proto OAuth client.** The app opens the system browser
(`expo-web-browser`, ASWebAuthenticationSession / Custom Tabs) at the server's existing sign-in start; the PDS
redirects back to the server's callback, exactly as for web; the server creates the Better Auth session (with the
2FA step) and returns to the app by deep link with a **one-time code** that the app exchanges for the session.

- Better Auth supports this directly: `@better-auth/expo` server plugin, the app scheme in `trustedOrigins`, session
  kept in SecureStore, and OAuth returning to the app by deep link
  ([better-auth.com/docs/integrations/expo](https://better-auth.com/docs/integrations/expo), docs for 1.7.28, Expo SDK 55).
  org-0015 already allows a bearer session without a cookie. Better Auth's bearer plugin is "intended only for APIs
  that don't support cookies" ([bearer docs](https://better-auth.com/docs/plugins/bearer)), which is what a native
  client is.
- Why not `@atproto/oauth-client-expo` on the device: it is Bluesky's real, maintained package (npm latest 0.2.16, first
  published 2025-10-06, still updated), but it makes the app a **public** client with DPoP tokens on the phone. That gives shorter
  PDS sessions and a second copy of the member's PDS tokens outside the server, where they are sealed today. It is
  the right tool for an app with no backend, which Unset is not.
- To decide when mobile starts (security, needs its own record): use universal/app links rather than a bare custom
  scheme for the return (custom schemes can be claimed by another app), bind the one-time code to PKCE, and decide
  session lifetime and device sign-out for phones. Device encryption keys (messaging) stay in the platform
  keychain/secure enclave, matching the web rule that device keys stay on-device.

## 3. Exposing the server

Today the server is private behind mTLS. Mobile changes that, so plan for it rather than discover it:

- Traefik routes only the member API prefix from the internet (say `app.unset.sh` or `unset.sh/api/app`), with
  rate limits; internal-only routes stay mTLS-only. The server already verifies every forwarded session itself
  (Alex, 2026-11-23), so the member API is already written as if the caller were untrusted. That decision pays off here.
- This is a separate surface from the planned public `api.unset.sh` (third-party, scoped tokens). Keep them as two
  groups with two contracts, as the proposal already does.

## 4. Contract and versions

- Eden works in Expo (Elysia documents an Expo integration with `treaty<app>()`,
  [elysiajs.com/integrations/expo](https://elysiajs.com/integrations/expo)), so `apps/mobile` gets the same types
  through the workspace as web. The generated OpenAPI stays the contract for anything not in TypeScript.
- **The real cost:** web deploys together with the server; an installed app does not. Once a mobile build ships,
  the member API can only change additively, with a deprecation window, or by a new route. The planned
  breaking-change check against the last release (OpenAPI drift plan, 2026-11-23) becomes a hard gate for that
  group. Add a minimum supported app version the server can enforce.

## 5. Mobile framework options

| Option | Reuse from web | Fit for Unset | Verdict |
|---|---|---|---|
| **Expo / React Native** | Brand tokens (JSON/CSS values), Eden types, domain logic in `packages/*`. Not the Svelte components. | Native feel for feeds, chat, push; Bluesky's own stack and its maintained AT Proto packages; Better Auth and Elysia both document it; native modules for keychain/secure enclave. | **Recommended.** |
| **Capacitor + Svelte SPA** | Svelte components and brand CSS. | Kit docs: "You can turn a SvelteKit SPA into a mobile app with Tauri or Capacitor", served from a local static host ([svelte.dev/docs/kit/project-types](https://svelte.dev/docs/kit/project-types)). So no SSR and no `load` on the server: the mobile build must call the server API anyway, and web's server code doesn't carry over. Webview feel for scrolling feeds. | Fallback if UI reuse wins. Would be a separate SPA app sharing a `packages/ui`. |
| **Tauri mobile** | Same as Capacitor. | Officially supports SvelteKit as a static SPA ([v2.tauri.app](https://v2.tauri.app/start/frontend/sveltekit/)); mobile side younger, Rust toolchain. | Not now. |
| **Native Swift + Kotlin** | Nothing but the API contract. | Best feel, two codebases for one person. | No. |

Trade-off to be honest about: Expo means React for mobile while web is Svelte, so UI is written twice. What is
shared is everything below the UI: contract, types, brand tokens, validation, product rules on the server. For a
social app with feeds, messaging and push, that is the usual and better trade.

## 6. Unverified, needs a spike before `apps/mobile`

- Expo's Metro bundler with Bun workspaces and Bun's isolated linker (Expo documents monorepos,
  [docs.expo.dev/guides/monorepos](https://docs.expo.dev/guides/monorepos/); I did not verify the isolated linker).
- Eden's `app.d.ts` type and the Elysia catalog pin inside an Expo build.
- The deep-link one-time-code hand-off with Better Auth's Expo plugin and our own AT Proto sign-in (not Better
  Auth's social providers).

## What this changes now

Nothing in the monorepo proposal. Keep `apps/mobile` "later". Two small things worth keeping in mind while building:
write member API routes as public-grade (validation, rate limits, no trust in "only web calls this"), and keep
product logic in the server or `packages/*`, never in SvelteKit `load` functions, so mobile gets it for free.
