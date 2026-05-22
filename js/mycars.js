// ══════════════════════════════════════════════════════════════════════
// MY CARS — owner-private vehicle log: photos, service, mods, drives
//
// One screen with two states: list and detail. State lives in
// _myCarsActive (numeric id or null). Renders into #mycars-body.
//
// Forms use prompt() for now — Phase 9 (UI polish) replaces them with
// proper modal sheets.
// ══════════════════════════════════════════════════════════════════════

let _myCars       = null;   // cached list
let _myCarsActive = null;   // currently-viewed car id
let _mcLogFilter  = 'all';  // 'all' | one of MC_LOG_KINDS

const MC_LOG_KINDS = ['service','mod','drive','note','photo'];
const MC_LOG_LABEL = { service:'Service', mod:'Mod', drive:'Drive', note:'Note', photo:'Photo' };

// Clean SVG placeholders — replace the old emoji car glyphs. Brass
// hairline icons that sit comfortably in the premium paper aesthetic.
const MC_PH_CAMERA = '<svg viewBox="0 0 24 24" class="mc-ph-svg" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
const MC_PH_CAR = '<svg viewBox="0 0 24 24" class="mc-ph-svg" aria-hidden="true"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>';

// Eight turntable angles in rotation order — front, sweeping
// clockwise back round to front. Filling all eight gives a spin-
// style preview (the foundation for a true 3D/rotatable view).
const MC_ANGLES = [
  { id:'front',   label:'Front' },
  { id:'front-r', label:'Front R' },
  { id:'right',   label:'Right' },
  { id:'rear-r',  label:'Rear R' },
  { id:'rear',    label:'Rear' },
  { id:'rear-l',  label:'Rear L' },
  { id:'left',    label:'Left' },
  { id:'front-l', label:'Front L' },
];

let _mcDetailCar   = null;  // car currently shown in the detail page
let _mcTurntableIdx = 0;    // active angle index in the turntable
let _mcPendingAngle = null; // angle id awaiting a captured photo

// ─── Local-only photo wiring ────────────────────────────────────────
//
// Photos stay on-device per the £0 design constraint. Each car owns a
// LocalPhotos bucket keyed `mc-${carId}`; entries carry meta
// { log_entry_id } so we can clean up when the entry is deleted.
// Legacy photos that are still in Supabase Storage (uploaded before
// this change) keep rendering until they age out — we merge them into
// the same list at render time.

const _MC_HERO_KEY = 'cb-mycar-hero-v1';
function _mcHeroLoad() {
  try { return JSON.parse(localStorage.getItem(_MC_HERO_KEY) || '{}') || {}; }
  catch { return {}; }
}
function _mcHeroSave(map) {
  try { localStorage.setItem(_MC_HERO_KEY, JSON.stringify(map)); }
  catch (e) { console.warn('mycar hero save:', e); }
}
function _setMcHero(carId, photoId) {
  const map = _mcHeroLoad();
  if (photoId == null) delete map[carId];
  else                 map[carId] = photoId;
  _mcHeroSave(map);
}

function _mcOwnerId(carId) { return `mc-${carId}`; }

function _mcPhotosFor(car) {
  const dbPhotos = (car.my_car_photos || []).map(p => ({
    id:           p.id,
    path:         p.storage_path,
    ts:           p.taken_at,
    log_entry_id: p.log_entry_id,
    _legacy:      true,
  }));
  const local = (typeof LocalPhotos !== 'undefined') ? LocalPhotos.list(_mcOwnerId(car.id)) : [];
  return [...dbPhotos, ...local];
}

// Map of angle id → photo entry for a car's turntable. An untagged,
// non-log photo (e.g. a legacy cover from before angle tagging)
// stands in as Front so older cars still show something.
function _mcAngleMap(car) {
  const photos = _mcPhotosFor(car);
  const map = {};
  for (const p of photos) {
    if (p.angle && !map[p.angle]) map[p.angle] = p;
  }
  if (!map.front) {
    const legacy = photos.find(p => !p.angle && !p.log_entry_id);
    if (legacy) map.front = legacy;
  }
  return map;
}

function _mcHeroFor(car, photos) {
  // Cover photo = the Front turntable angle, else the first filled
  // angle, else the legacy hero pointer, else any photo.
  const angleMap = _mcAngleMap(car);
  if (angleMap.front) return angleMap.front;
  for (const a of MC_ANGLES) { if (angleMap[a.id]) return angleMap[a.id]; }
  const heroId = _mcHeroLoad()[car.id];
  if (heroId != null) {
    const found = (photos || []).find(p => String(p.id) === String(heroId));
    if (found) return found;
  }
  if (car.hero_photo_id != null) {
    const found = (photos || []).find(p => p._legacy && String(p.id) === String(car.hero_photo_id));
    if (found) return found;
  }
  return (photos || [])[0] || null;
}

function _mcPhotoUrl(p) {
  if (!p) return null;
  if (typeof PhotoCache !== 'undefined') {
    const cached = PhotoCache.getUrlSync(p.path);
    if (cached) return cached;
  }
  if (p._legacy) return DB.storage.publicUrl(p.path);
  return null;
}

// Re-render the my-car page when a fresh batch of blob URLs is ready
// (LocalPhotos warm completes asynchronously after a cold load).
window.addEventListener('localphotos:warmed', () => {
  try {
    if (S.tab !== 'mycars') return;
    if (_myCarsActive != null) showMyCarDetail(_myCarsActive);
    else                       renderMyCarsList();
  } catch {}
});

const _REMOTE_MYCARS_CACHE_KEY = 'cb-remote-mycars-cache-v1';

async function _loadMyCars(force = false) {
  if (!force && _myCars) return _myCars;
  // Local cars are always read first — instant, never blocks. Remote
  // sync is best-effort and falls back to the LAST successful remote
  // payload (cached to localStorage) so cars added via the old
  // Supabase path don't vanish when the backend is unreachable.
  const local = LocalMyCars.list();
  let remote = [];
  let remoteOk = false;
  try {
    const wrap = (typeof _raceTimeout === 'function')
      ? _raceTimeout(DB.myCars.list(), 'My cars', 8000)
      : DB.myCars.list();
    const fetched = await wrap;
    if (Array.isArray(fetched)) {
      remote = fetched;
      remoteOk = true;
      // Cache for next time — survives Supabase outages.
      try { localStorage.setItem(_REMOTE_MYCARS_CACHE_KEY, JSON.stringify(remote)); }
      catch (e) { console.warn('myCars cache save:', e); }
    }
  } catch (err) {
    console.warn('myCars.list failed (will use cached remote):', err);
  }
  if (!remoteOk) {
    // Fall back to the last successful remote response.
    try {
      const cached = JSON.parse(localStorage.getItem(_REMOTE_MYCARS_CACHE_KEY) || '[]');
      if (Array.isArray(cached)) remote = cached;
    } catch {}
  }
  // Local entries come first — these are the cars the user added on
  // this device. Remote entries follow, deduped by id so we don't
  // double-render a car that's both in localStorage and Supabase.
  const seen = new Set(local.map(c => String(c.id)));
  const merged = [...local];
  for (const r of remote) {
    if (r && !seen.has(String(r.id))) merged.push(r);
  }
  _myCars = merged;
  return _myCars;
}

// Local-first My Cars store. The user is migrating off Supabase
// and the backend hangs intermittently — saving cars to localStorage
// means the Add Car flow works offline, instantly, with zero
// network dependency. Old remote cars still get merged in via
// _loadMyCars; new cars added here live entirely on the device.
const _LOCAL_MYCARS_KEY = 'cb-local-mycars-v1';
const LocalMyCars = {
  list() {
    try {
      const arr = JSON.parse(localStorage.getItem(_LOCAL_MYCARS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },
  _save(cars) {
    try { localStorage.setItem(_LOCAL_MYCARS_KEY, JSON.stringify(cars)); }
    catch (e) { console.warn('LocalMyCars save:', e); }
  },
  add(payload) {
    const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const car = {
      id,
      name:         payload.name,
      make:         payload.make,
      model:        payload.model,
      year:         payload.year,
      registration: payload.registration,
      notes:        payload.notes,
      my_car_photos: [],
      my_car_log_entries: [],
      _local: true,
    };
    const cars = this.list();
    cars.push(car);
    this._save(cars);
    return car;
  },
  update(id, patch) {
    const cars = this.list();
    const i = cars.findIndex(c => String(c.id) === String(id));
    if (i < 0) return null;
    cars[i] = { ...cars[i], ...patch };
    this._save(cars);
    return cars[i];
  },
  remove(id) {
    this._save(this.list().filter(c => String(c.id) !== String(id)));
  },
  isLocalId(id) { return String(id || '').startsWith('local-'); },
};
window.LocalMyCars = LocalMyCars;

// Local-first My Car Log store. Same rationale as LocalMyCars: the
// Supabase backend hangs intermittently and the user is migrating
// off it, so log entries (service / mod / drive / note / photo) are
// written to localStorage instantly. Remote sync is best-effort and
// only attempted for cars that have a real (non-local) id. Old
// remote log entries still render — _carLogEntries merges them in.
const _LOCAL_MYCAR_LOG_KEY = 'cb-local-mycar-log-v1';
const LocalMyCarLog = {
  _all() {
    try {
      const arr = JSON.parse(localStorage.getItem(_LOCAL_MYCAR_LOG_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },
  _save(entries) {
    try { localStorage.setItem(_LOCAL_MYCAR_LOG_KEY, JSON.stringify(entries)); }
    catch (e) { console.warn('LocalMyCarLog save:', e); }
  },
  // All entries for one car, newest first (by entry_date then ts).
  list(carId) {
    return this._all()
      .filter(e => String(e.my_car_id) === String(carId))
      .sort((a, b) => String(b.entry_date || '').localeCompare(String(a.entry_date || ''))
                   || (b._ts || 0) - (a._ts || 0));
  },
  add(payload) {
    const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const entry = {
      id,
      my_car_id:  payload.my_car_id,
      entry_kind: payload.entry_kind,
      title:      payload.title,
      body:       payload.body ?? null,
      entry_date: payload.entry_date || new Date().toISOString().slice(0, 10),
      _ts:        Date.now(),
      _local:     true,
    };
    const all = this._all();
    all.push(entry);
    this._save(all);
    return entry;
  },
  remove(logId) {
    this._save(this._all().filter(e => String(e.id) !== String(logId)));
  },
  isLocalId(id) { return String(id || '').startsWith('local-'); },
};
window.LocalMyCarLog = LocalMyCarLog;

// Argument-safe id for an inline onclick handler. Numeric ids go in
// raw; string ids (local-xxx) must be quoted or the browser parses
// `foo(local-abc)` as arithmetic on undefined identifiers.
function _mcIdArg(id) {
  return (typeof id === 'number') ? String(id) : `'${escapeJsSq(String(id))}'`;
}

// Public helper for the dashboard hero. Returns the user's primary
// car (the first one in the list) plus its hero photo URL + counts
// derived from the my_car_photos / my_car_log_entries relations the
// DB module already eagerly joins. Null when the user has no cars.
async function getHomeHeroCar() {
  const cars = await _loadMyCars();
  if (!Array.isArray(cars) || !cars.length) return null;
  const car = cars[0];
  const photos = _mcPhotosFor(car);
  const heroPhoto = _mcHeroFor(car, photos);
  const heroUrl = _mcPhotoUrl(heroPhoto);
  // Log count = local-first entries + any legacy remote ones.
  const localLog  = LocalMyCarLog.list(car.id).length;
  const remoteLog = Array.isArray(car.my_car_log_entries) ? car.my_car_log_entries.length : 0;
  return {
    car,
    photoUrl: heroUrl,
    photoCount: photos.length,
    logCount: localLog + remoteLog,
    totalCars: cars.length,
  };
}
window.getHomeHeroCar = getHomeHeroCar;

async function showMyCars() {
  _myCarsActive = null;
  switchTab('mycars');
  await renderMyCarsList();
}

// Sync snapshot — local cars + the last cached remote payload, no
// network. Lets the list paint instantly instead of waiting up to
// 8s on a (often unreachable) Supabase fetch.
function _myCarsSnapshot() {
  const local = LocalMyCars.list();
  let remote = [];
  try {
    const cached = JSON.parse(localStorage.getItem(_REMOTE_MYCARS_CACHE_KEY) || '[]');
    if (Array.isArray(cached)) remote = cached;
  } catch {}
  const seen = new Set(local.map(c => String(c.id)));
  const merged = [...local];
  for (const r of remote) if (r && !seen.has(String(r.id))) merged.push(r);
  return merged;
}

async function renderMyCarsList() {
  _myCarsActive = null;
  const titleEl = document.getElementById('mycars-hdr-title');
  if (titleEl) titleEl.textContent = 'My Cars';
  // Paint instantly from local + cached remote — no network wait.
  _paintMyCarsList(_myCarsSnapshot());
  // Refresh from Supabase in the background; repaint only if the user
  // is still on the list (hasn't tapped into a car's detail).
  _loadMyCars(true)
    .then(cars => { if (_myCarsActive === null) _paintMyCarsList(cars); })
    .catch(() => {});
}

function _paintMyCarsList(cars) {
  const body = document.getElementById('mycars-body');
  if (!body) return;
  if (!cars.length) {
    body.innerHTML = `
      <div class="mc-empty">
        <div class="mc-empty-icon">${MC_PH_CAR}</div>
        <h3>Your cars</h3>
        <p>Add a car to start logging photos, services, modifications, and drives.</p>
        <button class="primary-btn" onclick="openAddMyCar()">＋ Add a car</button>
      </div>`;
    return;
  }
  body.innerHTML = `
    <div class="mc-list">
      ${cars.map(c => {
        const photos = _mcPhotosFor(c);
        const heroPhoto = _mcHeroFor(c, photos);
        const heroUrl = _mcPhotoUrl(heroPhoto);
        const meta = [c.year, c.make, c.model].filter(Boolean).join(' · ') || '—';
        return `<button class="mc-card" onclick="showMyCarDetail(${_mcIdArg(c.id)})">
          <div class="mc-card-thumb">${heroUrl
            ? `<img src="${escapeAttr(heroUrl)}" alt="">`
            : `<div class="mc-card-ph">${MC_PH_CAMERA}</div>`}</div>
          <div class="mc-card-body">
            <div class="mc-card-name">${escapeHtml(c.name)}</div>
            <div class="mc-card-meta">${escapeHtml(meta)}</div>
          </div>
          <div class="mc-card-arrow">›</div>
        </button>`;
      }).join('')}
    </div>
    <div class="mc-add-wrap">
      <button class="primary-btn" onclick="openAddMyCar()">＋ Add another car</button>
    </div>`;
}

async function showMyCarDetail(carId) {
  _myCarsActive = carId;
  // Make sure the My Cars screen is actually showing — this is called
  // straight from the dashboard hero, where the active tab is Home.
  if (typeof switchTab === 'function') switchTab('mycars');
  const titleEl = document.getElementById('mycars-hdr-title');
  if (titleEl) titleEl.textContent = '';

  // Route local cars to LocalMyCars so we don't ask Supabase for a
  // bigint id like "local-mp9gepze-0yai" (which would 400 with a
  // 22P02 invalid input syntax error).
  let car;
  if (LocalMyCars.isLocalId(carId)) {
    car = LocalMyCars.list().find(c => String(c.id) === String(carId));
    if (!car) { showErr('Could not load car', new Error('Car not found locally')); return; }
  } else {
    try { car = await DB.myCars.get(carId); }
    catch (err) { showErr('Could not load car', err); return; }
  }

  // Log entries are local-first. Always read the on-device log; for
  // remote cars also pull the Supabase log and merge (deduped by id)
  // so entries written before the local-first switch still show.
  let logEntries = LocalMyCarLog.list(carId);
  if (!LocalMyCars.isLocalId(carId)) {
    try {
      const remote = await DB.myCarLog.list(carId);
      if (Array.isArray(remote)) {
        const seen = new Set(logEntries.map(e => String(e.id)));
        for (const r of remote) {
          if (r && !seen.has(String(r.id))) logEntries.push(r);
        }
        logEntries.sort((a, b) => String(b.entry_date || '').localeCompare(String(a.entry_date || '')));
      }
    } catch (err) { console.warn('myCarLog list:', err); }
  }

  const photos = _mcPhotosFor(car);
  const meta   = [car.year, car.make, car.model].filter(Boolean).join(' · ') || '—';

  // Cache the car so the turntable can re-render on rotation /
  // capture without a re-fetch. Start on the Front angle.
  _mcDetailCar    = car;
  _mcTurntableIdx = 0;

  const body = document.getElementById('mycars-body');
  body.innerHTML = `
    <button class="mc-back-btn" onclick="renderMyCarsList()">‹ All cars</button>

    <!-- 8-angle turntable — rotate through the car from every side -->
    <div class="mc-turntable" id="mc-turntable"></div>

    <div class="mc-detail">
      <h2 class="mc-name">${escapeHtml(car.name)}</h2>
      <div class="mc-meta">${escapeHtml(meta)}</div>
      ${car.registration ? `<div class="mc-reg">${escapeHtml(car.registration)}</div>` : ''}
      ${car.notes ? `<div class="mc-notes">${escapeHtml(car.notes)}</div>` : ''}

      <div class="mc-actions">
        <button class="mc-action-btn" onclick="openEditMyCar(${_mcIdArg(car.id)})">Edit details</button>
        <button class="mc-action-btn" onclick="openAddMyCar()">Add another car</button>
      </div>

      <div class="mc-section">
        <div class="mc-section-hdr">
          <span>History (${logEntries.length})</span>
          <button class="mc-section-add" type="button" onclick="openAddMyCarLog()">＋ Log entry</button>
        </div>
        ${logEntries.length ? `
          <div class="mc-log-filter">
            ${[['all','All'], ...MC_LOG_KINDS.map(k => [k, MC_LOG_LABEL[k] || k])].map(([v, l]) => {
              const n = v === 'all' ? logEntries.length : logEntries.filter(e => e.entry_kind === v).length;
              if (v !== 'all' && n === 0) return '';
              return `<button class="mc-filter-chip${_mcLogFilter===v?' active':''}" type="button" onclick="setMcLogFilter('${escapeJsSq(v)}')">${escapeHtml(l)} <span class="mc-filter-chip-n">${n}</span></button>`;
            }).filter(Boolean).join('')}
          </div>` : ''}
        ${(() => {
          const visible = _mcLogFilter === 'all' ? logEntries : logEntries.filter(e => e.entry_kind === _mcLogFilter);
          if (!logEntries.length) return `<div class="mc-section-empty">No history yet — log a service, mod, drive or note.</div>`;
          if (!visible.length)    return `<div class="mc-section-empty">No ${escapeHtml(_mcLogFilter)} entries.</div>`;
          return visible.map(e => {
            const linked    = (photos || []).find(p => String(p.log_entry_id) === String(e.id));
            const linkedUrl = linked ? _mcPhotoUrl(linked) : null;
            return `<div class="mc-log-entry mc-log-${e.entry_kind}">
              <div class="mc-log-row">
                <span class="mc-log-kind">${MC_LOG_LABEL[e.entry_kind] || e.entry_kind}</span>
                <span class="mc-log-date">${escapeHtml(e.entry_date || '')}</span>
              </div>
              <div class="mc-log-title">${escapeHtml(e.title)}</div>
              ${e.body ? `<div class="mc-log-body">${escapeHtml(e.body)}</div>` : ''}
              ${linkedUrl ? `<img class="mc-log-photo" src="${escapeAttr(linkedUrl)}" alt="" loading="lazy" onclick="openLightbox('${escapeJsSq(linkedUrl)}','${escapeJsSq(e.title)}')">` : ''}
              <button class="mc-log-del" onclick="deleteMyCarLog(${_mcIdArg(e.id)})" title="Delete entry">✕</button>
            </div>`;
          }).join('');
        })()}
      </div>

      <button class="mc-delete-btn mc-delete-wide" onclick="confirmDeleteMyCar(${_mcIdArg(car.id)})">Delete car</button>
    </div>`;

  _renderMyCarTurntable();
}

// ─── 8-angle turntable ──────────────────────────────────────────────
// Big rotatable viewer: arrows / swipe cycle the eight angles; each
// empty angle prompts a capture, each filled one can be replaced.
// The slot strip below gives an at-a-glance overview + quick jump.
function _renderMyCarTurntable() {
  const el  = document.getElementById('mc-turntable');
  const car = _mcDetailCar;
  if (!el || !car) return;
  const angleMap = _mcAngleMap(car);
  const filled   = MC_ANGLES.filter(a => angleMap[a.id]).length;
  if (_mcTurntableIdx < 0) _mcTurntableIdx = MC_ANGLES.length - 1;
  if (_mcTurntableIdx >= MC_ANGLES.length) _mcTurntableIdx = 0;
  const angle = MC_ANGLES[_mcTurntableIdx];
  const photo = angleMap[angle.id];
  const url   = photo ? _mcPhotoUrl(photo) : null;

  const stage = url
    ? `<img class="mc-tt-img" src="${escapeAttr(url)}" alt="${escapeAttr(angle.label)}" onclick="openLightbox('${escapeJsSq(url)}','${escapeJsSq(car.name + ' — ' + angle.label)}')">
       <button class="mc-tt-replace" type="button" onclick="triggerMyCarAnglePhoto('${angle.id}')">${MC_PH_CAMERA}<span>Replace</span></button>`
    : `<button class="mc-tt-add" type="button" onclick="triggerMyCarAnglePhoto('${angle.id}')">
         ${MC_PH_CAMERA}
         <span class="mc-tt-add-lbl">Add the ${escapeHtml(angle.label)} photo</span>
       </button>`;

  el.innerHTML = `
    <div class="mc-tt-stage">
      <button class="mc-tt-nav mc-tt-prev" type="button" onclick="rotateMyCarTurntable(-1)" aria-label="Rotate left">‹</button>
      <div class="mc-tt-frame">${stage}</div>
      <button class="mc-tt-nav mc-tt-next" type="button" onclick="rotateMyCarTurntable(1)" aria-label="Rotate right">›</button>
    </div>
    <div class="mc-tt-caption">
      <span class="mc-tt-angle">${escapeHtml(angle.label)}</span>
      <span class="mc-tt-count">${filled} / 8 angles</span>
    </div>
    <div class="mc-tt-grid">
      ${MC_ANGLES.map((a, i) => {
        const p = angleMap[a.id];
        const u = p ? _mcPhotoUrl(p) : null;
        return `<button class="mc-tt-slot${i===_mcTurntableIdx?' active':''}${u?' filled':''}" type="button" onclick="setMyCarTurntable(${i})" title="${escapeAttr(a.label)}">
          <span class="mc-tt-thumb">${u ? `<img src="${escapeAttr(u)}" alt="">` : MC_PH_CAMERA}</span>
          <span class="mc-tt-slot-lbl">${escapeHtml(a.label)}</span>
        </button>`;
      }).join('')}
    </div>`;

  _wireTurntableSwipe(el.querySelector('.mc-tt-frame'));
}

function rotateMyCarTurntable(dir) {
  _mcTurntableIdx += (dir < 0 ? -1 : 1);
  _renderMyCarTurntable();
}

function setMyCarTurntable(idx) {
  _mcTurntableIdx = idx;
  _renderMyCarTurntable();
}

// Drag/swipe the frame left-right to rotate, for a spin-style feel.
function _wireTurntableSwipe(frame) {
  if (!frame) return;
  let x0 = null;
  frame.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive:true });
  frame.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) rotateMyCarTurntable(dx < 0 ? 1 : -1);
  }, { passive:true });
}

// Capture (or replace) the photo for one turntable angle.
function triggerMyCarAnglePhoto(angleId) {
  if (!_mcDetailCar) return;
  _mcPendingAngle = angleId;
  document.getElementById('myCarAnglePhotoInput')?.click();
}

async function handleMyCarAnglePhoto(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !_mcDetailCar || !_mcPendingAngle) return;
  const car     = _mcDetailCar;
  const angleId = _mcPendingAngle;
  _mcPendingAngle = null;
  try {
    const owner = _mcOwnerId(car.id);
    // Replace — drop any photo already tagged with this angle.
    for (const p of LocalPhotos.list(owner)) {
      if (p.angle === angleId) LocalPhotos.removeEntry(owner, p.id, { withBlob:true });
    }
    await LocalPhotos.add(owner, file, { angle: angleId });
    _myCars = null;
    const idx = MC_ANGLES.findIndex(a => a.id === angleId);
    if (idx >= 0) _mcTurntableIdx = idx;
    _renderMyCarTurntable();
    showSnack('Photo saved');
    if (typeof renderHomeHero === 'function') renderHomeHero().catch(() => {});
  } catch (err) {
    showErr('Could not save photo', err);
  }
}

const _MC_CAR_FIELDS = [
  // Photo field first so it's seen immediately on a phone — the
  // form-fields container is scrollable and capped at 55vh, so
  // anything past the first ~3 fields sits below the fold.
  { id:'photo',   label:'Cover photo',  type:'photo' },
  // Catalog picker pre-fills name/make/model/year from CAR_DB. If
  // the car isn't in the database (kit car, rare grey-import, etc.)
  // the user just skips this and types into the text fields below.
  { id:'catalog', label:'Pick from catalog', type:'catalog', placeholder:'Search the car catalog' },
  { id:'name',  label:'Name',          required:true,  placeholder:"e.g. FIL's MGB" },
  { id:'make',  label:'Make',          placeholder:'e.g. MG' },
  { id:'model', label:'Model',         placeholder:'e.g. MGB' },
  { id:'year',  label:'Year',          type:'number',  inputmode:'numeric', placeholder:'1972' },
  { id:'reg',   label:'Registration',  placeholder:'Optional' },
  { id:'notes', label:'Notes',         type:'textarea', placeholder:'Anything you want to remember' },
];
// Edit form keeps the original text fields — we don't want to overwrite
// a cover photo from this form (cover is managed from the detail page).
const _MC_CAR_FIELDS_EDIT = _MC_CAR_FIELDS.filter(f => f.type !== 'photo');

function _yearOrNull(s) {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

async function openAddMyCar() {
  const data = await openFormSheet({
    title:       'Add a car',
    submitLabel: 'Add car',
    fields:      _MC_CAR_FIELDS,
  });
  if (!data) return;
  // Local-only save — instant, never blocks on Supabase. The user
  // is migrating off the backend and the network has been flaky;
  // localStorage is the source of truth for new cars. Old remote
  // cars still appear in the merged list (see _loadMyCars).
  let car;
  try {
    car = LocalMyCars.add({
      name:         data.name,
      make:         data.make,
      model:        data.model,
      year:         _yearOrNull(data.year),
      registration: data.reg,
      notes:        data.notes,
    });
  } catch (err) {
    showErr('Could not save car', err);
    return;
  }
  // Cover photo — save locally as the Front turntable angle. All
  // local; no Storage upload. The detail page's turntable picks it
  // up automatically as angle 'front'.
  if (data.photo && typeof LocalPhotos !== 'undefined') {
    try {
      await LocalPhotos.add(_mcOwnerId(car.id), data.photo, { angle: 'front' });
    } catch (e) {
      console.warn('Add car photo save:', e);
      // Car saved OK without photo. Don't fail.
    }
  }
  _myCars = null;
  showSnack('Car added');
  // Refresh both the My Cars list AND the dashboard hero so a car
  // added from the home page lands instantly on the home hero too.
  if (typeof renderMyCarsList === 'function') await renderMyCarsList().catch(() => {});
  if (typeof renderHomeHero === 'function')   renderHomeHero().catch(() => {});
}

async function openEditMyCar(carId) {
  const car = (_myCars || []).find(c => c.id === carId);
  if (!car) return;
  const data = await openFormSheet({
    title:       'Edit car',
    submitLabel: 'Save',
    fields:      _MC_CAR_FIELDS_EDIT,
    initial: {
      name:  car.name,
      make:  car.make  || '',
      model: car.model || '',
      year:  car.year ? String(car.year) : '',
      reg:   car.registration || '',
      notes: car.notes || '',
    },
  });
  if (!data) return;
  const patch = {
    name:         data.name,
    make:         data.make,
    model:        data.model,
    year:         _yearOrNull(data.year),
    registration: data.reg,
    notes:        data.notes,
  };
  try {
    // Route to LocalMyCars or Supabase based on the id prefix —
    // local-only cars never touch the network.
    if (LocalMyCars.isLocalId(carId)) {
      LocalMyCars.update(carId, patch);
    } else {
      await DB.myCars.update(carId, patch);
    }
    _myCars = null;
    showSnack('Saved');
    await showMyCarDetail(carId);
  } catch (err) {
    showErr('Could not save', err);
  }
}

async function confirmDeleteMyCar(carId) {
  const ok = await confirmSheet({
    title:        'Delete this car?',
    body:         'All photos and log entries for it will be deleted too.',
    confirmLabel: 'Delete',
    danger:       true,
  });
  if (!ok) return;
  try {
    if (LocalMyCars.isLocalId(carId)) {
      LocalMyCars.remove(carId);
    } else {
      await DB.myCars.remove(carId);
    }
    // Drop this car's local-first log entries + on-device photos.
    for (const e of LocalMyCarLog.list(carId)) LocalMyCarLog.remove(e.id);
    if (typeof LocalPhotos !== 'undefined') {
      try {
        const owner = _mcOwnerId(carId);
        for (const p of LocalPhotos.list(owner)) {
          LocalPhotos.removeEntry(owner, p.id, { withBlob: true });
        }
      } catch (e) { console.warn('local photo cleanup:', e); }
    }
    _myCars = null;
    showSnack('Deleted');
    await renderMyCarsList();
  } catch (err) {
    showErr('Could not delete', err);
  }
}

// ══════════════════════════════════════════════════════════════════════
// Unified Add-Entry sheet — supports any log kind plus an optional photo.
//
// "📷 Add photo" is the same flow primed with kind='photo' and the just-
// captured Blob; "＋ Log entry" is the same flow primed with kind='note'.
// User can flip kinds, add or remove a photo, and edit anything before
// hitting Save. Both flows produce one log entry plus (optionally) one
// my_car_photos row linked to it via log_entry_id.
// ══════════════════════════════════════════════════════════════════════

let _mceState = null;  // { carId, blob, previewUrl }

function openMyCarEntry(carId, opts = {}) {
  const { presetKind = 'note', presetTitle = '', preBlob = null } = opts;
  if (_mceState?.previewUrl) URL.revokeObjectURL(_mceState.previewUrl);
  _mceState = {
    carId,
    blob:       preBlob,
    previewUrl: preBlob ? URL.createObjectURL(preBlob) : null,
  };
  const kindsEl = document.getElementById('mce-kinds');
  if (kindsEl) {
    kindsEl.innerHTML = MC_LOG_KINDS.map(k =>
      `<button class="bc-era-btn ${k === presetKind ? 'active' : ''}" type="button" onclick="setMyCarEntryKind('${k}')" data-kind="${escapeAttr(k)}">${escapeHtml(MC_LOG_LABEL[k] || k)}</button>`
    ).join('');
  }
  const titleInput = document.getElementById('mce-title-input');
  const dateInput  = document.getElementById('mce-date');
  const bodyInput  = document.getElementById('mce-body');
  if (titleInput) titleInput.value = presetTitle;
  if (dateInput)  dateInput.value  = new Date().toISOString().slice(0, 10);
  if (bodyInput)  bodyInput.value  = '';

  const img     = document.getElementById('mce-photo-img');
  const preview = document.getElementById('mce-photo-preview');
  if (_mceState.previewUrl && img && preview) {
    img.src = _mceState.previewUrl;
    preview.style.display = '';
  } else if (preview) {
    preview.style.display = 'none';
  }

  const titleEl = document.getElementById('mce-sheet-title');
  if (titleEl) titleEl.textContent = presetKind === 'photo' ? 'New Photo' : 'New Entry';

  document.getElementById('my-car-entry-overlay')?.classList.add('open');
  setTimeout(() => {
    if (presetTitle) { titleInput?.focus(); titleInput?.select(); }
    else titleInput?.focus();
  }, 280);
}

function setMyCarEntryKind(kind) {
  const kinds = document.getElementById('mce-kinds');
  if (!kinds) return;
  kinds.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.kind === kind);
  });
}

function _getMyCarEntryKind() {
  return document.querySelector('#mce-kinds button.active')?.dataset.kind || 'note';
}

function closeMyCarEntry() {
  if (_mceState?.previewUrl) URL.revokeObjectURL(_mceState.previewUrl);
  _mceState = null;
  document.getElementById('my-car-entry-overlay')?.classList.remove('open');
}
document.getElementById('my-car-entry-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('my-car-entry-overlay')) closeMyCarEntry();
});

function triggerMyCarEntryPhoto() {
  document.getElementById('myCarEntryPhotoInput')?.click();
}

async function handleMyCarEntryPhoto(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !_mceState) return;
  try {
    if (_mceState.previewUrl) URL.revokeObjectURL(_mceState.previewUrl);
    _mceState.blob       = file;
    _mceState.previewUrl = URL.createObjectURL(file);
    const img = document.getElementById('mce-photo-img');
    const preview = document.getElementById('mce-photo-preview');
    if (img)     img.src = _mceState.previewUrl;
    if (preview) preview.style.display = '';
  } catch (err) {
    showErr('Could not load photo', err);
  }
}

function clearMyCarEntryPhoto() {
  if (_mceState?.previewUrl) URL.revokeObjectURL(_mceState.previewUrl);
  if (_mceState) { _mceState.blob = null; _mceState.previewUrl = null; }
  const preview = document.getElementById('mce-photo-preview');
  const img     = document.getElementById('mce-photo-img');
  if (preview) preview.style.display = 'none';
  if (img) img.src = '';
}

async function saveMyCarEntry() {
  if (!_mceState) return;
  const carId = _mceState.carId;
  const blob  = _mceState.blob;
  const kind  = _getMyCarEntryKind();
  const title = document.getElementById('mce-title-input').value.trim();
  const date  = document.getElementById('mce-date').value || undefined;
  const body  = document.getElementById('mce-body').value.trim() || null;
  if (!title) {
    showSnack('Add a title');
    document.getElementById('mce-title-input')?.focus();
    return;
  }
  if (!MC_LOG_KINDS.includes(kind)) { showSnack('Pick a kind'); return; }

  // Local-first: the log entry is written to localStorage immediately
  // so it appears with zero network wait. Entries stay on-device —
  // the user is migrating off Supabase and the £0 design keeps photos
  // (and now log entries) local. Old remote entries still display via
  // the merge in showMyCarDetail.
  const entry = LocalMyCarLog.add({
    my_car_id:  carId,
    entry_kind: kind,
    title,
    body,
    entry_date: date,
  });
  if (blob) {
    // Photo stays on this device only. Linked to the log entry via
    // meta so deletion of the entry can find and remove it.
    try { await LocalPhotos.add(_mcOwnerId(carId), blob, { log_entry_id: entry.id }); }
    catch (err) { console.warn('log photo save:', err); }
  }
  _myCars = null;
  closeMyCarEntry();
  showSnack('Saved');
  if (_myCarsActive) await showMyCarDetail(_myCarsActive);
}

async function openAddMyCarLog() {
  if (!_myCarsActive) return;
  openMyCarEntry(_myCarsActive, { presetKind: 'note' });
}

async function deleteMyCarLog(logId) {
  const ok = await confirmSheet({
    title:        'Delete this log entry?',
    body:         'The photo attached to it (if any) will be removed too.',
    confirmLabel: 'Delete',
    danger:       true,
  });
  if (!ok) return;
  try {
    // Local photos linked to this entry — drop them and their blobs.
    if (typeof LocalPhotos !== 'undefined' && _myCarsActive != null) {
      const owner = _mcOwnerId(_myCarsActive);
      const local = LocalPhotos.list(owner);
      for (const p of local) {
        if (String(p.log_entry_id) === String(logId)) {
          LocalPhotos.removeEntry(owner, p.id, { withBlob: true });
        }
      }
    }
    if (LocalMyCarLog.isLocalId(logId)) {
      // Local-first entry — remove from localStorage. No network.
      LocalMyCarLog.remove(logId);
    } else {
      // Legacy remote entry. Clean up its DB-stored photos (uploaded
      // before the local-only switch) then delete the row itself.
      try {
        const { data: photos } = await SB.from('my_car_photos')
          .select('id, storage_path')
          .eq('log_entry_id', logId);
        for (const p of (photos || [])) {
          try {
            await SB.from('my_car_photos').delete().eq('id', p.id);
            if (p.storage_path) await DB.storage.removePhoto(p.storage_path);
          } catch (e) { console.warn('legacy photo cleanup:', e); }
        }
      } catch (e) { console.warn('legacy photo lookup:', e); }
      await DB.myCarLog.remove(logId);
    }
    _myCars = null;
    showSnack('Deleted');
    if (_myCarsActive) await showMyCarDetail(_myCarsActive);
  } catch (err) {
    showErr('Could not delete', err);
  }
}

// "📷 Add photo" — opens the camera, then routes the captured Blob into
// the same entry sheet so the user can add a caption/notes.
function setMcLogFilter(kind) {
  _mcLogFilter = kind;
  if (_myCarsActive) showMyCarDetail(_myCarsActive);
}

async function setMyCarCover(carId, photoId) {
  // Cover is a per-device preference (different devices have different
  // local photos), so it's local-only too.
  _setMcHero(carId, photoId);
  // For legacy numeric photo ids, also update the DB so devices that
  // haven't migrated yet pick the same hero. Best-effort.
  if (typeof photoId === 'number') {
    try { await DB.myCars.update(carId, { hero_photo_id: photoId }); }
    catch (e) { console.warn('mycars hero DB update:', e); }
  }
  _myCars = null;
  showSnack('✓ Cover updated');
  await showMyCarDetail(carId);
}

function triggerMyCarPhoto() {
  if (!_myCarsActive) return;
  document.getElementById('myCarPhotoInput')?.click();
}

async function handleMyCarPhoto(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !_myCarsActive) return;
  try {
    openMyCarEntry(_myCarsActive, {
      presetKind:  'photo',
      presetTitle: 'Photo',
      preBlob:     file,
    });
  } catch (err) {
    showErr('Could not load photo', err);
  }
}
