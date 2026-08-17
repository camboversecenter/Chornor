# Architecture Overview

Chornor is a single-page React application backed by Supabase. It is designed to
work in two modes from the same codebase: a fully local guest mode, and an
authenticated cloud mode. This document explains the moving parts and how data
flows between them.

## Technology stack

- **Frontend:** React 19 with TypeScript, built by Vite, styled with Tailwind
  CSS 4. Charts use Recharts, icons use Lucide, animations use Motion, and
  dialogs use SweetAlert2.
- **Server:** a small Express server (`server.ts`) that serves the built SPA in
  production and hosts the Vite dev middleware in development. It does not hold
  business logic.
- **Backend:** Supabase provides authentication, a Postgres database with Row
  Level Security, Realtime subscriptions, and Deno Edge Functions for
  privileged operations.
- **AI engine:** Google Gemini (`gemini-2.5-flash`), called directly from the
  browser using an API key exposed through Vite's environment prefix.
- **Web3:** a Thirdweb in-app wallet on the Base chain, plus a standalone
  self-custodial wallet module under `wallet/`.

## Application shell

`src/App.tsx` is the entry component. It owns:

- **Authentication state.** It subscribes to `authService` and holds the
  current `UserProfile`, or `null` when nobody is signed in.
- **Routing.** Routing is lightweight and hand-rolled. A `TabView` enum maps to
  URL paths (for example `TabView.LENDING` maps to `/lending`), and navigation
  uses `history.pushState` with a `popstate` listener rather than a router
  library.
- **Top level data.** Categories, transactions, family members, the preferred
  currency, and notifications live in React state and are refreshed from the
  storage service.
- **Layout.** A desktop sidebar and a mobile navigation bar expose the feature
  tabs. The Admin tab only renders for admins.

## The storage service

`src/services/storageService.ts` is the heart of the data layer. It is a
singleton module that holds all app data in an in-memory `state` object, mirrors
it to `localStorage` under the key `chornor_data_v1`, and, for cloud users,
syncs with Supabase tables.

Key ideas:

- **Cloud vs local decision.** The helper `isCloudUser()` returns true only when
  the current user id does not start with `local_` and offline mode is off. All
  Supabase reads and writes are guarded by this check, so guest and local users
  never touch the network.
- **Generic table helpers.** `fetchTable`, `upsertTable`, and `deleteFromTable`
  provide a uniform way to read, write, and delete rows, filtered by `user_id`
  and keyed on the `_id` column.
- **Change notifications.** Components subscribe through
  `subscribeToDataChanges`. After any mutation the service calls
  `notifyDataChanged`, which triggers a UI refresh.
- **Realtime.** `subscribeToRealtimeUpdates` opens a Supabase Realtime channel
  so that changes made elsewhere (for example an approved external request) flow
  back into the app.

## Data flow strategy

Chornor uses a hybrid storage model:

1. **Guest and local users.** Everything is stored in `localStorage`. There is
   no network dependency, and the app is fully usable offline.
2. **Authenticated users.** Identity is managed by Supabase Auth (Google
   OAuth). Core data is loaded into the app state, and specific high value data
   (such as external transaction requests, the wallet whitelist, admin settings,
   and API clients) is synced through Supabase. Note that in the current beta,
   several write paths still target local state, with Supabase used at defined
   sync points rather than for every entity.

## Backend edge functions

Privileged work that must not run in the browser is offloaded to Supabase Edge
Functions in `supabase/functions/`:

- **`thirdweb-token`** mints a custom RS256 JWT so a Supabase user can log into a
  Thirdweb wallet. It checks the `wallet_whitelist` table before signing.
- **`thirdweb-jwks`** publishes the public key set that Thirdweb uses to verify
  those tokens.
- **`submit-transaction`** lets external apps post transactions into a user's
  account using an API key. See the External App API document.
- **`admin-action`** performs admin only operations such as toggling guest mode
  and fetching user statistics, after verifying the caller is an admin.

## Security model

- Supabase Row Level Security scopes each user's rows to their own `user_id`.
- Operations that require secrets (Thirdweb private key, service role key, admin
  listing of users) run only inside Edge Functions, never in the browser.
- The self-custodial wallet module keeps private key material inside a Web Worker
  and never exposes signing functions to the main thread.

## Repository layout

```
server.ts                 Express server that serves the SPA
index.html                App shell and small runtime polyfills
src/
  App.tsx                 Shell: auth, routing, layout, top level state
  types.ts                Shared TypeScript types for all entities
  constants.ts            Currencies, exchange rate, seed data
  components/             Feature UIs (Dashboard, Transactions, Lending, ...)
  services/               storageService, geminiService, authService, and more
  utils/                  Helper functions
  doc/                    Older technical spec and a services snapshot
supabase/
  functions/              Edge Functions (thirdweb-token, submit-transaction, ...)
  schema.sql              Database schema
wallet/                   Self-custodial wallet module (worker, crypto, passkeys)
docs/                     This documentation set
```
