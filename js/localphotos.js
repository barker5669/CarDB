// ══════════════════════════════════════════════════════════════════════
// LOCAL PHOTOS — device-only photo store. Zero-cost design: photos
// never leave the device. Sighting metadata syncs through Supabase
// (cheap text rows), but the bytes of the photo blob stay on the
// phone in IndexedDB.
//
// Why local-only: Supabase Storage charges per GB; we run on the free
// tier and FIL takes lots of photos at car shows. Keeping photos
// local is the only way to stay £0.
//
// Tradeoffs we accept:
//   - photos don't sync between devices (FIL's photos stay on his
//     phone; user's stay on theirs). Sightings still sync, so each
//     person sees the other's spotted cars — just no thumbnails for
//     photos taken on the other device.
//   - iOS Safari can evict IndexedDB under storage pressure. If that
//     happens the photos disappear; the sighting itself survives.
//
// Storage layout:
//   localStorage 'cb-local-photos-v1':
//       { [sightingId]: [{ id, path, ts }, ...] }
//   PhotoCache (IndexedDB) under the synthetic `path`:
//       the actual blob.
//
// Rendering: existing photoUrl(p) calls PhotoCache.getUrlSync(p.path),
// which returns a live blob: URL — same code path as cached uploaded
// photos used to take. No render code changes.
// ══════════════════════════════════════════════════════════════════════

const _LP_KEY = 'cb-local-photos-v1';

function _lpLoad() {
  try { return JSON.parse(localStorage.getItem(_LP_KEY) || '{}') || {}; }
  catch { return {}; }
}
function _lpSave(map) {
  try { localStorage.setItem(_LP_KEY, JSON.stringify(map)); }
  catch (e) { console.warn('LocalPhotos save:', e); }
}

const LocalPhotos = {
  // Save a freshly-captured blob and return a photo entry the caller
  // can push into S.spotted[...].sightings[i].photos. `meta` is merged
  // into the entry and persisted (e.g. { location } for sortbin items,
  // { log_entry_id } for my-car log photos).
  async add(ownerId, blob, meta = {}) {
    const id   = `lp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const path = id;  // synthetic path; PhotoCache key
    if (typeof PhotoCache !== 'undefined') {
      try { await PhotoCache.save(path, blob); }
      catch (e) { console.warn('LocalPhotos.add PhotoCache.save:', e); }
    }
    const map = _lpLoad();
    if (!map[ownerId]) map[ownerId] = [];
    const entry = { id, path, ts: new Date().toISOString(), ...meta };
    map[ownerId].push(entry);
    _lpSave(map);
    const url = (typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync(path))
      || URL.createObjectURL(blob);
    return { ...entry, url };
  },

  // Reassign an existing entry (and its blob) from one owner to another
  // without touching PhotoCache. Used by the sort-bin → sighting attach
  // flow: the binned blob is reused as the sighting's photo.
  move(fromOwner, photoId, toOwner) {
    const map = _lpLoad();
    const arr = map[fromOwner] || [];
    const idx = arr.findIndex(p => p.id === photoId);
    if (idx < 0) return null;
    const entry = arr[idx];
    arr.splice(idx, 1);
    if (!arr.length) delete map[fromOwner];
    if (!map[toOwner]) map[toOwner] = [];
    map[toOwner].push(entry);
    _lpSave(map);
    return entry;
  },

  // Remove just the entry from one owner. Pass { withBlob: true } to
  // also drop the PhotoCache blob — only safe when no other owner
  // references the same path.
  removeEntry(ownerId, photoId, { withBlob = false } = {}) {
    const map = _lpLoad();
    if (!map[ownerId]) return;
    const removed = map[ownerId].find(p => p.id === photoId);
    map[ownerId] = map[ownerId].filter(p => p.id !== photoId);
    if (!map[ownerId].length) delete map[ownerId];
    _lpSave(map);
    if (withBlob && removed && typeof PhotoCache !== 'undefined') {
      PhotoCache.remove(removed.path).catch(() => {});
    }
  },

  list(sightingId) {
    const map = _lpLoad();
    const items = map[sightingId] || [];
    // Kick off async warming for any path that doesn't already have a
    // live URL — a fresh tab won't have any in-memory blob URLs yet, and
    // photoUrl(p) is a synchronous lookup. After warm completes, the
    // caller's next render picks them up.
    if (typeof PhotoCache !== 'undefined') {
      const cold = items.filter(p => !PhotoCache.getUrlSync(p.path));
      if (cold.length) {
        PhotoCache.warmAll(cold.map(p => p.path), { fetchMissing: false })
          .then(() => {
            try { window.dispatchEvent(new CustomEvent('localphotos:warmed', { detail: { ownerId } })); } catch {}
          })
          .catch(() => {});
      }
    }
    return items.map(p => ({
      ...p,
      url: (typeof PhotoCache !== 'undefined') ? PhotoCache.getUrlSync(p.path) : null,
    }));
  },

  // After the queue drains a temp 'local-...' sighting into a real DB
  // id, photos saved under the temp id need to follow.
  rekey(oldSightingId, newSightingId) {
    const map = _lpLoad();
    if (!map[oldSightingId]) return;
    map[newSightingId] = (map[newSightingId] || []).concat(map[oldSightingId]);
    delete map[oldSightingId];
    _lpSave(map);
  },

  // Drop everything for an owner (when a sighting / car / log entry
  // is deleted).
  removeAll(ownerId) {
    const map = _lpLoad();
    const list = map[ownerId] || [];
    delete map[ownerId];
    _lpSave(map);
    if (typeof PhotoCache !== 'undefined') {
      list.forEach(p => PhotoCache.remove(p.path).catch(() => {}));
    }
  },

  // Hydrate PhotoCache's in-memory URL map from IDB on app start, so
  // the first render after a reload doesn't show empty thumbnails.
  async warmAll() {
    if (typeof PhotoCache === 'undefined') return;
    const map = _lpLoad();
    const paths = Object.values(map).flat().map(p => p.path).filter(Boolean);
    if (paths.length) {
      try { await PhotoCache.warmAll(paths, { fetchMissing: false }); }
      catch (e) { console.warn('LocalPhotos.warmAll:', e); }
    }
  },
};

window.LocalPhotos = LocalPhotos;
