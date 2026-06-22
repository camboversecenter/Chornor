-- PRAK wallet vault storage.
--
-- Stores only CIPHERTEXT and public identifiers. The server never sees the
-- passcode, the passkey PRF output, or any decrypted secret, so this remains
-- non-custodial: a database leak exposes Argon2id-protected envelopes, not funds.
--
-- One row per authenticated user. Row-level security ensures a user can only
-- read/write their own vault.

create table if not exists public.wallet_vaults (
  id               uuid primary key references auth.users (id) on delete cascade,
  pin_salt         text not null,          -- hex Argon2id salt
  pin_envelope     text not null,          -- DEK wrapped by the passcode KEK (JSON Envelope)
  passkey_envelope text,                   -- DEK wrapped by the passkey PRF KEK (nullable)
  passkey_id       text,                   -- hex WebAuthn rawId (nullable)
  wallet_envelope  text not null,          -- tagged secret (mnemonic | private key) encrypted by the DEK
  updated_at       timestamptz not null default now()
);

alter table public.wallet_vaults enable row level security;

drop policy if exists "own vault: select" on public.wallet_vaults;
create policy "own vault: select"
  on public.wallet_vaults for select
  using (auth.uid() = id);

drop policy if exists "own vault: insert" on public.wallet_vaults;
create policy "own vault: insert"
  on public.wallet_vaults for insert
  with check (auth.uid() = id);

drop policy if exists "own vault: update" on public.wallet_vaults;
create policy "own vault: update"
  on public.wallet_vaults for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at fresh on every write.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists wallet_vaults_touch on public.wallet_vaults;
create trigger wallet_vaults_touch
  before update on public.wallet_vaults
  for each row execute function public.touch_updated_at();
