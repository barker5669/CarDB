// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════
const BOARD_SEED  = 20250601;
const STORAGE_KEY = 'ccb-fil-v5';
const ERAS = ['Pre-War','1950s','1960s','70s–80s','1990s'];
// Derived at runtime from CAR_DB so they stay in sync automatically
function allMakes()     { return [...new Set(CAR_DB.map(c=>c.make))].sort(); }
function allCountries() { return [...new Set(CAR_DB.map(c=>c.country))].sort(); }
const RARITY_LABELS = {common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary'};


// Image cache: carName → url (loaded async from Wikipedia API)
const imgCache = {};

async function fetchWikiImg(carName) {
  if (imgCache[carName] !== undefined) return imgCache[carName];
  const page = WIKI_PAGES[carName];
  if (!page) { imgCache[carName] = null; return null; }
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
    const r = await fetch(url);
    const data = await r.json();
    const pages = data?.query?.pages;
    const p = pages && Object.values(pages)[0];
    const src = p?.thumbnail?.source || null;
    imgCache[carName] = src;
    return src;
  } catch(e) { imgCache[carName] = null; return null; }
}

// Preload images for current era cards
async function preloadEraImages(cars) {
  const unique = [...new Set(cars.map(c => c.name))];
  await Promise.all(unique.map(name => fetchWikiImg(name)));
  renderList();       // re-render once images are ready
  renderEventList();
}

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let S = {
  event:'', loc:'', date:'',
  board: null,
  tab: 'bingo',
  era: 'Pre-War',
  eventEra: 'All',
  spotted: {},
  modalKey: null,
  modalCar: null,
  pendingSightingId: null,
};

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      event:S.event, loc:S.loc, date:S.date,
      board:S.board, spotted:S.spotted,
    }));
  } catch(e) {}
  // Async push to Supabase (fire-and-forget, errors don't block UI)
  syncToSupabase().catch(e => console.warn('Supabase sync:', e));
}

function loadSaved() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch(e) { return null; }
}

async function syncToSupabase() {
  if (!sbReady() || !S.event) return;
  // Upsert event
  await sbUpsertEvent({ name: S.event, location: S.loc || '', date: S.date || '' });
  // Sync all spotted cars for this event
  const toSync = Object.entries(S.spotted).filter(([k, v]) => v.event === S.event);
  for (const [key, data] of toSync) {
    const parts = key.split('-').slice(1); // ['Era','CarName...']
    const era = parts[0];
    const carName = parts.slice(1).join('-');
    const car = CAR_DB.find(c => c.name === carName);
    if (!car) continue;
    await sbAddSighting({
      event_name: S.event,
      car_name:   carName,
      car_era:    era,
      car_make:   car.make,
      car_rarity: car.rarity,
      count:      data.sightings.length,
      spotted_at: data.ts,
    });
  }
}

async function loadFromSupabase(eventName) {
  if (!sbReady()) return null;
  const sightings = await sbGetSightings(eventName);
  if (!sightings.length) return null;
  return sightingsToSpotted(sightings);
}

async function loadAllEventsFromSupabase() {
  if (!sbReady()) return [];
  const events = await sbGetEvents();
  return events.map(e => e.name);
}

async function loadGarageFromSupabase() {
  if (!sbReady()) return null;
  const all = await sbGetAllSightings();
  if (!all.length) return null;
  return sightingsToSpotted(all);
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
function buildBoard() {
  // Rarity weights: how many of each per era board (total = 12)
  const QUOTA = { legendary: 1, epic: 2, rare: 5, common: 4 };
  const board = {};
  ERAS.forEach((era, ei) => {
    const seed = BOARD_SEED + ei * 7919;
    const byRarity = { legendary: [], epic: [], rare: [], common: [] };
    CAR_DB.filter(c => c.era === era).forEach(c => {
      if (byRarity[c.rarity]) byRarity[c.rarity].push(c);
    });
    const picks = [];
    Object.entries(QUOTA).forEach(([rarity, quota]) => {
      const pool = seededShuffle(byRarity[rarity], seed + rarity.length * 31);
      // Take up to quota; if not enough, take all available
      for (let i = 0; i < quota && i < pool.length; i++) picks.push(pool[i]);
    });
    // If a rarity bucket had fewer than quota, fill remaining from rare/common
    const needed = 12 - picks.length;
    if (needed > 0) {
      const usedNames = new Set(picks.map(c => c.name));
      const filler = seededShuffle(
        CAR_DB.filter(c => c.era === era && !usedNames.has(c.name)),
        seed + 99991
      ).slice(0, needed);
      picks.push(...filler);
    }
    board[era] = seededShuffle(picks, seed + 12345); // shuffle final order
  });
  return board;
}

// ══════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════
async function initSetup() {
  document.getElementById('date-input').value = new Date().toISOString().slice(0,10);
  const saved = loadSaved();

  if (saved && saved.event) {
    document.getElementById('ev-input').value  = saved.event;
    document.getElementById('loc-input').value = saved.loc || '';
  }
  if (saved && saved.date) document.getElementById('date-input').value = saved.date;

  const localEvents = saved ? [...new Set([
    saved.event,
    ...Object.values(saved.spotted || {}).map(s => s.event),
  ])].filter(Boolean) : [];

  let allEvents = [...localEvents];
  if (sbReady()) {
    try {
      const sbEvents = await loadAllEventsFromSupabase();
      sbEvents.forEach(e => { if (!allEvents.includes(e)) allEvents.push(e); });
    } catch(e) { console.warn('initSetup Supabase:', e); }
  }

  if (allEvents.length) {
    document.getElementById('past-events').style.display = 'block';
    document.getElementById('past-list').innerHTML = allEvents
      .map(e => `<button class="past-btn" onclick="resumeEvent('${e.replace(/'/g,"\\'")}')">Continue: ${e}</button>`)
      .join('');
  }
}
function resumeEvent(name) {
  const saved = loadSaved();
  if (saved) {
    S.board   = saved.board || buildBoard();
    S.spotted = saved.spotted || {};
    S.event   = name;
    S.loc     = saved.loc || '';
    S.date    = saved.date || '';
  }
  launch();
}

function startEvent() {
  const ev   = document.getElementById('ev-input').value.trim();
  const loc  = document.getElementById('loc-input').value.trim();
  const date = document.getElementById('date-input').value;
  if (!ev) { document.getElementById('ev-input').focus(); return; }
  const saved = loadSaved();
  S.board   = (saved && saved.board)   ? saved.board   : buildBoard();
  S.spotted = (saved && saved.spotted) ? saved.spotted : {};
  S.event = ev; S.loc = loc;
  S.date  = date ? new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  save();
  launch();
}

function launch() {
  document.getElementById('s-setup').classList.remove('active');
  switchTab('bingo');
  // Preload all eras in background (current era first)
  if (S.board) {
    preloadEraImages(S.board[S.era] || []).then(() => {
      // Then preload remaining eras
      ERAS.filter(e => e !== S.era).forEach(era => {
        preloadEraImages(S.board[era] || []);
      });
    });
  }
}

// ══════════════════════════════════════════════
// TAB NAVIGATION
// ══════════════════════════════════════════════
function switchTab(tab) {
  S.tab = tab;
  ['bingo','event','garage'].forEach(t => {
    document.getElementById('s-'+t).classList.toggle('active', t === tab);
    ['','2','3'].forEach(n => {
      const btn = document.getElementById('nav'+n+'-'+t);
      if (btn) btn.classList.toggle('active', t === tab);
    });
  });
  if (tab === 'bingo')  { buildEraTabs(); renderList(); }
  if (tab === 'event')  { buildEvFilters(); renderEventList(); }
  if (tab === 'garage') renderGarage();
}

// ══════════════════════════════════════════════
// BINGO TAB
// ══════════════════════════════════════════════
function cellKey(era, name) { return `fil-${era}-${name}`; }

function buildEraTabs() {
  const ev = S.event + (S.loc ? ' · '+S.loc : '') + (S.date ? ' · '+S.date : '');
  document.getElementById('bingo-ev-sub').textContent = ev;
  document.getElementById('era-scroller').innerHTML = ERAS.map(era => {
    const cars    = S.board[era] || [];
    const unique  = [...new Map(cars.map(c=>[c.name,c])).values()];
    const spotted = unique.filter(c => S.spotted[cellKey(era,c.name)]).length;
    return `<div class="era-tab${era===S.era?' active':''}" onclick="pickEra('${era}')">
      ${era}<span class="era-count">${spotted}/${unique.length}</span>
    </div>`;
  }).join('');
}

function pickEra(era) {
  S.era = era;
  buildEraTabs();
  renderList();
  const cars = S.board[era] || [];
  preloadEraImages(cars);
}

function renderList() {
  const list  = document.getElementById('car-list');
  const cars  = S.board[S.era] || [];
  const unique = [...new Map(cars.map(c=>[c.name,c])).values()];

  const unspotted = unique.filter(c => !S.spotted[cellKey(S.era, c.name)]);
  const spotted   = unique.filter(c =>  S.spotted[cellKey(S.era, c.name)]);

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
  const key   = cellKey(era, car.name);
  const data  = S.spotted[key];
  const count = data ? data.sightings.length : 0;
  const imgSrc = imgCache[car.name];

  // Fix 2: if they have a sighting photo, use that as card image
  const sightingPhoto = data?.sightings?.find(sg => sg.photos?.length > 0)?.photos[0]?.dataUrl;
  const displaySrc    = sightingPhoto || imgSrc;

  const imgHTML = displaySrc
    ? `<img src="${displaySrc}" alt="${car.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const phStyle = displaySrc ? 'display:none' : '';

  return `<div class="car-card ${car.rarity}${count>0?' spotted':''}" data-name="${car.name.replace(/"/g,'&quot;')}">
    <div class="car-img-wrap">
      ${imgHTML}
      <div class="car-placeholder" style="${phStyle}">${car.flag}</div>
      <div class="img-count">${count>0?'×'+count:''}</div>
    </div>
    <div class="car-info">
      <div>
        <div class="car-name">${car.name}</div>
        <div class="car-years">${car.years} · ${car.country}</div>
        <div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div>
      </div>
    </div>
    <div class="car-arrow">${count>0?'✓':'›'}</div>
  </div>`;
}

function updateScore() {
  const total    = Object.keys(S.spotted).filter(k=>k.startsWith('fil-')).length;
  const sightings = Object.values(S.spotted).reduce((a,v)=>a+(v.sightings?.length||0),0);
  document.getElementById('score-txt').textContent = `${total} cars · ${sightings} sightings`;
}

// ══════════════════════════════════════════════
// EVENT TAB  — shows cars spotted at THIS event
// ══════════════════════════════════════════════

// Filter state for event tab
const EV_F = { era:'All', rarity:'All', make:'All', country:'All', showSeen:true, showUnseen:true };
// Filter state for garage tab
const G_F  = { era:'All', rarity:'All', make:'All', country:'All', event:'All', showSeen:true, showUnseen:true };
// Picker state
let pickerEra = 'All';

// All cars that appear on the bingo board for this session
function boardCarNames() {
  if (!S.board) return new Set();
  const names = new Set();
  ERAS.forEach(era => (S.board[era]||[]).forEach(c => names.add(c.name)));
  return names;
}

// Cars spotted at the current event (keyed by car name, value = key)
function eventSpottedMap() {
  const map = {};
  Object.entries(S.spotted).forEach(([key, data]) => {
    if (data.event === S.event) {
      for (const era of ERAS) {
        if (key.startsWith(`fil-${era}-`)) {
          const name = key.slice(`fil-${era}-`.length);
          map[name] = key;
          break;
        }
      }
    }
  });
  return map;
}

// Build filter chips for event tab
function buildEvFilters() {
  const rarities = [['All','All'],['common','Common'],['rare','Rare'],['epic','Epic'],['legendary','Legendary']];

  // Era chips
  document.getElementById('ev-era-row').innerHTML =
    ['All',...ERAS].map(e =>
      `<button class="fchip${EV_F.era===e?' active':''}" onclick="evSetEra('${e}')">${e}</button>`
    ).join('');

  // Rarity chips
  document.getElementById('ev-rarity-row').innerHTML =
    rarities.map(([v,l]) =>
      `<button class="fchip fc-${v}${EV_F.rarity===v?' active':''}" onclick="evSetRarity('${v}')">${l}</button>`
    ).join('');

  // Make — dropdown
  const makes = ['All', ...new Set(CAR_DB.map(c=>c.make))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('ev-make-row').innerHTML =
    `<select class="filter-select" onchange="evSetMake(this.value)">
      ${makes.map(m=>`<option value="${m}"${EV_F.make===m?' selected':''}>${m}</option>`).join('')}
    </select>`;

  // Country — dropdown
  const countries = ['All', ...new Set(CAR_DB.map(c=>c.country))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('ev-country-row').innerHTML =
    `<select class="filter-select" onchange="evSetCountry(this.value)">
      ${countries.map(c=>`<option value="${c}"${EV_F.country===c?' selected':''}>${c}</option>`).join('')}
    </select>`;

  document.getElementById('ev-tog-seen').classList.toggle('active', EV_F.showSeen);
  document.getElementById('ev-tog-unseen').classList.toggle('active', EV_F.showUnseen);
}


function evSetEra(v)     { EV_F.era=v;     buildEvFilters(); renderEventList(); }
function evSetRarity(v)  { EV_F.rarity=v;  buildEvFilters(); renderEventList(); }
function evSetMake(v)    { EV_F.make=v;    buildEvFilters(); renderEventList(); }
function evSetCountry(v) { EV_F.country=v; buildEvFilters(); renderEventList(); }
function evToggle(which) {
  if (which==='seen') EV_F.showSeen = !EV_F.showSeen;
  else                EV_F.showUnseen = !EV_F.showUnseen;
  buildEvFilters(); renderEventList();
}

function renderEventList() {
  // Update header
  document.getElementById('event-hdr-title').textContent = '📋 ' + (S.event || 'Event');
  document.getElementById('event-hdr-sub').textContent   = [S.loc, S.date].filter(Boolean).join(' · ');

  const spottedMap = eventSpottedMap();  // name → key for cars spotted at this event
  const boardNames = boardCarNames();

  // All cars in DB that pass filters
  function passesFilter(car) {
    if (EV_F.era     !== 'All' && car.era     !== EV_F.era)     return false;
    if (EV_F.rarity  !== 'All' && car.rarity  !== EV_F.rarity)  return false;
    if (EV_F.make    !== 'All' && car.make    !== EV_F.make)     return false;
    if (EV_F.country !== 'All' && car.country !== EV_F.country)  return false;
    return true;
  }

  const seenCars   = CAR_DB.filter(c => passesFilter(c) && spottedMap[c.name]);
  const unseenCars = CAR_DB.filter(c => passesFilter(c) && !spottedMap[c.name]);

  // Summary
  const totalSeen = Object.keys(spottedMap).length;
  const totalSightings = Object.values(S.spotted)
    .filter(d => d.event === S.event)
    .reduce((a,d) => a+(d.sightings?.length||0), 0);
  document.getElementById('ev-summary-txt').textContent =
    totalSeen === 0
      ? 'No cars spotted yet — tap Add Car or use the Bingo tab'
      : `${totalSeen} car${totalSeen!==1?'s':''} · ${totalSightings} sighting${totalSightings!==1?'s':''}`;

  let html = '';

  if (!EV_F.showSeen && !EV_F.showUnseen) {
    html = `<div class="ev-empty"><div class="icon">🔍</div><p>Both filters hidden.<br>Tap the toggles above to show cars.</p></div>`;
  } else if (seenCars.length === 0 && unseenCars.length === 0) {
    html = `<div class="ev-empty"><div class="icon">🚗</div><p>No cars match this filter.</p></div>`;
  } else {
    // SEEN section
    if (EV_F.showSeen) {
      if (seenCars.length === 0 && EV_F.showUnseen) {
        // nothing to show here — unseen will show below
      } else if (seenCars.length === 0) {
        html += `<div class="ev-section-hdr">Spotted at this event (0)</div>
          <div class="ev-empty"><div class="icon">👀</div><p>Nothing spotted yet.<br>Tap <strong>Add Car</strong> or spot one on the Bingo tab.</p><button class="ev-empty-btn" onclick="openPicker()">＋ Add a Car</button></div>`;
      } else {
        html += `<div class="ev-section-hdr">Spotted at this event (${seenCars.length})</div>`;
        html += seenCars.map(c => evSeenCardHTML(c, spottedMap[c.name])).join('');
      }
    }

    // UNSEEN section — all cars in DB not yet spotted at this event
    if (EV_F.showUnseen) {
      if (unseenCars.length > 0) {
        html += `<div class="ev-section-hdr" style="margin-top:12px">Not spotted yet (${unseenCars.length})</div>`;
        html += unseenCars.map(c => evUnseenCardHTML(c)).join('');
      }
    }
  }

  const list = document.getElementById('ev-list');
  list.innerHTML = html;

  // Click handlers — seen cards open modal
  list.querySelectorAll('.ev-seen-card').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.key;
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car && key) openModal(car, key);
    });
  });
  // Unseen cards — tap card opens modal, tap + does quick-add
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
  const data  = S.spotted[key];
  const count = data?.sightings?.length || 0;
  const sightingPhoto = data?.sightings?.find(sg => sg.photos?.length>0)?.photos[0]?.dataUrl;
  const imgSrc = sightingPhoto || imgCache[car.name];
  const firstSighting = data?.sightings?.[0];
  const metaStr = firstSighting ? firstSighting.ts : '';

  return `<div class="ev-seen-card ${car.rarity}" data-name="${car.name.replace(/"/g,'&quot;')}" data-key="${key}">
    <div class="ev-seen-thumb">
      ${imgSrc ? `<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
      <div class="ev-thumb-ph" style="${imgSrc?'display:none':''}">${car.flag}</div>
      <div class="ev-seen-count">×${count}</div>
    </div>
    <div class="ev-seen-body">
      <div>
        <div class="ev-seen-name">${car.name}</div>
        <div class="ev-seen-years">${car.years} · ${car.country}</div>
        <div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div>
      </div>
      <div class="ev-seen-meta">${metaStr}</div>
    </div>
    <div class="ev-seen-arrow">›</div>
  </div>`;
}

function evUnseenCardHTML(car) {
  return `<div class="ev-unseen-card" data-name="${car.name.replace(/"/g,'&quot;')}">
    <div class="ev-unseen-flag">${car.flag}</div>
    <div class="ev-unseen-info">
      <div class="ev-unseen-name">${car.name}</div>
      <div class="ev-unseen-sub">${car.years} · ${car.country} · <span class="rarity-badge ${car.rarity}" style="padding:1px 6px;font-size:0.65rem">${RARITY_LABELS[car.rarity]}</span></div>
    </div>
    <button class="ev-unseen-add" data-name="${car.name.replace(/"/g,'&quot;')}" title="Spot this car">+</button>
  </div>`;
}

// Quick-add from event tab or picker
function quickAddSighting(car) {
  const key = `fil-${car.era}-${car.name}`;
  const ts  = new Date().toLocaleString('en-GB');
  const id  = Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  if (!S.spotted[key]) S.spotted[key] = { event:S.event, loc:S.loc, ts, sightings:[] };
  S.spotted[key].sightings.push({ id, event:S.event, loc:S.loc, ts, photos:[] });
  save(); renderEventList(); renderList(); buildEraTabs(); updateScore();
  showSnack(`🎯 ${car.name} spotted!`);
  S.modalKey = key; S.pendingSightingId = id;
  document.getElementById('camInput').click();
}

// ── PICKER SHEET ──────────────────────────────
function openPicker() {
  pickerEra = 'All';
  buildPickerEraChips();
  renderPicker();
  document.getElementById('picker-overlay').classList.add('open');
  setTimeout(() => document.getElementById('picker-search').focus(), 350);
}
function closePicker() {
  document.getElementById('picker-overlay').classList.remove('open');
  document.getElementById('picker-search').value = '';
}
document.getElementById('picker-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('picker-overlay')) closePicker();
});

function buildPickerEraChips() {
  document.getElementById('picker-era-row').innerHTML =
    ['All',...ERAS].map(e =>
      `<button class="picker-era-chip${pickerEra===e?' active':''}" onclick="pickerSetEra('${e}')">${e}</button>`
    ).join('');
}
function pickerSetEra(e) { pickerEra = e; buildPickerEraChips(); renderPicker(); }

function renderPicker() {
  const q     = (document.getElementById('picker-search')?.value||'').toLowerCase().trim();
  const spMap = eventSpottedMap();
  let cars    = pickerEra === 'All' ? CAR_DB : CAR_DB.filter(c => c.era === pickerEra);
  if (q) cars = cars.filter(c =>
    c.name.toLowerCase().includes(q) || c.era.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) || c.rarity.toLowerCase().includes(q)
  );

  // Sort: unspotted first, spotted dimmed at bottom
  cars = [...cars.filter(c => !spMap[c.name]), ...cars.filter(c => spMap[c.name])];

  if (!cars.length) {
    document.getElementById('picker-list').innerHTML =
      `<div style="text-align:center;padding:40px 20px;color:var(--muted);font-weight:700">No cars found</div>`;
    return;
  }

  document.getElementById('picker-list').innerHTML = cars.map(c => {
    const added = !!spMap[c.name];
    return `<div class="picker-row${added?' added':''}" data-name="${c.name.replace(/"/g,'&quot;')}">
      <div class="picker-flag">${c.flag}</div>
      <div class="picker-info">
        <div class="picker-name">${c.name}</div>
        <div class="picker-sub">${c.era} · ${c.years} · ${c.country}</div>
      </div>
      <div class="rarity-badge ${c.rarity}" style="flex-shrink:0">${RARITY_LABELS[c.rarity]}</div>
      ${added
        ? `<div class="picker-done"></div>`
        : `<button class="picker-add-btn" data-name="${c.name.replace(/"/g,'&quot;')}">+</button>`}
    </div>`;
  }).join('');

  document.getElementById('picker-list').querySelectorAll('.picker-add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const car = CAR_DB.find(c => c.name === btn.dataset.name);
      if (car) { quickAddSighting(car); renderPicker(); }
    });
  });
  document.getElementById('picker-list').querySelectorAll('.picker-row:not(.added)').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.picker-add-btn')) return;
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car) { closePicker(); openModal(car, `fil-${car.era}-${car.name}`); }
    });
  });
}

// ══════════════════════════════════════════════
// GARAGE TAB  — all cars across all events
// ══════════════════════════════════════════════

function buildGarageFilters() {
  const rarities = [['All','All'],['common','Common'],['rare','Rare'],['epic','Epic'],['legendary','Legendary']];

  document.getElementById('g-era-row').innerHTML =
    ['All',...ERAS].map(e =>
      `<button class="fchip${G_F.era===e?' active':''}" onclick="gSetEra('${e}')">${e}</button>`
    ).join('');

  document.getElementById('g-rarity-row').innerHTML =
    rarities.map(([v,l]) =>
      `<button class="fchip fc-${v}${G_F.rarity===v?' active':''}" onclick="gSetRarity('${v}')">${l}</button>`
    ).join('');

  const makes = ['All', ...new Set(CAR_DB.map(c=>c.make))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-make-row').innerHTML =
    `<select class="filter-select" onchange="gSetMake(this.value)">
      ${makes.map(m=>`<option value="${m}"${G_F.make===m?' selected':''}>${m}</option>`).join('')}
    </select>`;

  const countries = ['All', ...new Set(CAR_DB.map(c=>c.country))].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-country-row').innerHTML =
    `<select class="filter-select" onchange="gSetCountry(this.value)">
      ${countries.map(c=>`<option value="${c}"${G_F.country===c?' selected':''}>${c}</option>`).join('')}
    </select>`;

  // Event filter — dropdown
  const allEvents = ['All', ...new Set(
    Object.values(S.spotted).map(d=>d.event).filter(Boolean)
  )].sort((a,b)=>a==='All'?-1:a.localeCompare(b));
  document.getElementById('g-event-row').innerHTML =
    `<select class="filter-select" onchange="gSetEvent(this.value)">
      ${allEvents.map(e=>`<option value="${e}"${G_F.event===e?' selected':''}>${e}</option>`).join('')}
    </select>`;

  document.getElementById('g-tog-seen').classList.toggle('active', G_F.showSeen);
  document.getElementById('g-tog-unseen').classList.toggle('active', G_F.showUnseen);
}


function gSetEra(v)     { G_F.era=v;     buildGarageFilters(); renderGarage(); }
function gSetRarity(v)  { G_F.rarity=v;  buildGarageFilters(); renderGarage(); }
function gSetMake(v)    { G_F.make=v;    buildGarageFilters(); renderGarage(); }
function gSetCountry(v) { G_F.country=v; buildGarageFilters(); renderGarage(); }
function gSetEvent(v)   { G_F.event=v;   buildGarageFilters(); renderGarage(); }
function gToggle(which) {
  if (which==='seen') G_F.showSeen = !G_F.showSeen;
  else                G_F.showUnseen = !G_F.showUnseen;
  buildGarageFilters(); renderGarage();
}

function renderGarage() {
  buildGarageFilters();

  const body = document.getElementById('garage-body');

  // Build a map of carName → { car, seenAt:[{event,count,key}], totalSightings }
  // from ALL spotted data
  const carMap = {};
  Object.entries(S.spotted).forEach(([key, data]) => {
    for (const era of ERAS) {
      if (key.startsWith(`fil-${era}-`)) {
        const name = key.slice(`fil-${era}-`.length);
        if (!carMap[name]) {
          const car = CAR_DB.find(c => c.name === name) || { name, flag:'🚗', era, rarity:'common', years:'', country:'', produced:'', surviving:'', value:'', desc:'' };
          carMap[name] = { car, seenAt:[], totalSightings:0, firstKey:key };
        }
        const count = data.sightings?.length || 0;
        carMap[name].seenAt.push({ event:data.event||'Unknown', count, key });
        carMap[name].totalSightings += count;
        break;
      }
    }
  });

  // All cars in DB — seen + unseen
  function passesFilter(car, isSeen) {
    if (G_F.era     !== 'All' && car.era     !== G_F.era)     return false;
    if (G_F.rarity  !== 'All' && car.rarity  !== G_F.rarity)  return false;
    if (G_F.make    !== 'All' && car.make    !== G_F.make)     return false;
    if (G_F.country !== 'All' && car.country !== G_F.country)  return false;
    if (G_F.event !== 'All' && isSeen) {
      const entry = carMap[car.name];
      if (!entry || !entry.seenAt.some(s => s.event === G_F.event)) return false;
    }
    if (G_F.event !== 'All' && !isSeen) return false;
    return true;
  }

  const seenCars   = CAR_DB.filter(c => carMap[c.name] && passesFilter(c, true));
  const unseenCars = CAR_DB.filter(c => !carMap[c.name] && passesFilter(c, false));

  // Summary header
  const totalCars   = Object.keys(carMap).length;
  const totalS      = Object.values(S.spotted).reduce((a,d)=>a+(d.sightings?.length||0),0);
  document.getElementById('garage-total').textContent = `${totalCars} cars · ${totalS} sightings`;

  let html = '';

  if (!G_F.showSeen && !G_F.showUnseen) {
    html = `<div class="garage-empty"><div class="icon">🔍</div><p>Both filters hidden.</p></div>`;
  } else {
    if (G_F.showSeen) {
      if (seenCars.length) {
        html += `<div class="garage-section-hdr">In your collection (${seenCars.length})</div>`;
        html += seenCars.map(c => garageCarHTML(c, carMap[c.name], true)).join('');
      } else if (!G_F.showUnseen) {
        html = `<div class="garage-empty"><div class="icon">🏎️</div><p>Nothing matches these filters.</p></div>`;
      }
    }
    if (G_F.showUnseen) {
      if (unseenCars.length) {
        html += `<div class="garage-section-hdr" style="margin-top:12px">Still to find (${unseenCars.length})</div>`;
        html += unseenCars.map(c => garageCarHTML(c, null, false)).join('');
      }
    }
    if (!html) {
      html = `<div class="garage-empty"><div class="icon">🚗</div><p>No cars spotted yet.<br>Get out there!</p></div>`;
    }
  }

  body.innerHTML = html;

  // Event delegation
  body.querySelectorAll('.gcar[data-key]').forEach(el => {
    el.addEventListener('click', () => {
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car) openModal(car, el.dataset.key);
    });
  });
  body.querySelectorAll('.gcar[data-name]:not([data-key])').forEach(el => {
    el.addEventListener('click', () => {
      const car = CAR_DB.find(c => c.name === el.dataset.name);
      if (car) openModal(car, `fil-${car.era}-${car.name}`);
    });
  });
}

function garageCarHTML(car, entry, isSeen) {
  const safeName = car.name.replace(/"/g,'&quot;');

  if (!isSeen) {
    // Unseen card — dimmed, dashed
    const imgSrc = imgCache[car.name];
    return `<div class="gcar unseen ${car.rarity}" data-name="${safeName}">
      <div class="gcar-thumb">
        ${imgSrc ? `<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
        <div class="gcar-ph" style="${imgSrc?'display:none':''}">${car.flag}</div>
      </div>
      <div class="gcar-info">
        <div class="gcar-name">${car.name}</div>
        <div class="gcar-years">${car.years} · ${car.country}</div>
        <div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div>
      </div>
      <div class="gcar-arrow">›</div>
    </div>`;
  }

  // Seen card — vivid, shows events and sighting count
  const sightingPhoto = Object.entries(S.spotted)
    .filter(([k]) => k.startsWith(`fil-${car.era}-${car.name}`) || k === `fil-${car.era}-${car.name}`)
    .flatMap(([,d]) => d.sightings||[])
    .find(sg => sg.photos?.length>0)?.photos[0]?.dataUrl;
  const imgSrc  = sightingPhoto || imgCache[car.name];
  const key     = entry.firstKey;
  const evList  = [...new Set(entry.seenAt.map(s=>s.event))].join(', ');
  const total   = entry.totalSightings;

  return `<div class="gcar seen ${car.rarity}" data-name="${safeName}" data-key="${key}">
    <div class="gcar-thumb">
      ${imgSrc ? `<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
      <div class="gcar-ph" style="${imgSrc?'display:none':''}">${car.flag}</div>
      <div class="gcar-badge">×${total}</div>
    </div>
    <div class="gcar-info">
      <div class="gcar-name">${car.name}</div>
      <div class="gcar-years">${car.years} · ${car.country}</div>
      <div class="rarity-badge ${car.rarity}">${RARITY_LABELS[car.rarity]}</div>
      <div class="gcar-evs" style="margin-top:4px">${evList}</div>
    </div>
    <div class="gcar-arrow">›</div>
  </div>`;
}

// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function openModal(car, key) {
  if (!car || !key) return;
  S.modalKey = key;
  S.modalCar = car;

  // Hero image — fix 2: sighting photo takes priority
  const data = S.spotted[key];
  const sightingPhoto = data?.sightings?.find(sg=>sg.photos?.length>0)?.photos[0]?.dataUrl;
  const wikiImg = imgCache[car.name];
  const heroSrc = sightingPhoto || wikiImg;

  const hero = document.getElementById('modal-hero');
  // Keep the close button
  if (heroSrc) {
    hero.innerHTML = `<button class="modal-x" onclick="closeModal()">✕</button>
      <img src="${heroSrc}" alt="${car.name}" style="width:100%;height:100%;object-fit:cover;display:block"
        onerror="this.outerHTML='<div class=modal-hero-placeholder>${car.flag}</div>'">`;
  } else {
    hero.innerHTML = `<button class="modal-x" onclick="closeModal()">✕</button>
      <div class="modal-hero-placeholder">${car.flag}</div>`;
    // Async load wiki image and update if found
    if (WIKI_PAGES[car.name]) {
      fetchWikiImg(car.name).then(src => {
        if (src && S.modalKey === key) {
          const img = document.createElement('img');
          img.src = src; img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
          img.onerror = () => {};
          const ph = hero.querySelector('.modal-hero-placeholder');
          if (ph) ph.replaceWith(img);
        }
      });
    }
  }

  const rl = {common:'★ Common',rare:'★★ Rare',epic:'★★★ Epic',legendary:'★★★★ Legendary'};
  const rm = document.getElementById('m-rarity');
  rm.textContent = rl[car.rarity]||''; rm.className = 'modal-rarity '+(car.rarity||'');
  document.getElementById('m-name').textContent  = car.name;
  const mMake = document.getElementById('m-make');
  if (mMake) mMake.textContent = car.make ? `${car.make}${car.model?' · '+car.model:''}` : '';
  document.getElementById('m-years').textContent = (car.years||'') + (car.country ? ' · '+car.country : '');
  const hBtn = document.getElementById('m-hagerty');
  if (hBtn) {
    hBtn.href = car.hagerty
      ? `https://www.hagerty.com/valuation-tools/${car.hagerty}`
      : 'https://www.hagerty.com/valuation-tools/';
    hBtn.textContent = car.hagerty ? '📈 View Hagerty Valuation' : '📈 Search Hagerty Valuations';
  }
  document.getElementById('m-stats').innerHTML = `
    <div class="modal-stat"><div class="modal-stat-val">${car.produced||'—'}</div><div class="modal-stat-lbl">Produced</div></div>
    <div class="modal-stat"><div class="modal-stat-val">${car.surviving||'—'}</div><div class="modal-stat-lbl">Surviving</div></div>
    <div class="modal-stat"><div class="modal-stat-val">${car.value||'—'}</div><div class="modal-stat-lbl">Value</div></div>`;
  document.getElementById('m-desc').textContent = car.desc || '';

  document.getElementById('modal-sheet').scrollTop = 0;
  document.getElementById('modal-overlay').classList.add('open');
  refreshModalSightings();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  S.modalKey = S.modalCar = S.pendingSightingId = null;
  renderList();    // ensure spotted/unspotted sections update immediately
  renderEventList();
}
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

function refreshModalSightings() {
  const key   = S.modalKey;
  const data  = S.spotted[key];
  const count = data ? data.sightings.length : 0;
  document.getElementById('cnt-number').textContent = count;
  document.getElementById('cnt-minus').disabled     = count === 0;
  document.getElementById('spot-btn').textContent   = count === 0 ? '✓  I Spotted It!' : '+  I Saw Another One!';

  const wrap = document.getElementById('sightings-wrap');
  const list = document.getElementById('sightings-list');
  if (!count) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  list.innerHTML = data.sightings.map((sg, i) => {
    const photosHTML = (sg.photos||[]).map(p =>
      `<img class="s-thumb" src="${p.dataUrl}" onclick="openLightbox('${p.dataUrl.replace(/'/g,"\\'")}','${sg.event} · ${sg.ts.replace(/'/g,"\\'")}')">`,
    ).join('');
    return `<div class="sighting-entry">
      <div class="sighting-top">
        <div class="sighting-meta">
          <div class="sighting-num">Sighting #${i+1}</div>
          <div class="sighting-time">${sg.ts}</div>
          <div class="sighting-ev">${sg.event}${sg.loc?' · '+sg.loc:''}</div>
        </div>
        <button class="sighting-del" onclick="deleteSighting('${sg.id}')">✕</button>
      </div>
      ${photosHTML ? `<div class="sighting-photos">${photosHTML}</div>` : ''}
      <button class="add-photo-btn" onclick="triggerPhoto('${sg.id}')">📷  Add a Photo</button>
    </div>`;
  }).join('');

  // Fix 2: Update hero image after sightings change
  const firstPhoto = data.sightings.find(sg=>sg.photos?.length>0)?.photos[0]?.dataUrl;
  if (firstPhoto) {
    const hero = document.getElementById('modal-hero');
    const existing = hero.querySelector('img');
    if (existing) { existing.src = firstPhoto; }
    else {
      const img = document.createElement('img');
      img.src = firstPhoto;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      const ph = hero.querySelector('.modal-hero-placeholder');
      if (ph) ph.replaceWith(img);
    }
  }
}

// ══════════════════════════════════════════════
// COUNTER
// ══════════════════════════════════════════════
function changeCount(delta) {
  if (delta > 0) { addSighting(); return; }
  const data = S.spotted[S.modalKey];
  if (!data?.sightings.length) return;
  data.sightings.pop();
  if (!data.sightings.length) delete S.spotted[S.modalKey];
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Removed last sighting');
}

// ══════════════════════════════════════════════
// SIGHTINGS
// ══════════════════════════════════════════════
function addSighting() {
  const key = S.modalKey;
  const ts  = new Date().toLocaleString('en-GB');
  const id  = Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  if (!S.spotted[key]) S.spotted[key] = { event:S.event, loc:S.loc, ts, sightings:[] };
  S.spotted[key].sightings.push({ id, event:S.event, loc:S.loc, ts, photos:[] });
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('🎯 Spotted! Opening camera…');
  S.pendingSightingId = id;
  document.getElementById('camInput').click();
}

function deleteSighting(sgId) {
  const data = S.spotted[S.modalKey];
  if (!data) return;
  data.sightings = data.sightings.filter(sg => sg.id !== sgId);
  if (!data.sightings.length) delete S.spotted[S.modalKey];
  save(); renderList(); buildEraTabs(); refreshModalSightings(); renderEventList();
  showSnack('Sighting removed');
}

function triggerPhoto(sgId) {
  S.pendingSightingId = sgId;
  document.getElementById('camInput').click();
}

function handlePhoto(e) {
  const file = e.target.files[0];
  const sgId = S.pendingSightingId;
  S.pendingSightingId = null;
  e.target.value = '';
  if (!file || !S.modalKey) { showSnack('✓ Sighting saved'); return; }
  const r = new FileReader();
  r.onload = ev => {
    const data = S.spotted[S.modalKey];
    if (!data) return;
    let sg = sgId ? data.sightings.find(s=>s.id===sgId) : null;
    if (!sg) sg = data.sightings[data.sightings.length-1];
    if (!sg) return;
    if (!sg.photos) sg.photos = [];
    sg.photos.push({ dataUrl:ev.target.result, ts:new Date().toLocaleString('en-GB') });
    save(); refreshModalSightings(); renderList(); renderEventList();
    showSnack('📷 Photo saved!');
  };
  r.readAsDataURL(file);
}

// ══════════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════════
function openLightbox(src, info) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-info').textContent = info || '';
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

// ══════════════════════════════════════════════
// TOASTS
// ══════════════════════════════════════════════
let snackTimer;
function showSnack(msg) {
  const el = document.getElementById('snackbar');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
let bingoShown = false;
function checkBingo() {
  const eraBoard = S.board[S.era] || [];
  const unique   = [...new Map(eraBoard.map(c=>[c.name,c])).values()];
  const spotted  = unique.filter(c => S.spotted[cellKey(S.era, c.name)]).length;
  if (spotted >= 5 && !bingoShown) {
    bingoShown = true;
    const t = document.getElementById('bingo-toast');
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); bingoShown = false; }, 4000);
  }
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
(async () => {
  await initSetup();
  // Preload images immediately on launch
  if (S.board) preloadEraImages(S.board[S.era] || []);
})();
