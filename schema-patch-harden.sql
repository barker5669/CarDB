-- ══════════════════════════════════════════════════════════════════════
-- Patch: multi-tenant hardening — safe to run with OPEN SIGNUP
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (After schema.sql. Run schema-patch-unassigned-photos.sql too — that
-- table is referenced by js/db.js but has never been created.)
--
-- schema.sql was written for two trusted family members, so most
-- policies read `to authenticated ... using (true)` — fine when
-- "authenticated" meant you and one other person, wrong the moment
-- anyone can register. This patch re-scopes everything to the model:
--
--   • Shows and sightings   → private; shared only via a join code
--   • Upcoming calendar     → shared with everyone, creator-edits-only
--   • Collection / my cars  → private (already was)
--   • Photos                → no longer enumerable by strangers
--
-- Idempotent: safe to re-run.
-- ══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- 1. STORAGE — stop anonymous enumeration of the photos bucket
--
-- The old policy granted SELECT on storage.objects to the `public`
-- role, which is what the Storage *list* API checks. Anyone holding
-- the publishable key (it ships in js/supabase.js, so: anyone) could
-- POST /storage/v1/object/list/photos and walk the whole tree — user
-- folders, then every filename under them — then fetch each from the
-- public URL. "Unguessable URLs" only holds if nobody can ask for the
-- list.
--
-- Dropping this does NOT break <img src>. For a bucket marked public,
-- /storage/v1/object/public/... is served without consulting RLS; this
-- policy only governs the authenticated Storage API. The app never
-- calls .list() or .download(), so nothing regresses.
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists "photos public read" on storage.objects;
drop policy if exists "photos read own"    on storage.objects;

create policy "photos read own" on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Upload/delete policies from schema.sql are already own-folder-only.


-- ══════════════════════════════════════════════════════════════════════
-- 2. HELPERS
--
-- Both are SECURITY DEFINER on purpose. A policy on event_attendees
-- that queries event_attendees would recurse; running the lookup as
-- the definer bypasses RLS on the inner read and breaks the cycle.
-- ══════════════════════════════════════════════════════════════════════

create or replace function public.is_event_attendee(_event_id bigint)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from event_attendees
    where event_id = _event_id and user_id = auth.uid()
  );
$$;

-- True when I share at least one event — past or upcoming — with the
-- given user. Gates who can see whose display name.
create or replace function public.shares_event_with(_other uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from event_attendees a
    join event_attendees b on a.event_id = b.event_id
    where a.user_id = auth.uid() and b.user_id = _other
  ) or exists (
    select 1 from upcoming_event_attendees a
    join upcoming_event_attendees b on a.upcoming_event_id = b.upcoming_event_id
    where a.user_id = auth.uid() and b.user_id = _other
  );
$$;

revoke execute on function public.is_event_attendee(bigint) from public, anon;
revoke execute on function public.shares_event_with(uuid)   from public, anon;
grant  execute on function public.is_event_attendee(bigint) to authenticated;
grant  execute on function public.shares_event_with(uuid)   to authenticated;


-- ══════════════════════════════════════════════════════════════════════
-- 3. EVENTS — private, shared by join code
-- ══════════════════════════════════════════════════════════════════════

alter table events add column if not exists join_code text;

-- Backfill existing rows, then lock the column down. 8 hex chars =
-- 4.3bn combinations, so guessing is not a practical attack.
update events
   set join_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
 where join_code is null;

alter table events alter column join_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_join_code_key'
  ) then
    alter table events add constraint events_join_code_key unique (join_code);
  end if;
end $$;

alter table events
  alter column join_code
  set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

drop policy if exists "events read"   on events;
drop policy if exists "events update" on events;

-- Was: using (true) — every account could read every show.
create policy "events read" on events for select to authenticated
  using (created_by = auth.uid() or public.is_event_attendee(id));

-- Was: using (true) with check (true) — every account could rewrite
-- (or redate, or rename) any show, including ones they'd never seen.
create policy "events update" on events for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- "events insert" and "events delete" from schema.sql are already
-- created_by-scoped and stay as they are.


-- ══════════════════════════════════════════════════════════════════════
-- 4. JOINING A SHOW
--
-- The only route in. Direct INSERT on event_attendees is now limited
-- to the event's own creator, so a stranger can't self-join an event
-- id and unlock the co-attendee sighting read below. Everyone else
-- must present the code, and this function — running as definer — is
-- what turns a code into membership without ever exposing the events
-- table to a non-member.
-- ══════════════════════════════════════════════════════════════════════

create or replace function public.join_event_by_code(_code text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  _event_id bigint;
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in to join a show.';
  end if;

  select id into _event_id
    from events
   where join_code = upper(btrim(_code));

  -- Deliberately identical message for "no such code": don't confirm
  -- to a guesser that a code exists but something else went wrong.
  if _event_id is null then
    raise exception 'That code doesn''t match a show.';
  end if;

  insert into event_attendees (event_id, user_id)
  values (_event_id, auth.uid())
  on conflict (event_id, user_id) do nothing;

  return _event_id;
end;
$$;

revoke execute on function public.join_event_by_code(text) from public, anon;
grant  execute on function public.join_event_by_code(text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════
-- 5. EVENT ATTENDEES
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists "attendees read"   on event_attendees;
drop policy if exists "attendees insert" on event_attendees;

-- Was: using (true) — the full attendance graph of every user.
create policy "attendees read" on event_attendees for select to authenticated
  using (user_id = auth.uid() or public.is_event_attendee(event_id));

-- Was: with check (user_id = auth.uid()) only — i.e. any account could
-- add itself to any event id and then read that event's sightings.
-- Creators join their own events directly; everyone else goes through
-- join_event_by_code().
create policy "attendees insert" on event_attendees for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from events e
      where e.id = event_attendees.event_id
        and e.created_by = auth.uid()
    )
  );

-- "attendees delete" (leave an event) stays self-scoped.


-- ══════════════════════════════════════════════════════════════════════
-- 6. SIGHTINGS — co-attendee read, now that attendance is gated
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists "sightings read shared at event" on sightings;

create policy "sightings read shared at event" on sightings for select to authenticated
  using (event_id is not null and public.is_event_attendee(event_id));

-- Own-row select/insert/update/delete policies are unchanged.
--
-- NOTE: sighting_photos stays owner-only — co-attendees see that you
-- spotted a car and it counts on the leaderboard, but not your photo.
-- Photos are the most sensitive thing here (faces, plates, driveways),
-- so sharing them is opt-in rather than a side effect of joining. To
-- share them with co-attendees instead, add:
--
--   create policy "sighting_photos read shared" on sighting_photos
--     for select to authenticated using (exists (
--       select 1 from sightings s
--        where s.id = sighting_id
--          and s.event_id is not null
--          and public.is_event_attendee(s.event_id)));


-- ══════════════════════════════════════════════════════════════════════
-- 7. PROFILES — no longer a directory of every user
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists "profiles read" on profiles;

-- Was: using (true) — every account could enumerate every display
-- name. Now: yourself, plus people you actually share a show with.
create policy "profiles read" on profiles for select to authenticated
  using (id = auth.uid() or public.shares_event_with(id));

-- The signup trigger defaulted display_name to the email's local part,
-- so "dave.smith@..." showed up as "dave.smith" on any shared event.
-- Default to something neutral and let people set their own name.
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
    coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'), ''), 'New spotter')
  );
  return new;
end;
$$;


-- ══════════════════════════════════════════════════════════════════════
-- 8. UPCOMING EVENTS — shared calendar, creator edits only
--
-- Read stays open to all signed-in users: show dates are public
-- information and shared discovery is the point. Only the write path
-- narrows.
-- ══════════════════════════════════════════════════════════════════════

drop policy if exists "upcoming update" on upcoming_events;

-- Was: using (true) with check (true) — any account could rewrite or
-- redate anyone's calendar entry.
create policy "upcoming update" on upcoming_events for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Read / insert / delete and the attendee (RSVP) policies are already
-- correctly scoped and stay as they are.
