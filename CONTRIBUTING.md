# Contributing to Chornor

Thanks for your interest in Chornor (ចំណូលចំណាយ), a free, open-source personal
finance app for Cambodia. Contributions of all kinds are welcome: bug reports,
features, docs, translations, and design.

By contributing, you agree that your contributions are licensed under the
project's [Apache License 2.0](./LICENSE).

## Getting started

**Prerequisites:** Node.js 20.19 or newer.

```bash
git clone https://github.com/camboversecenter/Chornor.git
cd Chornor
npm install
cp .env.example .env      # then fill in your own values
npm run dev               # starts the app on http://localhost:3000
```

You can use the app as a guest with no accounts or keys. Cloud sync, AI, and the
wallet need the matching env vars set (see `.env.example`). Never use production
credentials for local development, and never commit your `.env`.

## Project layout

- `src/` is the React app (components, services, hooks).
- `server.ts` is a small Express server that serves the app and proxies Gemini.
- `supabase/functions/` holds the Deno Edge Functions.
- `wallet/` is the self-custodial wallet module.
- `docs/` has the architecture overview, user roles, and a document per feature.
- `AGENTS.md` is a short guide for contributors and AI agents.

Read `docs/architecture.md` and `AGENTS.md` before larger changes.

## Development workflow

1. Create a branch from `main` (or fork the repo).
2. Make your change. Keep pull requests focused on one thing.
3. Run the checks below and make sure they pass.
4. Open a pull request against `main` and fill in the template.

### Checks before you open a pull request

```bash
npm run lint     # type-check (tsc --noEmit)
npm run build    # production build must succeed
```

There is no automated test suite yet, so please also run the app and verify the
flow you changed actually works.

## Code style

- Match the style of the surrounding code (formatting, naming, and structure).
- The UI is bilingual: keep both the Khmer label and its English gloss when you
  edit user-facing text.
- Money is always dual currency (KHR and USD). Handle both.
- Every new source file starts with the two-line license header:
  ```
  // SPDX-License-Identifier: Apache-2.0
  // Copyright (C) <year> Tomorrow Rich Together
  ```
  Use the comment style that fits the file type (`--` for SQL, `/* */` for CSS).

## Commit messages

Use short, clear, imperative messages, optionally with a type prefix, for
example `feat: add budget alerts` or `fix: correct KHR rounding`.

## Security

Please do not open public issues for security vulnerabilities. See
[SECURITY.md](./SECURITY.md) for how to report them privately. Never commit API
keys, tokens, private keys, or other secrets.

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By taking part,
you agree to uphold it.

## Questions

Join the community on [Telegram](https://t.me/+VnJNjvNbXpQ3MWM1) to ask questions
and follow updates.
