-- FitTrack database schema
-- Run this in the Supabase SQL Editor for a new project to recreate all tables.
-- IDs for workouts/meals/weight come from Date.now() in the app, so they are bigint.

create table if not exists fit_workouts (
  id        bigint primary key,
  exercise  text not null,
  category  text,
  sets      integer default 0,
  reps      integer default 0,
  weight    numeric default 0,
  duration  integer default 0,
  date      text not null,
  note      text
);

create table if not exists fit_meals (
  id        bigint primary key,
  name      text not null,
  type      text,
  calories  numeric default 0,
  protein   numeric default 0,
  carbs     numeric default 0,
  fat       numeric default 0,
  date      text not null
);

create table if not exists fit_weight (
  id      bigint primary key,
  weight  numeric not null,
  date    text not null
);

create table if not exists fit_ai (
  id          bigint generated always as identity primary key,
  question    text,
  answer      text,
  created_at  timestamptz default now()
);

create table if not exists fit_goals (
  id                 bigint primary key,
  calories           numeric default 2500,
  protein            numeric default 150,
  workouts_per_week  numeric default 5
);

-- Seed the single goals row the app reads at id = 1.
insert into fit_goals (id, calories, protein, workouts_per_week)
values (1, 2500, 150, 5)
on conflict (id) do nothing;

-- The app uses the public anon key directly from the browser, so allow
-- anon read/write on every table (same open-access model as before).
alter table fit_workouts enable row level security;
alter table fit_meals    enable row level security;
alter table fit_weight   enable row level security;
alter table fit_ai       enable row level security;
alter table fit_goals    enable row level security;

create policy "public fit_workouts" on fit_workouts for all using (true) with check (true);
create policy "public fit_meals"    on fit_meals    for all using (true) with check (true);
create policy "public fit_weight"   on fit_weight   for all using (true) with check (true);
create policy "public fit_ai"       on fit_ai       for all using (true) with check (true);
create policy "public fit_goals"    on fit_goals    for all using (true) with check (true);
