-- ══════════════════════════════════════════════════════════════════════
-- Car Bingo — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════════

-- ── Events ────────────────────────────────────────────────────────────
create table if not exists events (
  id           bigserial primary key,
  name         text not null unique,
  location     text,
  date         text,
  created_at   timestamptz default now()
);

-- ── Sightings ─────────────────────────────────────────────────────────
create table if not exists sightings (
  id           bigserial primary key,
  event_name   text not null references events(name) on delete cascade,
  car_name     text not null,
  car_era      text,
  car_make     text,
  car_rarity   text,
  count        int not null default 1,
  spotted_at   timestamptz default now(),
  unique(event_name, car_name)
);

-- ── Cars (optional — seeded automatically by the app on first load) ───
create table if not exists cars (
  name       text primary key,
  make       text,
  model      text,
  era        text,
  country    text,
  rarity     text,
  years      text,
  produced   text,
  surviving  text,
  value      text,
  "desc"     text,
  hagerty    text,
  wiki       text,
  flag       text
);

-- ── Row Level Security ────────────────────────────────────────────────
-- The app is PIN-protected client-side; anon key gets full access here.
-- If you want stricter security, add auth.uid() checks below.

alter table events    enable row level security;
alter table sightings enable row level security;
alter table cars      enable row level security;

-- Allow all operations via anon key
create policy "public_all" on events    for all to anon using (true) with check (true);
create policy "public_all" on sightings for all to anon using (true) with check (true);
create policy "public_all" on cars      for all to anon using (true) with check (true);

-- ── Indexes ───────────────────────────────────────────────────────────
create index if not exists sightings_event_idx on sightings(event_name);
create index if not exists sightings_car_idx   on sightings(car_name);
create index if not exists events_name_idx     on events(name);
