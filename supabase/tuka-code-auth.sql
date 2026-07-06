-- Tuka lightweight code-based login (replaces Google auth).
-- Run in the Supabase SQL Editor.
--
-- NOTE: this is intentionally low-security (4-digit code login, app-level
-- scoping) for a couple of trusted users. Move to real auth if it grows.

-- 1. users: email + a unique 4-digit code
create table if not exists tuka_users (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  code        text unique not null,
  created_at  timestamptz default now()
);
alter table tuka_users enable row level security;
drop policy if exists "public tuka_users" on tuka_users;
create policy "public tuka_users" on tuka_users for all using (true) with check (true);

-- 2. drop the per-user (auth.uid) policies from the Google migration
drop policy if exists "own tuka_weights" on tuka_weights;
drop policy if exists "own tuka_targets" on tuka_targets;
drop policy if exists "own tuka_body" on tuka_body;

-- 3. open policies again — the app scopes every query by user_id itself
create policy "public tuka_weights" on tuka_weights for all using (true) with check (true);
create policy "public tuka_targets" on tuka_targets for all using (true) with check (true);
create policy "public tuka_body"    on tuka_body    for all using (true) with check (true);

-- (tuka_weights/tuka_targets already have a user_id column from the earlier
--  migration; tuka_body is keyed by user_id. Nothing else to add.)

-- ─────────────────────────────────────────────────────────────
-- ONE-TIME after you create your code account: claim existing data.
-- Only you have data right now, so assign it all to your new user id.
-- Find it in Supabase → Table editor → tuka_users (copy your id), then:
--
--   update tuka_weights set user_id = 'YOUR-TUKA_USERS-ID';
--   update tuka_targets set user_id = 'YOUR-TUKA_USERS-ID';
--   update tuka_body    set user_id = 'YOUR-TUKA_USERS-ID';
-- ─────────────────────────────────────────────────────────────
