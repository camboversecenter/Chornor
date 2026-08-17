# Chornor Documentation

This folder contains detailed documentation for the Chornor personal finance
app. Chornor (ចំណូលចំណាយ, "income and expenses") is a dual-currency (Khmer Riel
and US Dollar) finance manager built for the Cambodian market. It runs as an
offline-capable web app: guests work fully offline against browser storage,
while signed-in users get cloud sync through Supabase.

Chornor is a community project owned by the student team Tomorrow Rich Together
and incubated by the CamboVerse Center, which is located at the National
University of Management. It is free to use and licensed under Apache-2.0.

## How to read these docs

Start with the architecture overview, then the user roles document, then the
individual feature documents. Each feature document explains what the feature
does, who can use it, the data it stores, and how it works under the hood.

## Index

### Foundations

- [Architecture overview](./architecture.md)
- [User roles and access](./user-roles.md)

### Operations

- [Migrating to a new Supabase project](./supabase-migration.md)

### Features

- [Dashboard](./features/dashboard.md)
- [Transactions](./features/transactions.md)
- [Categories, Family, and Settings](./features/categories-family-settings.md)
- [Lending](./features/lending.md)
- [Savings](./features/savings.md)
- [Crypto and Wallet](./features/crypto-and-wallet.md)
- [Community Hub](./features/community.md)
- [Admin Panel](./features/admin.md)
- [External App API](./features/external-api.md)
- [AI features (Google Gemini)](./features/ai-gemini.md)
- [Notifications and reminders](./features/notifications.md)

## Quick facts

| Item | Value |
| --- | --- |
| Currencies | KHR (៛) and USD ($) |
| Reference exchange rate | 1 USD = 4100 KHR (`EXCHANGE_RATE` in `src/constants.ts`) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Supabase (Auth, Postgres with RLS, Realtime, Edge Functions) |
| AI engine | Google Gemini (`gemini-2.5-flash`) |
| Web3 | Thirdweb in-app wallet on Base, plus a self-custodial wallet module |
| Local storage key | `chornor_data_v1` |
| Current version | 0.02 (Beta) |

## A note on accuracy

These documents describe the code as it currently stands, including its beta
limitations. Where a feature is partially implemented or stores data locally
rather than in the cloud, the relevant document says so plainly. The older
technical notes in `src/doc/TECHNICAL_SPEC.md` remain in the repository for
reference, but this folder is the primary, up to date documentation.
