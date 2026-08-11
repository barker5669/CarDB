
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
// Escaping alone doesn't make a URL safe to put in href — `javascript:`
// and `data:` survive HTML-escaping intact and still execute on tap.
// Event URLs are user-typed and shared between accounts, so allow only
// http/https and drop anything else.
function safeUrl(s) {
  const raw = String(s ?? '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw, window.location.href);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '';
  } catch { return ''; }
}

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
    // Manual abort wrapper — AbortSignal.timeout is missing on
    // older iOS Safari (FIL's phone is one), and a missing static
    // method threw TypeError on EVERY fetch, blanking the bingo
    // card. Build our own AbortController + setTimeout instead.
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mapped)}`;
      const r = await fetch(url, ctrl ? { signal: ctrl.signal } : {});
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      const src = data?.thumbnail?.source || null;
      if (src) { imgCache[carName] = src; saveImgCache(); }    // only cache wins
      return src;
    } catch (e) {
      console.warn('fetchWikiImg failed:', carName, e?.message || e);
      return null;                                              // do NOT cache failure
    } finally {
      if (timer) clearTimeout(timer);
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
  showSnack(`${prefix}: ${detail}`);
}

// Promise.race wrapper: any DB call wrapped in this rejects after `ms`
// instead of leaving the user staring at a loading spinner. Use at the
// call sites of any operation that, when it hangs on flaky show-Wi-Fi,
// would leave the UI looking like nothing is happening.
function _raceTimeout(promise, label, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(
      () => reject(new Error(`${label} timed out — check your connection and try again`)),
      ms
    )),
  ]);
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
      // Never clobber a good stored board with an empty one — if
      // S.board is momentarily empty, keep whatever was saved before
      // (this is what made a resumed show lose all its cars).
      const prev  = store.events[S.event];
      const board = (Array.isArray(S.board) && S.board.length)
        ? S.board
        : ((prev && Array.isArray(prev.board) && prev.board.length) ? prev.board : S.board);
      store.events[S.event] = {
        board,
        spotted:  S.spotted[S.event] || {},
        loc:      S.loc,
        date:     S.date,
        rolls:    S.rolls,
        eras:     S.boardEras,
        carCount: S.boardCarCount,
      };
      store.lastEvent = S.event;
    } else {
      // No active show — clear lastEvent so the next launch doesn't
      // auto-resume a show the user already ended.
      delete store.lastEvent;
    }
    store.allSpotted = S.spotted;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    _quotaWarned = false;
  } catch(e) {
    console.warn('save() cache failed:', e);
    if (!_quotaWarned && typeof showSnack === 'function') {
      _quotaWarned = true;
      showSnack('Local cache full — your data is still saved online');
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
  // Board mix, weighted for ACHIEVABILITY. The old mix put ~7 of every 9
  // cells at rare-or-above (leg 1 / epic 2 / rare 4 / common 2), which
  // made a board next to impossible to complete. New intent: mostly
  // common, then rare, with epic + legendary as the scarce "trophy"
  // cells. The ordering common > rare > epic ≥ legendary holds across the
  // whole 6–16 card range the app allows. For the default 9-card board
  // this yields 4 common / 3 rare / 1 epic / 1 legendary.
  const legendary = n >= 8 ? 1 : 0;
  const epic      = Math.max(1, Math.round(n * 0.12));
  const rare      = Math.max(1, Math.round(n * 0.30));
  const common    = Math.max(0, n - legendary - epic - rare);
  return { legendary, epic, rare, common };
}

// Returns a single flat array of cars mixed across the selected eras.
// eventKey + userId fold into the seed so the same event yields a
// different card per user (you and FIL get different boards). Cars
// the user has spotted on a previous show are PUSHED to the back of
// each rarity pool, so a fresh board prefers cars the user has yet
// to see and only repeats once the unseen pool is exhausted.
function buildBoard(eventKey, userId, roll, eras, totalCount) {
  const defaults = (typeof loadBingoDefaults === 'function') ? loadBingoDefaults() : { eras: [...ERAS], carCount: 9 };
  eras       = (eras && eras.length) ? eras : defaults.eras;
  totalCount = totalCount || defaults.carCount;
  roll       = (roll !== undefined) ? roll : (S.rolls || 0);
  const baseSeed = strSeed(`${eventKey || 'default'}::${userId || 'anon'}::r${roll}`);

  // Cars the user has spotted at least once across any past event.
  // S.spotted[event][cellKey] where cellKey is fil-{era}-{name};
  // era names contain hyphens, so use carNameFromCellKey not regex.
  const seen = new Set();
  const allSp = S.spotted || {};
  for (const evName of Object.keys(allSp)) {
    for (const key of Object.keys(allSp[evName] || {})) {
      const name = carNameFromCellKey(key);
      if (name) seen.add(name);
    }
  }
  const orderUnseenFirst = (arr) => {
    const unseen = arr.filter(c => !seen.has(c.name));
    const haveSeen = arr.filter(c => seen.has(c.name));
    return [...unseen, ...haveSeen];
  };

  const quota = _quotaFor(totalCount);
  const byR   = { legendary:[], epic:[], rare:[], common:[] };
  CAR_DB.filter(c => eras.includes(c.era))
        .forEach(c => { if (byR[c.rarity]) byR[c.rarity].push(c); });

  const picks = [];
  Object.entries(quota).forEach(([rarity, q]) => {
    const shuffled = seededShuffle(byR[rarity], baseSeed + rarity.length * 31);
    const pool     = orderUnseenFirst(shuffled);
    for (let i = 0; i < q && i < pool.length; i++) picks.push(pool[i]);
  });
  // Fill any shortfall (small pools, or carCount > sum of quota).
  if (picks.length < totalCount) {
    const used = new Set(picks.map(c => c.name));
    const fillerPool = orderUnseenFirst(seededShuffle(
      CAR_DB.filter(c => eras.includes(c.era) && !used.has(c.name)),
      baseSeed + 99991
    ));
    picks.push(...fillerPool.slice(0, totalCount - picks.length));
  }
  return seededShuffle(picks, baseSeed + 12345);
}

// DB.boards.cars stores car names only. New shape: flat ["name", ...].
// Old shape: era-keyed { "Pre-War": ["name", ...] }. The localStorage
// cache (save()) stores the board as an array of full car OBJECTS, so
// hydrate also accepts objects — otherwise resuming a show produced an
// empty board (every object failed the name-string lookup).
function hydrateBoard(stored) {
  if (Array.isArray(stored)) {
    return stored.map(item => {
      const name = (item && typeof item === 'object') ? item.name : item;
      return CAR_DB.find(c => c.name === name) || (item && item.name ? item : null);
    }).filter(Boolean);
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
    // Clamp carCount to the realistic bingo range (3x3 → ~4x4). Values
    // outside this (e.g. a stale 30 from an earlier slider config) get
    // pulled back to the 9-card default so new shows respect intent.
    let carCount = Number.isInteger(obj.carCount) ? obj.carCount : BINGO_DEFAULTS_FALLBACK.carCount;
    if (carCount < 6 || carCount > 16) carCount = BINGO_DEFAULTS_FALLBACK.carCount;
    return {
      eras: (Array.isArray(obj.eras) && obj.eras.length)
        ? obj.eras.filter(e => ERAS.includes(e))
        : ERAS.slice(),
      carCount,
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
  if (!S.event) { showSnack('Start a show first'); return; }
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
  showSnack(`New board · ${3 - S.rolls} reroll${3-S.rolls===1?'':'s'} remaining`);
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
  // Welcome card display is now driven by updateHomeCard since the
  // past-events DOM was removed from the home (it lives on the Shows
  // tab instead). But the network enrichment below still runs so
  // PastEvents stays in sync for the Shows tab — that's the whole
  // reason this function survives.
  _raceTimeout(_eventsList(), 'Past shows', 8000)
    .then(all => {
      const me = currentUserId();
      const dbEvents = (all || []).filter(e =>
        Array.isArray(e.event_attendees) &&
        e.event_attendees.some(a => a.user_id === me)
      );
      for (const dbEv of dbEvents) PastEvents.upsert(dbEv);
      // Re-render the Shows tab if it happens to be visible so the
      // newly-enriched data shows up without a tab switch.
      if (S.tab === 'shows' && typeof renderShowsList === 'function') renderShowsList();
    })
    .catch(err => console.warn('renderPastEvents enrich:', err));
  // Old past-events DOM has been removed. If a future render adds
  // it back, render the list; otherwise nothing more to do here.
  if (!pastEl || !listEl) return;
  pastEl.style.display = '';
  _renderPastEventsSkeleton();
  const events = PastEvents.list().filter(e =>
    e.name && e.name !== PERSONAL_EVENT && e.name !== S.event
  );
  if (!events.length) {
    pastEl.style.display = 'none';
    return;
  }
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
      <span class="pb-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 21V3M4 4h13l-3 4 3 4H4"/></svg></span>
      <div class="pb-body">
        <div class="pb-name">${escapeHtml(e.name)}</div>
        ${meta ? `<div class="pb-meta">${escapeHtml(meta)}</div>` : ''}
      </div>
      ${count > 0 ? `<span class="pb-count">${count} spotted</span>` : ''}
      <span class="pb-arrow">›</span>
    </button>`;
  }).join('');
}

// Renders the dedicated Shows tab — a full-screen browseable list
// of every past show, sourced from the same PastEvents store the
// home dashboard uses. Tap a row to resume; the brass count badge
// shows spotted totals at a glance.
// Shows tab is segmented: 'upcoming' (the shared events calendar)
// and 'past' (shows already run). Default to upcoming — it's the
// forward-looking, more actionable view.
let _showsSegment = 'upcoming';

function setShowsSegment(seg) {
  _showsSegment = (seg === 'past') ? 'past' : 'upcoming';
  renderShowsList();
}

function _renderShowsSegmentBtns() {
  document.querySelectorAll('#shows-segment .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.seg === _showsSegment);
  });
  const addBtn = document.getElementById('shows-add-btn');
  if (addBtn) addBtn.textContent = _showsSegment === 'upcoming' ? '＋ Add' : '＋ New';
  const sub = document.getElementById('shows-hdr-sub');
  if (sub) sub.textContent = _showsSegment === 'upcoming' ? 'Events to come' : 'Shows you’ve run';
}

// Header add button — context-aware: add an upcoming event, or
// start a new show, depending on the active segment.
function showsAddTapped() {
  if (_showsSegment === 'upcoming') {
    if (typeof openAddUpcoming === 'function') openAddUpcoming();
  } else {
    openNewShowSheet();
  }
}

function renderShowsList() {
  _renderShowsSegmentBtns();
  const body = document.getElementById('shows-body');
  if (!body) return;
  if (_showsSegment === 'upcoming') {
    // Upcoming segment IS the events calendar — same render the old
    // standalone Upcoming tab used, now painting into #shows-body.
    if (typeof renderUpcoming === 'function') renderUpcoming();
    else body.innerHTML = '';
    return;
  }
  _renderPastShows(body);
}

// Past shows — month-grouped rows, newest first, styled identically
// to the upcoming list so the two segments feel like one screen. The
// currently-running show is excluded (it's not "past" — it shows on
// the dashboard). Each row can be resumed or deleted.
function _renderPastShows(body) {
  const events = (PastEvents.list() || []).filter(e =>
    e.name && e.name !== PERSONAL_EVENT && e.name !== S.event
  );
  // The active show, if any, gets its own pinned card at the top so
  // it's clearly separated from genuinely-ended shows.
  const activeCard = S.event ? `
    <div class="up-month">
      <div class="up-month-hdr">Running now</div>
      <button class="up-row up-row-btn" onclick="resumeEvent('${escapeJsSq(S.event)}')">
        <div class="up-date"><div class="up-date-d up-date-live">●</div></div>
        <div class="up-info">
          <div class="up-name">${escapeHtml(S.event)}</div>
          ${S.loc ? `<div class="up-loc">${escapeHtml(S.loc)}</div>` : ''}
          <div class="up-count">Current show · tap to continue</div>
        </div>
        <div class="up-row-chev">›</div>
      </button>
    </div>` : '';
  if (!events.length && !activeCard) {
    body.innerHTML = `
      <div class="shows-empty">
        <div class="shows-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 21V3M4 4h13l-3 4 3 4H4"/></svg></div>
        <h3>No past shows yet</h3>
        <p>Start a show and it'll show up here once you've run it.</p>
      </div>`;
    return;
  }
  const countFor = (name) => Object.keys((S.spotted || {})[name] || {}).length;
  // Newest first.
  const sorted = events.slice().sort((a, b) =>
    String(b.event_date || '').localeCompare(String(a.event_date || ''))
  );
  // Group by month so it mirrors the upcoming list's structure.
  const groups = {};
  for (const e of sorted) {
    const key = e.event_date ? String(e.event_date).slice(0, 7) : 'no-date';
    (groups[key] = groups[key] || []).push(e);
  }
  const pastHtml = Object.entries(groups).map(([key, evs]) => `
    <div class="up-month">
      <div class="up-month-hdr">${escapeHtml(_monthLabelSafe(key))}</div>
      ${evs.map(e => {
        const d = e.event_date ? new Date(e.event_date) : null;
        const dateBlock = d && !isNaN(d)
          ? `<div class="up-date-d">${d.getDate()}</div>
             <div class="up-date-w">${d.toLocaleDateString('en-GB',{weekday:'short'})}</div>`
          : `<div class="up-date-d">—</div>`;
        const count = countFor(e.name);
        return `<div class="up-row">
          <div class="up-row-main" onclick="resumeEvent('${escapeJsSq(e.name)}')">
            <div class="up-date">${dateBlock}</div>
            <div class="up-info">
              <div class="up-name">${escapeHtml(e.name)}</div>
              ${e.location ? `<div class="up-loc">${escapeHtml(e.location)}</div>` : ''}
              ${count > 0 ? `<div class="up-count">${count} spotted</div>` : ''}
            </div>
          </div>
          <div class="up-actions">
            <button class="up-del" type="button" onclick="confirmDeletePastShow('${escapeJsSq(e.name)}')" title="Delete show">✕</button>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
  body.innerHTML = activeCard + pastHtml;
}

// Delete a past show from the local index + its cached board.
// Spotted cars stay in the collection (they live in S.spotted).
async function confirmDeletePastShow(name) {
  const ok = await confirmSheet({
    title:        `Delete "${name}"?`,
    body:         'Removes the show from your list. Cars you spotted stay in your collection.',
    confirmLabel: 'Delete',
    danger:       true,
  });
  if (!ok) return;
  try {
    PastEvents._save((PastEvents.list() || []).filter(e => e.name !== name));
    const store = loadStore();
    if (store.events && store.events[name]) {
      delete store.events[name];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch (e) { console.warn('confirmDeletePastShow:', e); }
  showSnack('Show deleted');
  renderShowsList();
}

// Month label that doesn't depend on upcoming.js load order.
function _monthLabelSafe(key) {
  if (key === 'no-date') return 'No date';
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return 'No date';
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// Local-first index of every show the user has been part of, persisted
// across reloads. Source of truth for the "Previous Shows" list on
// Home — independent of network state, so end-show always lands in a
// renderable list even if the DB fetch hangs or returns empty (common
// when the just-ended show had no spotted cars yet).
const _PAST_KEY = 'cb-past-events-v1';
const PastEvents = {
  list() {
    try {
      const arr = JSON.parse(localStorage.getItem(_PAST_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },
  _save(arr) {
    try { localStorage.setItem(_PAST_KEY, JSON.stringify(arr.slice(0, 100))); }
    catch (e) { console.warn('PastEvents save:', e); }
  },
  // Insert or update by id (preferred) or by name (fallback for events
  // that haven't synced yet).
  upsert(ev) {
    if (!ev || !ev.name) return;
    const arr = this.list();
    const idx = arr.findIndex(e =>
      (ev.id != null && e.id != null && String(e.id) === String(ev.id)) ||
      (e.name && ev.name && e.name === ev.name)
    );
    const merged = {
      id:         ev.id ?? (idx >= 0 ? arr[idx].id : null),
      name:       ev.name,
      location:   ev.location ?? (idx >= 0 ? arr[idx].location : null),
      event_date: ev.event_date ?? (idx >= 0 ? arr[idx].event_date : null),
      ts:         Date.now(),
    };
    if (idx >= 0) arr[idx] = merged;
    else          arr.unshift(merged);
    arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    this._save(arr);
  },
  removeById(id) {
    const arr = this.list().filter(e => String(e.id) !== String(id));
    this._save(arr);
  },
};
window.PastEvents = PastEvents;

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
    showSnack('Could not load your sightings');
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
    // Legacy photos that are still in Supabase Storage (from before the
    // local-only switch). Keep displaying them until they age out.
    const remotePhotos = (s.sighting_photos || []).map(sp => {
      if (sp.storage_path) allPaths.push(sp.storage_path);
      return {
        id:   sp.id,
        path: sp.storage_path,
        url:  DB.storage.publicUrl(sp.storage_path),
        ts:   sp.taken_at,
      };
    });
    // Local photos taken on this device for this sighting. These never
    // sync to the cloud — they're the canonical store going forward.
    const localPhotos = (typeof LocalPhotos !== 'undefined') ? LocalPhotos.list(s.id) : [];
    spotted[eventName][key].sightings.push({
      id:    s.id,
      event: eventName,
      loc:   s.location || '',
      ts:    s.spotted_at,
      photos: [...remotePhotos, ...localPhotos],
    });
  }
  S.spotted = spotted;
  // Sightings just hydrated — refresh the dashboard stats so the
  // numbers reflect reality (they ran once with empty S.spotted
  // before the network responded).
  try { renderLifetimeStats(); } catch {}
  // Warm the photo cache in the background so renders prefer local
  // blobs over network URLs. Don't await — it can take a while if the
  // user has dozens of photos and we don't want to block hydrate.
  if (typeof PhotoCache !== 'undefined' && allPaths.length) {
    PhotoCache.warmAll(allPaths).then(() => {
      // Re-render any visible list once blobs are in memory.
      try { renderList?.(); renderEventList?.(); renderGarage?.(); } catch {}
    });
  }
  // Warm local-photo blobs into PhotoCache so renders find them
  // synchronously after a fresh load.
  if (typeof LocalPhotos !== 'undefined') {
    LocalPhotos.warmAll().then(() => {
      try { renderList?.(); renderEventList?.(); renderGarage?.(); refreshModalSightings?.(); } catch {}
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
  // Optimistically jump to bingo right away so the user gets instant
  // feedback. Prime S.* from cached PastEvents row (header info),
  // and pull S.board / S.spotted from localStorage so the cards
  // render immediately even if Supabase is slow or dead.
  const cached = (PastEvents.list() || []).find(e => e.name === name);
  if (cached) {
    S.event   = cached.name;
    S.eventId = cached.id ?? S.eventId;
    S.loc     = cached.location  || '';
    S.date    = cached.event_date || '';
    if (!S.spotted[cached.name]) S.spotted[cached.name] = {};
  }
  // Read the cached board for this show so cards render right away.
  // save() persists store.events[name].board after every change, so
  // this is the same data we'd build remotely.
  let evCache = null;
  try {
    const store = loadStore();
    evCache = store.events && store.events[name];
    if (evCache && Array.isArray(evCache.board) && evCache.board.length) {
      S.board         = hydrateBoard(evCache.board);
      S.rolls         = evCache.rolls ?? 0;
      S.boardEras     = evCache.eras ?? S.boardEras;
      S.boardCarCount = evCache.carCount ?? S.boardCarCount;
      if (evCache.spotted) S.spotted[name] = { ...(S.spotted[name] || {}), ...evCache.spotted };
    }
  } catch (e) { console.warn('resumeEvent cache read:', e); }
  // No cached board (show created on another device, or its cache was
  // lost) — build one NOW from settings so the user never lands on an
  // empty board. buildBoard is deterministic by event seed, so this
  // reconstructs a stable board; save() persists it for next time.
  if (!Array.isArray(S.board) || !S.board.length) {
    const defs = (typeof loadBingoDefaults === 'function')
      ? loadBingoDefaults() : { eras: ERAS.slice(), carCount: 9 };
    S.boardEras     = (evCache && Array.isArray(evCache.eras) && evCache.eras.length) ? evCache.eras : defs.eras;
    S.boardCarCount = (evCache && Number.isInteger(evCache.carCount)) ? evCache.carCount : defs.carCount;
    S.rolls         = (evCache && evCache.rolls) || 0;
    S.board = buildBoard(S.eventId || S.event || name, currentUserId(), S.rolls, S.boardEras, S.boardCarCount);
    save();
  }
  switchTab('bingo');
  try {
    // Network enrichment is best-effort — the board already rendered
    // from the local cache above, so a missing/slow Supabase event
    // must NOT surface a scary error (the show resumed fine locally).
    const eventRow = await _raceTimeout(_findEventByName(name), 'Resume show', 10000);
    if (!eventRow) { console.warn('resumeEvent: event not in Supabase (local-only show)'); return; }
    PastEvents.upsert(eventRow);
    S.event   = eventRow.name;
    S.eventId = eventRow.id;
    S.loc     = eventRow.location  || '';
    S.date    = eventRow.event_date || '';
    await DB.attendees.join(eventRow.id);  // idempotent
    await _loadOrCreateBoard(eventRow);
    if (!S.spotted[eventRow.name]) S.spotted[eventRow.name] = {};
    _resetBingoFiredForEvent();
    save();
    // Re-render now that the board is loaded.
    updateBingoState();
    if (Array.isArray(S.board) && S.board.length) preloadEraImages(S.board);
  } catch (err) {
    console.warn('resumeEvent enrich failed (show still resumed locally):', err);
  }
}

async function startEvent() {
  const ev   = document.getElementById('ev-input').value.trim();
  const loc  = document.getElementById('loc-input').value.trim();
  const date = document.getElementById('date-input').value;  // "YYYY-MM-DD" or ""
  if (!ev) { document.getElementById('ev-input').focus(); return; }

  // Local-first: build the show entirely from local state so the user
  // lands on the bingo board instantly. Supabase create happens in
  // the background — its result swaps the local-style id for the
  // canonical remote one when it succeeds.
  //
  // ALWAYS pull the latest settings (eras + carCount) from the
  // BingoDefaults store. S.* values can carry over from a resumed
  // show (resumeEvent sets S.boardCarCount to whatever that show
  // had), so trusting them gives 16-card boards even when the user
  // has the slider set to 9. Read from loadBingoDefaults directly.
  const settings  = loadBingoDefaults();
  const erasList  = (Array.isArray(settings.eras) && settings.eras.length) ? settings.eras : ERAS.slice();
  const carCount  = (Number.isInteger(settings.carCount) && settings.carCount > 0) ? settings.carCount : 9;
  S.boardEras     = erasList;
  S.boardCarCount = carCount;
  const localId = 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  S.event   = ev;
  S.eventId = localId;
  S.loc     = loc || '';
  S.date    = date
    ? new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    : '';
  const userId = (typeof currentUserId === 'function') ? currentUserId() : 'local-user';
  S.rolls = 0;
  S.board = buildBoard(localId, userId, 0, erasList, carCount);
  if (!S.spotted[ev]) S.spotted[ev] = {};
  _resetBingoFiredForEvent();
  // Persist the show + board to localStorage (the save() function
  // writes to store.events[ev] which resumeEvent reads back).
  save();
  // Record into PastEvents too so it appears in the Shows tab even
  // before the remote create lands.
  try {
    PastEvents.upsert({
      id:         localId,
      name:       ev,
      location:   loc || null,
      event_date: date || null,
    });
  } catch {}
  closeNewShowSheet();
  launch();

  // Background Supabase sync — best effort. If it succeeds, swap
  // the local-style id for the canonical remote one. Push our
  // freshly-built local board UP (don't pull a stale remote board
  // down — that's how a 9-card local board ended up replaced by an
  // old 16-card remote one for the same event name).
  if (window.DB && DB.events && typeof DB.events.create === 'function') {
    const localBoard      = S.board;
    const localBoardEras  = S.boardEras;
    const localBoardCount = S.boardCarCount;
    const localRolls      = S.rolls;
    (async () => {
      try {
        const eventRow = await _raceTimeout(_findOrCreateEvent(ev, loc, date || null), 'Start show', 10000);
        if (!eventRow || eventRow.id == null) return;
        PastEvents.upsert(eventRow);
        S.eventId = eventRow.id;
        try { await DB.attendees.join(eventRow.id); } catch (e) { console.warn('attendees.join:', e); }
        // Push the local board up — overwrite any stale remote board
        // for this event (e.g. an older 16-card layout from before
        // the user lowered their settings to 9).
        try {
          if (DB.boards && typeof DB.boards.upsert === 'function') {
            await DB.boards.upsert(eventRow.id, {
              cars:      dehydrateBoard(localBoard),
              eras:      localBoardEras,
              car_count: localBoardCount,
              rolls:     localRolls || 0,
            });
          }
        } catch (e) { console.warn('boards.upsert (push local):', e); }
        save();
        _invalidateEventsCache();
      } catch (err) {
        console.warn('Background show sync failed:', err);
      }
    })();
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
  // No active show → the bingo board has nothing to display. Route to
  // Shows (upcoming + past events) so the user can start or resume a
  // show rather than landing on an empty board.
  if (tab === 'bingo' && !S.event) tab = 'shows';
  S.tab = tab;
  const tabs = ['home','bingo','event','shows','garage','mycars','sort','settings'];
  tabs.forEach(t => {
    const el = document.getElementById('s-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  buildNav(tab);
  if (tab === 'bingo')    { updateBingoState(); }
  if (tab === 'event')    { buildEvFilters(); renderEventList(); }
  if (tab === 'shows')    { renderShowsList(); }
  if (tab === 'garage')   { buildGarageFilters(); renderGarage(); }
  if (tab === 'home')     { updateHomeCard(); renderPastEvents(); refreshHomeShortcuts(); }
  if (tab === 'mycars')   { /* renderMyCarsList is called explicitly by showMyCars */ }
  if (tab === 'sort')     { renderPhotoSort(); }
  if (tab === 'settings') { /* static */ }
}

function buildNav(activeTab) {
  // Nav: Home | Bingo | 📷 (FAB) | Shows | Collection
  // Shows = browseable list of past shows. The per-event "Spotted"
  // detail (s-event) is still reachable from the bingo screen and
  // from tapping a past show, but no longer has a nav slot.
  // My Cars (s-mycars) is reached by tapping the hero on the dashboard.
  // Settings is accessed via the burger on the dashboard hero.
  const NAV_TABS = [
    { id:'home',   lbl:'Home',       svg:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { id:'bingo',  lbl:'Bingo',      svg:'<rect x="3" y="2" width="18" height="20" rx="3"/><path d="M8 7h2l2 5 2-5h2"/><path d="M8 14h8"/>' },
    { id:'shows',  lbl:'Shows',      svg:'<path d="M4 5h16v6H4z"/><path d="M4 13h16v6H4z"/><path d="M8 5v14M12 5v14M16 5v14"/>' },
    { id:'garage', lbl:'Collection', svg:'<path d="M2 3h9a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H2z"/><path d="M22 3h-9a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H22z"/>' },
  ];
  const camSvg = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';

  // Mark home as active if on settings (since settings is accessed from home)
  const displayActive = activeTab === 'settings' ? 'home' : activeTab;

  function tabBtn(t) {
    return `<button class="nav-btn${displayActive===t.id?' active':''}" onclick="switchTab('${t.id}')"><svg viewBox="0 0 24 24">${t.svg}</svg>${t.lbl}</button>`;
  }
  const camBtn = `<button class="nav-cam" onclick="triggerPhotoFirst()"><span class="disc"><svg viewBox="0 0 24 24">${camSvg}</svg></span></button>`;

  const html = tabBtn(NAV_TABS[0]) + tabBtn(NAV_TABS[1]) + camBtn + tabBtn(NAV_TABS[2]) + tabBtn(NAV_TABS[3]);

  ['home','bingo','event','shows','garage','mycars','sort','settings'].forEach(id => {
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
  // Sync the dashboard carousel pager dots: only show them when
  // BOTH active-show + next-event are rendered, and reflect which
  // slide is currently scrolled into view.
  refreshDashCarousel();
  // Friendly greeting in the header sub-line.
  const greeting = document.getElementById('home-greeting');
  if (greeting && typeof currentDisplayName === 'function') {
    const name = currentDisplayName();
    greeting.textContent = name ? `Hello, ${name}` : 'Classic Car Spotter';
  }
  // Welcome card: shown only on a true first run — no active show
  // AND no past shows the user could resume into.
  const welcomeEl = document.getElementById('home-welcome');
  if (welcomeEl) {
    const hasPast = (PastEvents.list() || []).some(e => e.name && e.name !== PERSONAL_EVENT);
    welcomeEl.style.display = (!S.event && !hasPast) ? 'block' : 'none';
  }
  if (S.event) {
    // 'flex' (not 'block') so the .dash-slide flex rule still applies —
    // an inline display:block was overriding it and leaving the
    // current-show card shorter than the next-event card.
    activeDiv.style.display = 'flex';
    const nameEl  = document.getElementById('home-show-name');
    const metaEl  = document.getElementById('home-show-meta');
    const badgeEl = document.getElementById('home-show-badge');
    if (nameEl)  nameEl.textContent  = S.event;
    if (metaEl)  {
      // Format the date as "4 May 2026" if it came in raw ISO
      // (resumeEvent path) so the meta line stays short and
      // doesn't wrap inside the card.
      let dateStr = S.date || '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(dateStr);
        if (!isNaN(d)) dateStr = d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
      }
      metaEl.textContent = (S.loc ? S.loc + ' · ' : '') + dateStr;
    }
    if (badgeEl) {
      const count = Object.keys(currentSpotted()).length;
      badgeEl.textContent = count + ' spotted';
    }
  } else {
    activeDiv.style.display = 'none';
  }
  // Dashboard components — lifetime stats, next-event preview,
  // and the full-bleed His Car hero. Lifetime is synchronous (reads
  // localStorage); the other two are best-effort over the network
  // and fall back to placeholders/hidden when nothing's available.
  renderLifetimeStats();
  renderNextEventCard().catch(err => console.warn('renderNextEventCard:', err));
  renderHomeHero().catch(err => console.warn('renderHomeHero:', err));
}

// Dashboard carousel — shows the pager dots only when both the
// active-show card and the next-event card are visible. Tapping a
// dot jumps to that slide; scrolling the carousel highlights the
// matching dot. One-time wire (idempotent via _wired flag on the
// carousel element).
function refreshDashCarousel() {
  const car  = document.getElementById('dash-carousel');
  const pager = document.getElementById('dash-carousel-pager');
  const active = document.getElementById('home-active-show');
  const next   = document.getElementById('cb-next-event');
  if (!car || !pager || !active || !next) return;
  const activeVisible = active.style.display !== 'none';
  const showPager     = activeVisible && next.style.display !== 'none';
  pager.style.display = showPager ? 'flex' : 'none';
  if (!showPager) return;
  // Snap to the active-show slide so the user lands on "current
  // show" by default; they can swipe right to see the next event.
  requestAnimationFrame(() => { car.scrollLeft = 0; });
  if (car._wired) return;
  car._wired = true;
  pager.querySelectorAll('.pd').forEach(d => {
    d.onclick = () => {
      const idx = parseInt(d.dataset.idx || '0', 10);
      const slides = car.querySelectorAll('.dash-slide');
      const target = slides[idx];
      if (target) car.scrollTo({ left: target.offsetLeft - car.offsetLeft, behavior: 'smooth' });
    };
  });
  car.addEventListener('scroll', () => {
    const w = car.clientWidth || 1;
    const idx = Math.round(car.scrollLeft / w);
    pager.querySelectorAll('.pd').forEach((d, i) => d.classList.toggle('on', i === idx));
  });
}

// Dashboard hero — exact mockup structure. Cal pill + burger float
// over the cream-paper hero, car silhouette sits centred (replaced
// by a real photo when available), name + stats overlay the bottom,
// pager dots anchor the centre. Whole hero is tappable: in empty
// state opens the add-car flow, populated state opens the car detail.
async function renderHomeHero() {
  const hero = document.getElementById('cb-hero');
  if (!hero) return;
  // Cal pill renders regardless of cars — fire-and-forget.
  renderHomeHeroCalPill();

  if (typeof getHomeHeroCar !== 'function') return;
  let data;
  try { data = await getHomeHeroCar(); } catch { data = null; }

  const svgEl   = document.getElementById('cb-hero-svg');
  const photoEl = document.getElementById('cb-hero-photo');
  const imgEl   = document.getElementById('cb-hero-img');
  const nameEl  = document.getElementById('cb-hero-name');
  const metaEl  = document.getElementById('cb-hero-meta');
  const statsEl = document.getElementById('cb-hero-stats');
  if (!nameEl || !statsEl) return;

  if (!data) {
    // Empty state — silhouette stays visible, placeholder copy in
    // the bottom block, hero tappable to start the add-car flow.
    hero.classList.add('is-empty');
    if (svgEl)   svgEl.style.display = '';
    if (photoEl) photoEl.style.display = 'none';
    if (imgEl)   imgEl.removeAttribute('src');
    nameEl.textContent = 'Add your car';
    if (metaEl) metaEl.textContent = 'Tap to get started';
    statsEl.innerHTML = '';
    hero.onclick = (e) => {
      if (e.target.closest('button')) return;
      if (typeof openAddMyCar === 'function') openAddMyCar();
    };
    return;
  }

  hero.classList.remove('is-empty');
  const carId = data.car.id;
  hero.onclick = (e) => {
    if (e.target.closest('button')) return;
    if (typeof showMyCarDetail === 'function' && carId != null) showMyCarDetail(carId);
    else if (typeof showMyCars === 'function') showMyCars();
    else switchTab('mycars');
  };

  // Real photo if we have one — otherwise keep the silhouette.
  // .has-photo toggles styling that swaps the silhouette floor
  // shadow off when a real photo is present.
  if (data.photoUrl && photoEl && imgEl) {
    imgEl.src = data.photoUrl;
    imgEl.alt = data.car.name || '';
    imgEl.onerror = () => {
      photoEl.style.display = 'none';
      if (svgEl) svgEl.style.display = '';
      hero.classList.remove('has-photo');
    };
    photoEl.style.display = '';
    if (svgEl) svgEl.style.display = 'none';
    hero.classList.add('has-photo');
  } else {
    if (photoEl) photoEl.style.display = 'none';
    if (imgEl)   imgEl.removeAttribute('src');
    if (svgEl)   svgEl.style.display = '';
    hero.classList.remove('has-photo');
  }

  // Name + meta line. Year is shown in the stat pill below so we
  // drop it from the meta to keep the inline name/meta row short.
  const car  = data.car;
  const name = car.name || [car.make, car.model].filter(Boolean).join(' ') || 'My Car';
  nameEl.textContent = name;
  const metaParts = [car.make, car.color].filter(Boolean);
  if (metaEl) metaEl.textContent = metaParts.join(' · ');

  // Stat pills — mockup uses .stat-pill with .num and .lab (lowercase).
  const pills = [];
  if (car.year) pills.push({ num: car.year, lab: 'YR' });
  pills.push({ num: data.photoCount, lab: data.photoCount === 1 ? 'PHOTO' : 'PHOTOS' });
  if (data.logCount > 0) pills.push({ num: data.logCount, lab: data.logCount === 1 ? 'ENTRY' : 'LOG' });
  statsEl.innerHTML = pills.map(p =>
    `<div class="stat-pill"><span class="num">${escapeHtml(String(p.num))}</span><span class="lab">${escapeHtml(p.lab)}</span></div>`
  ).join('');

}

// 7-day calendar peek (today + 6 days ahead) for the cal pill on
// the hero. Mockup vocabulary: <button class="cal-day"> with
// <span class="dow"> + <span class="d">. Today gets .today (ink
// nub); days with RSVPd events get .has-event (brass dot below).
// Synchronous render uses cached events from the last successful
// fetch; async enrichment refreshes the cache.
const _UPCOMING_CACHE_KEY = 'cb-upcoming-cache-v1';

function _loadCachedUpcoming() {
  try {
    const arr = JSON.parse(localStorage.getItem(_UPCOMING_CACHE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function _saveCachedUpcoming(events) {
  try { localStorage.setItem(_UPCOMING_CACHE_KEY, JSON.stringify(events || [])); }
  catch (e) { console.warn('upcoming cache save:', e); }
}

function renderHomeHeroCalPill() {
  const pill = document.getElementById('cb-hero-cal');
  if (!pill) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Build 7-day window with onclick handlers wired up — earlier
  // versions of this render were emitting buttons without onclick,
  // so once app.js re-painted, the days lost their interactivity.
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const day = d.getDate();
    const iso = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    html += `<button class="cal-day${isToday ? ' today' : ''}" data-iso="${iso}" onclick="onCalDayTap('${iso}')">`
         +  `<span class="dow">${dow}</span>`
         +  `<span class="d">${day}</span>`
         +  `</button>`;
  }
  pill.innerHTML = html;
  // Paint dots from the local cache immediately — that way the
  // calendar shows the user's events even when the backend is
  // unreachable. Then refresh the cache asynchronously.
  _paintCalDotsFromList(pill, _loadCachedUpcoming());
  if (!(window.DB && DB.upcoming && typeof DB.upcoming.list === 'function')) return;
  Promise.resolve()
    .then(() => _raceTimeout(DB.upcoming.list(), 'Hero cal', 6000))
    .then(events => {
      if (!Array.isArray(events)) return;
      _saveCachedUpcoming(events);
      _paintCalDotsFromList(pill, events);
    })
    .catch(() => { /* leave the strip as-is — cached dots stay visible */ });
}

function _paintCalDotsFromList(pill, events) {
  if (!pill || !Array.isArray(events)) return;
  // Clear old dots first so a removed event doesn't ghost.
  pill.querySelectorAll('.cal-day.has-event').forEach(n => n.classList.remove('has-event'));
  const me = (typeof currentUserId === 'function') ? currentUserId() : null;
  for (const e of events) {
    if (!e || !e.event_date) continue;
    const attendees = Array.isArray(e.upcoming_event_attendees) ? e.upcoming_event_attendees : [];
    // If we know the current user, only paint dots for events
    // they RSVPd to. If we don't (auth hasn't loaded yet), show
    // any attended event so the user gets feedback.
    const attending = me ? attendees.some(a => a.user_id === me) : attendees.length > 0;
    if (!attending) continue;
    const node = pill.querySelector(`.cal-day[data-iso="${e.event_date}"]`);
    if (node) node.classList.add('has-event');
  }
}

// Lifetime stats — three bare numbers (Spotted, Shows, Legendary)
// with a small sub-info line beneath each ("+5 this month",
// "4 this year", "last · DB5"). The "since YY" eyebrow above the
// row gives the time horizon at a glance. All derived from local
// state; never blocks on a network call.
function renderLifetimeStats() {
  const spottedEl    = document.getElementById('cb-life-spotted');
  const showsEl      = document.getElementById('cb-life-shows');
  const legendaryEl  = document.getElementById('cb-life-legendary');
  const spottedSub   = document.getElementById('cb-life-spotted-sub');
  const showsSub     = document.getElementById('cb-life-shows-sub');
  const legendarySub = document.getElementById('cb-life-legendary-sub');
  const sinceYearEl  = document.getElementById('cb-life-since-year');
  if (!spottedEl || !showsEl || !legendaryEl) return;

  // Walk every sighting once — same loop powers all three stats so
  // the work stays cheap even with hundreds of cars logged.
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let totalSpotted = 0;
  let thisMonthSpotted = 0;
  let totalLegendary = 0;
  let lastLegendary = null;
  let lastLegendaryTs = 0;
  // Build a quick name → car lookup so we can read the rarity for
  // each spotted sighting. CAR_DB is the canonical list from cars.js,
  // a sibling classic-script global.
  const carIndex = {};
  if (typeof CAR_DB !== 'undefined' && Array.isArray(CAR_DB)) {
    for (const c of CAR_DB) { if (c && c.name) carIndex[c.name] = c; }
  }
  const allSpotted = S.spotted || {};
  for (const evName of Object.keys(allSpotted)) {
    const cars = allSpotted[evName] || {};
    for (const key of Object.keys(cars)) {
      const data = cars[key] || {};
      const sightings = Array.isArray(data.sightings) ? data.sightings : [];
      totalSpotted += 1;
      // Find the car name via the helper that handles hyphenated
      // era names ("Pre-War", "70s–80s") correctly.
      const carName = carNameFromCellKey(key);
      const car = carName ? carIndex[carName] : null;
      const isLegendary = !!(car && car.rarity === 'legendary');
      if (isLegendary) totalLegendary += 1;
      // First sighting timestamp powers the "this month" + "last seen" rolls.
      for (const sg of sightings) {
        if (!sg || !sg.ts) continue;
        const d = new Date(sg.ts);
        if (isNaN(d)) continue;
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (k === monthKey) thisMonthSpotted += 1;
        if (isLegendary && d.getTime() > lastLegendaryTs) {
          lastLegendaryTs = d.getTime();
          lastLegendary = carName;
        }
        break; // count first sighting only — duplicates would inflate "this month"
      }
    }
  }
  spottedEl.textContent = totalSpotted;
  if (spottedSub) {
    spottedSub.textContent = thisMonthSpotted > 0
      ? `+${thisMonthSpotted} this month`
      : ' '; // non-breaking space holds line height
  }

  // Shows = past events the user attended + 1 if there's a current
  // active show. PastEvents.list() is local-first.
  let pastList = [];
  try { pastList = (window.PastEvents && PastEvents.list()) || []; } catch {}
  const past = pastList.filter(e => e.name && e.name !== PERSONAL_EVENT);
  const showsCount = past.length + (S.event ? 1 : 0);
  showsEl.textContent = showsCount;
  // "X this year" — count past events whose date is in the current year,
  // plus the active show if it's also from this year.
  const thisYear = now.getFullYear();
  let thisYearShows = 0;
  for (const e of past) {
    if (!e.event_date) continue;
    const d = new Date(e.event_date);
    if (!isNaN(d) && d.getFullYear() === thisYear) thisYearShows += 1;
  }
  if (S.event && S.date) {
    const d = new Date(S.date);
    if (!isNaN(d) && d.getFullYear() === thisYear) thisYearShows += 1;
  }
  if (showsSub) showsSub.textContent = thisYearShows > 0 ? `${thisYearShows} this year` : ' ';

  // Legendary count + last one's name (short form when available).
  legendaryEl.textContent = totalLegendary;
  if (legendarySub) {
    if (lastLegendary) {
      // Trim to a snappy last word ("Aston Martin DB5" → "DB5") so
      // it fits on a narrow column. Falls back to the full name.
      const short = lastLegendary.split(/\s+/).pop();
      legendarySub.textContent = `last · ${short}`;
    } else {
      legendarySub.textContent = ' ';
    }
  }

  // "Since YY" eyebrow above the row — earliest show year or current.
  let earliestYear = null;
  for (const e of past) {
    if (!e.event_date) continue;
    const d = new Date(e.event_date);
    if (isNaN(d)) continue;
    if (earliestYear == null || d.getFullYear() < earliestYear) earliestYear = d.getFullYear();
  }
  if (S.event && S.date) {
    const d = new Date(S.date);
    if (!isNaN(d) && (earliestYear == null || d.getFullYear() < earliestYear)) earliestYear = d.getFullYear();
  }
  const sinceY = earliestYear != null ? earliestYear : thisYear;
  if (sinceYearEl) sinceYearEl.textContent = `'${String(sinceY).slice(-2)}`;
}

// Next-event preview card — toggles between "real upcoming event"
// and a "+ Add an event" CTA. Card is always visible; only its
// content/state changes. Tap handler routes accordingly via
// onNextEventTap (set on the card element in HTML).
let _nextEventState = 'empty';  // 'empty' or 'event'
async function renderNextEventCard() {
  const card = document.getElementById('cb-next-event');
  if (!card) return;
  // Start with the empty state visible — if cached events (or a
  // fresh fetch) reveal an upcoming RSVPd event, we'll flip it.
  _setNextEventEmpty();
  // Paint from cache first so the card shows the next event even
  // when the backend is unreachable.
  const cached = _loadCachedUpcoming();
  if (cached.length) _showNextEventFromList(cached);
  if (!window.DB || !DB.upcoming || typeof DB.upcoming.list !== 'function') return;
  let events;
  try { events = await _raceTimeout(DB.upcoming.list(), 'Next event', 6000); }
  catch { return; }
  if (!Array.isArray(events) || !events.length) return;
  _saveCachedUpcoming(events);
  _showNextEventFromList(events);
}

function _showNextEventFromList(events) {
  const todayIso = new Date().toISOString().slice(0, 10);
  // Show the soonest upcoming event regardless of RSVP. Skip the
  // currently-running show — it's not "next", it's the active one
  // and already has its own card on the dashboard.
  const candidates = events
    .filter(e => e.event_date && e.event_date >= todayIso)
    .filter(e => !S.event || e.name !== S.event)
    .sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));
  if (!candidates.length) return;
  const ev = candidates[0];
  const d  = new Date(ev.event_date);
  if (isNaN(d)) return;
  // "today" / "tomorrow" / "X days away" / "X weeks away" subtitle.
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  const days = Math.round((target - today) / 86400000);
  let away;
  if (days === 0)      away = 'today';
  else if (days === 1) away = 'tomorrow';
  else if (days < 14)  away = `${days} days away`;
  else                 away = `${Math.round(days / 7)} weeks away`;
  const locParts = [ev.location, away].filter(Boolean);
  _setNextEventFilled({
    m: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    d: d.getDate(),
    name: ev.name || 'Upcoming',
    meta: locParts.join(' · '),
  });
}

function _setNextEventEmpty() {
  _nextEventState = 'empty';
  const card = document.getElementById('cb-next-event');
  if (card) card.classList.add('is-empty');
  const set = (id, text) => { const n = document.getElementById(id); if (n) n.textContent = text; };
  set('cb-ne-eyebrow', 'Next event');
  set('cb-ne-name', 'No event scheduled');
  set('cb-ne-meta', 'Tap to add one');
  set('cb-ne-loc',  'Tap to add one');
  set('cb-ne-m', '');
  set('cb-ne-d', '+');
  set('cb-ne-chev', '＋');
}
function _setNextEventFilled({ m, d, name, meta }) {
  _nextEventState = 'event';
  const card = document.getElementById('cb-next-event');
  if (card) card.classList.remove('is-empty');
  const set = (id, text) => { const n = document.getElementById(id); if (n) n.textContent = text; };
  set('cb-ne-eyebrow', 'Next event');
  set('cb-ne-m', m);
  set('cb-ne-d', d);
  set('cb-ne-name', name);
  set('cb-ne-loc',  meta);
  set('cb-ne-chev', '›');
}
// ─── Car catalog picker ──────────────────────────────────────
// Search CAR_DB for a car to pre-fill the Add Car form. Opens on
// top of the form sheet (z-index:280 in HTML). Selection invokes
// the callback with the picked CAR_DB entry; cancellation invokes
// it with null (or never — the cancel button just closes).
let _catalogPickerCb = null;

function openCarCatalogPicker(callback) {
  _catalogPickerCb = callback || null;
  const overlay = document.getElementById('catalog-picker-overlay');
  const input   = document.getElementById('catalog-search-input');
  if (!overlay) return;
  if (input) {
    input.value = '';
    input.oninput = () => renderCatalogPickerList(input.value);
    setTimeout(() => input.focus(), 280);
  }
  renderCatalogPickerList('');
  overlay.classList.add('open');
}

function closeCarCatalogPicker() {
  const overlay = document.getElementById('catalog-picker-overlay');
  if (overlay) overlay.classList.remove('open');
  _catalogPickerCb = null;
}

function renderCatalogPickerList(query) {
  const list = document.getElementById('catalog-picker-list');
  if (!list) return;
  const cars = (typeof CAR_DB !== 'undefined' && Array.isArray(CAR_DB)) ? CAR_DB : [];
  const q = (query || '').toLowerCase().trim();
  const filtered = !q ? cars : cars.filter(c =>
    (c.name  && c.name.toLowerCase().includes(q)) ||
    (c.make  && c.make.toLowerCase().includes(q)) ||
    (c.model && c.model.toLowerCase().includes(q)) ||
    (c.era   && c.era.toLowerCase().includes(q))
  );
  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--ink-muted);font-size:0.88rem">No cars match "${escapeHtml(query)}".</div>`;
    return;
  }
  // Cap at 100 rows so a typo doesn't render 500+ DOM nodes; the
  // user can keep typing to narrow.
  list.innerHTML = filtered.slice(0, 100).map((c, idx) => {
    const realIdx = cars.indexOf(c);
    const sub = [c.make, c.years, c.era].filter(Boolean).join(' · ');
    return `<button class="picker-row" type="button" onclick="selectCatalogCar(${realIdx})">
      <span class="picker-flag">${c.flag || '🚗'}</span>
      <div class="picker-info">
        <div class="picker-name">${escapeHtml(c.name)}</div>
        <div class="picker-sub">${escapeHtml(sub)}</div>
      </div>
    </button>`;
  }).join('');
}

function selectCatalogCar(index) {
  const cars = (typeof CAR_DB !== 'undefined' && Array.isArray(CAR_DB)) ? CAR_DB : [];
  const car  = cars[index] || null;
  const cb   = _catalogPickerCb;
  closeCarCatalogPicker();
  if (cb && car) cb(car);
}

function onNextEventTap() {
  if (_nextEventState === 'empty' && typeof openAddUpcoming === 'function') {
    openAddUpcoming();
  } else if (typeof showUpcoming === 'function') {
    showUpcoming();
  }
}

function showGoLive() {
  switchTab('bingo');
}

// ══════════════════════════════════════════════
// BINGO TAB
// ══════════════════════════════════════════════
function cellKey(era, name) { return `fil-${era}-${name}`; }

// Reverse of cellKey — pulls the car name back out of a cellKey
// string. Era names contain hyphens ("Pre-War", "70s–80s") so a
// naive `/^fil-[^-]+-(.+)$/` regex extracts the wrong portion.
// Instead, try each known era as a prefix.
function carNameFromCellKey(key) {
  if (!key || typeof key !== 'string') return null;
  if (typeof ERAS !== 'undefined' && Array.isArray(ERAS)) {
    for (const era of ERAS) {
      const prefix = `fil-${era}-`;
      if (key.startsWith(prefix)) return key.slice(prefix.length);
    }
  }
  // Fallback if ERAS isn't loaded — still better than nothing.
  const m = /^fil-(.+?)-(.+)$/.exec(key);
  return m ? m[2] : null;
}

function buildEraTabs() {
  // Header subtitle (event name · location · date)
  const ev = S.event + (S.loc ? ' · '+S.loc : '') + (S.date ? ' · '+S.date : '');
  const sub = document.getElementById('bingo-ev-sub');
  if (sub) sub.textContent = ev;
  // Reroll pill
  const rb = document.getElementById('reroll-btn');
  if (rb) {
    const left = 3 - (S.rolls || 0);
    rb.textContent = left > 0 ? `Reroll · ${left}` : 'Reroll · 0';
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
  // Tag the live container with the current view so CSS can hide
  // the featured-bottom hero + section-lab in carousel mode (each
  // carousel card carries its own image + spot button, so the
  // bottom hero would be redundant and steal vertical space).
  const liveEl = document.getElementById('bingo-live');
  if (liveEl) liveEl.dataset.view = S.bingoView;
  const cars = Array.isArray(S.board) ? S.board : [];
  const unique = [...new Map(cars.map(c => [c.name, c])).values()];
  if (!unique.length) {
    list.innerHTML = `<div class="bingo-empty">No cars on this board yet.</div>`;
    const fb = document.getElementById('featured-bottom');
    if (fb) fb.style.display = 'none';
    updateScore();
    return;
  }
  if (S.bingoView === 'carousel') {
    // Preserve horizontal scroll across re-renders — spotting a car
    // rebuilds the list, and without this the carousel snaps back to
    // the first card instead of staying on the car just spotted.
    const oldScroll = list.querySelector('.bingo-carousel')?.scrollLeft || 0;
    const cells = unique.map((car, i) => bingoCarouselCardHTML(car, i)).join('');
    list.innerHTML = `<div class="bingo-carousel">${cells}</div>`;
    if (oldScroll) {
      const newCar = list.querySelector('.bingo-carousel');
      if (newCar) newCar.scrollLeft = oldScroll;
    }
  } else {
    // Flat 3-column grid mixing eras. Order is the buildBoard output so
    // line detection (rows / cols / diagonals) stays meaningful.
    const cells = unique.map((car, i) => bingoCellHTML(car, i)).join('');
    list.innerHTML = `<div class="bingo-grid">${cells}</div>`;
  }
  // Pick a featured car — keep the user's last choice if it's still
  // on the board; otherwise default to the first un-spotted car.
  const sp = currentSpotted();
  let featuredCar = unique.find(c => c.name === S.bingoFeatured);
  if (!featuredCar) {
    featuredCar = unique.find(c => !sp[cellKey(c.era, c.name)]) || unique[0];
    S.bingoFeatured = featuredCar.name;
  }
  // In grid mode the featured-bottom hero shows the image; in
  // carousel mode it's hidden via CSS, but we still keep S.bingoFeatured
  // in sync so toggling back lands on the same car.
  if (S.bingoView === 'grid') {
    renderBingoFeatured(featuredCar);
  } else {
    const fb = document.getElementById('featured-bottom');
    if (fb) fb.style.display = 'none';
  }
  // Delegated click — in grid mode tap = select-as-featured. In
  // carousel mode tap on the spot button fires spotCarouselCar; tap
  // on the card body is a no-op (each card is fully self-contained
  // and shows its own image + meta + spot affordance).
  list.onclick = (e) => {
    const spotBtn = e.target.closest('.bingo-card-spot[data-name]');
    if (spotBtn) {
      e.stopPropagation();
      const name = spotBtn.dataset.name;
      const car = unique.find(c => c.name === name);
      if (car) spotCarouselCar(car);
      return;
    }
    // Tap a carousel card's image → open it full screen.
    const imgZone = e.target.closest('.bingo-card-img[data-name]');
    if (imgZone) {
      const img = imgZone.querySelector('img');
      if (img && img.getAttribute('src')) openLightbox(img.src, imgZone.dataset.name);
      return;
    }
    // Tap a carousel card's body → open the full detail modal
    // (stats + every sighting, with delete).
    const cardBody = e.target.closest('.bingo-card-body');
    if (cardBody) {
      const card = cardBody.closest('.bingo-card[data-name]');
      if (card) openCarDetail(card.dataset.name);
      return;
    }
    if (S.bingoView === 'carousel') return;
    const cell = e.target.closest('.bingo-cell[data-name]');
    if (!cell) return;
    const car = unique.find(c => c.name === cell.dataset.name);
    if (!car) return;
    S.bingoFeatured = car.name;
    renderBingoFeatured(car);
    list.querySelectorAll('.is-featured').forEach(n => n.classList.remove('is-featured'));
    cell.classList.add('is-featured');
  };
  // Initial highlight only matters in grid mode (carousel cards are
  // all visually equal — no "selected" highlight).
  if (S.bingoView === 'grid') {
    const initEl = list.querySelector(`.bingo-cell[data-name="${escapeAttr(featuredCar.name)}"]`);
    if (initEl) initEl.classList.add('is-featured');
  }
  updateScore();
}

// Spot a car from the carousel view — sets the same state as
// spotFeaturedCar and triggers the photo flow. Each carousel card
// has its own spot button so the user can spot any car without
// returning to the featured-bottom hero (which is hidden in this
// view).
async function spotCarouselCar(car) {
  if (!car) return;
  S.bingoFeatured = car.name;
  S.modalKey = cellKey(car.era, car.name);
  S.modalCar = car;
  S.pendingSightingId = null;
  if (typeof addSighting === 'function') {
    try { await addSighting(); } catch (e) { console.warn('addSighting:', e); }
  }
}

// Populate the featured-bottom hero from a car object. Photo (real
// or wiki thumb) sits on the showroom-backdrop hero-image zone; name
// + meta + spot button sit in the hero-details zone below.
function renderBingoFeatured(car) {
  const fb = document.getElementById('featured-bottom');
  if (!fb || !car) return;
  fb.style.display = '';
  const key  = cellKey(car.era, car.name);
  const sp   = currentSpotted();
  const data = sp[key];
  const count = data ? data.sightings.length : 0;
  const spotted = count > 0;

  const photoEl = document.getElementById('featured-image');
  if (photoEl) {
    const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]);
    const wikiPic = imgCache[car.name];
    const src = sightingPhoto || wikiPic;
    if (src) {
      photoEl.innerHTML = `<img src="${escapeAttr(src)}" alt="${escapeAttr(car.name)}">`;
    } else {
      // No photo — show the country flag as a soft placeholder.
      photoEl.innerHTML = `<span class="ph">${car.flag || '🚗'}</span>`;
    }
  }
  const nameEl    = document.getElementById('featured-name');
  const rarityEl  = document.getElementById('featured-rarity-text');
  const metaEl    = document.getElementById('featured-meta');
  const spotBtn   = document.getElementById('featured-spot-btn');
  const spotLabel = document.getElementById('featured-spot-label');
  if (nameEl)   nameEl.textContent   = car.name || '';
  if (rarityEl) {
    const label = (typeof RARITY_LABELS !== 'undefined' && RARITY_LABELS[car.rarity]) || car.rarity || '';
    rarityEl.textContent = [label, car.country].filter(Boolean).join(' · ');
  }
  if (metaEl) {
    const parts = [car.years, car.make].filter(Boolean);
    metaEl.textContent = parts.join(' · ');
  }
  if (spotBtn) {
    spotBtn.classList.toggle('is-spotted', spotted);
    spotBtn.dataset.carName = car.name;
  }
  if (spotLabel) {
    spotLabel.textContent = spotted
      ? (count > 1 ? `Spotted ×${count}` : 'Spotted')
      : "I've spotted it";
  }
}

// Open the featured car's image in the lightbox (full-screen view).
// Uses the same openLightbox function the rest of the app uses for
// photo previews. Falls back silently if there's no image to show.
function openFeaturedImageFullscreen() {
  const name = S.bingoFeatured;
  if (!name) return;
  const cars = Array.isArray(S.board) ? S.board : [];
  const car = cars.find(c => c.name === name);
  if (!car) return;
  const key  = cellKey(car.era, car.name);
  const sp   = currentSpotted();
  const data = sp[key];
  const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]);
  const wikiPic = imgCache[car.name];
  const src = sightingPhoto || wikiPic;
  if (!src) return; // No image to expand — silently do nothing.
  if (typeof openLightbox === 'function') {
    openLightbox(src, car.name);
  }
}

// Spot the currently-featured car. Reuses the same path the modal
// uses, so sighting counts / photos / bingo toasts all still work.
async function spotFeaturedCar() {
  const name = S.bingoFeatured;
  if (!name) return;
  const cars = Array.isArray(S.board) ? S.board : [];
  const car = cars.find(c => c.name === name);
  if (!car) return;
  // Set the same state addSighting + handlePhoto read (S.modalKey,
  // S.modalCar) WITHOUT opening the detail modal. The user stays on
  // the bingo grid, the camera fires immediately, the photo saves,
  // and the cell flips to spotted — no big modal in the way.
  S.modalKey = cellKey(car.era, car.name);
  S.modalCar = car;
  S.pendingSightingId = null;
  if (typeof addSighting === 'function') {
    try { await addSighting(); } catch (e) { console.warn('addSighting:', e); }
  }
}

// Car detail facts (produced / surviving / value etc). Returned as
// the inner .car-fact items so callers can drop them into their own
// .car-facts container. Shared by the carousel card + the grid's
// featured-bottom hero so "car details" show in both views.
function _carFactsInner(car) {
  if (!car) return '';
  const facts = [
    ['Era',       car.era],
    ['Produced',  car.produced],
    ['Surviving', car.surviving],
    ['Value',     car.value],
  ].filter(([, v]) => v);
  if (!facts.length) return '';
  return facts.map(([k, v]) =>
    `<div class="car-fact"><span class="cf-k">${escapeHtml(k)}</span><span class="cf-v">${escapeHtml(String(v))}</span></div>`
  ).join('');
}

function bingoCarouselCardHTML(car, idx) {
  const key   = cellKey(car.era, car.name);
  const sp    = currentSpotted();
  const data  = sp[key];
  const count = data ? data.sightings.length : 0;
  const spotted = count > 0;
  const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]);
  const wikiPic = imgCache[car.name];
  const displaySrc = sightingPhoto || wikiPic;
  const imgHTML = displaySrc
    ? `<img src="${escapeAttr(displaySrc)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const stamp = spotted
    ? `<div class="bingo-stamp">✓ Spotted${count > 1 ? ` ·${count}` : ''}</div>`
    : '';
  const spotCls = spotted   ? ' spotted' : '';
  const flashCls = (S.justSpotted === key) ? ' just-spotted' : '';
  const spotLabel = spotted
    ? (count > 1 ? `Spotted ×${count}` : 'Spotted')
    : "I've spotted it";
  const facts = _carFactsInner(car);
  return `<div class="bingo-card ${car.rarity}${spotCls}${flashCls}" data-name="${escapeAttr(car.name)}" data-idx="${idx}">
    <div class="bingo-card-img" data-name="${escapeAttr(car.name)}">
      ${imgHTML}<div class="bingo-card-flag" style="${displaySrc?'display:none':''}">${car.flag}</div>
      <div class="bingo-card-era">${escapeHtml(car.era)}</div>
      ${stamp}
    </div>
    <div class="bingo-card-body">
      <div class="bingo-card-rarity rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]||''}</div>
      <div class="bingo-card-name">${escapeHtml(car.name)}</div>
      <div class="bingo-card-meta">${escapeHtml([car.years, car.country].filter(Boolean).join(' · '))}</div>
      ${facts ? `<div class="car-facts">${facts}</div>` : ''}
      <button type="button" class="bingo-card-spot${spotted?' is-spotted':''}" data-name="${escapeAttr(car.name)}">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${escapeHtml(spotLabel)}</span>
      </button>
    </div>
  </div>`;
}

function bingoCellHTML(car, idx) {
  // Text-only cell — name + rarity tag, with a brass tick badge
  // when spotted and a chamfered corner diagonal for the rarity.
  // The image lives in the featured-bottom hero zone now, so the
  // grid stays compact and 9–16 cards fit without scrolling.
  const key   = cellKey(car.era, car.name);
  const sp    = currentSpotted();
  const data  = sp[key];
  const count = data ? data.sightings.length : 0;
  const spotted = count > 0;
  const justSpotted = S.justSpotted === key;
  const stamp = spotted
    ? `<div class="bingo-stamp">${count > 1 ? '×' + count : '✓'}</div>`
    : '';
  const spotCls = spotted      ? ' spotted'      : '';
  const flashCls = justSpotted ? ' just-spotted' : '';
  const rarityLabel = (typeof RARITY_LABELS !== 'undefined' && RARITY_LABELS[car.rarity]) || car.rarity || '';
  return `<button class="bingo-cell ${car.rarity}${spotCls}${flashCls}" data-name="${escapeAttr(car.name)}" data-idx="${idx}" type="button">
    <div class="bingo-cell-name">${escapeHtml(car.name)}</div>
    <div class="bingo-cell-rarity"><span class="dot"></span>${escapeHtml(rarityLabel)}</div>
    ${stamp}
  </button>`;
}

function updateScore() {
  const cars = Array.isArray(S.board) ? S.board : [];
  const unique = [...new Map(cars.map(c => [c.name, c])).values()];
  const total = unique.length;
  const sp = currentSpotted();
  const spotted = unique.filter(c => sp[cellKey(c.era, c.name)]).length;
  const el = document.getElementById('score-txt');
  if (el) el.textContent = total ? `${spotted} of ${total} spotted` : '';
  // New bingo-meta line — event name + score in mono caps.
  const evMeta = document.getElementById('bingo-ev-meta');
  if (evMeta) evMeta.textContent = S.event || '';
  const scoreMeta = document.getElementById('bingo-score-meta');
  if (scoreMeta) scoreMeta.innerHTML = `<b>${spotted}</b>/<b>${total}</b> spotted`;
  // After spotting, the featured-bottom may need its label refreshed
  // (was the just-spotted car the featured one?). Cheap, idempotent.
  // Skip in carousel mode — the hero is hidden there and
  // renderBingoFeatured would un-hide it.
  if (S.bingoFeatured && S.bingoView !== 'carousel') {
    const car = unique.find(c => c.name === S.bingoFeatured);
    if (car) renderBingoFeatured(car);
  }
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
  document.getElementById('ev-make-row').innerHTML = pillSelect('ev-make-sel', evMakes.map(m=>({value:m,label:m})), EV_F.make, 'evSetMake', 'All Makes');
  const evCountries = ['All', ...new Set(CAR_DB.map(c=>c.country))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('ev-country-row').innerHTML = pillSelect('ev-country-sel', evCountries.map(c=>({value:c,label:c})), EV_F.country, 'evSetCountry', 'All Countries');
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
        <div class="nep-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 21V3M4 4h13l-3 4 3 4H4"/></svg></div>
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
    html = `<div class="ev-empty"><p>Both filters hidden.</p></div>`;
  } else if (!seenCars.length && !unseenCars.length) {
    html = `<div class="ev-empty"><p>No cars match this filter.</p></div>`;
  } else {
    if (EV_F.showSeen) {
      if (!seenCars.length && EV_F.showUnseen) { /* nothing */ }
      else if (!seenCars.length) {
        html += `<div class="ev-section-hdr">Spotted at this event (0)</div><div class="ev-empty"><p>Nothing spotted yet.<br>Tap <strong>Add Car</strong> or spot on the Bingo tab.</p><button class="ev-empty-btn" onclick="openPicker()">＋ Add a car</button></div>`;
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
    showSnack(`${car.name} spotted`);
    checkBingo();
    await attachWaitingPhoto(key);
    return;
  }

  // No waiting photo — open the camera while the user gesture is fresh
  // (iOS Safari rejects camInput.click() if it follows an `await`).
  S.modalKey = key;
  S.pendingSightingPromise = sightingPromise;
  document.getElementById('camInput').click();
  showSnack(`${car.name} spotted`);

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
  document.getElementById('g-make-row').innerHTML = pillSelect('g-make-sel', makes.map(m=>({value:m,label:m})), G_F.make, 'gSetMake', 'All Makes');
  const countries = ['All', ...new Set(CAR_DB.map(c=>c.country))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-country-row').innerHTML = pillSelect('g-country-sel', countries.map(c=>({value:c,label:c})), G_F.country, 'gSetCountry', 'All Countries');
  const evNames = ['All', ...Object.keys(S.spotted).filter(ev=>Object.keys(S.spotted[ev]||{}).length>0)].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-event-row').innerHTML = pillSelect('g-event-sel', evNames.map(e=>({value:e,label:e})), G_F.event, 'gSetEvent', 'All Events');
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
  // Quick link to the user's own vehicles (the My Cars tab).
  const myCarsLink = `<button class="garage-mycars-link" type="button" onclick="showMyCars()">
    <span class="gml-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25"/><circle cx="12" cy="12" r="2.6"/><line x1="12" y1="14.6" x2="12" y2="21.25"/><line x1="9.75" y1="10.7" x2="4" y2="7.4"/><line x1="14.25" y1="10.7" x2="20" y2="7.4"/></svg></span>
    <span class="gml-body"><span class="gml-title">My Cars</span><span class="gml-sub">Your own vehicles — photos &amp; history</span></span>
    <span class="gml-arrow">›</span>
  </button>`;
  let html = '';
  if (!G_F.showSeen && !G_F.showUnseen) {
    html=`<div class="garage-empty"><div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16" y2="16"/></svg></div><p>Both filters hidden.</p></div>`;
  } else {
    if(G_F.showSeen&&seenCars.length){html+=`<div class="garage-section-hdr">In your collection (${seenCars.length})</div>`;html+=seenCars.map(c=>garageCarHTML(c,carMap[c.name],true)).join('');}
    if(G_F.showUnseen&&unseenCars.length){html+=`<div class="garage-section-hdr" style="margin-top:12px">Still to find (${unseenCars.length})</div>`;html+=unseenCars.map(c=>garageCarHTML(c,null,false)).join('');}
    if(!html)html=`<div class="garage-empty"><div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="56" height="56" stroke="currentColor" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div><p>No cars spotted yet.<br>Get out there!</p></div>`;
  }
  body.innerHTML = myCarsLink + html;
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
// Open the full car-detail modal (stats, description, sightings list
// with delete + add-photo) for a car by name, looked up on the
// current board. The featured-bottom hero + carousel cards route
// here so the user can see and manage every sighting.
function openCarDetail(name) {
  if (!name) return;
  const cars = Array.isArray(S.board) ? S.board : [];
  const car = cars.find(c => c.name === name);
  if (!car) return;
  openModal(car, cellKey(car.era, car.name));
}

function openModal(car, key) {
  if (!car || !key) return;
  S.modalKey = key; S.modalCar = car;
  // Always start with a clean photo-target slot when opening a new
  // modal — leftover state from a prior sighting would route the next
  // photo to the wrong sg.id.
  S.pendingSightingId = null;
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
    hBtn.textContent = car.hagerty ? 'View Hagerty Valuation' : 'Search Hagerty Valuations';
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
    spotBtn.textContent = count === 0 ? 'I Spotted It' : 'Saw Another One';
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
      <button class="add-photo-btn" onclick="triggerPhoto('${sg.id}')">Add a Photo</button>
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
  if (typeof LocalPhotos !== 'undefined') LocalPhotos.removeAll(last.id);
  data.sightings.pop();
  if (!data.sightings.length) delete sp[S.modalKey];
  // (Storage cleanup is handled inside DB.sightings.remove.)
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Removed last sighting');
}

let _lastSpotTs = 0;
async function addSighting() {
  const key = S.modalKey;
  const car = S.modalCar;
  if (!key || !car) return;
  // Guard against a double-fire (double-tap, a delegated handler
  // running twice). A genuine second sighting always means re-opening
  // the camera, which takes seconds — so a sub-second repeat is
  // always accidental and would otherwise create a duplicate ×2.
  const now = Date.now();
  if (now - _lastSpotTs < 1200) return;
  _lastSpotTs = now;
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
  showSnack('Spotted · opening camera');

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
  if (typeof LocalPhotos !== 'undefined') LocalPhotos.removeAll(sg.id);
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
  if (!file || !S.modalKey) { showSnack('Sighting saved'); return; }

  showSnack('Saving photo…');
  try {
    // The camera was opened synchronously to preserve iOS gesture
    // context, so the sighting row may still be in flight. Wait for it.
    let row = null;
    if (!sgId && pendingPromise) {
      try {
        row = await pendingPromise;
        sgId = row?.id || null;
      } catch { /* swallowed; the sighting create surfaced its own error toast */ }
    }
    const sp   = currentSpotted();
    // Race-safe: addSighting and handlePhoto await the same promise; whichever
    // resumes first wins the microtask queue. If we got here before
    // addSighting populated sp[modalKey], do it ourselves so the photo
    // never gets dropped with "Sighting not found".
    if (row && S.modalKey) {
      if (!sp[S.modalKey]) {
        sp[S.modalKey] = { event: S.event, loc: S.loc, ts: row.spotted_at, sightings: [] };
      }
      if (!sp[S.modalKey].sightings.some(s => String(s.id) === String(row.id))) {
        sp[S.modalKey].sightings.push({
          id: row.id, event: S.event, loc: S.loc, ts: row.spotted_at, photos: [],
        });
      }
    }
    const data = sp[S.modalKey];
    if (!data) throw new Error('Sighting not found');
    let sg = sgId ? data.sightings.find(s => String(s.id) === String(sgId)) : null;
    if (!sg) sg = data.sightings[data.sightings.length-1];
    if (!sg) throw new Error('No sighting to attach photo to');
    // Photos are local-only — save the camera blob straight to IDB. No
    // downscale (which used to fail on iOS HEIC), no upload, no queue.
    const photo = await LocalPhotos.add(sg.id, file);
    if (!sg.photos) sg.photos = [];
    sg.photos.push(photo);
    save(); refreshModalSightings(); renderList(); renderEventList();
    showSnack('Photo saved');
  } catch (err) {
    showErr('Photo save failed', err);
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

  // Only the full-board win still fires a celebration. The "3 in
  // a row" toast was popping up over the camera flow during a
  // photo capture and breaking the user's focus — the user asked
  // for it gone. Line detection isn't run anymore for that reason.
  const fk = `${S.event || ''}`;
  if (allComplete && !S._fired.boardWin) {
    S._fired.boardWin = true;
    fireBingoToast('FULL BOARD<br><span style="font-size:0.45em;letter-spacing:0.15em">Every car spotted</span>', 'big');
    fireConfetti();
    return;
  }
}

// ══════════════════════════════════════════════
// CONFETTI — emoji-particle burst for milestones.
// Cheap and cheerful: a handful of DOM elements that float down with
// CSS animation and self-clean. No SVG canvas, no audio, no library.
// ══════════════════════════════════════════════
function fireConfetti({ count = 32 } = {}) {
  const root = document.body;
  if (!root) return;
  // Brass / ink particles instead of emoji. Cheap and on-brand.
  const palettes = ['#a67c52','#c79569','#7a5836','#1a1814'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.left              = (Math.random() * 100) + '%';
    const size = 4 + Math.random() * 6;
    p.style.width             = size + 'px';
    p.style.height            = size + 'px';
    p.style.background        = palettes[Math.floor(Math.random() * palettes.length)];
    p.style.borderRadius      = Math.random() < 0.5 ? '50%' : '1px';
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
    // Photos stay local (no upload), and the user wants no shrinking,
    // so just hold the camera blob directly. Skipping createImageBitmap
    // also avoids the iOS-Safari decode failure that was killing this
    // flow on phones.
    if (_pendingPhotoPreview) URL.revokeObjectURL(_pendingPhotoPreview);
    _pendingPhotoBlob    = file;
    _pendingPhotoPreview = URL.createObjectURL(file);
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

// "Save for later" — stashes the photo on-device only (no upload).
// The user can come back to the Sort Photos screen any time and
// assign each pending photo to a car.
async function camAttachToLater() {
  if (!_pendingPhotoBlob) { camAttachDiscard(); return; }
  document.getElementById('cam-attach-overlay').classList.remove('open');
  const blob = _pendingPhotoBlob;
  _clearPendingPhoto();
  showSnack('💾 Saving for later…');
  try {
    await PhotoBin.add({ blob, location: S.loc || null });
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

  showSnack('💾 Saving photo…');
  try {
    let photo;
    if (sortBinId) {
      // Sort-bin flow — the binned blob is already in PhotoCache; just
      // move the LocalPhotos entry from the bin owner to the sighting.
      const moved = PhotoBin.moveToOwner(sortBinId, sighting.id);
      if (!moved) throw new Error('Bin entry vanished');
      photo = {
        id:   moved.id,
        path: moved.path,
        ts:   moved.ts,
        url:  (typeof PhotoCache !== 'undefined') ? PhotoCache.getUrlSync(moved.path) : null,
      };
      refreshHomeShortcuts();
    } else {
      // Normal flow — straight-from-camera blob into LocalPhotos.
      photo = await LocalPhotos.add(sighting.id, blob);
    }
    sighting.photos.push(photo);
    save();
    renderList(); renderEventList(); renderGarage();
    if (typeof renderPhotoSort === 'function') renderPhotoSort();
    showSnack('📷 Photo attached!');
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
        const url = p.url
          || (typeof PhotoCache !== 'undefined' ? PhotoCache.getUrlSync(p.path) : null)
          || '';
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
  const item = PhotoBin.list().find(p => String(p.id) === String(id));
  if (!item) { showSnack('Photo not found'); return; }
  // The blob is already on-device in PhotoCache.
  let blob = null;
  if (typeof PhotoCache !== 'undefined') {
    blob = await PhotoCache.getBlob(item.path);
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
  // Track the bin id so attachWaitingPhoto can move the LocalPhotos
  // entry from the bin owner to the new sighting owner.
  _photoWaitingPath = item.path;
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
    body:         "Photos you haven't assigned to a car yet will be deleted from this device.",
    confirmLabel: 'Discard all',
    danger:       true,
  });
  if (!ok) return;
  await PhotoBin.clear();
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
    showSnack('Back online');
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
    const { sightings, profileById } = await _raceTimeout(_fetchEventSummary(S.eventId), 'Event summary', 10000);
    body.innerHTML = _renderJoinCode() + _renderEventSummary(sightings, profileById);
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

// The code that lets someone else into this show. Read from the cached
// event row rather than a fresh fetch — DB.events.list/get select '*',
// so join_code rides along once schema-patch-harden.sql has been run.
// Renders nothing at all if it's missing, so the summary still works
// on a database where the patch hasn't been applied yet.
function _renderJoinCode() {
  const row  = (PastEvents.list() || []).find(e => String(e.id) === String(S.eventId));
  const code = row && row.join_code;
  if (!code) return '';
  return `<div class="es-joincode">
    <div class="es-joincode-lbl">Invite someone to this show</div>
    <div class="es-joincode-val">${escapeHtml(code)}</div>
    <div class="es-joincode-sub">They tap the menu on the Bingo tab → Join a show with a code. Only people with this code can see what's spotted here.</div>
  </div>`;
}

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
// DATA BACKUP — full export / restore to a single file
// ══════════════════════════════════════════════
// One file holding every localStorage key (cars, sightings, shows,
// logs, settings) plus every on-device photo. The user saves it to
// Google Drive / Files; Restore rebuilds the app from it on any
// device. Supabase auth keys are deliberately left out.
function _isAuthKey(k) {
  return !!k && (k.startsWith('sb-') || k.toLowerCase().includes('supabase'));
}
function _blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload  = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}

// Self-contained dump of every cached photo blob, read straight from
// IndexedDB. Doesn't depend on photocache.js exposing a dump helper
// (a stale cached build of it was making the backup miss photos).
function _dumpPhotoBlobs() {
  return new Promise((resolve) => {
    let req;
    try { req = indexedDB.open('cardb-photo-cache'); }
    catch { resolve([]); return; }
    req.onerror = () => resolve([]);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames || !db.objectStoreNames.contains('photos')) {
        resolve([]); return;
      }
      let cur;
      try {
        cur = db.transaction('photos', 'readonly').objectStore('photos').openCursor();
      } catch { resolve([]); return; }
      const out = [];
      cur.onsuccess = () => {
        const c = cur.result;
        if (c) { out.push({ path: c.key, blob: c.value }); c.continue(); }
        else resolve(out);
      };
      cur.onerror = () => resolve(out);
    };
  });
}

async function exportBackup() {
  try {
    showSnack('Preparing backup…');
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !_isAuthKey(k)) ls[k] = localStorage.getItem(k);
    }
    // Photos are captured from every possible source — a photo can
    // be a local blob OR still hosted remotely on Supabase Storage.
    const photos = {};
    const seen = new Set();
    async function _grab(key, url) {
      if (!key || !url || seen.has(key)) return;
      seen.add(key);
      try {
        const r = await fetch(url);
        if (!r.ok) return;
        const blob = await r.blob();
        if (blob && blob.size) photos[key] = await _blobToDataURL(blob);
      } catch (e) { console.warn('backup grab:', key, e); }
    }
    // 1. Every local blob in the photo-cache IndexedDB store.
    for (const { path, blob } of await _dumpPhotoBlobs()) {
      if (path && blob && !seen.has(path)) {
        seen.add(path);
        try { photos[path] = await _blobToDataURL(blob); }
        catch (e) { console.warn('backup photo:', path, e); }
      }
    }
    // 2. Any LocalPhotos the IDB dump missed — via their live URL.
    try {
      const lp = JSON.parse(localStorage.getItem('cb-local-photos-v1') || '{}');
      for (const arr of Object.values(lp)) {
        for (const p of (arr || [])) {
          if (!p || !p.path || seen.has(p.path)) continue;
          const u = (typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync)
            ? PhotoCache.getUrlSync(p.path) : null;
          if (u) await _grab(p.path, u);
        }
      }
    } catch (e) { console.warn('backup: LocalPhotos sweep', e); }
    // 3. Legacy My Car photos still on Supabase Storage — fetch them
    //    now so they're preserved once the backend is gone.
    try {
      let cars = [];
      if (typeof _loadMyCars === 'function') {
        try { cars = await _loadMyCars(); } catch { cars = (window._myCars || []); }
      }
      for (const car of (cars || [])) {
        for (const p of ((car && car.my_car_photos) || [])) {
          const sp = p && p.storage_path;
          if (!sp || seen.has(sp)) continue;
          let u = (typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync(sp)) || null;
          if (!u && window.DB && DB.storage && typeof DB.storage.publicUrl === 'function') {
            try { u = DB.storage.publicUrl(sp); } catch {}
          }
          if (u) await _grab(sp, u);
        }
      }
    } catch (e) { console.warn('backup: legacy photo sweep', e); }
    const backup = {
      format:     'carbingo-backup',
      version:    1,
      exportedAt: new Date().toISOString(),
      localStorage: ls,
      photos,
    };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `car-bingo-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    const n = Object.keys(photos).length;
    showSnack(`Backup ready (${n} photo${n===1?'':'s'}) — save it to Google Drive`);
  } catch (err) {
    showErr('Backup failed', err);
  }
}

function triggerRestoreBackup() {
  document.getElementById('restoreInput')?.click();
}

async function handleRestoreFile(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let backup;
  try { backup = JSON.parse(await file.text()); }
  catch { showSnack('That file isn’t a valid backup'); return; }
  if (!backup || backup.format !== 'carbingo-backup' || !backup.localStorage) {
    showSnack('That isn’t a Car Bingo backup file');
    return;
  }
  const photoCount = backup.photos ? Object.keys(backup.photos).length : 0;
  const when = (backup.exportedAt || '').slice(0, 10);
  const ok = await confirmSheet({
    title:        'Restore this backup?',
    body:         `This replaces everything on this device with the backup${when ? ' from ' + when : ''} (${photoCount} photo${photoCount===1?'':'s'}). The app will reload.`,
    confirmLabel: 'Restore',
    danger:       true,
  });
  if (!ok) return;
  try {
    showSnack('Restoring…');
    // Replace localStorage but keep the current Supabase sign-in.
    const keep = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (_isAuthKey(k)) keep[k] = localStorage.getItem(k);
    }
    localStorage.clear();
    for (const [k, v] of Object.entries(keep)) localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(backup.localStorage)) localStorage.setItem(k, v);
    // Restore photos into the IndexedDB cache.
    if (backup.photos && typeof PhotoCache !== 'undefined') {
      for (const [path, dataUrl] of Object.entries(backup.photos)) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          await PhotoCache.save(path, blob);
        } catch (e) { console.warn('restore photo:', path, e); }
      }
    }
    showSnack('Restored — reloading');
    setTimeout(() => location.reload(), 900);
  } catch (err) {
    showErr('Restore failed', err);
  }
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
// Auth gates the app. bootAuth() (in auth.js) routes between the
// auth screen and the main app, and runs initSetup() after sign-in.
// Ask the browser to keep our storage (cars, sightings, photos)
// persistent — exempts it from eviction under storage pressure.
// Installed PWAs usually get this granted; harmless where unsupported.
async function _requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      if (!already) {
        const granted = await navigator.storage.persist();
        console.log('Persistent storage:', granted ? 'granted' : 'not granted');
      }
    }
  } catch (e) { console.warn('persist():', e); }
}

(async () => {
  _requestPersistentStorage();
  _setupConnectivity();
  _setupVisibilityRefresh();
  // Local photos are warmed asynchronously; re-render visible UI
  // when fresh blob URLs are ready so thumbnails fill in.
  window.addEventListener('localphotos:warmed', () => {
    try {
      if (S.tab === 'bingo')  renderList?.();
      if (S.tab === 'event')  renderEventList?.();
      if (S.tab === 'garage') renderGarage?.();
      if (S.tab === 'sort')   renderPhotoSort?.();
      refreshModalSightings?.();
    } catch {}
  });
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
  // Confirm — but never let a flaky confirm sheet block ending the
  // show. If confirmSheet throws (missing DOM, etc.) fall back to the
  // native prompt so the action always completes.
  let ok;
  try {
    ok = await confirmSheet({
      title:        `End "${S.event}"?`,
      body:         "Your sightings stay saved. You can come back to it from Previous Shows on Home.",
      confirmLabel: 'End show',
    });
  } catch (e) {
    console.warn('confirmSheet failed, using native confirm:', e);
    ok = window.confirm(`End "${S.event}"? Your sightings stay saved.`);
  }
  if (!ok) return;
  // Ending a show is a purely local operation — no network, so it can
  // never hang or time out. Wrapped in try/catch so a throw in any
  // render step can't leave the show half-ended.
  try {
    // Snapshot the show into the local Past Shows index BEFORE clearing
    // state, so it lands in the list even if it had no spotted cars.
    PastEvents.upsert({
      id:         S.eventId,
      name:       S.event,
      location:   S.loc || null,
      event_date: S.date || null,
    });
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
  } catch (err) {
    console.warn('endCurrentShow:', err);
    // State is already cleared above — make sure the user still lands
    // somewhere sensible even if a render step threw.
    try { switchTab('home'); } catch {}
  }
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
// Join someone else's show. Shows are private to their attendees, so
// the host shares the code from their Event Summary and this is how
// you get in — see join_event_by_code in schema-patch-harden.sql.
async function joinShowByCode() {
  closeEventMenu();
  let out;
  try {
    out = await openFormSheet({
      title:       'Join a show',
      submitLabel: 'Join',
      fields: [{
        id:          'code',
        label:       'Show code',
        required:    true,
        placeholder: 'e.g. 4F2A9C1B',
      }],
    });
  } catch (e) { console.warn('joinShowByCode sheet:', e); return; }
  if (!out || !out.code) return;
  try {
    const eventId = await DB.events.joinByCode(out.code);
    const ev      = await DB.events.get(eventId);
    PastEvents.upsert(ev);
    showSnack(`Joined ${ev.name}`);
    await resumeEvent(ev.name);
  } catch (err) {
    showErr("Couldn't join that show", err);
  }
}

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
    showSnack(`${car.name} added`);
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
  showSnack(`${car.name} added`);

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
        status.textContent = locStr;
        status.className   = 'loc-status ok';
      } catch(e) {
        // Fallback: just show coordinates
        input.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        status.textContent = 'Location set (no name found)';
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
