-- ══════════════════════════════════════════════════════════════════════
-- Patch: allow event attendees to read each other's sightings
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (After schema.sql has already been applied.)
--
-- Default RLS only lets a user read their own sightings, which is
-- right for the personal collection. To support the Event Summary
-- (leaderboard + combined cars-spotted list), this adds a SELECT
-- policy that lets you read sightings tied to an event you're
-- attending. Personal-collection sightings (event_id IS NULL) stay
-- private — only the owner can see them.
--
-- Multiple SELECT policies are OR'd in PostgreSQL, so this is purely
-- additive: the existing "sightings read own" policy keeps working,
-- and now any attendee of the same event can also see those rows.
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists "sightings read shared at event" on sightings;

create policy "sightings read shared at event" on sightings for select to authenticated
  using (
    event_id is not null
    and exists (
      select 1 from event_attendees ea
      where ea.event_id = sightings.event_id
        and ea.user_id  = auth.uid()
    )
  );
