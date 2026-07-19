# Chornor (ចំណូលចំណាយ)

**Chornor** is a dual-currency personal finance web app built for the Cambodian
market. The name (*chomnool chomnay*) means "income & expenses" in Khmer, and
Khmer Riel (KHR) and US Dollar (USD) are treated as first-class currencies
throughout every feature.

It is an offline-capable Progressive Web App. Guests get full functionality
backed by the browser's `localStorage`, while signed-in users (Google OAuth via
Supabase) get cloud sync and realtime updates.

## Features

- **Dashboard:** summary cards, expense charts, and AI-generated financial
  advice (in Khmer).
- **Transactions:** add/edit with itemized line items and recurring reminders,
  plus filtering and an analytics view. The form supports Gemini receipt
  scanning (photo becomes a parsed transaction) and AI category suggestion.
- **Lending:** loan tracking with generated amortization schedules (interest,
  principal, and balance per month, in both Riel and Dollar).
- **Savings:** savings goals with progress tracking and alerts.
- **Crypto:** portfolio tracker with live prices from CoinGecko, buy/sell
  history, and wallet integration.
- **Community:** a social feed where posts are AI-moderated before submission.
  Gemini also generates daily tip posts.
- **Admin:** user stats, third-party API key management, admin list, and a
  wallet whitelist.
- **External app integration:** third-party apps can POST transactions to a
  user's account (via `x-api-key`). These arrive as pending requests the user
  approves or rejects in-app.

## Architecture

- **Frontend:** React 19 with TypeScript, Vite, and Tailwind CSS 4, plus
  Recharts for charts, Lucide for icons, Motion for animation, and SweetAlert2
  for dialogs. `App.tsx` handles lightweight routing via `history.pushState`
  mapped to a `TabView` enum.
- **Server:** a small Express server (`server.ts`) that serves the SPA and
  proxies Google Gemini calls so the API key stays server-side.
- **Backend:** Supabase, providing Auth, Postgres with Row Level Security,
  Realtime, and Deno Edge Functions.
- **Data layer:** a singleton `storageService` abstracts localStorage vs.
  Supabase behind one API, using a pub/sub change-listener pattern.

### AI (Google Gemini)

Gemini powers financial advice, category suggestion, receipt parsing,
wallet-address extraction from images, community-post moderation, and daily post
generation. Calls are proxied through the server to protect the API key.

### Web3 wallet

There are two tracks:

1. **Thirdweb in-app wallet** on Base, bridged to Supabase Auth via custom
   RS256 JWTs (the `thirdweb-token` and `thirdweb-jwks` Edge Functions, gated by
   a wallet whitelist).
2. **Self-custodial wallet** (`wallet/`) with BIP39 mnemonic generation, key
   derivation and signing isolated in a Web Worker (so secrets never touch the
   main thread), Argon2id-encrypted vaults tuned for low-end mobile, WebAuthn
   PRF passkey unlock, and a USDC-first payments design on Base and Base Sepolia.

## Project layout

```
server.ts                 Express server + Gemini proxy endpoint
src/
  App.tsx                 Main router/layout, auth + tab state
  components/             Feature UIs (Dashboard, Transactions, Lending, ...)
  services/               storageService, geminiService, authService, etc.
  doc/                    Technical spec, API reference, and a services snapshot
supabase/
  functions/              Deno Edge Functions (thirdweb-token, submit-transaction, ...)
  schema.sql              Database schema
wallet/                   Self-custodial wallet module (worker, crypto-core, passkeys)
```

## Run locally

**Prerequisites:** Node.js >= 20.19

1. Install dependencies:
   ```
   npm install
   ```
2. Configure environment variables (see `.env.example`). At minimum set your
   Google Gemini API key, and the Supabase URL/keys for authenticated mode.
3. Run the app:
   ```
   npm run dev
   ```

Other scripts: `npm run build` (Vite build plus an esbuild bundle of the
server), `npm start` (run the production bundle), and `npm run lint`
(`tsc --noEmit`).

## Notes

- The codebase started from a "Fitness & Heart Rate Tracker" prototype, so a few
  fitness remnants remain (for example the fitness fields on `UserProfile` and
  some unused helper components). The live finance features live in
  `src/services/geminiService.ts` and the feature components.
- Further technical detail is in `src/doc/TECHNICAL_SPEC.md` and
  `src/doc/API_REFERENCE.md`.
</content>
