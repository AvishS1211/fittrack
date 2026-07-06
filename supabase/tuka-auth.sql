-- Tuka multi-user migration (run in the Supabase SQL Editor).
-- Adds per-user ownership + a body-composition table, and locks every table
-- down so each signed-in user only sees their own rows.

-- 1. ownership columns (default to the current signed-in user on insert)
alter table tuka_weights add column if not exists user_id uuid default auth.uid();
alter table tuka_targets add column if not exists user_id uuid default auth.uid();

-- 2. per-user body composition (one JSON row per user)
create table if not exists tuka_body (
  user_id     uuid primary key default auth.uid(),
  data        jsonb not null,
  updated_at  timestamptz default now()
);
alter table tuka_body enable row level security;

-- 3. replace the old open policies with per-user policies
drop policy if exists "public tuka_weights" on tuka_weights;
drop policy if exists "public tuka_targets" on tuka_targets;

create policy "own tuka_weights" on tuka_weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tuka_targets" on tuka_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tuka_body" on tuka_body
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 4. ONE-TIME: claim your existing data AFTER you first sign in.
--    Your existing weigh-ins/targets have no owner, so they're hidden
--    until you assign them to your account. Find your id in
--    Supabase → Authentication → Users (copy the UUID), then run:
--
--    update tuka_weights set user_id = 'YOUR-USER-UUID' where user_id is null;
--    update tuka_targets set user_id = 'YOUR-USER-UUID' where user_id is null;
-- ─────────────────────────────────────────────────────────────
