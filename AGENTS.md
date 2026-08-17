# AGENTS.md

Guidance for AI coding agents and human contributors working in this
repository. Keep it short, follow it, and update it when conventions change.

## Project

Chornor (ចំណូលចំណាយ, "income and expenses") is a dual-currency (Khmer Riel and
US Dollar) personal finance web app for the Cambodian market. It works offline
for guests via `localStorage` and syncs to Supabase for signed-in users.

- **Owned by the student team Tomorrow Rich Together. Incubated by the CamboVerse
  Center, located at the National University of Management.**
- **License:** Apache-2.0. It is a free community project funded by
  support, donations, grants, and training.
- **Detailed docs:** see the `docs/` folder (architecture, user roles, and a
  document per feature). Read those before making non-trivial changes.

## Setup and commands

Node.js >= 20.19 is required.

| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev server (port 3000) | `npm run dev` |
| Production build | `npm run build` |
| Run production build | `npm start` |
| Type check / lint | `npm run lint` (`tsc --noEmit`) |

There is no automated test suite. `npm run lint` is the only static check, so
run it before committing TypeScript changes, and verify behavior by running the
app.

## Environment

- Copy `.env.example` to `.env` and fill in values. The app needs a Google
  Gemini API key (the client reads `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY`)
  and, for cloud mode, Supabase URL and keys.
- Vite only exposes variables prefixed `VITE_` or `GEMINI_` (see
  `vite.config.ts`).
- Never commit real secrets. Edge Function secrets (Thirdweb private key,
  service role key) live in Supabase, not in the repo.

## Architecture in brief

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4. `src/App.tsx` is
  the shell: it owns auth state, lightweight routing (a `TabView` enum mapped to
  paths via `history.pushState`), and layout.
- **Data layer:** `src/services/storageService.ts` is a singleton. It holds all
  state, mirrors to `localStorage` (key `chornor_data_v1`), and syncs to
  Supabase only for cloud users. The gate is `isCloudUser()`: ids starting with
  `local_` and offline mode stay local.
- **AI:** `src/services/geminiService.ts` handles all Gemini calls
  (`gemini-2.5-flash`), from the browser.
- **Backend:** Supabase Auth, Postgres with Row Level Security, Realtime, and
  Edge Functions in `supabase/functions/` (`thirdweb-token`, `thirdweb-jwks`,
  `submit-transaction`, `admin-action`).
- **Wallet:** `wallet/` is a self-custodial signer. Key derivation and signing
  run inside a Web Worker.

## Conventions

- **Bilingual UI.** User-facing labels are usually Khmer with an English gloss.
  Keep both when editing copy.
- **Dual currency.** Always handle both KHR (៛) and USD ($). The reference rate
  lives in `src/constants.ts` (`EXCHANGE_RATE`).
- **Types.** Shared entity types are in `src/types.ts`. Records are keyed by
  `_id`.
- **Style.** Match the surrounding code: functional components with hooks,
  Tailwind utility classes, and the existing naming.
- **Plain text, no em-dash.** In documentation, comments, commit messages, and
  user-facing copy, do not use the em-dash character. Use commas, colons, or
  periods instead.

## Security

- Anything requiring a secret or elevated privilege belongs in a Supabase Edge
  Function, never in the browser.
- Do not move wallet signing or private key handling out of the worker, do not
  re-export signing functions to the main thread, and do not log secrets.
- Do not weaken Row Level Security or the wallet whitelist checks in
  `thirdweb-token`.

## Licensing

- The project is Apache-2.0 (permissive). A NOTICE file records the copyright.
- Copyright is held by the student team Tomorrow Rich Together. Source files
  carry a short SPDX header, and new files must include it using the comment
  style that fits the file type:
  `SPDX-License-Identifier: Apache-2.0` and
  `Copyright (C) <year> Tomorrow Rich Together`.

## Git workflow

- Commit with clear, imperative messages.
- Do not open pull requests unless asked.
- Confirm the target branch with the maintainer before pushing.

## Known gotchas

- The repo was bootstrapped from a "Fitness & Heart Rate Tracker" prototype.
  Unused remnants remain (`DashboardOverview`, `src/utils/fitnessHelpers.ts`,
  `LiveSimulation`, and fitness fields on `UserProfile`). Do not build on them.
- `src/doc/services/` is a snapshot copy of `src/services/`. Edit the real code
  in `src/services/`, not the snapshot.
- `supabase/schema.sql` and `src/doc/DATABASE_SCHEMA.sql` contain corrupted
  bytes. `wallet/schema-wallet.sql` is the reliable schema file.
