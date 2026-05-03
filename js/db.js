// ══════════════════════════════════════════════════════════════════════
// DB — Supabase data layer for Car Bingo
//
// All Supabase access goes through this module. Methods return promises
// and throw on error; callers wrap in try/catch and surface to the user
// (typically via showSnack). The Phase-11 hardening pass adds an offline
// mutation queue on top of this; for now mutations either succeed or
// surface a clear error.
//
// Depends on:
//   SB                — supabase-js client (js/supabase.js)
//   currentUserId()   — synchronous current-user-id (js/auth.js)
// ══════════════════════════════════════════════════════════════════════

function requireUser() {
  const id = currentUserId();
  if (!id) throw new Error('You need to be signed in for that.');
  return id;
}

function publicUrl(storagePath) {
  if (!storagePath) return null;
  return SB.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;
}

function storageKeyFor(kind, filename) {
  return `${requireUser()}/${kind}/${filename}`;
}

const DB = {

  // ─── Events ────────────────────────────────────────────────────────
  events: {
    async list() {
      const { data, error } = await SB.from('events')
        .select('*, event_attendees(user_id)')
        .order('event_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    async get(id) {
      const { data, error } = await SB.from('events')
        .select('*, event_attendees(user_id)')
        .eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async create({ name, location, event_date }) {
      const userId = requireUser();
      const { data, error } = await SB.from('events').insert({
        name, location, event_date, created_by: userId,
      }).select().single();
      if (error) throw error;
      // Creator automatically attends.
      await DB.attendees.join(data.id);
      return data;
    },
    async update(id, patch) {
      const { data, error } = await SB.from('events')
        .update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      // Best-effort: gather every photo path under this event before
      // the cascade obliterates the sighting_photos rows, then remove
      // the storage objects. The cascade is what makes the rows go
      // away — Storage isn't FK'd into the DB.
      try {
        const { data } = await SB.from('sightings')
          .select('id, sighting_photos(storage_path)')
          .eq('event_id', id);
        const paths = (data || [])
          .flatMap(s => (s.sighting_photos || []).map(sp => sp.storage_path))
          .filter(Boolean);
        if (paths.length) await SB.storage.from('photos').remove(paths);
      } catch (e) { console.warn('events.remove storage cleanup:', e); }
      const { error } = await SB.from('events').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // ─── Attendees ─────────────────────────────────────────────────────
  attendees: {
    async listForEvent(eventId) {
      const { data, error } = await SB.from('event_attendees')
        .select('*, profiles(display_name)')
        .eq('event_id', eventId);
      if (error) throw error;
      return data;
    },
    async join(eventId) {
      const userId = requireUser();
      // ignoreDuplicates skips ON CONFLICT DO UPDATE (re-joining is a
      // no-op). Without it, Postgres demands UPDATE permission on the
      // table even though we never actually update — which fails RLS.
      const { error } = await SB.from('event_attendees')
        .upsert({ event_id: eventId, user_id: userId },
                { onConflict: 'event_id,user_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    async leave(eventId) {
      const userId = requireUser();
      const { error } = await SB.from('event_attendees').delete()
        .eq('event_id', eventId).eq('user_id', userId);
      if (error) throw error;
    },
  },

  // ─── Boards ────────────────────────────────────────────────────────
  boards: {
    async getMine(eventId) {
      const userId = requireUser();
      const { data, error } = await SB.from('boards').select('*')
        .eq('event_id', eventId).eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async upsert(eventId, { cars, eras, car_count, rolls }) {
      const userId = requireUser();
      const payload = {
        event_id: eventId, user_id: userId,
        cars, eras, car_count,
        ...(rolls != null ? { rolls } : {}),
      };
      const { data, error } = await SB.from('boards')
        .upsert(payload, { onConflict: 'event_id,user_id' })
        .select().single();
      if (error) throw error;
      return data;
    },
    async setRolls(eventId, rolls) {
      const userId = requireUser();
      const { data, error } = await SB.from('boards')
        .update({ rolls }).eq('event_id', eventId).eq('user_id', userId)
        .select().single();
      if (error) throw error;
      return data;
    },
  },

  // ─── Sightings (per-user) ─────────────────────────────────────────
  sightings: {
    async listMine({ eventId } = {}) {
      const userId = requireUser();
      let q = SB.from('sightings')
        .select('*, sighting_photos(id, storage_path, taken_at)')
        .eq('user_id', userId)
        .order('spotted_at', { ascending: false });
      if (eventId !== undefined) q = q.eq('event_id', eventId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const userId = requireUser();
      const row = {
        event_id:   payload.event_id ?? null,
        user_id:    userId,
        car_name:   payload.car_name,
        car_era:    payload.car_era,
        car_make:   payload.car_make ?? null,
        car_rarity: payload.car_rarity ?? null,
        score:      payload.score ?? null,
        notes:      payload.notes ?? null,
        location:   payload.location ?? null,
      };
      const { data, error } = await SB.from('sightings').insert(row)
        .select('*, sighting_photos(id, storage_path, taken_at)').single();
      if (error) throw error;
      return data;
    },
    async update(id, patch) {
      const { data, error } = await SB.from('sightings')
        .update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      // Cleanup attached photo objects before deleting the parent row.
      try {
        const { data } = await SB.from('sighting_photos')
          .select('storage_path')
          .eq('sighting_id', id);
        const paths = (data || []).map(p => p.storage_path).filter(Boolean);
        if (paths.length) await SB.storage.from('photos').remove(paths);
      } catch (e) { console.warn('sightings.remove storage cleanup:', e); }
      const { error } = await SB.from('sightings').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // ─── Sighting photos ──────────────────────────────────────────────
  sightingPhotos: {
    async list(sightingId) {
      const { data, error } = await SB.from('sighting_photos').select('*')
        .eq('sighting_id', sightingId)
        .order('taken_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    async attach({ sighting_id, storage_path }) {
      const { data, error } = await SB.from('sighting_photos').insert({
        sighting_id, storage_path,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id, storage_path) {
      const { error } = await SB.from('sighting_photos').delete().eq('id', id);
      if (error) throw error;
      if (storage_path) await DB.storage.removePhoto(storage_path);
    },
  },

  // ─── My cars (owner-private) ──────────────────────────────────────
  myCars: {
    async list() {
      const userId = requireUser();
      const { data, error } = await SB.from('my_cars')
        .select('*, my_car_photos(id, storage_path, taken_at, log_entry_id)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async get(id) {
      const { data, error } = await SB.from('my_cars')
        .select('*, my_car_photos(id, storage_path, taken_at, log_entry_id)')
        .eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async create({ name, make, model, year, registration, notes }) {
      const userId = requireUser();
      const { data, error } = await SB.from('my_cars').insert({
        owner_id: userId, name, make, model, year, registration, notes,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, patch) {
      const { data, error } = await SB.from('my_cars')
        .update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      // Cleanup all attached photos in Storage before cascade.
      try {
        const { data } = await SB.from('my_car_photos')
          .select('storage_path')
          .eq('my_car_id', id);
        const paths = (data || []).map(p => p.storage_path).filter(Boolean);
        if (paths.length) await SB.storage.from('photos').remove(paths);
      } catch (e) { console.warn('myCars.remove storage cleanup:', e); }
      const { error } = await SB.from('my_cars').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // ─── My car log ───────────────────────────────────────────────────
  myCarLog: {
    async list(myCarId) {
      const { data, error } = await SB.from('my_car_log').select('*')
        .eq('my_car_id', myCarId)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create({ my_car_id, entry_kind, title, body, entry_date }) {
      const userId = requireUser();
      const { data, error } = await SB.from('my_car_log').insert({
        my_car_id, user_id: userId,
        entry_kind, title, body: body ?? null,
        entry_date: entry_date || new Date().toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, patch) {
      const { data, error } = await SB.from('my_car_log')
        .update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      const { error } = await SB.from('my_car_log').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // ─── My car photos ────────────────────────────────────────────────
  myCarPhotos: {
    async attach({ my_car_id, log_entry_id, storage_path }) {
      const { data, error } = await SB.from('my_car_photos').insert({
        my_car_id, log_entry_id: log_entry_id ?? null, storage_path,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id, storage_path) {
      const { error } = await SB.from('my_car_photos').delete().eq('id', id);
      if (error) throw error;
      if (storage_path) await DB.storage.removePhoto(storage_path);
    },
  },

  // ─── Upcoming events calendar ─────────────────────────────────────
  upcoming: {
    async list() {
      const { data, error } = await SB.from('upcoming_events')
        .select('*, upcoming_event_attendees(user_id)')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    async create({ name, location, event_date, url, notes }) {
      const userId = requireUser();
      const { data, error } = await SB.from('upcoming_events').insert({
        name, location, event_date,
        url:   url   ?? null,
        notes: notes ?? null,
        created_by: userId,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, patch) {
      const { data, error } = await SB.from('upcoming_events')
        .update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      const { error } = await SB.from('upcoming_events').delete().eq('id', id);
      if (error) throw error;
    },
    async setAttending(upcomingId, attending) {
      const userId = requireUser();
      if (attending) {
        // ignoreDuplicates: same reason as DB.attendees.join — RSVPing
        // when already attending is a no-op, and avoiding DO UPDATE
        // means we don't need an UPDATE policy on the join table.
        const { error } = await SB.from('upcoming_event_attendees').upsert({
          upcoming_event_id: upcomingId, user_id: userId,
        }, { onConflict: 'upcoming_event_id,user_id', ignoreDuplicates: true });
        if (error) throw error;
      } else {
        const { error } = await SB.from('upcoming_event_attendees').delete()
          .eq('upcoming_event_id', upcomingId).eq('user_id', userId);
        if (error) throw error;
      }
    },
  },

  // ─── Storage ──────────────────────────────────────────────────────
  storage: {
    publicUrl,

    // file: a Blob/File. kind: 'sightings' | 'my-car' | 'my-car-log'.
    // Returns { path, url }.
    async uploadPhoto(file, { kind = 'misc', filename } = {}) {
      requireUser();
      const ext     = (file.name?.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'jpg';
      const name    = filename
        || (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + safeExt);
      const path    = storageKeyFor(kind, name);
      const { error } = await SB.storage.from('photos').upload(path, file, {
        cacheControl: '3600',
        upsert:       false,
        contentType:  file.type || 'image/jpeg',
      });
      if (error) throw error;
      return { path, url: publicUrl(path) };
    },

    async removePhoto(path) {
      if (!path) return;
      const { error } = await SB.storage.from('photos').remove([path]);
      if (error) console.warn('removePhoto:', error);
    },
  },

};

window.DB = DB;
