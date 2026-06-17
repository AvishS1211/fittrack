-- Tuka database schema
-- Run this in the new Supabase project's SQL Editor.
-- IDs come from Date.now() in the app, so they are bigint.

create table if not exists tuka_weights (
  id    bigint primary key,
  kg    numeric not null,
  date  text not null
);

create table if not exists tuka_targets (
  id          bigint primary key,
  value       numeric not null,
  created_at  timestamptz default now()
);

-- The app talks to Supabase with the public anon key from the browser,
-- so allow anon read/write (same open-access model as before).
alter table tuka_weights enable row level security;
alter table tuka_targets enable row level security;

create policy "public tuka_weights" on tuka_weights for all using (true) with check (true);
create policy "public tuka_targets" on tuka_targets for all using (true) with check (true);
