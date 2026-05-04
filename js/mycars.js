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
const MC_LOG_LABEL = { service:'🔧 Service', mod:'⚙️ Mod', drive:'🛣️ Drive', note:'📝 Note', photo:'📷 Photo' };

async function _loadMyCars(force = false) {
  if (!force && _myCars) return _myCars;
  try { _myCars = await DB.myCars.list(); }
  catch (err) { _myCars = []; showErr('Could not load your cars', err); }
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
  catch (err) { showErr('Could not load car', err); return; }

  let logEntries = [];
  try { logEntries = await DB.myCarLog.list(carId); }
  catch (err) { console.warn('myCarLog list:', err); }

  const photos    = car.my_car_photos || [];
  // Hero priority: explicit hero_photo_id → newest photo → none.
  const heroPhoto = (car.hero_photo_id && photos.find(p => p.id === car.hero_photo_id)) || photos[0];
  const heroUrl   = heroPhoto
    ? ((typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync(heroPhoto.storage_path)) || DB.storage.publicUrl(heroPhoto.storage_path))
    : null;
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
              const url = (typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync(p.storage_path))
                || DB.storage.publicUrl(p.storage_path);
              const isCover = (heroPhoto && p.id === heroPhoto.id);
              return `<div class="mc-photo ${isCover?'is-cover':''}">
                <img src="${escapeAttr(url)}" alt="" loading="lazy" onclick="openLightbox('${escapeJsSq(url)}','${escapeJsSq(car.name)}')">
                <button class="mc-cover-toggle" type="button" onclick="setMyCarCover(${car.id}, ${p.id})" title="${isCover?'Cover photo':'Set as cover'}">${isCover?'★':'☆'}</button>
              </div>`;
            }).join('')}</div>`
          : `<div class="mc-section-empty">No photos yet — tap "Add photo".</div>`}
      </div>

      <div class="mc-section">
        <div class="mc-section-hdr">Log (${logEntries.length})</div>
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
          if (!logEntries.length) return `<div class="mc-section-empty">No entries yet.</div>`;
          if (!visible.length)    return `<div class="mc-section-empty">No ${escapeHtml(_mcLogFilter)} entries.</div>`;
          return visible.map(e => {
            const linked = (photos || []).find(p => p.log_entry_id === e.id);
            const linkedUrl = linked
              ? ((typeof PhotoCache !== 'undefined' && PhotoCache.getUrlSync(linked.storage_path)) || DB.storage.publicUrl(linked.storage_path))
              : null;
            return `<div class="mc-log-entry mc-log-${e.entry_kind}">
              <div class="mc-log-row">
                <span class="mc-log-kind">${MC_LOG_LABEL[e.entry_kind] || e.entry_kind}</span>
                <span class="mc-log-date">${escapeHtml(e.entry_date || '')}</span>
              </div>
              <div class="mc-log-title">${escapeHtml(e.title)}</div>
              ${e.body ? `<div class="mc-log-body">${escapeHtml(e.body)}</div>` : ''}
              ${linkedUrl ? `<img class="mc-log-photo" src="${escapeAttr(linkedUrl)}" alt="" loading="lazy" onclick="openLightbox('${escapeJsSq(linkedUrl)}','${escapeJsSq(e.title)}')">` : ''}
              <button class="mc-log-del" onclick="deleteMyCarLog(${e.id})" title="Delete entry">✕</button>
            </div>`;
          }).join('');
        })()}
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
    showErr('Could not save car', err);
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
    await DB.myCars.remove(carId);
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
    const blob = await Photos.downscale(file);
    if (_mceState.previewUrl) URL.revokeObjectURL(_mceState.previewUrl);
    _mceState.blob       = blob;
    _mceState.previewUrl = URL.createObjectURL(blob);
    const img = document.getElementById('mce-photo-img');
    const preview = document.getElementById('mce-photo-preview');
    if (img)     img.src = _mceState.previewUrl;
    if (preview) preview.style.display = '';
  } catch (err) {
    showErr('Could not process photo', err);
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
  showSnack('📤 Saving…');
  try {
    const entry = await DB.myCarLog.create({
      my_car_id:  carId,
      entry_kind: kind,
      title,
      body,
      entry_date: date,
    });
    if (blob) {
      const { path } = await DB.storage.uploadPhoto(blob, { kind: 'my-car-log' });
      await DB.myCarPhotos.attach({
        my_car_id:    carId,
        log_entry_id: entry.id,
        storage_path: path,
      });
    }
    _myCars = null;
    closeMyCarEntry();
    showSnack('Saved');
    if (_myCarsActive) await showMyCarDetail(_myCarsActive);
  } catch (err) {
    showErr('Could not save entry', err);
  }
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
    // Best-effort: clean up any photo Storage objects linked to this
    // entry first. The DB row's log_entry_id has on-delete-set-null,
    // not cascade — without explicit removal the photo would be
    // orphaned (unlinked but still in Storage and in my_car_photos).
    const { data: photos } = await SB.from('my_car_photos')
      .select('id, storage_path')
      .eq('log_entry_id', logId);
    for (const p of (photos || [])) {
      try {
        await SB.from('my_car_photos').delete().eq('id', p.id);
        if (p.storage_path) await DB.storage.removePhoto(p.storage_path);
      } catch (e) { console.warn('photo cleanup:', e); }
    }
    await DB.myCarLog.remove(logId);
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
  try {
    await DB.myCars.update(carId, { hero_photo_id: photoId });
    _myCars = null;
    showSnack('✓ Cover updated');
    await showMyCarDetail(carId);
  } catch (err) {
    showErr('Could not update cover', err);
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
  try {
    const blob = await Photos.downscale(file);
    openMyCarEntry(_myCarsActive, {
      presetKind:  'photo',
      presetTitle: 'Photo',
      preBlob:     blob,
    });
  } catch (err) {
    showErr('Could not process photo', err);
  }
}
