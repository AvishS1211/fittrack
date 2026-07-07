-- Per-user uploaded workout plan (parsed from a PDF). Run in the SQL Editor.
create table if not exists tuka_workout (
  user_id     uuid primary key,
  data        jsonb not null,
  updated_at  timestamptz default now()
);
alter table tuka_workout enable row level security;
drop policy if exists "public tuka_workout" on tuka_workout;
create policy "public tuka_workout" on tuka_workout for all using (true) with check (true);
