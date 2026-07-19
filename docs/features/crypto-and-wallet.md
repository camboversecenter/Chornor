# Crypto and Wallet

The Crypto tab is both a portfolio tracker and a Web3 wallet. Users track their
holdings with live prices, and whitelisted users can connect an in-app wallet on
the Base chain to hold and send tokens. There are two wallet implementations in
the codebase, described below.

- **Route:** `/crypto`
- **Component:** `src/components/CryptoManager.tsx` (plus
  `src/components/CryptoAnalytics.tsx`)
- **Available to:** all signed in users for tracking. Wallet connection requires
  being on the wallet whitelist.

## Portfolio tracking

The tracker is available to everyone, no wallet required.

The `CryptoAsset` type in `src/types.ts` records each holding: symbol, name,
optional CoinGecko id, image, quantity, average buy price, and current price.
The `CryptoTransaction` type records buys and sells with quantity, price, and
date, so the tracker can compute cost basis and profit or loss.

Live prices come from CoinGecko through `src/services/coingeckoService.ts`. The
service maps each asset's CoinGecko id to a current price and updates the stored
holdings, which then feed the portfolio value and the analytics charts in
`CryptoAnalytics`.

## The Thirdweb in-app wallet

The wallet that ships in the Crypto UI is a Thirdweb in-app wallet on the Base
chain. The connection flow bridges the user's Supabase identity into Web3:

1. The user signs in to Chornor with Google (Supabase).
2. On the Crypto tab, connecting the wallet calls the `thirdweb-token` Edge
   Function with the Supabase session token.
3. That function verifies the session, checks the user's email against the
   `wallet_whitelist` table, and, if allowed, mints an RS256 JWT whose audience
   is the Thirdweb client id.
4. The client uses that JWT to log into the Thirdweb `inAppWallet`, giving the
   user a wallet address tied to their account.

If the user is not whitelisted, the Edge Function returns an "Access Denied"
response and the UI shows that the wallet feature requires admin approval. See
the Admin Panel document for how the whitelist is managed.

Once connected, the wallet can show token balances and send transactions on
Base. Addresses link out to BaseScan for inspection.

## The self-custodial wallet module

The `wallet/` directory contains a separate, self-custodial wallet
implementation. It is a standalone module built for strong key hygiene, and it
is independent of the Thirdweb wallet used in the Crypto UI.

Its design highlights:

- **Seed phrases and keys.** It can create a new BIP39 mnemonic wallet, import
  from a recovery phrase, or import a single raw private key
  (`useWalletSigner`).
- **Worker isolation.** All derivation and signing happen inside a Web Worker
  (`signer.worker.ts`). Secret material never touches the main thread. The
  module intentionally does not re-export the signing functions to the main
  thread.
- **Encrypted vaults.** Secrets are sealed with Argon2id key derivation, tuned
  for low end mobile devices (`wallet/config.ts`). Changing the Argon2
  parameters would change the derived key, so they are treated as fixed.
- **Passkey unlock.** WebAuthn PRF passkeys are supported alongside a PIN, so a
  vault can be unlocked either with a passcode or with a device passkey
  (`webauthn-prf.ts`).
- **Payments first.** The module targets USDC on Base and Base Sepolia by
  default, with a configurable RPC and explorer.
- **Signing.** It exposes digest signing and personal message signing, meant to
  be paired with a user confirmation step that a compromised page cannot forge.

At present this module is a self contained library. The Crypto tab uses the
Thirdweb wallet described above; the self-custodial module provides the
building blocks for a fully user owned wallet and can be wired in as that
direction matures.

## Storage

Crypto assets and transactions are saved through the storage service
(`saveCryptoAsset`, `addCryptoTransaction`, and related functions) and follow
the same local versus cloud rule as the rest of the app. Wallet key vaults, when
used, are persisted per Supabase user through the wallet storage adapter.
