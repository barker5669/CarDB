// ══════════════════════════════════════════════════════════════════════
// PHOTOBIN — "save for later" bin for unassigned photos.
//
// Source of truth: the `unassigned_photos` table in Supabase (per-user,
// RLS-locked). localStorage is a hot cache populated by sync() so the
// Sort screen can render instantly without waiting on the network.
//
// Item shape (in cache and from DB):
//   { id, storage_path, ts, location }
//
// id is the bigint from Supabase. Items added while offline get a
// temporary `local-XXXX` id and a `_pending` flag; sync() promotes
// them on the next online hydration.
// ══════════════════════════════════════════════════════════════════════

const _PB_KEY = 'cb-photobin-v2';

const PhotoBin = {
  list() {
    try {
      const arr = JSON.parse(localStorage.getItem(_PB_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },
  _save(arr) {
    try { localStorage.setItem(_PB_KEY, JSON.stringify(arr)); }
    catch (e) { console.warn('PhotoBin save:', e); }
  },
  count() { return this.list().length; },

  // Add a freshly-saved photo. Tries the DB first; on failure, stores
  // a local-only entry (Supabase patch may not be applied; or device
  // is offline) so the user still sees it on the Sort screen.
  async add({ storage_path, location }) {
    let item = null;
    try {
      const row = await DB.unassigned.create({ storage_path, location });
      item = {
        id:           row.id,
        storage_path: row.storage_path,
        ts:           row.taken_at ? new Date(row.taken_at).getTime() : Date.now(),
        location:     row.location || null,
      };
    } catch (e) {
      // Likely the patch SQL hasn't been run yet, or offline. Fall
      // back to a local-only entry so the user doesn't lose track.
      console.warn('PhotoBin DB add failed; saving local-only:', e);
      item = {
        id:           `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
        storage_path,
        ts:           Date.now(),
        location:     location || null,
        _pending:     true,
      };
    }
    const arr = this.list();
    arr.unshift(item);
    this._save(arr);
    return item.id;
  },

  // Remove an item (after assignment, or via the Discard-all flow).
  // Cleans up the DB row + Storage object when applicable.
  async remove(id, { keepStorage = false } = {}) {
    const item = this.list().find(p => p.id === id);
    if (!item) return;
    if (typeof item.id === 'number') {
      try {
        await DB.unassigned.remove(item.id, keepStorage ? null : item.storage_path);
      } catch (e) { console.warn('PhotoBin DB remove:', e); }
    } else if (!keepStorage && item.storage_path) {
      try { await DB.storage.removePhoto(item.storage_path); } catch {}
    }
    this._save(this.list().filter(p => p.id !== id));
  },

  // Mark an item as "assigned to a sighting" — same as remove(), but
  // skips Storage cleanup because the path was reused for the new
  // sighting_photos row.
  async markAssigned(id) {
    return this.remove(id, { keepStorage: true });
  },

  async clear() {
    const items = this.list();
    for (const it of items) {
      if (typeof it.id === 'number') {
        try { await DB.unassigned.remove(it.id, it.storage_path); } catch {}
      } else if (it.storage_path) {
        try { await DB.storage.removePhoto(it.storage_path); } catch {}
      }
    }
    try { localStorage.removeItem(_PB_KEY); } catch {}
  },

  // Pull the latest from Supabase and reconcile with the local cache.
  // - DB rows replace the cached entries (DB is source of truth)
  // - Local-only entries that haven't synced yet are kept and tried
  //   again here (so a flaky-network add eventually lands)
  // Called on sign-in, on tab focus when needed, after the schema
  // patch is applied.
  async sync() {
    let dbItems = [];
    try {
      const rows = await DB.unassigned.list();
      dbItems = (rows || []).map(r => ({
        id:           r.id,
        storage_path: r.storage_path,
        ts:           r.taken_at ? new Date(r.taken_at).getTime() : Date.now(),
        location:     r.location || null,
      }));
    } catch (e) {
      console.warn('PhotoBin.sync list:', e);
      return;
    }
    // Try to push local-only items that haven't reached the DB yet.
    const local = this.list();
    const pending = local.filter(p => typeof p.id === 'string' && p.id.startsWith('local-'));
    for (const p of pending) {
      try {
        const row = await DB.unassigned.create({ storage_path: p.storage_path, location: p.location });
        dbItems.unshift({
          id:           row.id,
          storage_path: row.storage_path,
          ts:           row.taken_at ? new Date(row.taken_at).getTime() : Date.now(),
          location:     row.location || null,
        });
      } catch (e) {
        // Still couldn't push — keep the local entry around for next time.
        console.warn('PhotoBin.sync push:', e);
        dbItems.push(p);
      }
    }
    // Sort newest-first by ts.
    dbItems.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    this._save(dbItems);
  },
};

window.PhotoBin = PhotoBin;
