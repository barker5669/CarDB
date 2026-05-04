// ══════════════════════════════════════════════════════════════════════
// PHOTO CACHE — IndexedDB-backed local copy of every photo blob.
//
// Why this exists: at car shows the network is rotten. Storage URLs
// resolve to <img src=...> over the network; if the fetch fails the
// cell shows no photo even though the upload succeeded. By stashing
// the original blob in IDB keyed by storage_path, we can hand back a
// blob: URL that loads instantly and works offline indefinitely.
//
// Usage:
//   PhotoCache.save(path, blob)   — store after every successful upload
//   PhotoCache.getUrlSync(path)   — synchronous lookup; returns null if
//                                    the in-memory map isn't warm yet
//   PhotoCache.warmAll(paths)     — populate the in-memory map; for
//                                    paths missing from IDB it fetches
//                                    from Supabase Storage and caches.
// ══════════════════════════════════════════════════════════════════════

const _PHC_DB    = 'cardb-photo-cache';
const _PHC_STORE = 'photos';
let _phcReady = null;

function _phcDb() {
  if (_phcReady) return _phcReady;
  _phcReady = new Promise((resolve, reject) => {
    const req = indexedDB.open(_PHC_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(_PHC_STORE);
    req.onsuccess       = () => resolve(req.result);
    req.onerror         = () => reject(req.error);
  });
  return _phcReady;
}

function _idbPut(path, blob) {
  return _phcDb().then(db => new Promise((res, rej) => {
    const tx = db.transaction(_PHC_STORE, 'readwrite');
    tx.objectStore(_PHC_STORE).put(blob, path);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  }));
}
function _idbGet(path) {
  return _phcDb().then(db => new Promise((res, rej) => {
    const tx = db.transaction(_PHC_STORE, 'readonly');
    const r  = tx.objectStore(_PHC_STORE).get(path);
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  }));
}
function _idbDel(path) {
  return _phcDb().then(db => new Promise((res, rej) => {
    const tx = db.transaction(_PHC_STORE, 'readwrite');
    tx.objectStore(_PHC_STORE).delete(path);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  }));
}

// Live object URLs by storage_path, so renders can be synchronous.
const _liveUrls = new Map();

function _setLive(path, blob) {
  if (_liveUrls.has(path)) URL.revokeObjectURL(_liveUrls.get(path));
  _liveUrls.set(path, URL.createObjectURL(blob));
}

async function PhotoCache_save(path, blob) {
  if (!path || !blob) return;
  try {
    await _idbPut(path, blob);
    _setLive(path, blob);
  } catch (e) { console.warn('PhotoCache.save:', e); }
}

function PhotoCache_getUrlSync(path) {
  return _liveUrls.get(path) || null;
}

async function PhotoCache_getUrl(path) {
  if (!path) return null;
  const live = _liveUrls.get(path);
  if (live) return live;
  try {
    const blob = await _idbGet(path);
    if (!blob) return null;
    _setLive(path, blob);
    return _liveUrls.get(path);
  } catch { return null; }
}

async function PhotoCache_remove(path) {
  if (!path) return;
  try { await _idbDel(path); } catch {}
  if (_liveUrls.has(path)) {
    URL.revokeObjectURL(_liveUrls.get(path));
    _liveUrls.delete(path);
  }
}

// Warm the in-memory Map for a set of paths. Anything not in IDB is
// fetched from Storage and cached. Failures are silent — we still
// want the rest to populate.
async function PhotoCache_warmAll(paths, { fetchMissing = true } = {}) {
  const todo = [];
  for (const p of paths) {
    if (!p || _liveUrls.has(p)) continue;
    try {
      const blob = await _idbGet(p);
      if (blob) {
        _setLive(p, blob);
      } else if (fetchMissing) {
        todo.push(p);
      }
    } catch (e) { console.warn('PhotoCache.warm get:', p, e); }
  }
  if (!todo.length || typeof SB === 'undefined') return;
  // Pull missing ones from Storage in small parallel batches.
  const BATCH = 4;
  for (let i = 0; i < todo.length; i += BATCH) {
    await Promise.all(todo.slice(i, i + BATCH).map(async path => {
      try {
        const url = SB.storage.from('photos').getPublicUrl(path).data.publicUrl;
        const r = await fetch(url, { cache: 'force-cache' });
        if (!r.ok) return;
        const blob = await r.blob();
        await _idbPut(path, blob);
        _setLive(path, blob);
      } catch (e) { console.warn('PhotoCache.warm fetch:', path, e); }
    }));
  }
}

window.PhotoCache = {
  save:        PhotoCache_save,
  getUrlSync:  PhotoCache_getUrlSync,
  getUrl:      PhotoCache_getUrl,
  remove:      PhotoCache_remove,
  warmAll:     PhotoCache_warmAll,
};
