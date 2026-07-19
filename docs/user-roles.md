# User Roles and Access

Chornor has several distinct kinds of users. Some are real people who sign in,
one is a local test identity, one is a machine identity used by third party
apps, and one is a per feature access grant layered on top of a normal account.
This document describes each role, how it is assigned, and what it can do.

The user shape is defined by the `UserProfile` type in `src/types.ts`. The two
fields that drive most access decisions are `isTestUser` (a local, offline
identity) and `isAdmin` (elevated privileges).

## Summary table

| Role | How it is created | Data location | Key abilities |
| --- | --- | --- | --- |
| Guest / Test user | Local login button | `localStorage` only | Full app features, no cloud sync |
| Authenticated user | Google sign in via Supabase | Supabase cloud | Full app features with sync and realtime |
| Admin | Super admin, admin email list, or local admin login | Depends on account | Everything above plus the Admin Panel |
| Wallet whitelisted user | Admin adds their email to the whitelist | Supabase | May provision and connect the Thirdweb wallet |
| External API client | Admin generates an API key | Supabase | May post transaction requests through the API |

## Guest / Test user

A guest is a local only identity created by the "Guest Mode" button on the login
screen. `authService.createLocalUser` builds a `UserProfile` with an id prefixed
`local_`, sets `isTestUser: true`, stores it under `chornor_local_user` in
`localStorage`, and reloads the app.

Characteristics:

- All data lives in the browser under `chornor_data_v1`. Nothing is sent to
  Supabase, because `isCloudUser()` returns false for `local_` ids.
- The guest can use every feature: transactions, lending, savings, crypto
  tracking, and the community feed backed by seed and local data.
- Guests see an extra "Simulate External App Request" button in Settings so they
  can try the external request approval flow without a real API call.
- The login screen only shows the guest and admin test buttons when Guest Mode
  is enabled globally (see the Admin Panel document).

## Authenticated user

An authenticated user signs in with Google through Supabase OAuth
(`authService.loginWithGoogle`). On sign in, `mapSupabaseUser` builds their
profile from the Supabase session: id, name, email, and avatar.

Characteristics:

- Data is scoped to their Supabase `user_id` and protected by Row Level
  Security.
- They get cloud persistence and Realtime updates across devices.
- They can receive external transaction requests from third party apps that know
  their email.
- The login screen labels this path as "Secured by Supabase."

## Admin

An admin is any user with `isAdmin: true`. There are three ways to become one:

1. **Super admin.** The email `sengtha@gmail.com` is hardcoded as a super admin
   in `authService.mapSupabaseUser` and in the storage service fallback. This
   account always has admin rights and cannot be removed from the UI.
2. **Admin email list.** Additional admin emails are stored in the
   `app_settings` row keyed `admin_emails`. The `admin-action` Edge Function
   checks a caller's email against this list before performing privileged
   actions.
3. **Local admin login.** The "Admin" test button on the login screen calls
   `createLocalUser` with `isAdmin: true`, creating an offline admin identity for
   testing. This grants access to the Admin Panel UI locally but does not carry
   real server side privileges.

Admin abilities (through the Admin Panel):

- View total user count and a user directory.
- Toggle global Guest Mode on or off.
- Create, disable, and revoke third party API keys.
- Manage the wallet access whitelist.
- Manage the list of admin emails.

Server side, the `admin-action` Edge Function independently re-verifies that the
caller is in `admin_emails` before it will toggle guest mode or list users, so
UI level admin state alone is not enough to perform privileged cloud actions.

## Wallet whitelisted user

Wallet access is a grant layered on top of a normal signed in account. It is not
a separate login. An admin adds a user's email to the `wallet_whitelist` table
through the Admin Panel.

Characteristics:

- When a whitelisted user opens the Crypto tab and connects a wallet, the client
  calls the `thirdweb-token` Edge Function. That function verifies the Supabase
  session, checks the email against `wallet_whitelist`, and only then mints the
  RS256 JWT that logs them into the Thirdweb in-app wallet.
- A non whitelisted user who tries to connect receives an "Access Denied"
  response and sees a message that the wallet feature requires admin approval.

## External API client

An external API client is a machine identity, not a person. An admin generates a
named API key in the Admin Panel, which creates a row in the `api_clients`
table.

Characteristics:

- The key is shown once at creation time and should be copied immediately.
- A client can be disabled or revoked at any time. The `submit-transaction`
  Edge Function rejects keys that are missing, unknown, or inactive.
- A client posts transactions on behalf of a user by supplying that user's email.
  The transaction lands as a pending request for the user to approve or reject,
  so a client can never write directly to a user's ledger. See the External App
  API document for the full contract.

## How roles combine

Roles are not mutually exclusive. A single signed in Google user can also be an
admin, and can also be on the wallet whitelist. The external API client is the
only role that is never a human account. Guest and authenticated are mutually
exclusive for a given session, because one is local and the other is cloud
backed.
