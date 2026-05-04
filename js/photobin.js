// ══════════════════════════════════════════════════════════════════════
// PHOTOBIN — local list of "I'll sort this later" photos.
//
// User snaps a bunch of photos at a busy show, taps "Save for later"
// each time, then sits down later and walks through assigning each
// photo to a car. The bin keeps lightweight metadata in localStorage;
// the photo blobs themselves live in PhotoCache (IndexedDB) and the
// originals are uploaded to Supabase Storage so they're backed up.
//
// Storage shape per pending entry:
//   { id, storage_path, ts, location? }
// ══════════════════════════════════════════════════════════════════════

const _PB_KEY = 'cb-photobin-v1';

const PhotoBin = {
  list() {
    try {
      const arr = JSON.parse(localStorage.getItem(_PB_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },
  _save(arr) {
    try { localStorage.setItem(_PB_KEY, JSON.stringify(arr)); } catch (e) { console.warn('PhotoBin save:', e); }
  },
  add(item) {
    const id = `pb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const arr = this.list();
    arr.unshift({ id, ts: Date.now(), ...item });
    this._save(arr);
    return id;
  },
  get(id) {
    return this.list().find(p => p.id === id) || null;
  },
  remove(id) {
    this._save(this.list().filter(p => p.id !== id));
  },
  count() { return this.list().length; },
  clear() { try { localStorage.removeItem(_PB_KEY); } catch {} },
};

window.PhotoBin = PhotoBin;
