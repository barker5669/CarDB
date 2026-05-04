-- ══════════════════════════════════════════════════════════════════════
-- Patch: unassigned_photos table for the "Photos to sort" bin
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (After schema.sql has already been applied.)
--
-- The Sort Photos screen lets the user snap a bunch of photos at a
-- show ("Save for later") and assign each to a car later. Without this
-- table, the bin lives only in localStorage on one device, so:
--   - the same person on a different device can't see their bin
--   - if iOS Safari clears localStorage (ITP, low storage), the
--     bin metadata is lost (the photos themselves stay in Storage,
--     but become orphans).
--
-- Per-user only — sort bins are private; nobody sees anyone else's.
-- ══════════════════════════════════════════════════════════════════════

create table if not exists unassigned_photos (
  id           bigint      generated always as identity primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  storage_path text        not null,
  taken_at     timestamptz not null default now(),
  location     text
);

create index if not exists unassigned_photos_user_idx on unassigned_photos (user_id, taken_at desc);

alter table unassigned_photos enable row level security;

drop policy if exists "unassigned read own"   on unassigned_photos;
drop policy if exists "unassigned insert own" on unassigned_photos;
drop policy if exists "unassigned delete own" on unassigned_photos;

create policy "unassigned read own"   on unassigned_photos for select to authenticated
  using (user_id = auth.uid());
create policy "unassigned insert own" on unassigned_photos for insert to authenticated
  with check (user_id = auth.uid());
create policy "unassigned delete own" on unassigned_photos for delete to authenticated
  using (user_id = auth.uid());
