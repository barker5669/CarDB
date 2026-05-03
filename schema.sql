-- ══════════════════════════════════════════════════════════════════════
-- Car Bingo — Schema v2
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- This DROPS and recreates the schema. Safe because no production data
-- exists yet. After running:
--   1. Create the 'photos' Storage bucket (Storage → New Bucket → public)
--   2. Add two users via Auth → Add User (you + FIL)
-- ══════════════════════════════════════════════════════════════════════

-- ── Drop previous schema ─────────────────────────────────────────────
drop table if exists upcoming_event_attendees cascade;
drop table if exists upcoming_events          cascade;
drop table if exists my_car_photos            cascade;
drop table if exists my_car_log               cascade;
drop table if exists my_cars                  cascade;
drop table if exists sighting_photos          cascade;
drop table if exists sightings                cascade;
drop table if exists boards                   cascade;
drop table if exists event_attendees          cascade;
drop table if exists events                   cascade;
drop table if exists profiles                 cascade;
drop table if exists cars                     cascade;  -- v1 leftover

-- ══════════════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════════════

-- ── PROFILES ─────────────────────────────────────────────────────────
-- Extends auth.users with a friendly display name. A row is auto-created
-- on signup by the on_auth_user_created trigger below.
create table profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── EVENTS — shared shows attended ───────────────────────────────────
create table events (
  id          bigint      generated always as identity primary key,
  name        text        not null,
  location    text,
  event_date  date,
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index events_name_idx on events (lower(name));
create index events_date_idx on events (event_date desc);

-- ── EVENT_ATTENDEES — many-to-many ───────────────────────────────────
create table event_attendees (
  event_id  bigint      not null references events(id)        on delete cascade,
  user_id   uuid        not null references auth.users(id)    on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_attendees_user_idx on event_attendees (user_id);

-- ── BOARDS — per-user, per-event bingo board state ──────────────────
create table boards (
  id          bigint      generated always as identity primary key,
  event_id    bigint      not null references events(id)     on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  cars        jsonb       not null,           -- { era: [carName, ...], ... }
  eras        text[]      not null,
  car_count   int         not null,
  rolls       int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ── SIGHTINGS — a car observed by a user ────────────────────────────
-- event_id NULL = personal collection / non-event sighting
create table sightings (
  id          bigint      generated always as identity primary key,
  event_id    bigint      references events(id) on delete set null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  car_name    text        not null,
  car_era     text        not null,
  car_make    text,
  car_rarity  text,
  score       int         check (score between 1 and 5),
  notes       text,
  location    text,
  spotted_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index sightings_user_idx       on sightings (user_id);
create index sightings_event_idx      on sightings (event_id);
create index sightings_user_event_idx on sightings (user_id, event_id);
create index sightings_car_idx        on sightings (car_name);

-- ── SIGHTING_PHOTOS — many photos per sighting ──────────────────────
create table sighting_photos (
  id           bigint      generated always as identity primary key,
  sighting_id  bigint      not null references sightings(id) on delete cascade,
  storage_path text        not null,           -- key inside 'photos' bucket
  taken_at     timestamptz not null default now()
);

create index sighting_photos_sighting_idx on sighting_photos (sighting_id);

-- ── MY_CARS — vehicles owned by a user ──────────────────────────────
create table my_cars (
  id            bigint      generated always as identity primary key,
  owner_id      uuid        not null references auth.users(id) on delete cascade,
  name          text        not null,
  make          text,
  model         text,
  year          int         check (year between 1880 and 2100),
  registration  text,
  notes         text,
  hero_photo_id bigint,                          -- forward FK; set after photos created
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index my_cars_owner_idx on my_cars (owner_id);

-- ── MY_CAR_LOG — service / mods / drives / notes ────────────────────
create table my_car_log (
  id           bigint      generated always as identity primary key,
  my_car_id    bigint      not null references my_cars(id)     on delete cascade,
  user_id      uuid        not null references auth.users(id)  on delete cascade,
  entry_kind   text        not null check (entry_kind in ('service','mod','drive','note','photo')),
  title        text        not null,
  body         text,
  entry_date   date        not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index my_car_log_car_idx on my_car_log (my_car_id, entry_date desc);

-- ── MY_CAR_PHOTOS ────────────────────────────────────────────────────
create table my_car_photos (
  id            bigint      generated always as identity primary key,
  my_car_id     bigint      not null references my_cars(id)    on delete cascade,
  log_entry_id  bigint      references my_car_log(id)          on delete set null,
  storage_path  text        not null,
  taken_at      timestamptz not null default now()
);

create index my_car_photos_car_idx on my_car_photos (my_car_id);
create index my_car_photos_log_idx on my_car_photos (log_entry_id);

alter table my_cars add constraint my_cars_hero_photo_fk
  foreign key (hero_photo_id) references my_car_photos(id) on delete set null;

-- ── UPCOMING_EVENTS — calendar of future shows ──────────────────────
create table upcoming_events (
  id          bigint      generated always as identity primary key,
  name        text        not null,
  location    text,
  event_date  date        not null,
  url         text,
  notes       text,
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index upcoming_events_date_idx on upcoming_events (event_date);

create table upcoming_event_attendees (
  upcoming_event_id bigint      not null references upcoming_events(id) on delete cascade,
  user_id           uuid        not null references auth.users(id)      on delete cascade,
  joined_at         timestamptz not null default now(),
  primary key (upcoming_event_id, user_id)
);

create index upcoming_event_attendees_user_idx on upcoming_event_attendees (user_id);

-- ══════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════════

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic updated_at touch.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at        before update on profiles        for each row execute function public.set_updated_at();
create trigger events_updated_at          before update on events          for each row execute function public.set_updated_at();
create trigger boards_updated_at          before update on boards          for each row execute function public.set_updated_at();
create trigger sightings_updated_at       before update on sightings       for each row execute function public.set_updated_at();
create trigger my_cars_updated_at         before update on my_cars         for each row execute function public.set_updated_at();
create trigger my_car_log_updated_at      before update on my_car_log      for each row execute function public.set_updated_at();
create trigger upcoming_events_updated_at before update on upcoming_events for each row execute function public.set_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- All tables are RLS-on. The anon key cannot read or write anything;
-- callers must be authenticated.
-- ══════════════════════════════════════════════════════════════════════

alter table profiles                 enable row level security;
alter table events                   enable row level security;
alter table event_attendees          enable row level security;
alter table boards                   enable row level security;
alter table sightings                enable row level security;
alter table sighting_photos          enable row level security;
alter table my_cars                  enable row level security;
alter table my_car_log               enable row level security;
alter table my_car_photos            enable row level security;
alter table upcoming_events          enable row level security;
alter table upcoming_event_attendees enable row level security;

-- ── PROFILES — readable by all authed users; only own is writable ───
create policy "profiles read"       on profiles for select to authenticated using (true);
create policy "profiles update own" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ── EVENTS — shared family calendar of past shows ───────────────────
create policy "events read"   on events for select to authenticated using (true);
create policy "events insert" on events for insert to authenticated with check (created_by = auth.uid());
create policy "events update" on events for update to authenticated using (true) with check (true);
create policy "events delete" on events for delete to authenticated using (created_by = auth.uid());

-- ── EVENT_ATTENDEES — anyone can see who's going; only self-insert ──
create policy "attendees read"   on event_attendees for select to authenticated using (true);
create policy "attendees insert" on event_attendees for insert to authenticated with check (user_id = auth.uid());
create policy "attendees delete" on event_attendees for delete to authenticated using (user_id = auth.uid());

-- ── BOARDS — strictly per-user ──────────────────────────────────────
create policy "boards read own"   on boards for select to authenticated using (user_id = auth.uid());
create policy "boards insert own" on boards for insert to authenticated with check (user_id = auth.uid());
create policy "boards update own" on boards for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "boards delete own" on boards for delete to authenticated using (user_id = auth.uid());

-- ── SIGHTINGS — strictly per-user ───────────────────────────────────
create policy "sightings read own"   on sightings for select to authenticated using (user_id = auth.uid());
create policy "sightings insert own" on sightings for insert to authenticated with check (user_id = auth.uid());
create policy "sightings update own" on sightings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sightings delete own" on sightings for delete to authenticated using (user_id = auth.uid());

-- ── SIGHTING_PHOTOS — gated through parent sighting ─────────────────
create policy "sighting_photos read own" on sighting_photos for select to authenticated
  using (exists (select 1 from sightings s where s.id = sighting_id and s.user_id = auth.uid()));
create policy "sighting_photos insert own" on sighting_photos for insert to authenticated
  with check (exists (select 1 from sightings s where s.id = sighting_id and s.user_id = auth.uid()));
create policy "sighting_photos delete own" on sighting_photos for delete to authenticated
  using (exists (select 1 from sightings s where s.id = sighting_id and s.user_id = auth.uid()));

-- ── MY_CARS — owner only ────────────────────────────────────────────
create policy "my_cars read own"   on my_cars for select to authenticated using (owner_id = auth.uid());
create policy "my_cars insert own" on my_cars for insert to authenticated with check (owner_id = auth.uid());
create policy "my_cars update own" on my_cars for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "my_cars delete own" on my_cars for delete to authenticated using (owner_id = auth.uid());

-- ── MY_CAR_LOG — gated through parent my_cars ───────────────────────
create policy "my_car_log read own" on my_car_log for select to authenticated
  using (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));
create policy "my_car_log insert own" on my_car_log for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));
create policy "my_car_log update own" on my_car_log for update to authenticated
  using (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));
create policy "my_car_log delete own" on my_car_log for delete to authenticated
  using (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));

-- ── MY_CAR_PHOTOS ───────────────────────────────────────────────────
create policy "my_car_photos read own" on my_car_photos for select to authenticated
  using (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));
create policy "my_car_photos insert own" on my_car_photos for insert to authenticated
  with check (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));
create policy "my_car_photos delete own" on my_car_photos for delete to authenticated
  using (exists (select 1 from my_cars c where c.id = my_car_id and c.owner_id = auth.uid()));

-- ── UPCOMING_EVENTS — shared family calendar of future shows ────────
create policy "upcoming read"   on upcoming_events for select to authenticated using (true);
create policy "upcoming insert" on upcoming_events for insert to authenticated with check (created_by = auth.uid());
create policy "upcoming update" on upcoming_events for update to authenticated using (true) with check (true);
create policy "upcoming delete" on upcoming_events for delete to authenticated using (created_by = auth.uid());

create policy "upcoming attendees read"   on upcoming_event_attendees for select to authenticated using (true);
create policy "upcoming attendees insert" on upcoming_event_attendees for insert to authenticated with check (user_id = auth.uid());
create policy "upcoming attendees delete" on upcoming_event_attendees for delete to authenticated using (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════
-- STORAGE — single 'photos' bucket
--
-- Create the bucket via Dashboard → Storage → New Bucket
--   Name: photos
--   Public bucket: ON  (so <img src> works without signed URLs)
--
-- Then run the policies below.
-- Path convention: <user_id>/<kind>/<random>.jpg
--   e.g.  61cf...e8/sightings/abc123.jpg
-- ══════════════════════════════════════════════════════════════════════

-- Public read (URLs are unguessable; fine for a 2-user family app).
drop policy if exists "photos public read"   on storage.objects;
drop policy if exists "photos auth upload"   on storage.objects;
drop policy if exists "photos auth delete"   on storage.objects;

create policy "photos public read" on storage.objects for select to public
  using (bucket_id = 'photos');

-- Authenticated users can only write under a folder named after their uid.
create policy "photos auth upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos auth delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
