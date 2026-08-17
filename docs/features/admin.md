# Admin Panel

The Admin Panel is a control center for administrators. It exposes system wide
settings, third party API keys, the wallet whitelist, a user directory, and
admin management. It is only reachable by users with `isAdmin: true`, and its
privileged actions are re-verified on the server.

- **Route:** `/admin`
- **Component:** `src/components/AdminDashboard.tsx`
- **Available to:** admins only. `App.tsx` renders the panel only when
  `currentUser.isAdmin` is true, and shows "Access Denied" otherwise.

## Overview cards

At the top the panel shows two live counters: total registered users and the
number of active API clients.

## System settings

- **Guest Mode toggle.** Turns global Guest Mode on or off. When on, the login
  screen shows the guest and admin test buttons. When off, those test buttons
  are hidden for everyone. The toggle is optimistic in the UI and is persisted
  through the `admin-action` Edge Function under the `app_settings` key
  `guest_mode`. If the server rejects the change, the UI reverts.

## Third party API keys

Admins manage machine identities that can post transactions into the app:

- **Generate a key.** Enter an app name (for example a delivery or payments
  service) and generate a key. The new key is displayed once, with a copy
  button, and a warning that it will not be shown again.
- **Disable or enable.** Toggle a client active or inactive without deleting it.
- **Revoke.** Permanently delete a client after confirmation.

Each client is an `APIClient` record (see `src/types.ts`) with a name, key,
active flag, creation time, and request count. The `submit-transaction` Edge
Function checks incoming keys against this list and rejects any that are missing,
unknown, or inactive. See the External App API document.

## Wallet access whitelist

Admins control who may use the Web3 wallet:

- Add a user's email to the whitelist, or remove it after confirmation.
- Whitelisted users can connect the Thirdweb in-app wallet on the Crypto tab.
  Non whitelisted users are refused by the `thirdweb-token` Edge Function.

## User directory

A scrollable list of registered users showing avatar, name, email, and last
login date. The data comes from the `admin-action` Edge Function's
`GET_USER_STATS` action, which lists Supabase auth users and returns only safe
fields.

## Admin management

Admins can grant admin rights by adding an email to the admin list, and revoke
them by removing an email. The super admin `sengtha@gmail.com` is shown as a
fixed entry and cannot be removed from the UI.

## Server side enforcement

The Admin Panel UI is gated by client state, but the real protection is server
side. The `admin-action` Edge Function independently verifies the caller's
Supabase identity and checks their email against the `admin_emails` value in
`app_settings` before it will toggle guest mode or list users. A local admin
test identity can open the panel UI but does not carry these server privileges.
