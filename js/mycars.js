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

const MC_LOG_KINDS = ['service','mod','drive','note','photo'];
const MC_LOG_LABEL = { service:'🔧 Service', mod:'⚙️ Mod', drive:'🛣️ Drive', note:'📝 Note', photo:'📷 Photo' };

async function _loadMyCars(force = false) {
  if (!force && _myCars) return _myCars;
  try { _myCars = await DB.myCars.list(); }
  catch (err) { console.error('loadMyCars:', err); _myCars = []; showSnack('⚠️ Could not load your cars'); }
  return _myCars;
}

async function showMyCars() {
  _myCarsActive = null;
  switchTab('mycars');
  await renderMyCarsList();
}

async function renderMyCarsList() {
  _myCarsActive = null;
  const cars = await _loadMyCars(true);
  const body = document.getElementById('mycars-body');
  if (!body) return;
  const titleEl = document.getElementById('mycars-hdr-title');
  if (titleEl) titleEl.textContent = 'My Cars';

  if (!cars.length) {
    body.innerHTML = `
      <div class="mc-empty">
        <div class="mc-empty-icon">🏎️</div>
        <h3>Your cars</h3>
        <p>Add a car to start logging photos, services, modifications, and drives.</p>
        <button class="primary-btn" onclick="openAddMyCar()">＋ Add a car</button>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="mc-list">
      ${cars.map(c => {
        const photos  = c.my_car_photos || [];
        const heroPhoto = photos[0];
        const heroUrl = heroPhoto ? DB.storage.publicUrl(heroPhoto.storage_path) : null;
        const meta = [c.year, c.make, c.model].filter(Boolean).join(' · ') || '—';
        return `<button class="mc-card" onclick="showMyCarDetail(${c.id})">
          <div class="mc-card-thumb">${heroUrl
            ? `<img src="${escapeAttr(heroUrl)}" alt="">`
            : `<div class="mc-card-ph">🚗</div>`}</div>
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
  const titleEl = document.getElementById('mycars-hdr-title');
  if (titleEl) titleEl.textContent = '';

  let car;
  try { car = await DB.myCars.get(carId); }
  catch (err) { console.error(err); showSnack('⚠️ Could not load car'); return; }

  let logEntries = [];
  try { logEntries = await DB.myCarLog.list(carId); }
  catch (err) { console.warn('myCarLog list:', err); }

  const photos    = car.my_car_photos || [];
  const heroPhoto = photos[0];
  const heroUrl   = heroPhoto ? DB.storage.publicUrl(heroPhoto.storage_path) : null;
  const meta      = [car.year, car.make, car.model].filter(Boolean).join(' · ') || '—';

  const body = document.getElementById('mycars-body');
  body.innerHTML = `
    <button class="mc-back-btn" onclick="renderMyCarsList()">‹ All cars</button>

    <div class="mc-hero">
      ${heroUrl
        ? `<img src="${escapeAttr(heroUrl)}" alt="" onclick="openLightbox('${escapeJsSq(heroUrl)}','${escapeJsSq(car.name)}')">`
        : `<div class="mc-hero-ph">🚗</div>`}
    </div>

    <div class="mc-detail">
      <h2 class="mc-name">${escapeHtml(car.name)}</h2>
      <div class="mc-meta">${escapeHtml(meta)}</div>
      ${car.registration ? `<div class="mc-reg">${escapeHtml(car.registration)}</div>` : ''}
      ${car.notes        ? `<div class="mc-notes">${escapeHtml(car.notes)}</div>`     : ''}

      <div class="mc-actions">
        <button class="mc-action-btn" onclick="triggerMyCarPhoto()">📷&nbsp; Add photo</button>
        <button class="mc-action-btn" onclick="openAddMyCarLog()">＋&nbsp; Log entry</button>
      </div>

      <div class="mc-section">
        <div class="mc-section-hdr">Photos (${photos.length})</div>
        ${photos.length
          ? `<div class="mc-photo-grid">${photos.map(p => {
              const url = DB.storage.publicUrl(p.storage_path);
              return `<div class="mc-photo"><img src="${escapeAttr(url)}" alt="" onclick="openLightbox('${escapeJsSq(url)}','${escapeJsSq(car.name)}')"></div>`;
            }).join('')}</div>`
          : `<div class="mc-section-empty">No photos yet — tap "Add photo".</div>`}
      </div>

      <div class="mc-section">
        <div class="mc-section-hdr">Log (${logEntries.length})</div>
        ${logEntries.length
          ? logEntries.map(e => `
              <div class="mc-log-entry mc-log-${e.entry_kind}">
                <div class="mc-log-row">
                  <span class="mc-log-kind">${MC_LOG_LABEL[e.entry_kind] || e.entry_kind}</span>
                  <span class="mc-log-date">${escapeHtml(e.entry_date || '')}</span>
                </div>
                <div class="mc-log-title">${escapeHtml(e.title)}</div>
                ${e.body ? `<div class="mc-log-body">${escapeHtml(e.body)}</div>` : ''}
                <button class="mc-log-del" onclick="deleteMyCarLog(${e.id})" title="Delete entry">✕</button>
              </div>`).join('')
          : `<div class="mc-section-empty">No entries yet.</div>`}
      </div>

      <div class="mc-detail-edit">
        <button class="mc-edit-btn"   onclick="openEditMyCar(${car.id})">Edit details</button>
        <button class="mc-delete-btn" onclick="confirmDeleteMyCar(${car.id})">Delete car</button>
      </div>
    </div>`;
}

const _MC_CAR_FIELDS = [
  { id:'name',  label:'Name',          required:true,  placeholder:"e.g. FIL's MGB" },
  { id:'make',  label:'Make',          placeholder:'e.g. MG' },
  { id:'model', label:'Model',         placeholder:'e.g. MGB' },
  { id:'year',  label:'Year',          type:'number',  inputmode:'numeric', placeholder:'1972' },
  { id:'reg',   label:'Registration',  placeholder:'Optional' },
  { id:'notes', label:'Notes',         type:'textarea', placeholder:'Anything you want to remember' },
];

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
  try {
    await DB.myCars.create({
      name:         data.name,
      make:         data.make,
      model:        data.model,
      year:         _yearOrNull(data.year),
      registration: data.reg,
      notes:        data.notes,
    });
    _myCars = null;
    showSnack('🚗 Car added!');
    await renderMyCarsList();
  } catch (err) {
    console.error('openAddMyCar:', err);
    showSnack('⚠️ Could not save car');
  }
}

async function openEditMyCar(carId) {
  const car = (_myCars || []).find(c => c.id === carId);
  if (!car) return;
  const data = await openFormSheet({
    title:       'Edit car',
    submitLabel: 'Save',
    fields:      _MC_CAR_FIELDS,
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
  try {
    await DB.myCars.update(carId, {
      name:         data.name,
      make:         data.make,
      model:        data.model,
      year:         _yearOrNull(data.year),
      registration: data.reg,
      notes:        data.notes,
    });
    _myCars = null;
    showSnack('Saved');
    await showMyCarDetail(carId);
  } catch (err) {
    console.error('openEditMyCar:', err);
    showSnack('⚠️ Could not save');
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
    await DB.myCars.remove(carId);
    _myCars = null;
    showSnack('Deleted');
    await renderMyCarsList();
  } catch (err) {
    console.error('confirmDeleteMyCar:', err);
    showSnack('⚠️ Could not delete');
  }
}

async function openAddMyCarLog() {
  if (!_myCarsActive) return;
  const data = await openFormSheet({
    title:       'New log entry',
    submitLabel: 'Save entry',
    fields: [
      { id:'kind',  label:`Kind — ${MC_LOG_KINDS.join(' / ')}`, required:true, placeholder:'note' },
      { id:'title', label:'Title', required:true, placeholder:'e.g. Annual service' },
      { id:'date',  label:'Date',  type:'date' },
      { id:'body',  label:'Notes', type:'textarea', placeholder:'Optional details' },
    ],
    initial: { kind: 'note', date: new Date().toISOString().slice(0, 10) },
  });
  if (!data) return;
  if (!MC_LOG_KINDS.includes(data.kind)) {
    showSnack(`Kind must be one of: ${MC_LOG_KINDS.join(', ')}`);
    return;
  }
  try {
    await DB.myCarLog.create({
      my_car_id:  _myCarsActive,
      entry_kind: data.kind,
      title:      data.title,
      body:       data.body,
      entry_date: data.date || undefined,
    });
    showSnack('Logged');
    await showMyCarDetail(_myCarsActive);
  } catch (err) {
    console.error('openAddMyCarLog:', err);
    showSnack('⚠️ Could not save log entry');
  }
}

async function deleteMyCarLog(logId) {
  const ok = await confirmSheet({
    title:        'Delete this log entry?',
    confirmLabel: 'Delete',
    danger:       true,
  });
  if (!ok) return;
  try {
    await DB.myCarLog.remove(logId);
    showSnack('Deleted');
    if (_myCarsActive) await showMyCarDetail(_myCarsActive);
  } catch (err) {
    console.error('deleteMyCarLog:', err);
    showSnack('⚠️ Could not delete');
  }
}

function triggerMyCarPhoto() {
  if (!_myCarsActive) return;
  document.getElementById('myCarPhotoInput')?.click();
}

async function handleMyCarPhoto(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !_myCarsActive) return;
  showSnack('📤 Saving photo…');
  try {
    const { path } = await Photos.captureAndUpload(file, { kind: 'my-car' });
    await DB.myCarPhotos.attach({ my_car_id: _myCarsActive, log_entry_id: null, storage_path: path });
    _myCars = null;
    showSnack('📷 Photo saved!');
    await showMyCarDetail(_myCarsActive);
  } catch (err) {
    console.error('handleMyCarPhoto:', err);
    showSnack('⚠️ Photo upload failed — try again');
  }
}
