
// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════
const STORAGE_KEY = 'ccb-fil-v7'; // v7: per-event sightings
const ERAS = ['Pre-War','1950s','1960s','70s–80s','1990s'];
function allMakes()     { return [...new Set(CAR_DB.map(c=>c.make))].sort(); }
function allCountries() { return [...new Set(CAR_DB.map(c=>c.country))].sort(); }
const RARITY_LABELS = {common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary'};

// Photo entry shape:
//   Phase 4+: { path, url, ts } — Storage path + public URL
//   Legacy:   { dataUrl, ts }   — base64 in localStorage (no live data;
//             tolerated only so a half-rolled-out client doesn't NPE)
function photoUrl(p) { return p?.url || p?.dataUrl || null; }

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
// ══════════════════════════════════════════════
const IMG_CACHE_KEY = 'ccb-imgcache-v2';
const imgCache = {};

function loadImgCache() {
  try { const r = localStorage.getItem(IMG_CACHE_KEY); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function saveImgCache() {
  try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache)); } catch(e) {}
}
Object.assign(imgCache, loadImgCache());

// Hybrid image fetcher:
//   • If WIKI_PAGES value starts with 'http' → use it directly (Wikimedia Commons, etc.)
//   • Otherwise → treat as Wikipedia article slug and hit the REST summary API
//   • Falls back to auto-slugging the car name if no entry exists
//   • Results cached in localStorage so each device only fetches once
async function fetchWikiImg(carName) {
  if (imgCache[carName] !== undefined) return imgCache[carName];

  const mapped = WIKI_PAGES[carName] || carName.replace(/ /g, '_');

  // Direct URL — bypass API entirely
  if (mapped.startsWith('http')) {
    imgCache[carName] = mapped;
    saveImgCache();
    return mapped;
  }

  // Wikipedia REST summary — returns a guaranteed CDN thumbnail for ~95% of articles
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mapped)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    const src = data?.thumbnail?.source || null;
    imgCache[carName] = src;
    saveImgCache();
    return src;
  } catch(e) {
    imgCache[carName] = null;
    return null;
  }
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
  modalKey: null,
  modalCar: null,
  pendingSightingId: null,
  spotted: {},
};

function currentSpotted() {
  if (!S.event) return {};
  if (!S.spotted[S.event]) S.spotted[S.event] = {};
  return S.spotted[S.event];
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
  } catch(e) {}
}

function loadStore() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function loadEventData(name) {
  const store = loadStore();
  return (store.events && store.events[name]) || null;
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
// eventKey + userId fold into the seed so the same event yields a
// different bingo card per user (e.g. you and FIL at the same show).
function buildBoard(eventKey, userId, roll, eras, carCount) {
  eras     = eras     || S.boardEras     || ERAS;
  carCount = carCount || S.boardCarCount || 12;
  roll     = (roll !== undefined) ? roll : (S.rolls || 0);
  const baseSeed = strSeed(`${eventKey || 'default'}::${userId || 'anon'}::r${roll}`);
  function quotaFor(n) {
    const leg  = 1;
    const epic = Math.max(1, Math.round(n * 0.17));
    const rare = Math.max(1, Math.round(n * 0.42));
    const com  = Math.max(0, n - leg - epic - rare);
    return { legendary: leg, epic, rare, common: com };
  }
  const board = {};
  eras.forEach((era, ei) => {
    const seed  = baseSeed + ei * 7919;
    const quota = quotaFor(carCount);
    const byR   = { legendary:[], epic:[], rare:[], common:[] };
    CAR_DB.filter(c => c.era === era).forEach(c => { if (byR[c.rarity]) byR[c.rarity].push(c); });
    const picks = [];
    Object.entries(quota).forEach(([rarity, q]) => {
      const pool = seededShuffle(byR[rarity], seed + rarity.length * 31);
      for (let i = 0; i < q && i < pool.length; i++) picks.push(pool[i]);
    });
    const needed = carCount - picks.length;
    if (needed > 0) {
      const used = new Set(picks.map(c => c.name));
      const filler = seededShuffle(CAR_DB.filter(c => c.era === era && !used.has(c.name)), seed + 99991).slice(0, needed);
      picks.push(...filler);
    }
    board[era] = seededShuffle(picks, seed + 12345);
  });
  return board;
}

// DB.boards.cars stores car names only ({ era: [name, ...] }) to avoid
// duplicating the catalogue. Hydrate to full car objects on read,
// dehydrate on write.
function hydrateBoard(carsByEra) {
  const out = {};
  for (const era in (carsByEra || {})) {
    out[era] = (carsByEra[era] || [])
      .map(name => CAR_DB.find(c => c.name === name))
      .filter(Boolean);
  }
  return out;
}

function dehydrateBoard(boardObj) {
  const out = {};
  for (const era in (boardObj || {})) {
    out[era] = (boardObj[era] || []).map(c => c.name);
  }
  return out;
}

// ══════════════════════════════════════════════
// BOARD CONFIGURATOR
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
      console.error('rerollBoard:', err);
      showSnack('⚠️ Reroll save failed — try again');
      return;
    }
  }
  S.rolls = newRolls;
  S.board = newBoard;
  save();
  S.era = (S.boardEras||ERAS)[0];
  buildEraTabs(); renderList();
  showSnack(`🎲 New board! (${3 - S.rolls} reroll${3-S.rolls===1?'':'s'} remaining)`);
}

// ══════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════
async function initSetup() {
  document.getElementById('date-input').value = new Date().toISOString().slice(0,10);
  renderBoardConfig();
  const store = loadStore();
  // Also try legacy storage keys so old shows aren't lost on upgrade
  const LEGACY_KEYS = ['ccb-fil-v6','ccb-fil-v5','ccb-fil-v4'];
  LEGACY_KEYS.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return;
      const leg = JSON.parse(raw);
      if (leg.events) {
        store.events = store.events || {};
        Object.entries(leg.events).forEach(([name, data]) => {
          if (!store.events[name]) store.events[name] = data;
        });
      }
    } catch(e) {}
  });
  if (store.allSpotted) {
    S.spotted = store.allSpotted;
  } else if (store.events) {
    Object.entries(store.events).forEach(([evName, evData]) => {
      if (evData.spotted && Object.keys(evData.spotted).length > 0) {
        S.spotted[evName] = evData.spotted;
      }
    });
  }
  // Past events come from DB now (events I'm attending), not localStorage.
  await renderPastEvents();
}

async function renderPastEvents() {
  const pastEl = document.getElementById('past-events');
  const listEl = document.getElementById('past-list');
  if (!pastEl || !listEl) return;
  let events = [];
  try {
    const all = await _eventsList();
    const me = currentUserId();
    events = (all || []).filter(e =>
      Array.isArray(e.event_attendees) &&
      e.event_attendees.some(a => a.user_id === me)
    );
  } catch (err) {
    console.warn('renderPastEvents:', err);
    pastEl.style.display = 'none';
    return;
  }
  if (!events.length) { pastEl.style.display = 'none'; return; }
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

// Loads the user's board for an event from DB; if none exists, generates
// it deterministically and persists. Returns nothing — sets S.* directly.
async function _loadOrCreateBoard(eventRow) {
  const userId = currentUserId();
  let row = await DB.boards.getMine(eventRow.id);
  if (row) {
    S.board         = hydrateBoard(row.cars);
    S.boardEras     = row.eras;
    S.boardCarCount = row.car_count;
    S.rolls         = row.rolls;
    return;
  }
  S.boardEras     = S.boardEras     || [...ERAS];
  S.boardCarCount = S.boardCarCount || 12;
  S.rolls         = 0;
  S.board = buildBoard(eventRow.id, userId, 0, S.boardEras, S.boardCarCount);
  await DB.boards.upsert(eventRow.id, {
    cars:      dehydrateBoard(S.board),
    eras:      S.boardEras,
    car_count: S.boardCarCount,
    rolls:     0,
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
    S.era = (S.boardEras || ERAS)[0];
    save();
    launch();
  } catch (err) {
    console.error('resumeEvent:', err);
    showSnack('⚠️ Could not load event — check connection');
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
    S.era = (S.boardEras || ERAS)[0];
    save();
    _invalidateEventsCache();
    launch();
  } catch (err) {
    console.error('startEvent:', err);
    showSnack('⚠️ Could not start show — check connection');
  }
}

function launch() {
  // Activate main app shell (auth-gated; bootAuth handles the auth screen)
  document.getElementById('s-auth')?.classList.remove('active');
  document.getElementById('s-app')?.classList.add('active');
  updateHomeCard();
  // Update headers
  const bingoSub = document.getElementById('bingo-ev-sub');
  if (bingoSub) bingoSub.textContent = S.event || '';
  switchTab('bingo');
  const currentEraCars = S.board && S.board[S.era] ? S.board[S.era] : [];
  preloadEraImages(currentEraCars);
  const otherEras = (S.boardEras || ERAS).filter(e => e !== S.era);

}

// ══════════════════════════════════════════════
// TAB NAV
// ══════════════════════════════════════════════
function switchTab(tab) {
  S.tab = tab;
  const tabs = ['home','bingo','event','garage','settings'];
  tabs.forEach(t => {
    const el = document.getElementById('s-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  buildNav(tab);
  if (tab === 'bingo')    { updateBingoState(); }
  if (tab === 'event')    { buildEvFilters(); renderEventList(); }
  if (tab === 'garage')   { buildGarageFilters(); renderGarage(); }
  if (tab === 'home')     { updateHomeCard(); renderPastEvents(); }
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

  ['home','bingo','event','garage','settings'].forEach(id => {
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
  const activeDiv  = document.getElementById('home-active-show');
  const newLbl     = document.getElementById('home-new-lbl');
  if (!activeDiv) return;
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
    if (newLbl) newLbl.textContent = 'Start a Different Show';
  } else {
    activeDiv.style.display = 'none';
    if (newLbl) newLbl.textContent = 'Start a New Show';
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
  const ev = S.event + (S.loc ? ' · '+S.loc : '') + (S.date ? ' · '+S.date : '');
  document.getElementById('bingo-ev-sub').textContent = ev;
  const rb = document.getElementById('reroll-btn');
  if (rb) {
    const left = 3 - (S.rolls || 0);
    rb.textContent = left > 0 ? `🎲 ${left}` : '🎲✕';
    rb.title = left > 0 ? `Reroll board (${left} left)` : 'No rerolls remaining';
    rb.classList.toggle('exhausted', left <= 0);
  }
  const activeEras = S.boardEras || ERAS;
  const sp = currentSpotted();
  document.getElementById('era-scroller').innerHTML = activeEras.map(era => {
    const cars   = S.board ? (S.board[era]||[]) : [];
    const unique = [...new Map(cars.map(c=>[c.name,c])).values()];
    const spotted = unique.filter(c => sp[cellKey(era,c.name)]).length;
    return `<div class="era-tab${era===S.era?' active':''}" onclick="pickEra('${era}')">${era}<span class="era-count">${spotted}/${unique.length}</span></div>`;
  }).join('');
}

function pickEra(era) {
  S.era = era; buildEraTabs(); renderList();
  const cars = S.board ? (S.board[era]||[]) : [];
  preloadEraImages(cars);
}

function renderList() {
  const list  = document.getElementById('car-list');
  const cars  = S.board ? (S.board[S.era]||[]) : [];
  const unique = [...new Map(cars.map(c=>[c.name,c])).values()];
  const sp = currentSpotted();
  const unspotted = unique.filter(c => !sp[cellKey(S.era, c.name)]);
  const spotted   = unique.filter(c =>  sp[cellKey(S.era, c.name)]);
  let html = '';
  if (unspotted.length) {
    html += `<div class="list-section-hdr">Still Looking For (${unspotted.length})</div>`;
    html += unspotted.map(c => bingoCardHTML(c, S.era)).join('');
  }
  if (spotted.length) {
    html += `<div class="list-section-hdr">Spotted ✓ (${spotted.length})</div>`;
    html += spotted.map(c => bingoCardHTML(c, S.era)).join('');
  }
  list.innerHTML = html;
  list.querySelectorAll('.car-card[data-name]').forEach(el => {
    const car = unique.find(c => c.name === el.dataset.name);
    if (car) el.addEventListener('click', () => openModal(car, cellKey(S.era, car.name)));
  });
  updateScore();
}

function bingoCardHTML(car, era) {
  const key  = cellKey(era, car.name);
  const sp   = currentSpotted();
  const data = sp[key];
  const count = data ? data.sightings.length : 0;
  const imgSrc = imgCache[car.name];
  const sightingPhoto = photoUrl(data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]);
  const displaySrc = sightingPhoto || imgSrc;
  const imgHTML = displaySrc ? `<img src="${displaySrc}" alt="${car.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
  return `<div class="car-card ${car.rarity}${count>0?' spotted':''}" data-name="${car.name.replace(/"/g,'&quot;')}">
    <div class="car-img-wrap">${imgHTML}<div class="car-placeholder" style="${displaySrc?'display:none':''}">${car.flag}</div><div class="img-count">${count>0?'×'+count:''}</div></div>
    <div class="car-info"><div><div class="car-name">${car.name}</div><div class="car-years">${car.years} · ${car.country}</div><div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div></div></div>
    <div class="car-arrow">${count>0?'✓':'›'}</div>
  </div>`;
}

function updateScore() {
  const sp = currentSpotted();
  const total = Object.keys(sp).length;
  const sightings = Object.values(sp).reduce((a,v) => a + (v.sightings?.length||0), 0);
  document.getElementById('score-txt').textContent = `${total} cars · ${sightings} sightings`;
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

function boardCarNames() {
  if (!S.board) return new Set();
  const names = new Set();
  ERAS.forEach(era => (S.board[era]||[]).forEach(c => names.add(c.name)));
  return names;
}

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
  list.querySelectorAll('.ev-seen-card').forEach(el => {
    el.addEventListener('click', () => {
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car && el.dataset.key) openModal(car, el.dataset.key);
    });
  });
  list.querySelectorAll('.ev-unseen-card').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.ev-unseen-add')) return;
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car) openModal(car, `fil-${car.era}-${car.name}`);
    });
  });
  list.querySelectorAll('.ev-unseen-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const car = CAR_DB.find(c => c.name === btn.dataset.name);
      if (car) quickAddSighting(car);
    });
  });
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
  const key = `fil-${car.era}-${car.name}`;
  const ts  = new Date().toLocaleString('en-GB');
  const id  = Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const sp  = currentSpotted();
  if (!sp[key]) sp[key] = { event:S.event, loc:S.loc, ts, sightings:[] };
  sp[key].sightings.push({ id, event:S.event, loc:S.loc, ts, photos:[] });
  save(); renderEventList(); renderList(); buildEraTabs(); updateScore();
  showSnack(`🎯 ${car.name} spotted!`);
  // Photo-first flow: a Blob is already waiting from the camera FAB.
  // Attach it directly instead of re-prompting for the camera.
  if (_photoWaiting) {
    closePicker();
    await attachWaitingPhoto(key);
    return;
  }
  S.modalKey = key; S.pendingSightingId = id;
  document.getElementById('camInput').click();
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
  document.getElementById('picker-list').querySelectorAll('.picker-add-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); const car=CAR_DB.find(c=>c.name===btn.dataset.name); if(car){quickAddSighting(car);renderPicker();} });
  });
  document.getElementById('picker-list').querySelectorAll('.picker-row:not(.added)').forEach(el => {
    el.addEventListener('click', e => { if(e.target.closest('.picker-add-btn'))return; const car=CAR_DB.find(c=>c.name===el.dataset.name); if(car){closePicker();openModal(car,`fil-${car.era}-${car.name}`);} });
  });
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
  body.querySelectorAll('.gcar[data-key]').forEach(el=>{el.addEventListener('click',()=>{const car=CAR_DB.find(c=>c.name===el.dataset.name);if(car)openModal(car,el.dataset.key);});});
  body.querySelectorAll('.gcar[data-name]:not([data-key])').forEach(el=>{el.addEventListener('click',()=>{const car=CAR_DB.find(c=>c.name===el.dataset.name);if(car)openModal(car,`fil-${car.era}-${car.name}`);});});
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
  const evList = [...new Set(entry.seenAt.map(s=>s.event))].join(', ');
  const total  = entry.totalSightings;
  return `<div class="gcar seen ${car.rarity}" data-name="${safeName}" data-key="${key}">
    <div class="gcar-thumb">${imgSrc?`<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="gcar-ph" style="${imgSrc?'display:none':''}">${car.flag}</div><div class="gcar-badge">×${total}</div></div>
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
  const key  = S.modalKey;
  const sp   = currentSpotted();
  const data = sp[key];
  const count = data ? data.sightings.length : 0;
  document.getElementById('cnt-number').textContent = count;
  document.getElementById('cnt-minus').disabled     = count === 0;
  document.getElementById('spot-btn').textContent   = count === 0 ? '✓  I Spotted It!' : '+  I Saw Another One!';
  const wrap = document.getElementById('sightings-wrap');
  const list = document.getElementById('sightings-list');
  if (!count) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = data.sightings.map((sg, i) => {
    const photosHTML = (sg.photos||[]).map(p => {
      const src = photoUrl(p);
      if (!src) return '';
      const safeSrc = src.replace(/'/g,"\\'");
      const safeTs  = (sg.ts||'').replace(/'/g,"\\'");
      const safeEv  = (sg.event||'').replace(/'/g,"\\'");
      return `<img class="s-thumb" src="${src}" onclick="openLightbox('${safeSrc}','${safeEv} · ${safeTs}')">`;
    }).join('');
    return `<div class="sighting-entry">
      <div class="sighting-top"><div class="sighting-meta"><div class="sighting-num">Sighting #${i+1}</div><div class="sighting-time">${sg.ts}</div><div class="sighting-ev">${sg.event}${sg.loc?' · '+sg.loc:''}</div></div><button class="sighting-del" onclick="deleteSighting('${sg.id}')">✕</button></div>
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
function changeCount(delta) {
  if (delta > 0) { addSighting(); return; }
  const sp   = currentSpotted();
  const data = sp[S.modalKey];
  if (!data?.sightings.length) return;
  data.sightings.pop();
  if (!data.sightings.length) delete sp[S.modalKey];
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Removed last sighting');
}
function addSighting() {
  const key = S.modalKey;
  const ts  = new Date().toLocaleString('en-GB');
  const id  = Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  const sp  = currentSpotted();
  if (!sp[key]) sp[key] = { event:S.event, loc:S.loc, ts, sightings:[] };
  sp[key].sightings.push({ id, event:S.event, loc:S.loc, ts, photos:[] });
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('🎯 Spotted! Opening camera…');
  S.pendingSightingId = id;
  document.getElementById('camInput').click();
}
function deleteSighting(sgId) {
  const sp   = currentSpotted();
  const data = sp[S.modalKey];
  if (!data) return;
  data.sightings = data.sightings.filter(sg => sg.id !== sgId);
  if (!data.sightings.length) delete sp[S.modalKey];
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Sighting removed');
}
function triggerPhoto(sgId) { S.pendingSightingId = sgId; document.getElementById('camInput').click(); }

async function handlePhoto(e) {
  const file = e.target.files[0];
  const sgId = S.pendingSightingId;
  S.pendingSightingId = null; e.target.value = '';
  if (!file || !S.modalKey) { showSnack('✓ Sighting saved'); return; }
  showSnack('📤 Saving photo…');
  try {
    const { path, url } = await Photos.captureAndUpload(file, { kind: 'sightings' });
    const sp   = currentSpotted();
    const data = sp[S.modalKey];
    if (!data) return;
    let sg = sgId ? data.sightings.find(s=>s.id===sgId) : null;
    if (!sg) sg = data.sightings[data.sightings.length-1];
    if (!sg) return;
    if (!sg.photos) sg.photos = [];
    sg.photos.push({ path, url, ts: new Date().toLocaleString('en-GB') });
    save(); refreshModalSightings(); renderList(); renderEventList();
    showSnack('📷 Photo saved!');
  } catch (err) {
    console.error('handlePhoto:', err);
    showSnack('⚠️ Photo upload failed — check connection and try again');
  } finally {
    // Restore event context if we were doing a personal collection add
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
let bingoShown = false;
function checkBingo() {
  const eraBoard = S.board ? (S.board[S.era]||[]) : [];
  const unique = [...new Map(eraBoard.map(c=>[c.name,c])).values()];
  const sp = currentSpotted();
  const spotted = unique.filter(c => sp[cellKey(S.era, c.name)]).length;
  if (spotted >= 5 && !bingoShown) {
    bingoShown = true;
    const t = document.getElementById('bingo-toast');
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); bingoShown = false; }, 4000);
  }
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

// Called after user selects a car in picker/garage-add when _photoWaiting is set.
async function attachWaitingPhoto(key) {
  if (!_photoWaiting) return;
  const blob   = _photoWaiting;
  const target = _photoTarget;
  _photoWaiting = null;
  _photoTarget  = null;

  const sp = target === 'collection'
    ? (S.spotted[PERSONAL_EVENT] = S.spotted[PERSONAL_EVENT] || {})
    : currentSpotted();
  if (!sp[key]) {
    const ts = new Date().toLocaleString('en-GB');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,5);
    sp[key] = {
      event: target==='collection'?PERSONAL_EVENT:S.event,
      loc:   S.loc,
      ts,
      sightings: [{ id, event: S.event||PERSONAL_EVENT, loc: S.loc, ts, photos: [] }],
    };
  }
  const sighting = sp[key].sightings[sp[key].sightings.length - 1];
  if (!sighting.photos) sighting.photos = [];

  showSnack('📤 Saving photo…');
  try {
    const { path, url } = await DB.storage.uploadPhoto(blob, { kind: 'sightings' });
    sighting.photos.push({ path, url, ts: new Date().toLocaleString('en-GB') });
    save();
    renderList(); renderEventList(); renderGarage();
    showSnack('📷 Photo attached!');
  } catch (err) {
    console.error('attachWaitingPhoto:', err);
    showSnack('⚠️ Photo upload failed — try again');
  }
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
// Auth gates the app. bootAuth() (in auth.js) routes between the
// auth screen and the main app, and runs initSetup() after sign-in.
(async () => { await bootAuth(); })();

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
function goToNewEvent() { closeEventMenu(); switchTab('home'); }
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

  document.getElementById('garage-add-list').querySelectorAll('.picker-add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const car = CAR_DB.find(c => c.name === btn.dataset.name);
      if (car) addCarToPersonalCollection(car);
    });
  });
  // Tap row opens modal for cars already in collection
  document.getElementById('garage-add-list').querySelectorAll('.picker-row.added').forEach(el => {
    el.addEventListener('click', () => {
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car) { closeGarageAdd(); openModal(car, `fil-${car.era}-${car.name}`); }
    });
  });
}

async function addCarToPersonalCollection(car) {
  const key = `fil-${car.era}-${car.name}`;
  const loc = document.getElementById('garage-add-loc').value.trim();
  const ts  = new Date().toLocaleString('en-GB');
  const id  = Date.now().toString(36) + Math.random().toString(36).slice(2,5);

  if (!S.spotted[PERSONAL_EVENT]) S.spotted[PERSONAL_EVENT] = {};
  const sp = S.spotted[PERSONAL_EVENT];
  if (!sp[key]) sp[key] = { event:PERSONAL_EVENT, loc, ts, sightings:[] };
  sp[key].sightings.push({ id, event:PERSONAL_EVENT, loc, ts, photos:[] });
  save();
  renderGarageAddPicker();
  renderGarage();
  showSnack(`🚗 ${car.name} added to collection!`);
  // Photo-first flow: attach the waiting photo and skip the camera prompt.
  if (_photoWaiting) {
    closeGarageAdd();
    await attachWaitingPhoto(key);
    return;
  }
  // Temporarily switch context to PERSONAL_EVENT so handlePhoto saves correctly
  S.modalKey = key;
  S.pendingSightingId = id;
  S._prevEvent = S.event;
  S.event = PERSONAL_EVENT;
  document.getElementById('camInput').click();
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

function confirmClearData() {
  const confirmed = confirm('This will delete ALL events, sightings and photos. This cannot be undone.\n\nAre you sure?');
  if (!confirmed) return;
  const confirmed2 = confirm('Last chance — really delete everything?');
  if (!confirmed2) return;
  localStorage.clear();
  S.spotted = {};
  S.event = '';
  S.board = null;
  showSnack('🗑️ All data cleared');
  switchTab('home');
}
