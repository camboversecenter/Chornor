# Security Policy

Chornor handles people's financial data and, through the wallet features, crypto
keys. We take security seriously and appreciate responsible disclosure.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security problems, and do not
disclose them publicly until they are fixed.

Instead, report privately by contacting a maintainer:

- Message an admin on our [Telegram community](https://t.me/+VnJNjvNbXpQ3MWM1)
  and ask to report a security issue privately, or
- Email the maintainers (add your security email here, for example
  `security@your-domain`).

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- Any affected component (app, Edge Function, wallet, database).

We aim to acknowledge reports within a few days and will keep you updated on the
fix. Please give us reasonable time to address the issue before any public
disclosure.

## Scope and notes

- The Supabase `anon` key is a publishable client key by design. The real access
  control is Row Level Security, which must be enabled on every table.
- Privileged operations (Thirdweb token signing, admin actions, third-party
  transaction submission) run inside Supabase Edge Functions, never in the
  browser.
- The self-custodial wallet keeps private key material inside a Web Worker and
  does not expose signing to the main thread.
- Secrets (API keys, service role keys, private keys) must never be committed.
  If you find one in the repository or its history, report it privately so it can
  be rotated.

## Dependency audit posture

We keep the dependency tree free of known **high** and **critical** advisories.
Where a fix lives in a transitive package, we pin the patched version through the
`overrides` field in `package.json` (currently `axios`, `hono`, `js-yaml`,
`nanoid`, `postcss`, and `ws`).

A few **moderate** advisories remain in the optional Web3 wallet connector tree
(MetaMask SDK, Solana, and their `uuid` dependency). Their only published fix is
a breaking downgrade of `@solana/web3.js`, which would remove wallet
functionality, so we accept them for now. The `uuid` advisory
(GHSA-w5hq-g745-h8pq) only triggers when `uuid` is called with a caller-supplied
`buf` argument, a code path Chornor never uses. Run `npm audit` to review the
current list.

## Supported versions

Chornor is in active beta. Security fixes are applied to the latest `main`.
