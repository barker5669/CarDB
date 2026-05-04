
// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════
const STORAGE_KEY = 'ccb-fil-v7'; // v7: per-event sightings
const ERAS = ['Pre-War','1950s','1960s','70s–80s','1990s'];
const RARITY_LABELS = {common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary'};

// Photo entry shape:
//   Phase 4+: { path, url, ts } — Storage path + public URL
//   Legacy:   { dataUrl, ts }   — base64 in localStorage (no live data;
//             tolerated only so a half-rolled-out client doesn't NPE)
//
// Renders prefer a locally-cached blob: URL when available (offline-
// resilient at car shows). PhotoCache.warmAll() populates the in-
// memory map; until then we fall back to the public URL.
function photoUrl(p) {
  if (!p) return null;
  if (p.path && typeof PhotoCache !== 'undefined') {
    const cached = PhotoCache.getUrlSync(p.path);
    if (cached) return cached;
  }
  return p.url || p.dataUrl || null;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }
// Escape for embedding in a single-quoted JS string in onclick="..."
function escapeJsSq(s) { return String(s ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

// ══════════════════════════════════════════════
// IMAGE CACHE — Wikipedia REST API + localStorage
//
// v3 caches ONLY successful URL results. Previous versions (v2)
// poisoned the cache by storing null for any transient failure
// (network blip, slow connection, AbortSignal timeout) — once a car
// got a null cached, it stayed broken forever. v3 leaves failures
// uncached so the next render attempt re-fetches.
// ══════════════════════════════════════════════
const IMG_CACHE_KEY = 'ccb-imgcache-v3';
const imgCache = {};

function loadImgCache() {
  try { const r = localStorage.getItem(IMG_CACHE_KEY); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function saveImgCache() {
  try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache)); } catch(e) {}
}
Object.assign(imgCache, loadImgCache());
// Drop the poisoned v2 cache (full of null entries) once on upgrade.
try { localStorage.removeItem('ccb-imgcache-v2'); } catch {}

// In-flight requests are deduped so concurrent renders don't fire the
// same fetch many times.
const _imgInFlight = new Map();

async function fetchWikiImg(carName) {
  if (imgCache[carName]) return imgCache[carName];           // cache hit (truthy URL)
  if (_imgInFlight.has(carName)) return _imgInFlight.get(carName);

  const mapped = WIKI_PAGES[carName] || carName.replace(/ /g, '_');

  // Direct URL → use it as-is and cache.
  if (mapped.startsWith('http')) {
    imgCache[carName] = mapped;
    saveImgCache();
    return mapped;
  }

  const promise = (async () => {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mapped)}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      const src = data?.thumbnail?.source || null;
      if (src) { imgCache[carName] = src; saveImgCache(); }    // only cache wins
      return src;
    } catch (e) {
      return null;                                              // do NOT cache failure
    } finally {
      _imgInFlight.delete(carName);
    }
  })();
  _imgInFlight.set(carName, promise);
  return promise;
}

// Fetch images in batches of 6, update UI after each batch
async function preloadEraImages(cars) {
  const unique = [...new Set(cars.map(c => c.name))];
  const uncached = unique.filter(n => imgCache[n] === undefined);
  const BATCH = 6;
  for (let i = 0; i < uncached.length; i += BATCH) {
    await Promise.all(uncached.slice(i, i + BATCH).map(n => fetchWikiImg(n)));
    renderList();
    renderEventList();
    if (i + BATCH < uncached.length) await new Promise(r => setTimeout(r, 150));
  }
  renderList();
  renderEventList();
}

// ══════════════════════════════════════════════
// STATE
// S.spotted keyed by eventName then carKey:
//   S.spotted[eventName][carKey] = { sightings:[], ... }
// ══════════════════════════════════════════════
let S = {
  event: '', eventId: null, loc: '', date: '',
  board: null,
  boardEras: null,
  boardCarCount: 12,
  rolls: 0,
  tab: 'bingo',
  era: 'Pre-War',
  bingoView: 'grid',  // 'grid' | 'carousel'
  modalKey: null,
  modalCar: null,
  pendingSightingId: null,
  spotted: {},
};

// PERSONAL_EVENT is declared later but the const is in the module scope —
// safe to reference from a function called at user-interaction time.
function currentSpotted() {
  const ev = S.event || PERSONAL_EVENT;
  if (!S.spotted[ev]) S.spotted[ev] = {};
  return S.spotted[ev];
}

// Surfaces the actual error message from Supabase (not just a vague
// "Could not save"). Logs full err to console for proper inspection.
function showErr(prefix, err) {
  console.error(prefix, err);
  const detail = err?.message || err?.error_description || err?.hint || (typeof err === 'string' ? err : 'Unknown error');
  showSnack(`⚠️ ${prefix}: ${detail}`);
}

function allSpotted() {
  const merged = {};
  Object.entries(S.spotted).forEach(([evName, evData]) => {
    Object.entries(evData).forEach(([key, data]) => {
      if (!merged[key]) {
        merged[key] = { ...data, sightings: [...(data.sightings||[])] };
      } else {
        merged[key].sightings.push(...(data.sightings||[]));
      }
    });
  });
  return merged;
}

// ══════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════
// localStorage is a hot cache only — Supabase is canonical for events,
// boards, sightings, and photos. A failure here doesn't lose data
// (a fresh hydrate next session restores from DB) but should surface so
// FIL knows reload-resilience is degraded.
let _quotaWarned = false;
function save() {
  try {
    const store = loadStore();
    store.events = store.events || {};
    if (S.event) {
      store.events[S.event] = {
        board:    S.board,
        spotted:  S.spotted[S.event] || {},
        loc:      S.loc,
        date:     S.date,
        rolls:    S.rolls,
        eras:     S.boardEras,
        carCount: S.boardCarCount,
      };
      store.lastEvent = S.event;
    }
    store.allSpotted = S.spotted;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    _quotaWarned = false;
  } catch(e) {
    console.warn('save() cache failed:', e);
    if (!_quotaWarned && typeof showSnack === 'function') {
      _quotaWarned = true;
      showSnack('⚠️ Local cache full — your data is still saved online');
    }
  }
}

function loadStore() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}

// ══════════════════════════════════════════════
// BOARD
// ══════════════════════════════════════════════
function seededShuffle(arr, s) {
  const a = [...arr]; let x = s;
  for (let i = a.length-1; i > 0; i--) {
    x = (x * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(x) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function strSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}
function _quotaFor(n) {
  const leg  = 1;
  const epic = Math.max(1, Math.round(n * 0.17));
  const rare = Math.max(1, Math.round(n * 0.42));
  const com  = Math.max(0, n - leg - epic - rare);
  return { legendary: leg, epic, rare, common: com };
}

// Returns a single flat array of cars mixed across the selected eras.
// eventKey + userId fold into the seed so the same event yields a
// different card per user (you and FIL get different boards).
function buildBoard(eventKey, userId, roll, eras, totalCount) {
  const defaults = (typeof loadBingoDefaults === 'function') ? loadBingoDefaults() : { eras: [...ERAS], carCount: 16 };
  eras       = (eras && eras.length) ? eras : defaults.eras;
  totalCount = totalCount || defaults.carCount;
  roll       = (roll !== undefined) ? roll : (S.rolls || 0);
  const baseSeed = strSeed(`${eventKey || 'default'}::${userId || 'anon'}::r${roll}`);

  const quota = _quotaFor(totalCount);
  const byR   = { legendary:[], epic:[], rare:[], common:[] };
  CAR_DB.filter(c => eras.includes(c.era))
        .forEach(c => { if (byR[c.rarity]) byR[c.rarity].push(c); });

  const picks = [];
  Object.entries(quota).forEach(([rarity, q]) => {
    const pool = seededShuffle(byR[rarity], baseSeed + rarity.length * 31);
    for (let i = 0; i < q && i < pool.length; i++) picks.push(pool[i]);
  });
  // Fill any shortfall (small pools, or carCount > sum of quota).
  if (picks.length < totalCount) {
    const used = new Set(picks.map(c => c.name));
    const filler = seededShuffle(
      CAR_DB.filter(c => eras.includes(c.era) && !used.has(c.name)),
      baseSeed + 99991
    ).slice(0, totalCount - picks.length);
    picks.push(...filler);
  }
  return seededShuffle(picks, baseSeed + 12345);
}

// DB.boards.cars stores car names only. New shape: flat ["name", ...].
// Old shape: era-keyed { "Pre-War": ["name", ...] }. Hydrate handles both.
function hydrateBoard(stored) {
  if (Array.isArray(stored)) {
    return stored.map(name => CAR_DB.find(c => c.name === name)).filter(Boolean);
  }
  const out = [];
  for (const era in (stored || {})) {
    for (const name of (stored[era] || [])) {
      const car = CAR_DB.find(c => c.name === name);
      if (car) out.push(car);
    }
  }
  return out;
}

function dehydrateBoard(boardArr) {
  if (!Array.isArray(boardArr)) return [];
  return boardArr.map(c => c.name);
}

// ══════════════════════════════════════════════
// BINGO DEFAULTS — eras + cars-per-board
// User-tunable via Settings → Bingo Card. Defaults are read once when
// a new event is created; existing events keep their own settings.
// ══════════════════════════════════════════════
const BINGO_DEFAULTS_KEY = 'cb-bingo-defaults-v1';
// 9 = a classic 3×3 bingo card. Lines + diagonals all detectable.
const BINGO_DEFAULTS_FALLBACK = { eras: ERAS.slice(), carCount: 9 };

function loadBingoDefaults() {
  try {
    const raw = localStorage.getItem(BINGO_DEFAULTS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return {
      eras: (Array.isArray(obj.eras) && obj.eras.length)
        ? obj.eras.filter(e => ERAS.includes(e))
        : ERAS.slice(),
      carCount: Number.isInteger(obj.carCount) ? obj.carCount : BINGO_DEFAULTS_FALLBACK.carCount,
    };
  } catch { return { ...BINGO_DEFAULTS_FALLBACK, eras: BINGO_DEFAULTS_FALLBACK.eras.slice() }; }
}

function saveBingoDefaults(d) {
  try { localStorage.setItem(BINGO_DEFAULTS_KEY, JSON.stringify(d)); } catch (e) { console.warn('saveBingoDefaults:', e); }
  refreshBingoSettingsRow();
}

function refreshBingoSettingsRow() {
  const sub = document.getElementById('sr-bingo-sub');
  if (!sub) return;
  const d = loadBingoDefaults();
  const erasLbl = d.eras.length === ERAS.length ? 'All eras' : (d.eras.length + ' eras');
  sub.textContent = `${erasLbl} · ${d.carCount} cars`;
}

function openBingoSettings() {
  const overlay = document.getElementById('bingo-settings-overlay');
  if (!overlay) return;
  _renderBingoSettingsBody();
  overlay.classList.add('open');
}
function closeBingoSettings() {
  document.getElementById('bingo-settings-overlay')?.classList.remove('open');
}
document.getElementById('bingo-settings-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('bingo-settings-overlay')) closeBingoSettings();
});

function _renderBingoSettingsBody() {
  const d = loadBingoDefaults();
  const erasEl = document.getElementById('bs-eras');
  if (erasEl) {
    erasEl.innerHTML = ERAS.map(era =>
      `<button class="bc-era-btn ${d.eras.includes(era) ? 'active' : ''}" type="button" onclick="bsToggleEra('${escapeJsSq(era)}')">${escapeHtml(era)}</button>`
    ).join('');
  }
  const slider = document.getElementById('bs-slider');
  const cntVal = document.getElementById('bs-count-val');
  if (slider) {
    slider.value = d.carCount;
    slider.oninput = () => {
      if (cntVal) cntVal.textContent = slider.value;
      const cur = loadBingoDefaults();
      cur.carCount = parseInt(slider.value, 10);
      saveBingoDefaults(cur);
    };
  }
  if (cntVal) cntVal.textContent = d.carCount;
}

function bsToggleEra(era) {
  const d = loadBingoDefaults();
  const idx = d.eras.indexOf(era);
  if (idx === -1) {
    d.eras.push(era);
    d.eras.sort((a, b) => ERAS.indexOf(a) - ERAS.indexOf(b));
  } else {
    if (d.eras.length <= 1) return;  // must keep at least one era
    d.eras.splice(idx, 1);
  }
  saveBingoDefaults(d);
  _renderBingoSettingsBody();
}

// ══════════════════════════════════════════════
// LEGACY board configurator (kept until verified unused)
// ══════════════════════════════════════════════
function renderBoardConfig() {
  const el = document.getElementById('board-config');
  if (!el) return;
  if (!S.boardEras) S.boardEras = [...ERAS];
  const count = S.boardCarCount || 12;
  el.innerHTML = `
    <div class="bc-section">
      <div class="bc-label">Eras to include</div>
      <div class="bc-eras">
        ${ERAS.map(era => `<button class="bc-era-btn${S.boardEras.includes(era)?' active':''}" onclick="bcToggleEra('${era}')">${era}</button>`).join('')}
      </div>
    </div>
    <div class="bc-section">
      <div class="bc-label">Cars per era: <strong id="bc-count-val">${count}</strong></div>
      <div class="bc-slider-wrap">
        <span class="bc-slider-lbl">5</span>
        <input type="range" class="bc-slider" id="bc-slider" min="5" max="20" value="${count}" oninput="bcSetCount(this.value)">
        <span class="bc-slider-lbl">20</span>
      </div>
    </div>
  `;
}
function bcToggleEra(era) {
  if (!S.boardEras) S.boardEras = [...ERAS];
  const idx = S.boardEras.indexOf(era);
  if (idx === -1) {
    S.boardEras.push(era);
    S.boardEras.sort((a,b) => ERAS.indexOf(a) - ERAS.indexOf(b));
  } else {
    if (S.boardEras.length <= 1) return;
    S.boardEras.splice(idx, 1);
  }
  renderBoardConfig();
}
function bcSetCount(val) {
  S.boardCarCount = parseInt(val, 10);
  const el = document.getElementById('bc-count-val');
  if (el) el.textContent = val;
}

// ══════════════════════════════════════════════
// REROLL — keeps sightings, persists via DB.boards
// ══════════════════════════════════════════════
async function rerollBoard() {
  if ((S.rolls || 0) >= 3) { showSnack('No rerolls left for this event'); return; }
  const newRolls = (S.rolls || 0) + 1;
  const newBoard = buildBoard(S.eventId || S.event, currentUserId(), newRolls, S.boardEras, S.boardCarCount);
  if (S.eventId) {
    try {
      await DB.boards.upsert(S.eventId, {
        cars:      dehydrateBoard(newBoard),
        eras:      S.boardEras,
        car_count: S.boardCarCount,
        rolls:     newRolls,
      });
    } catch (err) {
      showErr('Reroll save failed', err);
      return;
    }
  }
  S.rolls = newRolls;
  S.board = newBoard;
  S._fired = {};   // milestones reset for the new card
  save();
  buildEraTabs(); renderList();
  showSnack(`🎲 New board! (${3 - S.rolls} reroll${3-S.rolls===1?'':'s'} remaining)`);
}

// ══════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════
async function initSetup() {
  document.getElementById('date-input').value = new Date().toISOString().slice(0,10);
  refreshBingoSettingsRow();
  // DB is canonical for sightings + events. localStorage is a hot cache
  // populated by save() and reused on cold start until the hydrate fills.
  const store = loadStore();
  if (store.allSpotted) S.spotted = store.allSpotted;
  // Refresh from server so we see anything FIL added on his device.
  await hydrateSightingsFromDB();
  await renderPastEvents();
  refreshHomeShortcuts();
}

function _renderPastEventsSkeleton() {
  const listEl = document.getElementById('past-list');
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="past-skel"></div>
    <div class="past-skel"></div>
    <div class="past-skel"></div>`;
}

async function renderPastEvents() {
  const pastEl = document.getElementById('past-events');
  const listEl = document.getElementById('past-list');
  const welcomeEl = document.getElementById('home-welcome');
  if (!pastEl || !listEl) return;
  // Show skeletons immediately so the home isn't blank during fetch.
  pastEl.style.display = '';
  _renderPastEventsSkeleton();
  let events = [];
  try {
    const all = await _eventsList();
    const me = currentUserId();
    events = (all || []).filter(e =>
      Array.isArray(e.event_attendees) &&
      e.event_attendees.some(a => a.user_id === me) &&
      e.id !== S.eventId   // current show shows in the active card above; don't double-list
    );
  } catch (err) {
    console.warn('renderPastEvents:', err);
    pastEl.style.display = 'none';
    if (welcomeEl) welcomeEl.style.display = !S.event ? 'block' : 'none';
    return;
  }
  if (!events.length) {
    pastEl.style.display = 'none';
    // Show welcome only when there's no active show either.
    if (welcomeEl) welcomeEl.style.display = !S.event ? 'block' : 'none';
    return;
  }
  if (welcomeEl) welcomeEl.style.display = 'none';
  pastEl.style.display = '';
  // Sightings count still reads from localStorage until Phase 6.
  const countFor = (name) => Object.keys(S.spotted[name] || {}).length;
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  };
  listEl.innerHTML = events.map(e => {
    const meta = [e.location, fmtDate(e.event_date)].filter(Boolean).join(' · ');
    const count = countFor(e.name);
    return `<button class="past-btn" onclick="resumeEvent('${escapeJsSq(e.name)}')">
      <span class="pb-icon">🏁</span>
      <div class="pb-body">
        <div class="pb-name">${escapeHtml(e.name)}</div>
        ${meta ? `<div class="pb-meta">${escapeHtml(meta)}</div>` : ''}
      </div>
      ${count > 0 ? `<span style="background:var(--gold);color:var(--bg);font-size:0.68rem;font-weight:900;padding:2px 8px;border-radius:6px;flex-shrink:0">${count} spotted</span>` : ''}
      <span class="pb-arrow">›</span>
    </button>`;
  }).join('');
}

// Cache of recent DB events to avoid re-listing on every action.
let _eventsCache = null;
async function _eventsList() {
  if (_eventsCache) return _eventsCache;
  _eventsCache = await DB.events.list();
  return _eventsCache;
}
function _invalidateEventsCache() { _eventsCache = null; }

async function _findEventByName(name) {
  const all = await _eventsList();
  const lower = name.trim().toLowerCase();
  return all.find(e => (e.name || '').toLowerCase() === lower) || null;
}

async function _findOrCreateEvent(name, location, dateISO) {
  const existing = await _findEventByName(name);
  if (existing) return existing;
  const created = await DB.events.create({
    name,
    location:   location || null,
    event_date: dateISO  || null,
  });
  _invalidateEventsCache();
  return created;
}

// Pulls all of my sightings from DB and rebuilds S.spotted in the
// shape the existing rendering code expects:
//   S.spotted[eventName][cellKey] = {
//     event, ts, sightings: [{ id, event, loc, ts, photos: [{id,path,url,ts}] }]
//   }
// event_id IS NULL maps to the PERSONAL_EVENT bucket.
async function hydrateSightingsFromDB() {
  // Build event_id → event name map.
  const eventsById = {};
  try {
    const evs = await _eventsList();
    (evs || []).forEach(e => { eventsById[e.id] = e.name; });
  } catch (e) { console.warn('hydrateSightingsFromDB: events list', e); }

  let rows;
  try { rows = await DB.sightings.listMine(); }
  catch (err) {
    console.error('hydrateSightingsFromDB:', err);
    showSnack('⚠️ Could not load your sightings');
    return;
  }

  const spotted = {};
  const allPaths = [];
  for (const s of rows) {
    const eventName = s.event_id != null
      ? (eventsById[s.event_id] || `Event #${s.event_id}`)
      : PERSONAL_EVENT;
    if (!spotted[eventName]) spotted[eventName] = {};
    const key = cellKey(s.car_era, s.car_name);
    if (!spotted[eventName][key]) {
      spotted[eventName][key] = { event: eventName, loc: s.location || '', ts: s.spotted_at, sightings: [] };
    }
    const photos = (s.sighting_photos || []).map(sp => {
      if (sp.storage_path) allPaths.push(sp.storage_path);
      return {
        id:   sp.id,
        path: sp.storage_path,
        url:  DB.storage.publicUrl(sp.storage_path),
        ts:   sp.taken_at,
      };
    });
    spotted[eventName][key].sightings.push({
      id:    s.id,
      event: eventName,
      loc:   s.location || '',
      ts:    s.spotted_at,
      photos,
    });
  }
  S.spotted = spotted;
  // Warm the photo cache in the background so renders prefer local
  // blobs over network URLs. Don't await — it can take a while if the
  // user has dozens of photos and we don't want to block hydrate.
  if (typeof PhotoCache !== 'undefined' && allPaths.length) {
    PhotoCache.warmAll(allPaths).then(() => {
      // Re-render any visible list once blobs are in memory.
      try { renderList?.(); renderEventList?.(); renderGarage?.(); } catch {}
    });
  }
}

// Loads the user's board for an event from DB; if none exists, generates
// it deterministically and persists. Returns nothing — sets S.* directly.
//
// Old era-keyed boards (cars stored as { era: [name,...] }) get
// regenerated to the new flat shape using current defaults. The
// alternative — hydrating to a flat 60-car list — overwhelms FIL.
async function _loadOrCreateBoard(eventRow) {
  const userId = currentUserId();
  let row = await DB.boards.getMine(eventRow.id);
  const isFlat = row && Array.isArray(row.cars);

  if (row && isFlat) {
    S.board         = hydrateBoard(row.cars);
    S.boardEras     = (Array.isArray(row.eras) && row.eras.length) ? row.eras : [...ERAS];
    S.boardCarCount = row.car_count || S.board.length;
    S.rolls         = row.rolls;
    return;
  }

  // No board, or legacy era-keyed shape — (re)generate using user's
  // current settings. Sightings already logged are NOT lost; they live
  // in the sightings table keyed by car_name and surface in the
  // Spotted tab and lifetime collection regardless of board membership.
  const defaults = loadBingoDefaults();
  S.boardEras     = defaults.eras;
  S.boardCarCount = defaults.carCount;
  S.rolls         = row?.rolls || 0;
  S.board = buildBoard(eventRow.id, userId, S.rolls, S.boardEras, S.boardCarCount);
  await DB.boards.upsert(eventRow.id, {
    cars:      dehydrateBoard(S.board),
    eras:      S.boardEras,
    car_count: S.boardCarCount,
    rolls:     S.rolls,
  });
}

async function resumeEvent(name) {
  try {
    const eventRow = await _findEventByName(name);
    if (!eventRow) { showSnack('Event not found'); return; }
    S.event   = eventRow.name;
    S.eventId = eventRow.id;
    S.loc     = eventRow.location  || '';
    S.date    = eventRow.event_date || '';
    await DB.attendees.join(eventRow.id);  // idempotent
    await _loadOrCreateBoard(eventRow);
    if (!S.spotted[eventRow.name]) S.spotted[eventRow.name] = {};
    _resetBingoFiredForEvent();
    save();
    launch();
  } catch (err) {
    showErr('Could not load event', err);
  }
}

async function startEvent() {
  const ev   = document.getElementById('ev-input').value.trim();
  const loc  = document.getElementById('loc-input').value.trim();
  const date = document.getElementById('date-input').value;  // "YYYY-MM-DD" or ""
  if (!ev) { document.getElementById('ev-input').focus(); return; }

  try {
    const eventRow = await _findOrCreateEvent(ev, loc, date || null);
    S.event   = eventRow.name;
    S.eventId = eventRow.id;
    S.loc     = eventRow.location || '';
    S.date    = eventRow.event_date
      ? new Date(eventRow.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
      : '';
    await DB.attendees.join(eventRow.id);
    await _loadOrCreateBoard(eventRow);
    if (!S.spotted[eventRow.name]) S.spotted[eventRow.name] = {};
    _resetBingoFiredForEvent();
    save();
    _invalidateEventsCache();
    closeNewShowSheet();
    launch();
  } catch (err) {
    showErr('Could not start show', err);
  }
}

function launch() {
  // Activate main app shell (auth-gated; bootAuth handles the auth screen)
  document.getElementById('s-auth')?.classList.remove('active');
  document.getElementById('s-app')?.classList.add('active');
  updateHomeCard();
  const bingoSub = document.getElementById('bingo-ev-sub');
  if (bingoSub) bingoSub.textContent = S.event || '';
  switchTab('bingo');
  // Preload Wikipedia thumbs for the cars on the (now flat) board.
  if (Array.isArray(S.board) && S.board.length) preloadEraImages(S.board);
}

// ══════════════════════════════════════════════
// TAB NAV
// ══════════════════════════════════════════════
function switchTab(tab) {
  S.tab = tab;
  const tabs = ['home','bingo','event','garage','mycars','upcoming','sort','settings'];
  tabs.forEach(t => {
    const el = document.getElementById('s-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  buildNav(tab);
  if (tab === 'bingo')    { updateBingoState(); }
  if (tab === 'event')    { buildEvFilters(); renderEventList(); }
  if (tab === 'garage')   { buildGarageFilters(); renderGarage(); }
  if (tab === 'home')     { updateHomeCard(); renderPastEvents(); refreshHomeShortcuts(); }
  if (tab === 'mycars')   { /* renderMyCarsList is called explicitly by showMyCars */ }
  if (tab === 'sort')     { renderPhotoSort(); }
  if (tab === 'settings') { /* static */ }
}

function buildNav(activeTab) {
  // Nav shows: Home | Bingo | 📷 (FAB) | Spotted | Collection
  // Settings is accessed via Home page (less frequently used)
  const NAV_TABS = [
    { id:'home',   lbl:'Home',       svg:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { id:'bingo',  lbl:'Bingo',      svg:'<rect x="3" y="2" width="18" height="20" rx="3"/><path d="M8 7h2l2 5 2-5h2"/><path d="M8 14h8"/>' },
    { id:'event',  lbl:'Spotted',    svg:'<path d="M8 21h8M12 17v4M7 4H4a1 1 0 0 0-1 1v3c0 3.31 2.69 6 6 6h6c3.31 0 6-2.69 6-6V5a1 1 0 0 0-1-1h-3"/><path d="M7 4h10v7a5 5 0 0 1-10 0V4z"/>' },
    { id:'garage', lbl:'Collection', svg:'<path d="M2 3h9a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H2z"/><path d="M22 3h-9a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H22z"/>' },
  ];
  const camSvg = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
  
  // Mark home as active if on settings (since settings is accessed from home)
  const displayActive = activeTab === 'settings' ? 'home' : activeTab;

  function tabBtn(t) {
    return `<button class="nav-btn${displayActive===t.id?' active':''}" onclick="switchTab('${t.id}')"><div class="nb-wrap"><svg class="nav-svg" viewBox="0 0 24 24">${t.svg}</svg></div><span class="nav-lbl">${t.lbl}</span></button>`;
  }
  const camBtn = `<button class="nav-cam" onclick="triggerPhotoFirst()"><div class="nav-cam-disc"><svg viewBox="0 0 24 24">${camSvg}</svg></div><span class="nav-cam-lbl">Photo</span></button>`;

  const html = tabBtn(NAV_TABS[0]) + tabBtn(NAV_TABS[1]) + camBtn + tabBtn(NAV_TABS[2]) + tabBtn(NAV_TABS[3]);

  ['home','bingo','event','garage','mycars','upcoming','sort','settings'].forEach(id => {
    const bar = document.getElementById('nav-' + id + '-bar');
    if (bar) bar.innerHTML = html;
  });
}

function updateBingoState() {
  const noEv = document.getElementById('bingo-no-event');
  const live  = document.getElementById('bingo-live');
  if (!S.event) {
    if (noEv) noEv.style.display = 'flex';
    if (live)  live.style.display = 'none';
  } else {
    if (noEv) noEv.style.display = 'none';
    if (live)  { live.style.display = 'flex'; buildEraTabs(); renderList(); }
  }
}

function updateHomeCard() {
  const activeDiv = document.getElementById('home-active-show');
  if (!activeDiv) return;
  // Friendly greeting in the header sub-line.
  const greeting = document.getElementById('home-greeting');
  if (greeting && typeof currentDisplayName === 'function') {
    const name = currentDisplayName();
    greeting.textContent = name ? `Hello, ${name}` : 'Classic Car Spotter';
  }
  if (S.event) {
    activeDiv.style.display = 'block';
    const nameEl  = document.getElementById('home-show-name');
    const metaEl  = document.getElementById('home-show-meta');
    const badgeEl = document.getElementById('home-show-badge');
    if (nameEl)  nameEl.textContent  = S.event;
    if (metaEl)  metaEl.textContent  = (S.loc ? S.loc + ' · ' : '') + (S.date || '');
    if (badgeEl) {
      const count = Object.keys(currentSpotted()).length;
      badgeEl.textContent = count + ' spotted';
    }
  } else {
    activeDiv.style.display = 'none';
  }
}

function showGoLive() {
  switchTab('bingo');
}

// ══════════════════════════════════════════════
// BINGO TAB
// ══════════════════════════════════════════════
function cellKey(era, name) { return `fil-${era}-${name}`; }

function buildEraTabs() {
  // Header subtitle (event name · location · date)
  const ev = S.event + (S.loc ? ' · '+S.loc : '') + (S.date ? ' · '+S.date : '');
  const sub = document.getElementById('bingo-ev-sub');
  if (sub) sub.textContent = ev;
  // Reroll pill
  const rb = document.getElementById('reroll-btn');
  if (rb) {
    const left = 3 - (S.rolls || 0);
    rb.textContent = left > 0 ? `🎲 ${left}` : '🎲✕';
    rb.title = left > 0 ? `Reroll board (${left} left)` : 'No rerolls remaining';
    rb.classList.toggle('exhausted', left <= 0);
  }
  // Era scroller is hidden in the flat-card layout (cards mix eras).
  // Cleared so any old content disappears on legacy data.
  const eraScroller = document.getElementById('era-scroller');
  if (eraScroller) { eraScroller.innerHTML = ''; eraScroller.style.display = 'none'; }
}

function _loadBingoView() {
  try {
    const v = localStorage.getItem('cb-bingo-view-v1');
    if (v === 'carousel' || v === 'grid') return v;
  } catch {}
  return 'grid';
}
function _saveBingoView(v) {
  try { localStorage.setItem('cb-bingo-view-v1', v); } catch {}
}

function toggleBingoView() {
  S.bingoView = (S.bingoView === 'grid') ? 'carousel' : 'grid';
  _saveBingoView(S.bingoView);
  _refreshViewToggleBtn();
  renderList();
}
function _refreshViewToggleBtn() {
  const icon = document.getElementById('view-toggle-icon');
  if (icon) icon.textContent = S.bingoView === 'carousel' ? '▦' : '◫';
}

function renderList() {
  const list = document.getElementById('car-list');
  if (!list) return;
  if (!S.bingoView) S.bingoView = _loadBingoView();
  _refreshViewToggleBtn();
  const cars = Array.isArray(S.board) ? S.board : [];
  const unique = [...new Map(cars.map(c => [c.name, c])).values()];
  if (!unique.length) {
    list.innerHTML = `<div class="bingo-empty">No cars on this board yet.</div>`;
    updateScore();
    return;
  }
  if (S.bingoView === 'carousel') {
    const cells = unique.map((car, i) => bingoCarouselCardHTML(car, i)).join('');
    list.innerHTML = `<div class="bingo-carousel">${cells}</div>`;
  } else {
    // Flat 3-column grid mixing eras. Order is the buildBoard output so
    // line detection (rows / cols / diagonals) stays meaningful.
    const cells = unique.map((car, i) => bingoCellHTML(car, i)).join('');
    list.innerHTML = `<div class="bingo-grid">${cells}</div>`;
  }
  // Delegated click — survives re-renders from preloadEraImages, and
  // handles both views with one selector.
  list.onclick = (e) => {
    const cell = e.target.closest('.bingo-cell[data-name],.bingo-card[data-name]');
    if (!cell) return;
    const car = unique.find(c => c.name === cell.dataset.name);
    if (car) openModal(car, cellKey(car.era, car.name));
  };
  updateScore();
}

function bingoCarouselCardHTML(car, idx) {
  const key   = cellKey(car.era, car.name);
  const sp    = currentSpotted();
  const data  = sp[key];
  const count = data ? data.sightings.length : 0;
  const spotted = count > 0;
  const isPending = (data?.sightings || []).some(s => String(s.id || '').startsWith('local-'));
  const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]);
  const wikiPic = imgCache[car.name];
  const displaySrc = sightingPhoto || wikiPic;
  const imgHTML = displaySrc
    ? `<img src="${escapeAttr(displaySrc)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const stamp = spotted
    ? `<div class="bingo-stamp">✓${count > 1 ? ` ×${count}` : ''}</div>`
    : '';
  const pendCls = isPending ? ' pending' : '';
  const spotCls = spotted   ? ' spotted' : '';
  const flashCls = (S.justSpotted === key) ? ' just-spotted' : '';
  return `<div class="bingo-card ${car.rarity}${spotCls}${pendCls}${flashCls}" data-name="${escapeAttr(car.name)}" data-idx="${idx}">
    <div class="bingo-card-img">
      ${imgHTML}<div class="bingo-card-flag" style="${displaySrc?'display:none':''}">${car.flag}</div>
      <div class="bingo-card-era">${escapeHtml(car.era)}</div>
      ${stamp}
    </div>
    <div class="bingo-card-body">
      <div class="bingo-card-rarity rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]||''}</div>
      <div class="bingo-card-name">${escapeHtml(car.name)}</div>
      <div class="bingo-card-meta">${escapeHtml([car.years, car.country].filter(Boolean).join(' · '))}</div>
    </div>
  </div>`;
}

function bingoCellHTML(car, idx) {
  // Key uses car.era (board mixes eras now, so S.era is meaningless here).
  const key   = cellKey(car.era, car.name);
  const sp    = currentSpotted();
  const data  = sp[key];
  const count = data ? data.sightings.length : 0;
  const spotted = count > 0;
  const isPending = (data?.sightings || []).some(s => String(s.id || '').startsWith('local-'));
  const justSpotted = S.justSpotted === key;
  const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]);
  const wikiPic = imgCache[car.name];
  const displaySrc = sightingPhoto || wikiPic;
  const imgHTML = displaySrc
    ? `<img src="${escapeAttr(displaySrc)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const stamp = spotted
    ? `<div class="bingo-stamp">✓${count > 1 ? ` ×${count}` : ''}</div>`
    : '';
  const pendCls = isPending    ? ' pending'      : '';
  const spotCls = spotted      ? ' spotted'      : '';
  const flashCls = justSpotted ? ' just-spotted' : '';
  return `<div class="bingo-cell ${car.rarity}${spotCls}${pendCls}${flashCls}" data-name="${escapeAttr(car.name)}" data-idx="${idx}">
    <div class="bingo-cell-img">
      ${imgHTML}<div class="bingo-cell-flag" style="${displaySrc?'display:none':''}">${car.flag}</div>
      <div class="bingo-cell-era">${escapeHtml(car.era)}</div>
    </div>
    ${stamp}
    <div class="bingo-cell-name">${escapeHtml(car.name)}</div>
  </div>`;
}

function updateScore() {
  const cars = Array.isArray(S.board) ? S.board : [];
  const unique = [...new Map(cars.map(c => [c.name, c])).values()];
  const total = unique.length;
  const sp = currentSpotted();
  const spotted = unique.filter(c => sp[cellKey(c.era, c.name)]).length;
  const el = document.getElementById('score-txt');
  if (el) el.textContent = total ? `${spotted} of ${total} spotted` : '';
  const fill = document.getElementById('bingo-progress-fill');
  if (fill) fill.style.width = (total ? Math.round(spotted / total * 100) : 0) + '%';
}

// ══════════════════════════════════════════════
// FILTER HELPERS — styled pill-select
// ══════════════════════════════════════════════
function pillSelect(id, options, current, onchangeFn, placeholder) {
  const isActive = current !== 'All';
  const activeLabel = isActive ? (options.find(o => o.value === current)?.label || current) : null;
  return `<div class="pill-select-wrap${isActive?' ps-active':''}">
    <select id="${id}" class="pill-select" onchange="${onchangeFn}(this.value)">
      <option value="All">${placeholder}</option>
      ${options.filter(o=>o.value!=='All').map(o=>`<option value="${o.value}"${current===o.value?' selected':''}>${o.label}</option>`).join('')}
    </select>
    <span class="ps-label">${isActive ? activeLabel : placeholder}</span>
    <span class="ps-arrow">▾</span>
  </div>`;
}

// ══════════════════════════════════════════════
// EVENT TAB
// ══════════════════════════════════════════════
const EV_F = { era:'All', rarity:'All', make:'All', country:'All', showSeen:true, showUnseen:true };
const G_F  = { era:'All', rarity:'All', make:'All', country:'All', event:'All', showSeen:true, showUnseen:true };
let pickerEra = 'All';

function eventSpottedMap() {
  const map = {};
  const sp = currentSpotted();
  Object.entries(sp).forEach(([key]) => {
    for (const era of ERAS) {
      if (key.startsWith(`fil-${era}-`)) {
        const name = key.slice(`fil-${era}-`.length);
        map[name] = key; break;
      }
    }
  });
  return map;
}

function buildEvFilters() {
  const rarities = [['All','All'],['common','Common'],['rare','Rare'],['epic','Epic'],['legendary','Legendary']];
  document.getElementById('ev-era-row').innerHTML =
    ['All',...ERAS].map(e => `<button class="fchip${EV_F.era===e?' active':''}" onclick="evSetEra('${e}')">${e}</button>`).join('');
  document.getElementById('ev-rarity-row').innerHTML =
    rarities.map(([v,l]) => `<button class="fchip fc-${v}${EV_F.rarity===v?' active':''}" onclick="evSetRarity('${v}')">${l}</button>`).join('');
  const evMakes = ['All', ...new Set(CAR_DB.map(c=>c.make))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('ev-make-row').innerHTML = pillSelect('ev-make-sel', evMakes.map(m=>({value:m,label:m})), EV_F.make, 'evSetMake', '🏭 All Makes');
  const evCountries = ['All', ...new Set(CAR_DB.map(c=>c.country))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('ev-country-row').innerHTML = pillSelect('ev-country-sel', evCountries.map(c=>({value:c,label:c})), EV_F.country, 'evSetCountry', '🌍 All Countries');
  document.getElementById('ev-tog-seen').classList.toggle('active', EV_F.showSeen);
  document.getElementById('ev-tog-unseen').classList.toggle('active', EV_F.showUnseen);
}

function evSetEra(v)     { EV_F.era=v;     buildEvFilters(); renderEventList(); _updateEvFilterBadge(); }
function evSetRarity(v)  { EV_F.rarity=v;  buildEvFilters(); renderEventList(); _updateEvFilterBadge(); }
function evSetMake(v)    { EV_F.make=v;    buildEvFilters(); renderEventList(); _updateEvFilterBadge(); }
function evSetCountry(v) { EV_F.country=v; buildEvFilters(); renderEventList(); _updateEvFilterBadge(); }
function evToggle(which) {
  if (which==='seen') EV_F.showSeen = !EV_F.showSeen;
  else                EV_F.showUnseen = !EV_F.showUnseen;
  buildEvFilters(); renderEventList(); _updateEvFilterBadge();
}

function renderEventList() {
  const listEl = document.getElementById('ev-list');

  // Guard: no active event
  if (!S.event) {
    if (listEl) listEl.innerHTML = `
      <div class="no-event-prompt">
        <div class="nep-icon">🏁</div>
        <h3>No show selected</h3>
        <p>Head back to the home screen to start a new show, then your spotted cars will appear here.</p>
        <button class="nep-btn" onclick="goToNewEvent()">Choose a Show</button>
      </div>`;
    const sumEl = document.getElementById('ev-summary');
    if (sumEl) sumEl.style.display = 'none';
    return;
  }

  // Show event subtitle
  const evSub = document.getElementById('event-hdr-sub');
  if (evSub) evSub.textContent = S.event;
  const sumEl = document.getElementById('ev-summary');
  if (sumEl) sumEl.style.display = '';

  const spottedMap = eventSpottedMap();
  const sp = currentSpotted();

  function passesFilter(car) {
    if (EV_F.era    !=='All' && car.era    !==EV_F.era)    return false;
    if (EV_F.rarity !=='All' && car.rarity !==EV_F.rarity) return false;
    if (EV_F.make   !=='All' && car.make   !==EV_F.make)   return false;
    if (EV_F.country!=='All' && car.country!==EV_F.country)return false;
    return true;
  }
  const seenCars   = CAR_DB.filter(c => passesFilter(c) && spottedMap[c.name]);
  const unseenCars = CAR_DB.filter(c => passesFilter(c) && !spottedMap[c.name]);
  const totalSeen = Object.keys(spottedMap).length;
  const totalSightings = Object.values(sp).reduce((a,d) => a+(d.sightings?.length||0), 0);
  document.getElementById('ev-summary-txt').textContent =
    totalSeen === 0 ? 'No cars spotted yet — tap Add Car or use the Bingo tab'
                    : `${totalSeen} car${totalSeen!==1?'s':''} · ${totalSightings} sighting${totalSightings!==1?'s':''}`;

  let html = '';
  if (!EV_F.showSeen && !EV_F.showUnseen) {
    html = `<div class="ev-empty"><div class="icon">🔍</div><p>Both filters hidden.</p></div>`;
  } else if (!seenCars.length && !unseenCars.length) {
    html = `<div class="ev-empty"><div class="icon">🚗</div><p>No cars match this filter.</p></div>`;
  } else {
    if (EV_F.showSeen) {
      if (!seenCars.length && EV_F.showUnseen) { /* nothing */ }
      else if (!seenCars.length) {
        html += `<div class="ev-section-hdr">Spotted at this event (0)</div><div class="ev-empty"><div class="icon">👀</div><p>Nothing spotted yet.<br>Tap <strong>Add Car</strong> or spot on Bingo tab.</p><button class="ev-empty-btn" onclick="openPicker()">＋ Add a Car</button></div>`;
      } else {
        html += `<div class="ev-section-hdr">Spotted at this event (${seenCars.length})</div>`;
        html += seenCars.map(c => evSeenCardHTML(c, spottedMap[c.name])).join('');
      }
    }
    if (EV_F.showUnseen && unseenCars.length) {
      html += `<div class="ev-section-hdr" style="margin-top:12px">Not spotted yet (${unseenCars.length})</div>`;
      html += unseenCars.map(c => evUnseenCardHTML(c)).join('');
    }
  }
  const list = document.getElementById('ev-list');
  list.innerHTML = html;
  // Single delegated click handler — survives subsequent re-renders
  // (preloadEraImages re-renders the list mid-load and the per-element
  // listeners attached above used to get blown away).
  list.onclick = (e) => {
    const seen = e.target.closest('.ev-seen-card');
    if (seen && seen.dataset.name && seen.dataset.key) {
      const car = CAR_DB.find(c => c.name === seen.dataset.name);
      if (car) openModal(car, seen.dataset.key);
      return;
    }
    const addBtn = e.target.closest('.ev-unseen-add');
    if (addBtn && addBtn.dataset.name) {
      e.stopPropagation();
      const car = CAR_DB.find(c => c.name === addBtn.dataset.name);
      if (car) quickAddSighting(car);
      return;
    }
    const unseen = e.target.closest('.ev-unseen-card');
    if (unseen && unseen.dataset.name) {
      const car = CAR_DB.find(c => c.name === unseen.dataset.name);
      if (car) openModal(car, `fil-${car.era}-${car.name}`);
    }
  };
}

function evSeenCardHTML(car, key) {
  const sp   = currentSpotted();
  const data = sp[key];
  const count = data?.sightings?.length || 0;
  const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length>0)?.photos[0]);
  const imgSrc = sightingPhoto || imgCache[car.name];
  const metaStr = data?.sightings?.[0]?.ts || '';
  return `<div class="ev-seen-card ${car.rarity}" data-name="${car.name.replace(/"/g,'&quot;')}" data-key="${key}">
    <div class="ev-seen-thumb">
      ${imgSrc?`<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"`+`>`:''}<div class="ev-thumb-ph" style="${imgSrc?'display:none':''}">${car.flag}</div>
      <div class="ev-seen-count">×${count}</div>
    </div>
    <div class="ev-seen-body"><div><div class="ev-seen-name">${car.name}</div><div class="ev-seen-years">${car.years} · ${car.country}</div><div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div></div><div class="ev-seen-meta">${metaStr}</div></div>
    <div class="ev-seen-arrow">›</div>
  </div>`;
}

function evUnseenCardHTML(car) {
  return `<div class="ev-unseen-card" data-name="${car.name.replace(/"/g,'&quot;')}">
    <div class="ev-unseen-flag">${car.flag}</div>
    <div class="ev-unseen-info"><div class="ev-unseen-name">${car.name}</div><div class="ev-unseen-sub">${car.years} · ${car.country} · <span class="rarity-badge ${car.rarity}" style="padding:1px 6px;font-size:0.65rem">${RARITY_LABELS[car.rarity]}</span></div></div>
    <button class="ev-unseen-add" data-name="${car.name.replace(/"/g,'&quot;')}" title="Spot this car">+</button>
  </div>`;
}

async function quickAddSighting(car) {
  const key = cellKey(car.era, car.name);
  const sightingPromise = Queue.sightingCreate({
    event_id:   S.eventId,
    car_name:   car.name,
    car_era:    car.era,
    car_make:   car.make,
    car_rarity: car.rarity,
    location:   S.loc || null,
  });

  // Photo-first flow: blob already waiting; no camera prompt needed.
  if (_photoWaiting) {
    closePicker();
    let row;
    try { row = await sightingPromise; }
    catch (err) { showErr('Could not save sighting', err); return; }
    const sp = currentSpotted();
    if (!sp[key]) sp[key] = { event:S.event, loc:S.loc, ts:row.spotted_at, sightings:[] };
    sp[key].sightings.push({ id:row.id, event:S.event, loc:S.loc, ts:row.spotted_at, photos:[] });
    save(); renderEventList(); renderList(); buildEraTabs(); updateScore();
    showSnack(`🎯 ${car.name} spotted!`);
    checkBingo();
    await attachWaitingPhoto(key);
    return;
  }

  // No waiting photo — open the camera while the user gesture is fresh
  // (iOS Safari rejects camInput.click() if it follows an `await`).
  S.modalKey = key;
  S.pendingSightingPromise = sightingPromise;
  document.getElementById('camInput').click();
  showSnack(`🎯 ${car.name} spotted!`);

  let row;
  try { row = await sightingPromise; }
  catch (err) {
    S.pendingSightingPromise = null;
    showErr('Could not save sighting', err);
    return;
  }
  const sp = currentSpotted();
  const wasFirst = !sp[key];
  if (!sp[key]) sp[key] = { event:S.event, loc:S.loc, ts:row.spotted_at, sightings:[] };
  sp[key].sightings.push({ id:row.id, event:S.event, loc:S.loc, ts:row.spotted_at, photos:[] });
  if (wasFirst) _flashJustSpotted(key);
  save(); renderEventList(); renderList(); buildEraTabs(); updateScore();
  checkBingo();
  S.pendingSightingId = row.id;
}

function openPicker() {
  pickerEra = 'All'; buildPickerEraChips(); renderPicker();
  document.getElementById('picker-overlay').classList.add('open');
  setTimeout(() => document.getElementById('picker-search').focus(), 350);
}
function closePicker() {
  document.getElementById('picker-overlay').classList.remove('open');
  document.getElementById('picker-search').value = '';
}
document.getElementById('picker-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('picker-overlay')) closePicker();
});
function buildPickerEraChips() {
  document.getElementById('picker-era-row').innerHTML =
    ['All',...ERAS].map(e => `<button class="picker-era-chip${pickerEra===e?' active':''}" onclick="pickerSetEra('${e}')">${e}</button>`).join('');
}
function pickerSetEra(e) { pickerEra = e; buildPickerEraChips(); renderPicker(); }
function renderPicker() {
  const q    = (document.getElementById('picker-search')?.value||'').toLowerCase().trim();
  const spMap = eventSpottedMap();
  let cars   = pickerEra === 'All' ? CAR_DB : CAR_DB.filter(c => c.era === pickerEra);
  if (q) cars = cars.filter(c => c.name.toLowerCase().includes(q)||c.era.toLowerCase().includes(q)||c.country.toLowerCase().includes(q)||c.rarity.toLowerCase().includes(q));
  cars = [...cars.filter(c => !spMap[c.name]), ...cars.filter(c => spMap[c.name])];
  if (!cars.length) { document.getElementById('picker-list').innerHTML=`<div style="text-align:center;padding:40px 20px;color:var(--muted);font-weight:700">No cars found</div>`; return; }
  document.getElementById('picker-list').innerHTML = cars.map(c => {
    const added = !!spMap[c.name];
    return `<div class="picker-row${added?' added':''}" data-name="${c.name.replace(/"/g,'&quot;')}">
      <div class="picker-flag">${c.flag}</div>
      <div class="picker-info"><div class="picker-name">${c.name}</div><div class="picker-sub">${c.era} · ${c.years} · ${c.country}</div></div>
      <div class="rarity-badge ${c.rarity}" style="flex-shrink:0">${RARITY_LABELS[c.rarity]}</div>
      ${added?`<div class="picker-done"></div>`:`<button class="picker-add-btn" data-name="${c.name.replace(/"/g,'&quot;')}">+</button>`}
    </div>`;
  }).join('');
  // Delegated click — survives the renderPicker re-renders that fire
  // on every keystroke in the search field.
  const pickerList = document.getElementById('picker-list');
  pickerList.onclick = (e) => {
    const addBtn = e.target.closest('.picker-add-btn');
    if (addBtn) {
      e.stopPropagation();
      const car = CAR_DB.find(c => c.name === addBtn.dataset.name);
      if (car) { quickAddSighting(car); renderPicker(); }
      return;
    }
    const row = e.target.closest('.picker-row:not(.added)');
    if (!row) return;
    const car = CAR_DB.find(c => c.name === row.dataset.name);
    if (!car) return;
    if (_photoWaiting) {
      // Photo-first flow — attach the waiting photo directly. Don't
      // open the modal (which would loop the user back through "I
      // Spotted It" and re-prompt the camera).
      quickAddSighting(car);
      return;
    }
    closePicker();
    openModal(car, `fil-${car.era}-${car.name}`);
  };
}

// ══════════════════════════════════════════════
// GARAGE TAB
// ══════════════════════════════════════════════
function buildGarageFilters() {
  const rarities = [['All','All'],['common','Common'],['rare','Rare'],['epic','Epic'],['legendary','Legendary']];
  document.getElementById('g-era-row').innerHTML =
    ['All',...ERAS].map(e => `<button class="fchip${G_F.era===e?' active':''}" onclick="gSetEra('${e}')">${e}</button>`).join('');
  document.getElementById('g-rarity-row').innerHTML =
    rarities.map(([v,l]) => `<button class="fchip fc-${v}${G_F.rarity===v?' active':''}" onclick="gSetRarity('${v}')">${l}</button>`).join('');
  const makes = ['All', ...new Set(CAR_DB.map(c=>c.make))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-make-row').innerHTML = pillSelect('g-make-sel', makes.map(m=>({value:m,label:m})), G_F.make, 'gSetMake', '🏭 All Makes');
  const countries = ['All', ...new Set(CAR_DB.map(c=>c.country))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-country-row').innerHTML = pillSelect('g-country-sel', countries.map(c=>({value:c,label:c})), G_F.country, 'gSetCountry', '🌍 All Countries');
  const evNames = ['All', ...Object.keys(S.spotted).filter(ev=>Object.keys(S.spotted[ev]||{}).length>0)].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-event-row').innerHTML = pillSelect('g-event-sel', evNames.map(e=>({value:e,label:e})), G_F.event, 'gSetEvent', '📋 All Events');
  document.getElementById('g-tog-seen').classList.toggle('active', G_F.showSeen);
  document.getElementById('g-tog-unseen').classList.toggle('active', G_F.showUnseen);
}
function gSetEra(v)    {G_F.era=v;    buildGarageFilters();renderGarage();}
function gSetRarity(v) {G_F.rarity=v; buildGarageFilters();renderGarage();}
function gSetMake(v)   {G_F.make=v;   buildGarageFilters();renderGarage();}
function gSetCountry(v){G_F.country=v;buildGarageFilters();renderGarage();}
function gSetEvent(v)  {G_F.event=v;  buildGarageFilters();renderGarage();}
function gToggle(which){
  if(which==='seen')G_F.showSeen=!G_F.showSeen; else G_F.showUnseen=!G_F.showUnseen;
  buildGarageFilters();renderGarage();
}

function renderGarage() {
  buildGarageFilters();
  const body = document.getElementById('garage-body');
  const merged = allSpotted();
  const carMap = {};
  Object.entries(merged).forEach(([key, data]) => {
    for (const era of ERAS) {
      if (key.startsWith(`fil-${era}-`)) {
        const name = key.slice(`fil-${era}-`.length);
        if (!carMap[name]) {
          const car = CAR_DB.find(c=>c.name===name)||{name,flag:'🚗',era,rarity:'common',years:'',country:'',produced:'',surviving:'',value:'',desc:''};
          carMap[name] = {car,seenAt:[],totalSightings:0,firstKey:key};
        }
        const sightings = data.sightings||[];
        const eventCounts = {};
        sightings.forEach(sg => { const ev=sg.event||data.event||'Unknown'; eventCounts[ev]=(eventCounts[ev]||0)+1; });
        Object.entries(eventCounts).forEach(([ev,count]) => carMap[name].seenAt.push({event:ev,count,key}));
        carMap[name].totalSightings += sightings.length;
        break;
      }
    }
  });
  function passesFilter(car, isSeen) {
    if(G_F.era    !=='All'&&car.era    !==G_F.era)    return false;
    if(G_F.rarity !=='All'&&car.rarity !==G_F.rarity) return false;
    if(G_F.make   !=='All'&&car.make   !==G_F.make)   return false;
    if(G_F.country!=='All'&&car.country!==G_F.country) return false;
    if(G_F.event!=='All'&&isSeen){const e=carMap[car.name];if(!e||!e.seenAt.some(s=>s.event===G_F.event))return false;}
    if(G_F.event!=='All'&&!isSeen) return false;
    return true;
  }
  const seenCars   = CAR_DB.filter(c => carMap[c.name] && passesFilter(c,true));
  const unseenCars = CAR_DB.filter(c => !carMap[c.name] && passesFilter(c,false));
  const totalCars = Object.keys(carMap).length;
  const totalS    = Object.values(merged).reduce((a,d)=>a+(d.sightings?.length||0),0);
  document.getElementById('garage-total').textContent = `${totalCars} cars · ${totalS} sightings`;
  let html = '';
  if (!G_F.showSeen && !G_F.showUnseen) {
    html=`<div class="garage-empty"><div class="icon">🔍</div><p>Both filters hidden.</p></div>`;
  } else {
    if(G_F.showSeen&&seenCars.length){html+=`<div class="garage-section-hdr">In your collection (${seenCars.length})</div>`;html+=seenCars.map(c=>garageCarHTML(c,carMap[c.name],true)).join('');}
    if(G_F.showUnseen&&unseenCars.length){html+=`<div class="garage-section-hdr" style="margin-top:12px">Still to find (${unseenCars.length})</div>`;html+=unseenCars.map(c=>garageCarHTML(c,null,false)).join('');}
    if(!html)html=`<div class="garage-empty"><div class="icon">🚗</div><p>No cars spotted yet.<br>Get out there!</p></div>`;
  }
  body.innerHTML = html;
  // Delegated click — survives the re-renders from preloadEraImages.
  body.onclick = (e) => {
    const card = e.target.closest('.gcar[data-name]');
    if (!card) return;
    const car = CAR_DB.find(c => c.name === card.dataset.name);
    if (!car) return;
    const key = card.dataset.key || `fil-${car.era}-${car.name}`;
    openModal(car, key);
  };
}

function garageCarHTML(car, entry, isSeen) {
  const safeName = car.name.replace(/"/g,'&quot;');
  if (!isSeen) {
    const imgSrc = imgCache[car.name];
    return `<div class="gcar unseen ${car.rarity}" data-name="${safeName}">
      <div class="gcar-thumb">${imgSrc?`<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="gcar-ph" style="${imgSrc?'display:none':''}">${car.flag}</div></div>
      <div class="gcar-info"><div class="gcar-name">${car.name}</div><div class="gcar-years">${car.years} · ${car.country}</div><div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div></div>
      <div class="gcar-arrow">›</div></div>`;
  }
  const merged = allSpotted();
  const sightingPhoto = photoUrl(Object.entries(merged).filter(([k])=>k===`fil-${car.era}-${car.name}`).flatMap(([,d])=>d.sightings||[]).find(sg=>sg.photos?.length>0)?.photos[0]);
  const imgSrc = sightingPhoto || imgCache[car.name];
  const key    = entry.firstKey;
  const evList = [...new Set(entry.seenAt.map(s=>s.event))].map(escapeHtml).join(', ');
  const total  = entry.totalSightings;
  return `<div class="gcar seen ${car.rarity}" data-name="${safeName}" data-key="${escapeAttr(key)}">
    <div class="gcar-thumb">${imgSrc?`<img src="${escapeAttr(imgSrc)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="gcar-ph" style="${imgSrc?'display:none':''}">${car.flag}</div><div class="gcar-badge">×${total}</div></div>
    <div class="gcar-info"><div class="gcar-name">${car.name}</div><div class="gcar-years">${car.years} · ${car.country}</div><div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div><div class="gcar-evs" style="margin-top:4px">${evList}</div></div>
    <div class="gcar-arrow">›</div></div>`;
}

// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function openModal(car, key) {
  if (!car || !key) return;
  S.modalKey = key; S.modalCar = car;
  const sp = currentSpotted();
  const data = sp[key];
  const sightingPhoto = photoUrl(data?.sightings?.find(sg=>sg.photos?.length>0)?.photos[0]);
  const wikiImg = imgCache[car.name];
  const heroSrc = sightingPhoto || wikiImg;
  const hero = document.getElementById('modal-hero');
  if (heroSrc) {
    hero.innerHTML = `<button class="modal-x" onclick="closeModal()">✕</button><img src="${heroSrc}" alt="${car.name}" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.outerHTML='<div class=modal-hero-placeholder>${car.flag}</div>'">`;
  } else {
    hero.innerHTML = `<button class="modal-x" onclick="closeModal()">✕</button><div class="modal-hero-placeholder">${car.flag}</div>`;
    if (WIKI_PAGES[car.name]) {
      fetchWikiImg(car.name).then(src => {
        if (src && S.modalKey === key) {
          const img = document.createElement('img');
          img.src = src; img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
          const ph = hero.querySelector('.modal-hero-placeholder');
          if (ph) ph.replaceWith(img);
        }
      });
    }
  }
  const rl = {common:'★ Common',rare:'★★ Rare',epic:'★★★ Epic',legendary:'★★★★ Legendary'};
  const rm = document.getElementById('m-rarity');
  rm.textContent = rl[car.rarity]||''; rm.className = 'modal-rarity '+(car.rarity||'');
  document.getElementById('m-name').textContent = car.name;
  const mMake = document.getElementById('m-make');
  if (mMake) mMake.textContent = car.make ? `${car.make}${car.model?' · '+car.model:''}` : '';
  document.getElementById('m-years').textContent = (car.years||'') + (car.country ? ' · '+car.country : '');
  const hBtn = document.getElementById('m-hagerty');
  if (hBtn) {
    hBtn.href = car.hagerty ? `https://www.hagerty.com/valuation-tools/${car.hagerty}` : 'https://www.hagerty.com/valuation-tools/';
    hBtn.textContent = car.hagerty ? '📈 View Hagerty Valuation' : '📈 Search Hagerty Valuations';
  }
  document.getElementById('m-stats').innerHTML = `
    <div class="modal-stat"><div class="modal-stat-val">${car.produced||'—'}</div><div class="modal-stat-lbl">Produced</div></div>
    <div class="modal-stat"><div class="modal-stat-val">${car.surviving||'—'}</div><div class="modal-stat-lbl">Surviving</div></div>
    <div class="modal-stat"><div class="modal-stat-val">${car.value||'—'}</div><div class="modal-stat-lbl">Value</div></div>`;
  document.getElementById('m-desc').textContent = car.desc || '';
  const _ms = document.getElementById('modal-sheet') || document.querySelector('.modal-sheet'); if (_ms) _ms.scrollTop = 0;
  document.getElementById('modal-overlay').classList.add('open');
  refreshModalSightings();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  S.modalKey = S.modalCar = S.pendingSightingId = null;
  renderList(); renderEventList();
}
document.getElementById('modal-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

function refreshModalSightings() {
  const key   = S.modalKey;
  const sp    = currentSpotted();
  const data  = sp[key];
  const count = data ? data.sightings.length : 0;

  // Primary action label: first time vs. another sighting.
  const spotBtn = document.getElementById('spot-btn');
  if (spotBtn) {
    spotBtn.textContent = count === 0 ? '📷  I Spotted It!' : '📷  Saw Another One!';
    spotBtn.classList.toggle('spotted', count > 0);
  }

  // Subtle counter row only when there's something spotted.
  const ctr     = document.getElementById('spot-counter');
  const ctrText = document.getElementById('spot-counter-text');
  if (ctr && ctrText) {
    if (count === 0) {
      ctr.style.display = 'none';
    } else {
      ctr.style.display = 'flex';
      ctrText.textContent = count === 1 ? 'Spotted 1 time' : `Spotted ${count} times`;
    }
  }

  const wrap = document.getElementById('sightings-wrap');
  const list = document.getElementById('sightings-list');
  if (!count) { if (wrap) wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = data.sightings.map((sg, i) => {
    const photosHTML = (sg.photos||[]).map(p => {
      const src = photoUrl(p);
      if (!src) return '';
      const safeSrc = src.replace(/'/g,"\\'");
      const safeTs  = (sg.ts||'').replace(/'/g,"\\'");
      const safeEv  = (sg.event||'').replace(/'/g,"\\'");
      const cls     = p._pending ? 's-thumb pending' : 's-thumb';
      return `<img class="${cls}" src="${src}" onclick="openLightbox('${safeSrc}','${safeEv} · ${safeTs}')">`;
    }).join('');
    return `<div class="sighting-entry">
      <div class="sighting-top"><div class="sighting-meta"><div class="sighting-num">Sighting #${i+1}</div><div class="sighting-time">${escapeHtml(sg.ts)}</div><div class="sighting-ev">${escapeHtml(sg.event)}${sg.loc?' · '+escapeHtml(sg.loc):''}</div></div><button class="sighting-del" onclick="deleteSighting('${escapeJsSq(sg.id)}')">✕</button></div>
      ${photosHTML?`<div class="sighting-photos">${photosHTML}</div>`:''}
      <button class="add-photo-btn" onclick="triggerPhoto('${sg.id}')">📷  Add a Photo</button>
    </div>`;
  }).join('');
  const firstPhoto = photoUrl(data.sightings.find(sg=>sg.photos?.length>0)?.photos[0]);
  if (firstPhoto) {
    const hero = document.getElementById('modal-hero');
    const existing = hero.querySelector('img');
    if (existing) existing.src = firstPhoto;
    else {
      const img = document.createElement('img');
      img.src = firstPhoto; img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      const ph = hero.querySelector('.modal-hero-placeholder');
      if (ph) ph.replaceWith(img);
    }
  }
}

// ══════════════════════════════════════════════
// COUNTER / SIGHTINGS
// ══════════════════════════════════════════════
async function changeCount(delta) {
  if (delta > 0) { addSighting(); return; }
  const sp   = currentSpotted();
  const data = sp[S.modalKey];
  if (!data?.sightings.length) return;
  const last = data.sightings[data.sightings.length - 1];
  try { await Queue.sightingDelete(last.id); }
  catch (err) {
    showErr('Could not remove sighting', err);
    return;
  }
  data.sightings.pop();
  if (!data.sightings.length) delete sp[S.modalKey];
  // (Storage cleanup is handled inside DB.sightings.remove.)
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Removed last sighting');
}

async function addSighting() {
  const key = S.modalKey;
  const car = S.modalCar;
  if (!key || !car) return;
  const eventIdForRow = (S.event === PERSONAL_EVENT) ? null : (S.eventId || null);

  // iOS Safari throws away the user-gesture context across an `await`.
  // If we wait for the DB insert before calling camInput.click(), the
  // camera silently doesn't open on the second tap onwards. So we kick
  // off the insert as a Promise, click the camera *synchronously*, and
  // let handlePhoto await the same promise to learn the row id.
  const sightingPromise = Queue.sightingCreate({
    event_id:   eventIdForRow,
    car_name:   car.name,
    car_era:    car.era,
    car_make:   car.make,
    car_rarity: car.rarity,
    location:   S.loc || null,
  });
  S.pendingSightingPromise = sightingPromise;
  document.getElementById('camInput').click();
  showSnack('🎯 Spotted! Opening camera…');

  let row;
  try { row = await sightingPromise; }
  catch (err) {
    S.pendingSightingPromise = null;
    showErr('Could not save sighting', err);
    return;
  }
  const sp = currentSpotted();
  const wasFirst = !sp[key];
  if (!sp[key]) sp[key] = { event:S.event, loc:S.loc, ts:row.spotted_at, sightings:[] };
  sp[key].sightings.push({ id:row.id, event:S.event, loc:S.loc, ts:row.spotted_at, photos:[] });
  if (wasFirst) _flashJustSpotted(key);
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  checkBingo();
  S.pendingSightingId = row.id;
}

async function deleteSighting(sgId) {
  const sp   = currentSpotted();
  const data = sp[S.modalKey];
  if (!data) return;
  const sg = data.sightings.find(s => String(s.id) === String(sgId));
  if (!sg) return;
  try { await Queue.sightingDelete(sg.id); }
  catch (err) {
    showErr('Could not delete sighting', err);
    return;
  }
  data.sightings = data.sightings.filter(s => String(s.id) !== String(sgId));
  if (!data.sightings.length) delete sp[S.modalKey];
  // (Storage cleanup is handled inside DB.sightings.remove.)
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Sighting removed');
}
function triggerPhoto(sgId) { S.pendingSightingId = sgId; document.getElementById('camInput').click(); }

async function handlePhoto(e) {
  const file = e.target.files[0];
  let   sgId = S.pendingSightingId;
  const pendingPromise = S.pendingSightingPromise;
  S.pendingSightingId = null;
  S.pendingSightingPromise = null;
  e.target.value = '';
  if (!file || !S.modalKey) { showSnack('✓ Sighting saved'); return; }

  showSnack('📤 Saving photo…');
  try {
    // The camera was opened synchronously to preserve iOS gesture
    // context, so the sighting row may still be in flight. Wait for it.
    if (!sgId && pendingPromise) {
      try {
        const row = await pendingPromise;
        sgId = row?.id || null;
      } catch { /* swallowed; the sighting create surfaced its own error toast */ }
    }
    const blob = await Photos.downscale(file);
    const sp   = currentSpotted();
    const data = sp[S.modalKey];
    if (!data) throw new Error('Sighting not found');
    let sg = sgId ? data.sightings.find(s => String(s.id) === String(sgId)) : null;
    if (!sg) sg = data.sightings[data.sightings.length-1];
    if (!sg) throw new Error('No sighting to attach photo to');
    const photo = await Queue.sightingPhotoAttach(blob, sg.id, { kind: 'sightings' });
    if (!sg.photos) sg.photos = [];
    sg.photos.push(photo);
    save(); refreshModalSightings(); renderList(); renderEventList();
    showSnack(photo._pending ? '📷 Photo saved (will sync when online)' : '📷 Photo saved!');
  } catch (err) {
    showErr('Photo upload failed', err);
  } finally {
    if (S._prevEvent !== undefined) { S.event = S._prevEvent; S._prevEvent = undefined; }
  }
}

// ══════════════════════════════════════════════
// LIGHTBOX / TOASTS
// ══════════════════════════════════════════════
function openLightbox(src, info) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-info').textContent = info || '';
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }
document.getElementById('lightbox')?.addEventListener('click', e => { if(e.target===document.getElementById('lightbox'))closeLightbox(); });

let snackTimer;
function showSnack(msg) {
  const el = document.getElementById('snackbar');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
// Bingo milestones — line (3 in a row/col/diag), era (every cell in
// current era), board (every cell in every selected era).
// Each milestone fires once per event session via S._fired.
let bingoShown = false;  // legacy flag, kept for any external check

function _detectLines(uniqueCars, spottedSet) {
  const COLS = 3;
  const ROWS = Math.ceil(uniqueCars.length / COLS);
  const out  = [];
  // Rows — only rows that have all 3 cells (never the partial last row)
  for (let r = 0; r < ROWS; r++) {
    const row = uniqueCars.slice(r * COLS, r * COLS + COLS);
    if (row.length === COLS && row.every(c => spottedSet.has(c.name))) {
      out.push({ kind: 'row', r });
    }
  }
  // Columns — only count if there are at least 3 cells in that column
  for (let c = 0; c < COLS; c++) {
    let allOk = true, cnt = 0;
    for (let r = 0; r < ROWS; r++) {
      const i = r * COLS + c;
      if (i >= uniqueCars.length) break;
      cnt++;
      if (!spottedSet.has(uniqueCars[i].name)) { allOk = false; break; }
    }
    if (allOk && cnt >= 3) out.push({ kind: 'col', c });
  }
  // Diagonals — only on a 3×3 board
  if (uniqueCars.length === 9) {
    const has = (i) => spottedSet.has(uniqueCars[i].name);
    if (has(0) && has(4) && has(8)) out.push({ kind: 'diag', i: 0 });
    if (has(2) && has(4) && has(6)) out.push({ kind: 'diag', i: 1 });
  }
  return out;
}

function fireBingoToast(html, size = 'small') {
  const t = document.getElementById('bingo-toast');
  if (!t) return;
  t.innerHTML = html;
  t.className = `bingo-toast toast-${size} show`;
  clearTimeout(t._tmr);
  const ms = size === 'big' ? 5500 : (size === 'medium' ? 4000 : 3000);
  t._tmr = setTimeout(() => t.classList.remove('show'), ms);
}

// Marks a key for the cell-spot flash animation. The bingo render
// reads S.justSpotted and tags the matching cell with .just-spotted;
// the CSS keyframe runs and we clear the flag after a beat so future
// renders don't replay the animation.
function _flashJustSpotted(key) {
  S.justSpotted = key;
  setTimeout(() => {
    if (S.justSpotted === key) {
      S.justSpotted = null;
      try { renderList?.(); } catch {}
    }
  }, 900);
}

function checkBingo() {
  if (!Array.isArray(S.board)) return;
  S._fired = S._fired || {};
  const sp = currentSpotted();
  const cars = S.board;
  const spotted = new Set(cars.filter(c => sp[cellKey(c.era, c.name)]).map(c => c.name));
  const allComplete = cars.length > 0 && spotted.size === cars.length;
  const lines = _detectLines(cars, spotted);

  const fk = `${S.event || ''}`;
  if (allComplete && !S._fired.boardWin) {
    S._fired.boardWin = true;
    fireBingoToast('🏆<br>FULL BOARD!<br><span style="font-size:0.7em">Every car spotted</span>', 'big');
    fireConfetti();
    return;
  }
  if (lines.length > 0 && !S._fired[`line:${fk}`]) {
    S._fired[`line:${fk}`] = true;
    bingoShown = true;
    fireBingoToast('🎯<br>BINGO!<br><span style="font-size:0.7em">3 in a row</span>', 'small');
    fireConfetti({ count: 18 });
    return;
  }
}

// ══════════════════════════════════════════════
// CONFETTI — emoji-particle burst for milestones.
// Cheap and cheerful: a handful of DOM elements that float down with
// CSS animation and self-clean. No SVG canvas, no audio, no library.
// ══════════════════════════════════════════════
function fireConfetti({ count = 36 } = {}) {
  const root = document.body;
  if (!root) return;
  const emojis = ['🎉','🏆','⭐','🎊','🚗','🏁','✨'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left            = (Math.random() * 100) + '%';
    p.style.fontSize        = (1.2 + Math.random() * 1.6) + 'rem';
    p.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
    p.style.animationDelay    = (Math.random() * 0.4) + 's';
    root.appendChild(p);
    setTimeout(() => p.remove(), 4500);
  }
}

function _resetBingoFiredForEvent() {
  // Called when starting / resuming an event so milestones can fire
  // again for the new session.
  S._fired = {};
  bingoShown = false;
}

// (Legacy supabase compat helpers removed; replaced by the per-user db
//  layer in the Phase-3 sync rewrite.)


// ══════════════════════════════════════════════
// FILTER PANEL TOGGLE (collapsible)
// ══════════════════════════════════════════════
function toggleEvFilters() {
  const panel = document.getElementById('ev-filter-panel');
  const btn   = document.getElementById('ev-filter-btn');
  if (!panel) return;
  panel.classList.toggle('open');
  btn.classList.toggle('has-filters', panel.classList.contains('open') || _evFilterCount() > 0);
}
function toggleGarageFilters() {
  const panel = document.getElementById('g-filter-panel');
  const btn   = document.getElementById('g-filter-btn');
  if (!panel) return;
  panel.classList.toggle('open');
  btn.classList.toggle('has-filters', panel.classList.contains('open') || _gFilterCount() > 0);
}
function _evFilterCount() {
  let n = 0;
  if (EV_F.era     !== 'All') n++;
  if (EV_F.rarity  !== 'All') n++;
  if (EV_F.make    !== 'All') n++;
  if (EV_F.country !== 'All') n++;
  if (!EV_F.showSeen || !EV_F.showUnseen) n++;
  return n;
}
function _gFilterCount() {
  let n = 0;
  if (G_F.era     !== 'All') n++;
  if (G_F.rarity  !== 'All') n++;
  if (G_F.make    !== 'All') n++;
  if (G_F.country !== 'All') n++;
  if (G_F.event   !== 'All') n++;
  if (!G_F.showSeen || !G_F.showUnseen) n++;
  return n;
}
function _updateEvFilterBadge() {
  const n = _evFilterCount();
  const badge = document.getElementById('ev-filter-badge');
  const clear = document.getElementById('ev-filter-clear');
  const btn   = document.getElementById('ev-filter-btn');
  if (badge) { badge.textContent = n; badge.style.display = n > 0 ? '' : 'none'; }
  if (clear)   clear.style.display = n > 0 ? '' : 'none';
  if (btn)     btn.classList.toggle('has-filters', n > 0);
}
function _updateGFilterBadge() {
  const n = _gFilterCount();
  const badge = document.getElementById('g-filter-badge');
  const clear = document.getElementById('g-filter-clear');
  const btn   = document.getElementById('g-filter-btn');
  if (badge) { badge.textContent = n; badge.style.display = n > 0 ? '' : 'none'; }
  if (clear)   clear.style.display = n > 0 ? '' : 'none';
  if (btn)     btn.classList.toggle('has-filters', n > 0);
}
function clearEvFilters() {
  EV_F.era = EV_F.rarity = EV_F.make = EV_F.country = 'All';
  EV_F.showSeen = EV_F.showUnseen = true;
  buildEvFilters(); renderEventList();
}
function clearGarageFilters() {
  G_F.era = G_F.rarity = G_F.make = G_F.country = G_F.event = 'All';
  G_F.showSeen = G_F.showUnseen = true;
  buildGarageFilters(); renderGarage();
}


// ══════════════════════════════════════════════
// PHOTO-FIRST CAMERA FLOW
//
// User taps the camera FAB before having picked a car. Capture flow:
//   1. handlePhotoFirst() downscales the file → keeps Blob in memory
//      and shows a preview via object URL (no upload yet — the user
//      may still choose "discard").
//   2. They pick "Current Show" or "My Collection" → camAttachTo*()
//      stashes the Blob in _photoWaiting and opens the picker.
//   3. They pick a car → quickAddSighting / addCarToPersonalCollection
//      sees _photoWaiting is set and routes through attachWaitingPhoto
//      instead of re-prompting for the camera.
// ══════════════════════════════════════════════
let _pendingPhotoBlob    = null;
let _pendingPhotoPreview = null;  // object URL for the preview <img>
let _photoWaiting        = null;  // Blob waiting to be uploaded once a car is picked
let _photoTarget         = null;  // 'event' | 'collection'
let _photoWaitingPath    = null;  // existing Storage path (when sorting from PhotoBin)
let _pendingSortBinId    = null;  // PhotoBin id whose photo is currently being sorted

function triggerPhotoFirst() {
  document.getElementById('camInputFirst').click();
}

async function handlePhotoFirst(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const blob = await Photos.downscale(file);
    if (_pendingPhotoPreview) URL.revokeObjectURL(_pendingPhotoPreview);
    _pendingPhotoBlob    = blob;
    _pendingPhotoPreview = URL.createObjectURL(blob);
    const preview = document.getElementById('cam-preview-img');
    if (preview) { preview.src = _pendingPhotoPreview; preview.classList.add('loaded'); }
    const showName = document.getElementById('cam-attach-show-name');
    if (showName) showName.textContent = S.event || 'No active show';
    const evBtn = document.getElementById('cam-attach-event-btn');
    if (evBtn) { evBtn.disabled = !S.event; evBtn.style.opacity = S.event ? '' : '0.4'; }
    document.getElementById('cam-attach-overlay').classList.add('open');
  } catch (err) {
    console.error('handlePhotoFirst:', err);
    showSnack('⚠️ Could not process photo');
  }
}

function _clearPendingPhoto() {
  if (_pendingPhotoPreview) URL.revokeObjectURL(_pendingPhotoPreview);
  _pendingPhotoBlob    = null;
  _pendingPhotoPreview = null;
}

function camAttachDiscard() {
  _clearPendingPhoto();
  document.getElementById('cam-attach-overlay').classList.remove('open');
  showSnack('Photo discarded');
}

function camAttachToEvent() {
  if (!S.event || !_pendingPhotoBlob) { camAttachDiscard(); return; }
  document.getElementById('cam-attach-overlay').classList.remove('open');
  _photoWaiting = _pendingPhotoBlob;
  _photoTarget  = 'event';
  _pendingPhotoBlob = null;       // ownership transferred
  if (_pendingPhotoPreview) { URL.revokeObjectURL(_pendingPhotoPreview); _pendingPhotoPreview = null; }
  openPicker();
  showSnack('Find the car to attach the photo to');
}

function camAttachToCollection() {
  if (!_pendingPhotoBlob) { camAttachDiscard(); return; }
  document.getElementById('cam-attach-overlay').classList.remove('open');
  _photoWaiting = _pendingPhotoBlob;
  _photoTarget  = 'collection';
  _pendingPhotoBlob = null;
  if (_pendingPhotoPreview) { URL.revokeObjectURL(_pendingPhotoPreview); _pendingPhotoPreview = null; }
  openGarageAdd();
  showSnack('Find the car to attach the photo to');
}

// "Save for later" — uploads the photo to Storage now (so it's backed
// up in the cloud) and adds a PhotoBin entry. The user can come back
// to the Sort Photos screen any time and assign each pending photo
// to a car.
async function camAttachToLater() {
  if (!_pendingPhotoBlob) { camAttachDiscard(); return; }
  document.getElementById('cam-attach-overlay').classList.remove('open');
  const blob = _pendingPhotoBlob;
  _clearPendingPhoto();
  showSnack('📤 Saving for later…');
  try {
    const { path } = await DB.storage.uploadPhoto(blob, { kind: 'sortbin' });
    PhotoBin.add({ storage_path: path });
    refreshHomeShortcuts();
    showSnack('💾 Saved — sort it from Home later');
  } catch (err) {
    showErr('Could not save photo', err);
  }
}

// Called after user selects a car in picker/garage-add when _photoWaiting
// (a Blob) or _photoWaitingPath (a Storage path from the sort bin) is
// set. Creates the photo row linked to the latest sighting on this key.
async function attachWaitingPhoto(key) {
  if (!_photoWaiting && !_photoWaitingPath) return;
  const blob       = _photoWaiting;
  const sortPath   = _photoWaitingPath;
  const sortBinId  = _pendingSortBinId;
  const target     = _photoTarget;
  _photoWaiting     = null;
  _photoWaitingPath = null;
  _pendingSortBinId = null;
  _photoTarget      = null;

  const sp = target === 'collection'
    ? (S.spotted[PERSONAL_EVENT] = S.spotted[PERSONAL_EVENT] || {})
    : currentSpotted();
  if (!sp[key] || !sp[key].sightings?.length) {
    showSnack('⚠️ No sighting to attach photo to');
    return;
  }
  const sighting = sp[key].sightings[sp[key].sightings.length - 1];
  if (!sighting.photos) sighting.photos = [];

  showSnack('📤 Saving photo…');
  try {
    let photo;
    if (sortPath) {
      // Sort flow — the photo is already in Storage; just link it.
      const photoRow = await DB.sightingPhotos.attach({
        sighting_id:  sighting.id,
        storage_path: sortPath,
      });
      photo = {
        id:   photoRow.id,
        path: sortPath,
        url:  DB.storage.publicUrl(sortPath),
        ts:   photoRow.taken_at,
      };
      if (sortBinId) {
        PhotoBin.remove(sortBinId);
        refreshHomeShortcuts();
      }
    } else {
      // Normal flow — upload + attach.
      photo = await Queue.sightingPhotoAttach(blob, sighting.id, { kind: 'sightings' });
    }
    sighting.photos.push(photo);
    save();
    renderList(); renderEventList(); renderGarage();
    if (typeof renderPhotoSort === 'function') renderPhotoSort();
    showSnack(photo._pending ? '📷 Photo saved (will sync when online)' : '📷 Photo attached!');
  } catch (err) {
    showErr('Could not save photo', err);
  }
}

// ══════════════════════════════════════════════
// PHOTO SORT — unassigned photos screen
// ══════════════════════════════════════════════
function showPhotoSort() {
  switchTab('sort');
  renderPhotoSort();
}

function renderPhotoSort() {
  const body = document.getElementById('sort-body');
  if (!body) return;
  const pending = PhotoBin.list();
  const sub = document.getElementById('sort-hdr-sub');
  if (sub) sub.textContent = pending.length === 1 ? '1 photo' : `${pending.length} photos`;
  if (!pending.length) {
    body.innerHTML = `
      <div class="sort-empty">
        <div class="sort-empty-icon">📸</div>
        <h3>Nothing to sort</h3>
        <p>When you tap the camera button at a show, choose <strong>"Save for later"</strong> and your photos collect here.<br>Then come back when you have a moment and assign each one to the right car.</p>
      </div>`;
    return;
  }
  body.innerHTML = `
    <div class="sort-grid">
      ${pending.map(p => {
        const url = (typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync(p.storage_path))
          || DB.storage.publicUrl(p.storage_path);
        const when = p.ts ? new Date(p.ts).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '';
        return `<button class="sort-card" onclick="openSortAttach('${escapeJsSq(p.id)}')">
          <img src="${escapeAttr(url)}" alt="" loading="lazy">
          <div class="sort-card-meta">
            <span class="sort-card-time">${escapeHtml(when)}</span>
            <span class="sort-card-arrow">Sort →</span>
          </div>
        </button>`;
      }).join('')}
    </div>
    <button class="sort-clear-btn" onclick="confirmClearPhotoBin()">Discard all unsorted</button>`;
}

async function openSortAttach(id) {
  const item = PhotoBin.get(id);
  if (!item) { showSnack('Photo not found'); return; }
  // Try the local cache first; fall back to Storage if needed.
  let blob = null;
  if (typeof PhotoCache !== 'undefined') {
    blob = await PhotoCache.getBlob(item.storage_path);
  }
  if (!blob) {
    try {
      const url = DB.storage.publicUrl(item.storage_path);
      const r = await fetch(url);
      if (r.ok) blob = await r.blob();
    } catch (e) { console.warn('openSortAttach fetch:', e); }
  }
  if (!blob) {
    showSnack('⚠️ Could not load this photo');
    return;
  }
  // Re-use the cam-attach-overlay so the user gets the same routing
  // (Current Show / My Collection) as the photo-FAB flow.
  if (_pendingPhotoPreview) URL.revokeObjectURL(_pendingPhotoPreview);
  _pendingPhotoBlob    = blob;
  _pendingPhotoPreview = URL.createObjectURL(blob);
  // Track the path so attachWaitingPhoto can link it directly without
  // re-uploading, and clean up the PhotoBin entry on success.
  _photoWaitingPath = item.storage_path;
  _pendingSortBinId = item.id;

  const preview = document.getElementById('cam-preview-img');
  if (preview) { preview.src = _pendingPhotoPreview; preview.classList.add('loaded'); }
  const showName = document.getElementById('cam-attach-show-name');
  if (showName) showName.textContent = S.event || 'No active show';
  const evBtn = document.getElementById('cam-attach-event-btn');
  if (evBtn) { evBtn.disabled = !S.event; evBtn.style.opacity = S.event ? '' : '0.4'; }
  document.getElementById('cam-attach-overlay').classList.add('open');
}

async function confirmClearPhotoBin() {
  const ok = await confirmSheet({
    title:        'Discard all unsorted photos?',
    body:         "Photos you haven't assigned to a car yet will be deleted from the bin and from cloud storage.",
    confirmLabel: 'Discard all',
    danger:       true,
  });
  if (!ok) return;
  const items = PhotoBin.list();
  for (const it of items) {
    try { await DB.storage.removePhoto(it.storage_path); } catch {}
  }
  PhotoBin.clear();
  refreshHomeShortcuts();
  renderPhotoSort();
  showSnack('Bin cleared');
}

function refreshHomeShortcuts() {
  const banner = document.getElementById('home-sort-banner');
  const sub    = document.getElementById('home-sort-sub');
  const n = (typeof PhotoBin !== 'undefined') ? PhotoBin.count() : 0;
  if (banner) banner.style.display = n > 0 ? '' : 'none';
  if (sub)    sub.textContent = n === 1 ? '1 photo waiting' : `${n} photos waiting`;
}

// ══════════════════════════════════════════════
// CONNECTIVITY + REFRESH
// ══════════════════════════════════════════════
function _setOfflineBanner(offline) {
  const el = document.getElementById('offline-banner');
  if (el) el.classList.toggle('show', offline);
}

function _setupConnectivity() {
  _setOfflineBanner(!navigator.onLine);
  window.addEventListener('online',  () => {
    _setOfflineBanner(false);
    showSnack('🟢 Back online');
    // Refresh data we may have missed while offline.
    _refreshOnFocus();
  });
  window.addEventListener('offline', () => {
    _setOfflineBanner(true);
    showSnack('⚡ You\'re offline');
  });
}

// Refreshes sightings + past events from DB. Called when the tab
// becomes visible again (FIL flips back from another app) and when
// connectivity returns. Quiet on failure — errors surface elsewhere.
let _refreshing = false;
async function _refreshOnFocus() {
  if (_refreshing) return;
  if (!CURRENT_SESSION) return;
  _refreshing = true;
  try {
    if (typeof Queue !== 'undefined') await Queue.drain();
    _invalidateEventsCache();
    await hydrateSightingsFromDB();
    await renderPastEvents();
    if (S.tab === 'event')  renderEventList();
    if (S.tab === 'garage') renderGarage();
    if (S.tab === 'bingo')  { buildEraTabs(); renderList(); }
  } catch (e) {
    console.warn('_refreshOnFocus:', e);
  } finally {
    _refreshing = false;
  }
}

function _setupVisibilityRefresh() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') _refreshOnFocus();
  });
}

// ══════════════════════════════════════════════
// EVENT SUMMARY — leaderboard + cars across all attendees
// Requires the "sightings read shared at event" RLS policy from
// schema-patch-event-summary.sql.
// ══════════════════════════════════════════════
async function _fetchEventSummary(eventId) {
  const { data: sightings, error: e1 } = await SB.from('sightings')
    .select('id, user_id, car_name, car_era, car_rarity, spotted_at, sighting_photos(storage_path)')
    .eq('event_id', eventId);
  if (e1) throw e1;
  const userIds = [...new Set(sightings.map(s => s.user_id))];
  let profileById = {};
  if (userIds.length) {
    const { data: profiles } = await SB.from('profiles').select('id, display_name').in('id', userIds);
    (profiles || []).forEach(p => { profileById[p.id] = p.display_name || 'Someone'; });
  }
  return { sightings, profileById };
}

async function openEventSummary() {
  if (!S.eventId) { showSnack('Start a show first to see its summary'); return; }
  const overlay = document.getElementById('event-summary-overlay');
  const body    = document.getElementById('event-summary-body');
  const title   = document.getElementById('event-summary-title');
  if (!overlay || !body) return;
  if (title) title.textContent = S.event ? `Summary · ${S.event}` : 'Event Summary';
  body.innerHTML = '<div class="es-loading">Loading…</div>';
  overlay.classList.add('open');
  try {
    const { sightings, profileById } = await _fetchEventSummary(S.eventId);
    body.innerHTML = _renderEventSummary(sightings, profileById);
  } catch (err) {
    console.error('openEventSummary:', err);
    const detail = err?.message || String(err);
    body.innerHTML = `<div class="es-empty">⚠️ Couldn't load summary<br><span style="font-size:0.78rem">${escapeHtml(detail)}</span><br><br><span style="font-size:0.78rem;color:var(--dim2)">If this is the first time, run schema-patch-event-summary.sql in Supabase to allow shared reads.</span></div>`;
  }
}

function closeEventSummary() {
  document.getElementById('event-summary-overlay')?.classList.remove('open');
}
document.getElementById('event-summary-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('event-summary-overlay')) closeEventSummary();
});

function _renderEventSummary(sightings, profileById) {
  if (!sightings.length) {
    return '<div class="es-empty">No cars spotted at this event yet.<br><span style="font-size:0.82rem">Spot one and it\'ll show up here.</span></div>';
  }
  const me = currentUserId();
  const byUser = {};
  for (const s of sightings) {
    const uid = s.user_id;
    if (!byUser[uid]) byUser[uid] = {
      user_id: uid,
      display_name: profileById[uid] || 'Someone',
      uniqueCars: new Set(),
      sightings: 0,
    };
    byUser[uid].uniqueCars.add(s.car_name);
    byUser[uid].sightings++;
  }
  const ranked = Object.values(byUser).sort((a, b) => b.uniqueCars.size - a.uniqueCars.size);

  const byCar = {};
  for (const s of sightings) {
    const name = s.car_name;
    if (!byCar[name]) byCar[name] = {
      car_name: name,
      car_era:  s.car_era,
      car_rarity: s.car_rarity || 'common',
      spotters: new Set(),
      count:    0,
    };
    byCar[name].spotters.add(byUser[s.user_id]?.display_name || 'Someone');
    byCar[name].count++;
  }
  const carList = Object.values(byCar).sort((a, b) => b.count - a.count || a.car_name.localeCompare(b.car_name));

  let html = '<div class="es-leaderboard">';
  ranked.forEach((u, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="font-family:var(--fh);font-weight:900;color:var(--dim)">#${i+1}</span>`;
    const isMe  = u.user_id === me;
    const cls   = isMe ? 'es-row me' : 'es-row';
    html += `<div class="${cls}">
      <div class="es-medal">${medal}</div>
      <div class="es-name">${escapeHtml(u.display_name)}${isMe ? ' (you)' : ''}</div>
      <div class="es-score">${u.uniqueCars.size}<span class="es-sub">cars</span></div>
    </div>`;
  });
  html += '</div>';

  html += `<div class="es-section-hdr">All cars spotted (${carList.length})</div>`;
  carList.forEach(c => {
    const spotters = [...c.spotters].join(', ');
    html += `<div class="es-car-row ${c.car_rarity}">
      <div class="es-car-name">${escapeHtml(c.car_name)}</div>
      <div class="es-car-meta">${escapeHtml(c.car_era)} · spotted by <strong>${escapeHtml(spotters)}</strong>${c.count > 1 ? ` · ×${c.count}` : ''}</div>
    </div>`;
  });

  return html;
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
// Auth gates the app. bootAuth() (in auth.js) routes between the
// auth screen and the main app, and runs initSetup() after sign-in.
(async () => {
  _setupConnectivity();
  _setupVisibilityRefresh();
  await bootAuth();
})();

// ══════════════════════════════════════════════
// EVENT MENU — switch / new event
// ══════════════════════════════════════════════
function openEventMenu() {
  document.getElementById('event-menu-overlay').classList.add('open');
}
function closeEventMenu() {
  document.getElementById('event-menu-overlay').classList.remove('open');
}
document.getElementById('event-menu-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('event-menu-overlay')) closeEventMenu();
});
function goToNewEvent() {
  closeEventMenu();
  switchTab('home');
  setTimeout(() => openNewShowSheet(), 100);
}

// "End this show" — clears the current event from the running app. The
// event row and all sightings stay in Supabase; user can resume from
// Home → Previous Shows whenever.
async function endCurrentShow() {
  closeEventMenu();
  if (!S.event) { showSnack('No active show'); return; }
  const ok = await confirmSheet({
    title:        `End "${S.event}"?`,
    body:         "Your sightings stay saved. You can come back to it from Previous Shows on Home.",
    confirmLabel: 'End show',
  });
  if (!ok) return;
  S.event   = '';
  S.eventId = null;
  S.board   = null;
  S.boardEras = null;
  S.boardCarCount = null;
  S.rolls   = 0;
  S._fired  = {};
  save();
  _invalidateEventsCache();
  showSnack('Show ended');
  switchTab('home');
}

function openNewShowSheet() {
  const overlay = document.getElementById('new-show-overlay');
  if (!overlay) return;
  const di = document.getElementById('date-input');
  if (di && !di.value) di.value = new Date().toISOString().slice(0, 10);
  // Clear any stale value in the inputs from a previous open.
  const ev = document.getElementById('ev-input');
  const lc = document.getElementById('loc-input');
  if (ev) ev.value = '';
  if (lc) lc.value = '';
  overlay.classList.add('open');
  setTimeout(() => ev?.focus(), 280);
}
function closeNewShowSheet() {
  document.getElementById('new-show-overlay')?.classList.remove('open');
}
document.getElementById('new-show-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('new-show-overlay')) closeNewShowSheet();
});
function goToSwitchEvent() { 
  closeEventMenu(); 
  switchTab('home'); 
  // Scroll to past events section
  setTimeout(() => {
    const pe = document.getElementById('past-events');
    if (pe && pe.style.display !== 'none') pe.scrollIntoView({ behavior:'smooth', block:'start' });
  }, 100);
}

// ══════════════════════════════════════════════
// GARAGE ADD — add car to personal collection
// ══════════════════════════════════════════════
const PERSONAL_EVENT = '📦 Personal Collection';
let garageAddEra = 'All';

function openGarageAdd() {
  garageAddEra = 'All';
  buildGarageAddEraChips();
  renderGarageAddPicker();
  document.getElementById('garage-add-loc').value = '';
  document.getElementById('loc-status').textContent = '';
  document.getElementById('loc-status').className = 'loc-status';
  document.getElementById('garage-add-search').value = '';
  document.getElementById('garage-add-overlay').classList.add('open');
  // Auto-detect location on open
  detectLocation();
}
function closeGarageAdd() {
  document.getElementById('garage-add-overlay').classList.remove('open');
  document.getElementById('garage-add-search').value = '';
}
document.getElementById('garage-add-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('garage-add-overlay')) closeGarageAdd();
});

function buildGarageAddEraChips() {
  document.getElementById('garage-add-era-row').innerHTML =
    ['All',...ERAS].map(e =>
      `<button class="picker-era-chip${garageAddEra===e?' active':''}" onclick="setGarageAddEra('${e}')">${e}</button>`
    ).join('');
}
function setGarageAddEra(e) { garageAddEra = e; buildGarageAddEraChips(); renderGarageAddPicker(); }

function renderGarageAddPicker() {
  const q    = (document.getElementById('garage-add-search')?.value||'').toLowerCase().trim();
  const merged = allSpotted();
  // Show all cars in personal collection as "added"
  const personalSpotted = S.spotted[PERSONAL_EVENT] || {};

  let cars = garageAddEra === 'All' ? CAR_DB : CAR_DB.filter(c => c.era === garageAddEra);
  if (q) cars = cars.filter(c =>
    c.name.toLowerCase().includes(q) || c.make.toLowerCase().includes(q) ||
    c.era.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
  // Unspotted first, then already in personal collection
  cars = [...cars.filter(c => !personalSpotted[`fil-${c.era}-${c.name}`]),
          ...cars.filter(c =>  personalSpotted[`fil-${c.era}-${c.name}`])];

  if (!cars.length) {
    document.getElementById('garage-add-list').innerHTML =
      `<div style="text-align:center;padding:40px 20px;color:var(--muted);font-weight:700">No cars found</div>`;
    return;
  }

  document.getElementById('garage-add-list').innerHTML = cars.map(c => {
    const key = `fil-${c.era}-${c.name}`;
    const inCollection = !!personalSpotted[key];
    const count = personalSpotted[key]?.sightings?.length || 0;
    return `<div class="picker-row${inCollection?' added':''}" data-name="${c.name.replace(/"/g,'&quot;')}">
      <div class="picker-flag">${c.flag}</div>
      <div class="picker-info">
        <div class="picker-name">${c.name}</div>
        <div class="picker-sub">${c.era} · ${c.years} · ${c.country}</div>
      </div>
      <div class="rarity-badge ${c.rarity}" style="flex-shrink:0">${RARITY_LABELS[c.rarity]}</div>
      ${inCollection
        ? `<div class="picker-done" style="background:var(--green)"></div><span style="font-size:0.75rem;font-weight:800;color:var(--green2);flex-shrink:0">×${count}</span>`
        : `<button class="picker-add-btn" data-name="${c.name.replace(/"/g,'&quot;')}" data-era="${c.era}">+</button>`}
    </div>`;
  }).join('');

  // Delegated — same reason as the main picker: re-renders on every
  // keystroke, per-element handlers don't survive.
  const gaList = document.getElementById('garage-add-list');
  gaList.onclick = (e) => {
    const addBtn = e.target.closest('.picker-add-btn');
    if (addBtn) {
      e.stopPropagation();
      const car = CAR_DB.find(c => c.name === addBtn.dataset.name);
      if (car) addCarToPersonalCollection(car);
      return;
    }
    const addedRow = e.target.closest('.picker-row.added');
    if (addedRow) {
      const car = CAR_DB.find(c => c.name === addedRow.dataset.name);
      if (!car) return;
      if (_photoWaiting) {
        // Photo-first flow: even for a car already in the collection,
        // tapping it should log another sighting + attach the photo.
        // Without this branch the click went to openModal and the
        // waiting photo just sat there unsaved.
        addCarToPersonalCollection(car);
      } else {
        closeGarageAdd();
        openModal(car, `fil-${car.era}-${car.name}`);
      }
      return;
    }
    const row = e.target.closest('.picker-row:not(.added)');
    if (!row) return;
    const car = CAR_DB.find(c => c.name === row.dataset.name);
    if (car) addCarToPersonalCollection(car);
  };
}

async function addCarToPersonalCollection(car) {
  const key = cellKey(car.era, car.name);
  const loc = document.getElementById('garage-add-loc').value.trim();
  const sightingPromise = Queue.sightingCreate({
    event_id:   null,
    car_name:   car.name,
    car_era:    car.era,
    car_make:   car.make,
    car_rarity: car.rarity,
    location:   loc || null,
  });

  // Photo-first flow: blob already waiting from the camera FAB.
  if (_photoWaiting) {
    closeGarageAdd();
    let row;
    try { row = await sightingPromise; }
    catch (err) { showErr('Could not add to collection', err); return; }
    if (!S.spotted[PERSONAL_EVENT]) S.spotted[PERSONAL_EVENT] = {};
    const sp = S.spotted[PERSONAL_EVENT];
    if (!sp[key]) sp[key] = { event:PERSONAL_EVENT, loc, ts:row.spotted_at, sightings:[] };
    sp[key].sightings.push({ id:row.id, event:PERSONAL_EVENT, loc, ts:row.spotted_at, photos:[] });
    save(); renderGarageAddPicker(); renderGarage();
    showSnack(`🚗 ${car.name} added!`);
    await attachWaitingPhoto(key);
    return;
  }

  // No waiting photo — fire the camera click synchronously while the
  // user gesture is fresh, then resolve the DB row in parallel.
  S.modalKey = key;
  S._prevEvent = S.event;
  S.event = PERSONAL_EVENT;
  S.pendingSightingPromise = sightingPromise;
  document.getElementById('camInput').click();
  showSnack(`🚗 ${car.name} added!`);

  let row;
  try { row = await sightingPromise; }
  catch (err) {
    S.pendingSightingPromise = null;
    showErr('Could not add to collection', err);
    return;
  }
  if (!S.spotted[PERSONAL_EVENT]) S.spotted[PERSONAL_EVENT] = {};
  const sp = S.spotted[PERSONAL_EVENT];
  if (!sp[key]) sp[key] = { event:PERSONAL_EVENT, loc, ts:row.spotted_at, sightings:[] };
  sp[key].sightings.push({ id:row.id, event:PERSONAL_EVENT, loc, ts:row.spotted_at, photos:[] });
  save(); renderGarageAddPicker(); renderGarage();
  S.pendingSightingId = row.id;
}

// ══════════════════════════════════════════════
// LOCATION DETECTION
// ══════════════════════════════════════════════
let _locController = null;

async function detectLocation() {
  const btn    = document.getElementById('loc-detect-btn');
  const status = document.getElementById('loc-status');
  const input  = document.getElementById('garage-add-loc');

  if (!navigator.geolocation) {
    status.textContent = 'Location not supported on this device';
    status.className   = 'loc-status err';
    return;
  }

  btn.classList.add('detecting');
  status.textContent  = '📡 Detecting location…';
  status.className    = 'loc-status';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      btn.classList.remove('detecting');
      const { latitude, longitude } = pos.coords;
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        // Build a readable location string: "Town, County" or "City, Country"
        const a = data.address || {};
        const parts = [
          a.village || a.town || a.city || a.municipality,
          a.county  || a.state_district || a.state,
        ].filter(Boolean);
        const locStr = parts.join(', ') || data.display_name?.split(',').slice(0,2).join(',').trim() || '';
        input.value    = locStr;
        status.textContent = `📍 ${locStr}`;
        status.className   = 'loc-status ok';
      } catch(e) {
        // Fallback: just show coordinates
        input.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        status.textContent = '📍 Location set (no name found)';
        status.className   = 'loc-status ok';
      }
    },
    (err) => {
      btn.classList.remove('detecting');
      const msgs = {
        1: 'Location permission denied',
        2: 'Location unavailable',
        3: 'Location request timed out',
      };
      status.textContent = msgs[err.code] || 'Could not get location';
      status.className   = 'loc-status err';
    },
    { timeout: 10000, maximumAge: 60000 }
  );
}

// ══════════════════════════════════════════════
// SETTINGS SCREEN
// ══════════════════════════════════════════════
function openSettings()     { switchTab('settings'); }
function closeSettings()    { switchTab('home'); }
function openSetupGarage()  { switchTab('garage'); }

function showInstallInfo() {
  showSnack('Tap Share ⬆ then "Add to Home Screen"');
}

function showAbout() {
  alert('Car Bingo v14\n\nSpot classic cars at shows and on the road.\nBuilt with love for the classic car enthusiast.\n\nTap a car card to log a sighting, add photos, and build your lifetime garage collection.');
}

function exportData() {
  try {
    const data = {
      exported: new Date().toISOString(),
      events: loadStore().events || {},
      spotted: S.spotted,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `carbingo-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnack('📤 Data exported');
  } catch(e) {
    showSnack('Export failed — try again');
  }
}

async function confirmClearData() {
  const ok = await confirmSheet({
    title:        'Clear local cache?',
    body:         "This empties this device's offline cache. Your data on the server is untouched and will reload next time you sign in.",
    confirmLabel: 'Clear cache',
    danger:       true,
  });
  if (!ok) return;
  localStorage.clear();
  S.spotted  = {};
  S.event    = '';
  S.eventId  = null;
  S.board    = null;
  showSnack('🗑️ Local cache cleared');
  switchTab('home');
}
