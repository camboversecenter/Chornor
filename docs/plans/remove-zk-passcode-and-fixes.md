# Remove the ZK Passcode Login — Change Notes & Fix Plan

## Why

The Crypto tab gated wallet activation behind a 6-digit "Wallet PIN" backed by
the self-custodial vault in `wallet/` (Argon2id + AES-GCM, the "zk vault"). The
PIN created and unlocked an encrypted BIP39 mnemonic stored in the
`wallet_vaults` table.

That mnemonic **never controlled the wallet the user actually sees.** The live
wallet is a Thirdweb `inAppWallet` connected by a JWT minted from the Google /
Supabase session (`thirdweb-token` Edge Function). So the passcode:

- forced every whitelisted user to invent and remember a 6-digit PIN,
- showed a "Save your recovery phrase" screen for a phrase that recovers
  nothing on the live wallet, and
- blocked the "remember me" auto-reconnect (see Bug 1 below).

It was pure friction with no security benefit. This change removes it.

## What changed (done in this branch)

- **`src/components/CryptoManager.tsx`**
  - Removed imports of `useWalletSigner` and `createStorageAdapter`.
  - Removed `walletPin` and `vaultExists` state, the `vaultStorage` memo, the
    `secureWallet` hook, and the vault-load effect.
  - `handleActivateWallet` now goes straight from the Supabase session to the
    `thirdweb-token` exchange and `inAppWallet` connect — no PIN validation, no
    `unlockWithPin` / `createWallet`, no recovery-phrase alert.
  - Removed the PIN `<input>` block and the `vaultExists === null` term from the
    Activate button's `disabled` condition (one-tap activation).
  - `handleDisconnect` no longer calls `secureWallet.lock()` / clears the PIN.
- **`docs/features/crypto-and-wallet.md`** — documented one-tap activation and
  noted the self-custodial module is no longer wired into any screen.

Result: activation is a single **Activate Now** tap. `npm run lint`
(`tsc --noEmit`) passes clean.

## Bugs found during the review

### Bug 1 — Auto-reconnect never worked for returning vault users (fixed by this change)
`checkAutoConnect` calls `handleActivateWallet(true)`, but the old activation
path required a 6-digit `walletPin` in React state. On a fresh page load
`walletPin` is `''`, so `/^\d{6}$/.test('')` failed and activation bailed before
connecting. The `chornor_wallet_active` "remember me" flag was effectively dead
for anyone with a vault. Removing the PIN gate restores silent auto-reconnect.

### Bug 2 — `checkAutoConnect` effect has stale-closure / missing deps (open)
`src/components/CryptoManager.tsx` — the effect depends only on `[activeTab]`
but reads `account`, `isActivating`, and `currentUser`. If `currentUser` (or the
account) resolves after the first render, the effect does not re-run with the
fresh value, so auto-reconnect can silently no-op or run against a stale
`currentUser`.
**Fix:** add `currentUser?.id`, `account`, and `isActivating` (or a stable
`currentUser?.isTestUser`) to the dependency array, or guard on `currentUser`
inside and key the effect on `currentUser?.id`.

### Bug 3 — `fetchWalletData` effect keys on the `account` object identity (open)
The balance-fetch effect uses `[activeTab, account]`. `account` is a Thirdweb
object whose reference can change across renders, causing redundant balance
fetches.
**Fix:** depend on `account?.address` instead of `account`.

### Bug 4 — Orphaned vault module and dead `wallet_vaults` rows (open, cleanup)
After this change nothing imports `wallet/` at runtime (it is a standalone
library, still type-checked via `tsconfig` `include`). Rows already written to
`public.wallet_vaults` are encrypted mnemonics that control nothing.
**Fix (decide, then do):**
- Keep `wallet/` as a library for a future user-owned wallet (current doc
  stance), **or** delete `wallet/` + `wallet/schema-wallet.sql` if that
  direction is abandoned.
- Migrate away `wallet_vaults`: `drop table if exists public.wallet_vaults;`
  (and remove it from `docs/supabase-migration.md`) once you confirm no data
  there is needed. Back up first if in doubt.

### Bug 5 — Users may hold a misleading "recovery phrase" (comms, not code)
Anyone who activated the wallet before this change saw a "Save your recovery
phrase" dialog. That phrase does **not** recover their live Thirdweb wallet.
**Fix:** if any real users activated, tell them that phrase is obsolete; their
wallet is tied to their Google login.

### Bug 6 — Minor dead code (low priority)
`useActiveWalletChain` is imported but unused; `isConnecting` and `connectError`
from `useConnect` are destructured but unused. Harmless (no `noUnusedLocals`),
but worth removing in a cleanup pass.

## Suggested order of follow-up

1. Bug 2 and Bug 3 — small, safe correctness/perf fixes in `CryptoManager.tsx`.
2. Bug 5 — user comms, if the feature had real users.
3. Bug 4 — decide the fate of `wallet/` and `wallet_vaults`, then migrate.
4. Bug 6 — dead-code sweep.
