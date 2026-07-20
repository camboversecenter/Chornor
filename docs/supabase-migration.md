# Migrating Chornor to a new Supabase project

This runbook moves the project from one Supabase project to another while keeping
**all existing data**, including user accounts. Read it fully before starting.

The single most important rule: **preserve the Auth user UUIDs.** Every data table
stores a `user_id` that points at `auth.users.id`. If those UUIDs change, every
user is disconnected from their data. The database-level dump below keeps them.

## What has to move

| Area | Items |
| --- | --- |
| Auth | Google OAuth users (`auth.users`, `auth.identities`), UUIDs must be preserved |
| Public tables | transactions, categories, family_members, lendings, lending_transactions, savings, saving_transactions, crypto_assets, crypto_transactions, community_posts, transaction_requests, api_clients, app_settings, wallet_whitelist, wallet_vaults |
| Database objects | RLS policies, sequences, functions (e.g. `increment_request_count`), the `supabase_realtime` publication |
| Edge Functions | thirdweb-token, thirdweb-jwks, submit-transaction, admin-action (+ their secrets) |
| Auth config | Google provider client id/secret, Site URL and Redirect URLs |
| Thirdweb | Custom Auth JWKS URL and issuer (they change with the project) |
| App config | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Storage | None used in this project |

## 0. Before you touch anything

1. **Pick a maintenance window.** Any writes made after you start the dump will
   not be in the copy. Either announce short downtime or put the app in a
   read-only state while migrating.
2. **Create the new Supabase project** (same region if possible). Record its:
   project ref, URL, `anon` key, `service_role` key, and database password.
3. **Take a full backup of the OLD project first** (see step 1). Do not delete or
   pause the old project until the new one is fully verified.
4. **Collect existing secrets and config** from the old project so you can
   re-enter them: Google OAuth client id/secret, `THIRDWEB_PRIVATE_KEY`,
   `THIRDWEB_PUBLIC_KEY`, `THIRDWEB_KEY_ID`, and the current Auth redirect URLs.

## 1. Dump the old database (schema + data + auth)

Install the Supabase CLI. Get the **direct** database connection string for each
project from Dashboard > Settings > Database (use the session pooler or direct
connection on port 5432, not the transaction pooler on 6543).

```bash
OLD_DB_URL="postgresql://postgres.<old-ref>:<password>@<host>:5432/postgres"

supabase db dump --db-url "$OLD_DB_URL" -f roles.sql  --role-only
supabase db dump --db-url "$OLD_DB_URL" -f schema.sql
supabase db dump --db-url "$OLD_DB_URL" -f data.sql   --use-copy --data-only
```

The `--data-only` dump includes the `auth` schema data, so `auth.users` and
`auth.identities` come across with their original UUIDs. That is what keeps every
user connected to their rows.

Keep these three files safe. They are your migration artifact and your backup.

## 2. Restore into the new project

```bash
NEW_DB_URL="postgresql://postgres.<new-ref>:<password>@<host>:5432/postgres"

psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$NEW_DB_URL"
```

`SET session_replication_role = replica` disables triggers and foreign-key checks
during the data load so rows insert regardless of order and auth triggers do not
double-fire. `--single-transaction` means the whole restore rolls back if
anything fails, so you never end up half-migrated.

## 3. Re-enable Realtime

The app subscribes to `postgres_changes` on the public tables. After restore,
confirm the tables are in the realtime publication. In the SQL editor:

```sql
-- add every table the app watches (safe to re-run)
alter publication supabase_realtime add table
  transactions, categories, family_members, lendings, lending_transactions,
  savings, saving_transactions, crypto_assets, crypto_transactions,
  community_posts, transaction_requests;
```

If a table is already in the publication you will get a notice, which is fine.

## 4. Verify the database (data remains)

Run these on BOTH projects and compare. Counts must match.

```sql
select 'auth.users' t, count(*) from auth.users
union all select 'transactions', count(*) from transactions
union all select 'categories', count(*) from categories
union all select 'lendings', count(*) from lendings
union all select 'savings', count(*) from savings
union all select 'crypto_assets', count(*) from crypto_assets
union all select 'wallet_vaults', count(*) from wallet_vaults
union all select 'wallet_whitelist', count(*) from wallet_whitelist
union all select 'api_clients', count(*) from api_clients
union all select 'transaction_requests', count(*) from transaction_requests;
```

Also confirm RLS is enabled on each table and the `increment_request_count`
function exists.

## 5. Reconfigure Auth (dashboard, not SQL)

Auth provider settings do not travel in the database dump, so redo them:

1. Auth > Providers > Google: enable it and paste the **same** Google OAuth
   client id and secret.
2. In Google Cloud Console, add the new callback URL to the OAuth client's
   authorized redirect URIs:
   `https://<new-ref>.supabase.co/auth/v1/callback`
3. Auth > URL Configuration: set Site URL to `https://chornors.camboverse.world`
   and add redirect URLs for that domain and `http://localhost:3000`.

Note: the JWT secret differs between projects, so existing login sessions become
invalid. Users are not lost, they simply sign in again with Google and land back
on their data (same UUID).

## 6. Deploy Edge Functions and secrets

```bash
supabase functions deploy thirdweb-token     --project-ref <new-ref>
supabase functions deploy thirdweb-jwks      --project-ref <new-ref>
supabase functions deploy submit-transaction --project-ref <new-ref>
supabase functions deploy admin-action       --project-ref <new-ref>

supabase secrets set --project-ref <new-ref> \
  THIRDWEB_PRIVATE_KEY="..." \
  THIRDWEB_PUBLIC_KEY="..." \
  THIRDWEB_KEY_ID="..."
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
into Edge Functions automatically, so you do not set those. The CORS allowlist in
the functions already points at `chornors.camboverse.world`, so no code change is
needed there.

## 7. Reconnect Thirdweb (easy to forget)

`thirdweb-token` signs a JWT whose issuer is `SUPABASE_URL`, and `thirdweb-jwks`
serves the public key. Both URLs change with the new project. In the Thirdweb
dashboard for the in-app wallet's Custom Auth:

1. Update the JWKS URI to the new function URL, for example
   `https://<new-ref>.supabase.co/functions/v1/thirdweb-jwks`.
2. Update the issuer/domain if it is pinned there. The `aud` stays the Thirdweb
   client id and does not change.

Because user UUIDs were preserved, each user maps to the same in-app wallet as
before. Only the JWKS/issuer wiring changes.

The `wallet_vaults` table (self-custodial wallet) holds encrypted secrets keyed
by `user_id`. Those UUIDs are preserved, so users can still unlock with their PIN
or passkey after the move.

## 8. Point the app at the new project

The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Set the new
values in your deploy environment and rebuild the client.

Important gotcha: `src/services/supabaseClient.ts` still has the **old** project
URL and anon key as a hardcoded fallback. If the env vars are not set, the app
silently keeps using the old project. Either set the env vars, or update that
fallback to the new project (ask and this repo can be updated to remove the
fallback so the config must come from env).

Server side, restart the app so it picks up the new env. The Gemini proxy and its
`GEMINI_API_KEY` are unrelated to Supabase and need no change.

## 9. Cutover and verification

1. Deploy the app with the new config.
2. Sign in with a real Google account and confirm transactions, categories,
   lending, savings, and crypto all appear.
3. Confirm Realtime updates (add a transaction on one device, see it on another).
4. Confirm admin panel loads (user stats, whitelist, API keys).
5. Confirm a whitelisted user can connect the Thirdweb wallet.
6. Post a community item and confirm AI moderation still responds (server proxy).

Keep the old project live until all of the above pass. If any writes happened on
the old project after your dump, either redo the migration during a proper freeze
or manually copy the few new rows. Decommission the old project only after a grace
period.

## Rollback

If something is wrong, the app still points at the old project until you change
`VITE_SUPABASE_URL`. Revert the env vars (or the fallback) to the old values,
rebuild, and you are back on the old project with zero data loss, since the old
project was never modified.
