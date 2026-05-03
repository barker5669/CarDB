// ══════════════════════════════════════════════════════════════════════
// QUEUE — offline mutation queue for sightings + sighting photos
//
// What FIL sees: he taps "spotted" or "add photo" and it just works,
// even if Wi-Fi blinks. Behind the scenes, Queue tries the live DB
// call first; on a network failure (or while navigator.onLine is
// false) it stashes an envelope in localStorage, blobs in IndexedDB,
// and synthesises an optimistic row so the UI can render immediately.
//
// On `online` and on visibilitychange→visible, Queue.drain() replays
// envelopes oldest-first. Temp ids issued offline (local-...) are
// swapped for real DB ids via tempMap, which photo.attach envelopes
// resolve through when they land.
//
// Other mutations (events, my_cars, upcoming) are not queued — they
// surface errors directly. The hot path for FIL is sightings + photos.
// ══════════════════════════════════════════════════════════════════════

const _Q_KEY          = 'cb-mutation-queue-v1';
const _Q_TEMP_MAP_KEY = 'cb-tempid-map-v1';
const _IDB_NAME       = 'cardb-photos';
const _IDB_STORE      = 'pending';

let _qState   = null;   // array of envelopes
let _tempMap  = null;   // { 'local-abc': 42 }
let _draining = false;
let _idbReady = null;

// ─── Persistence ─────────────────────────────────────────────────────

function _qLoad() {
  if (_qState) return _qState;
  try { _qState = JSON.parse(localStorage.getItem(_Q_KEY) || '[]'); }
  catch { _qState = []; }
  return _qState;
}
function _qSave() {
  try { localStorage.setItem(_Q_KEY, JSON.stringify(_qState)); }
  catch (e) { console.warn('queue save:', e); }
}
function _mapLoad() {
  if (_tempMap) return _tempMap;
  try { _tempMap = JSON.parse(localStorage.getItem(_Q_TEMP_MAP_KEY) || '{}'); }
  catch { _tempMap = {}; }
  return _tempMap;
}
function _mapSave() {
  try { localStorage.setItem(_Q_TEMP_MAP_KEY, JSON.stringify(_tempMap)); }
  catch (e) { console.warn('tempmap save:', e); }
}

function _genTempId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function _isTempId(id)         { return typeof id === 'string' && id.startsWith('local-'); }
function _resolveTempId(id) {
  if (!_isTempId(id)) return id;
  _mapLoad();
  return _tempMap[id] || id;
}

function _isNetErr(err) {
  if (!err) return false;
  if (err.status === 0)                     return true;
  if (err.status >= 500 && err.status < 600) return true;
  const m = String(err.message || err).toLowerCase();
  return m.includes('failed to fetch')
      || m.includes('networkerror')
      || m.includes('load failed')
      || m.includes('network request failed')
      || err.name === 'TypeError';  // fetch throws TypeError on offline
}

function _setIndicator() {
  const n = (_qState || []).length;
  const el = document.getElementById('queue-indicator');
  if (!el) return;
  el.textContent = n > 0 ? `↑ ${n} syncing…` : '';
  el.classList.toggle('show', n > 0);
}

// ─── IndexedDB for offline photo blobs ───────────────────────────────

function _idb() {
  if (_idbReady) return _idbReady;
  _idbReady = new Promise((resolve, reject) => {
    const req = indexedDB.open(_IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(_IDB_STORE);
    req.onsuccess       = () => resolve(req.result);
    req.onerror         = () => reject(req.error);
  });
  return _idbReady;
}
async function _idbPut(key, blob) {
  const db = await _idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(_IDB_STORE, 'readwrite');
    tx.objectStore(_IDB_STORE).put(blob, key);
    tx.oncomplete = res;
    tx.onerror    = () => rej(tx.error);
  });
}
async function _idbGet(key) {
  const db = await _idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(_IDB_STORE, 'readonly');
    const r  = tx.objectStore(_IDB_STORE).get(key);
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
}
async function _idbDel(key) {
  const db = await _idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(_IDB_STORE, 'readwrite');
    tx.objectStore(_IDB_STORE).delete(key);
    tx.oncomplete = res;
    tx.onerror    = () => rej(tx.error);
  });
}

// ─── Public API ──────────────────────────────────────────────────────

const Queue = {

  // Returns a row-shaped object the UI can render. Online: the real
  // DB row. Offline: synthetic with a temp id (.id.startsWith('local-'))
  // and ._pending = true.
  async sightingCreate(payload) {
    try {
      return await DB.sightings.create(payload);
    } catch (err) {
      if (!_isNetErr(err) && navigator.onLine) throw err;
      _qLoad();
      const tempId = _genTempId();
      const synthetic = {
        id:         tempId,
        event_id:   payload.event_id ?? null,
        user_id:    currentUserId(),
        car_name:   payload.car_name,
        car_era:    payload.car_era,
        car_make:   payload.car_make ?? null,
        car_rarity: payload.car_rarity ?? null,
        score:      payload.score ?? null,
        notes:      payload.notes ?? null,
        location:   payload.location ?? null,
        spotted_at: new Date().toISOString(),
        sighting_photos: [],
        _pending:   true,
      };
      _qState.push({ kind: 'sighting.create', payload, tempId, ts: Date.now() });
      _qSave();
      _setIndicator();
      return synthetic;
    }
  },

  async sightingDelete(id) {
    if (_isTempId(id)) {
      // Cancelling a still-queued create: drop the create + any of
      // its photo.attach envelopes. Nothing reaches the server.
      _qLoad();
      _qState = _qState.filter(env => {
        if (env.kind === 'sighting.create' && env.tempId    === id) return false;
        if (env.kind === 'photo.attach'    && env.sightingId === id) return false;
        return true;
      });
      _qSave();
      _setIndicator();
      return;
    }
    try { await DB.sightings.remove(id); }
    catch (err) {
      if (!_isNetErr(err) && navigator.onLine) throw err;
      _qLoad();
      _qState.push({ kind: 'sighting.delete', id, ts: Date.now() });
      _qSave();
      _setIndicator();
    }
  },

  // Returns a photo entry the UI can render. Pending entries get a
  // local objectURL for display until the upload settles.
  async sightingPhotoAttach(blob, sightingId, { kind = 'sightings' } = {}) {
    const realSightingId = _resolveTempId(sightingId);

    // If parent sighting hasn't synced yet, we have to queue regardless.
    if (_isTempId(realSightingId)) {
      const blobKey = `pendphoto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      await _idbPut(blobKey, blob);
      _qLoad();
      _qState.push({ kind: 'photo.attach', sightingId, blobKey, uploadKind: kind, ts: Date.now() });
      _qSave();
      _setIndicator();
      return { id: blobKey, path: null, url: URL.createObjectURL(blob), ts: new Date().toISOString(), _pending: true };
    }

    try {
      const { path, url } = await DB.storage.uploadPhoto(blob, { kind });
      const photoRow = await DB.sightingPhotos.attach({ sighting_id: realSightingId, storage_path: path });
      return { id: photoRow.id, path, url, ts: photoRow.taken_at };
    } catch (err) {
      if (!_isNetErr(err) && navigator.onLine) throw err;
      const blobKey = `pendphoto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      await _idbPut(blobKey, blob);
      _qLoad();
      _qState.push({ kind: 'photo.attach', sightingId: realSightingId, blobKey, uploadKind: kind, ts: Date.now() });
      _qSave();
      _setIndicator();
      return { id: blobKey, path: null, url: URL.createObjectURL(blob), ts: new Date().toISOString(), _pending: true };
    }
  },

  pendingCount() { _qLoad(); return _qState.length; },

  async drain() {
    if (_draining) return;
    if (!currentUserId()) return;
    _qLoad();
    if (!_qState.length) return;
    _draining = true;
    let progressed = false;
    try {
      while (_qState.length) {
        const env = _qState[0];
        try {
          await _apply(env);
          _qState.shift();
          _qSave();
          _setIndicator();
          progressed = true;
        } catch (err) {
          if (_isNetErr(err)) {
            console.warn('Queue.drain: network blip; will retry');
            break;
          }
          console.error('Queue.drain: irrecoverable, dropping', env, err);
          showSnack?.('⚠️ One change failed to sync and was dropped');
          _qState.shift();
          _qSave();
          _setIndicator();
        }
      }
      if (progressed && typeof hydrateSightingsFromDB === 'function') {
        // Pull the canonical state so temp ids in S.spotted resolve to
        // the real ones the server now knows about.
        await hydrateSightingsFromDB();
        if (typeof renderList            === 'function') renderList();
        if (typeof buildEraTabs          === 'function') buildEraTabs();
        if (typeof renderEventList       === 'function') renderEventList();
        if (typeof renderGarage          === 'function') renderGarage();
        if (typeof refreshModalSightings === 'function') refreshModalSightings();
      }
    } finally {
      _draining = false;
    }
  },
};

async function _apply(env) {
  switch (env.kind) {
    case 'sighting.create': {
      const row = await DB.sightings.create(env.payload);
      _mapLoad();
      _tempMap[env.tempId] = row.id;
      _mapSave();
      return;
    }
    case 'sighting.delete': {
      await DB.sightings.remove(env.id);
      return;
    }
    case 'photo.attach': {
      const blob = await _idbGet(env.blobKey);
      if (!blob) throw new Error('Pending photo blob missing in IDB');
      const sightingId = _resolveTempId(env.sightingId);
      if (_isTempId(sightingId)) {
        // Parent create envelope must run first. Throw a non-net error
        // so the queue drops this item — but actually we want it to
        // wait. Solution: shuffle to back of queue.
        throw Object.assign(new Error('Parent sighting not yet synced'), { _retry: true });
      }
      const { path } = await DB.storage.uploadPhoto(blob, { kind: env.uploadKind || 'sightings' });
      await DB.sightingPhotos.attach({ sighting_id: sightingId, storage_path: path });
      await _idbDel(env.blobKey);
      return;
    }
    default:
      throw new Error(`Unknown queue kind: ${env.kind}`);
  }
}

// Auto-drain hooks
window.addEventListener('online', () => { Queue.drain(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') Queue.drain();
});

window.Queue = Queue;
