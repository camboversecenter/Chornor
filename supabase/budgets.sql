-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Copyright (C) 2026 Tomorrow Rich Together
-- Monthly category spending limits ("Budgets").
--
-- One row per user per expense category. The app stores records with the same
-- camelCase field names it uses in TypeScript, so the columns are quoted to
-- preserve their casing (matching the other Chornor tables). Rows are keyed by
-- "_id" (client-generated) and scoped to a user via user_id for row-level
-- security. The client upserts on "_id" and filters by user_id.

create table if not exists public.budgets (
  "_id"        text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  "categoryId" text not null,
  amount       numeric not null default 0,
  currency     text not null default 'KHR',
  "createdAt"  timestamptz not null default now()
);

create index if not exists budgets_user_id_idx on public.budgets (user_id);

alter table public.budgets enable row level security;

drop policy if exists "own budgets: select" on public.budgets;
create policy "own budgets: select"
  on public.budgets for select
  using (auth.uid() = user_id);

drop policy if exists "own budgets: insert" on public.budgets;
create policy "own budgets: insert"
  on public.budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "own budgets: update" on public.budgets;
create policy "own budgets: update"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own budgets: delete" on public.budgets;
create policy "own budgets: delete"
  on public.budgets for delete
  using (auth.uid() = user_id);
