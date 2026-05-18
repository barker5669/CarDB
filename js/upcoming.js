// ══════════════════════════════════════════════════════════════════════
// UPCOMING — shared calendar of future events with per-user RSVPs
//
// Rendered as a month-grouped list (better mobile UX than a grid).
// Both users see the full list; each marks themselves as attending.
// Forms are prompt()-based for now; Phase 9 turns them into modals.
// ══════════════════════════════════════════════════════════════════════

let _profilesIndex = null;

async function _loadProfilesIndex() {
  if (_profilesIndex) return _profilesIndex;
  _profilesIndex = {};
  try {
    const { data, error } = await SB.from('profiles').select('id, display_name');
    if (!error && data) data.forEach(p => { _profilesIndex[p.id] = p.display_name; });
  } catch (e) { console.warn('loadProfilesIndex:', e); }
  return _profilesIndex;
}

async function showUpcoming() {
  switchTab('upcoming');
  await renderUpcoming();
}

function _monthLabel(key) {
  if (key === 'no-date') return 'No date';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

async function renderUpcoming() {
  const body = document.getElementById('upcoming-body');
  if (!body) return;

  // Local-first: cache is the source of truth. Render whatever's
  // cached immediately, then refresh from Supabase in the background
  // and re-render if anything changed. Cache is updated by
  // openAddUpcoming (optimistic) + by successful list() responses.
  const cached = (typeof _loadCachedUpcoming === 'function') ? _loadCachedUpcoming() : [];
  _paintUpcoming(body, cached);
  if (window.DB && DB.upcoming && typeof DB.upcoming.list === 'function') {
    _raceTimeout(DB.upcoming.list(), 'Upcoming events', 8000)
      .then(fresh => {
        if (!Array.isArray(fresh)) return;
        // Merge: keep local-only events the backend doesn't know about.
        const localOnly = cached.filter(e => e && String(e.id || '').startsWith('local-'));
        const merged    = [...fresh, ...localOnly];
        if (typeof _saveCachedUpcoming === 'function') _saveCachedUpcoming(merged);
        _paintUpcoming(body, merged);
      })
      .catch(err => console.warn('renderUpcoming:', err));
  }
}

async function _paintUpcoming(body, events) {
  if (!body) return;
  await _loadProfilesIndex();
  if (!events.length) {
    body.innerHTML = `
      <div class="up-empty">
        <div class="up-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>
        </div>
        <h3>No upcoming events</h3>
        <p>Add a show you'd like to attend.</p>
        <button class="primary-btn" onclick="openAddUpcoming()">＋ Add an event</button>
      </div>`;
    return;
  }

  const me = currentUserId();
  // Sort by date ascending so the list reads top-down chronologically.
  const sorted = events.slice().sort((a, b) =>
    String(a.event_date || '').localeCompare(String(b.event_date || ''))
  );
  const groups = {};
  for (const e of sorted) {
    const key = e.event_date ? e.event_date.slice(0, 7) : 'no-date';
    (groups[key] = groups[key] || []).push(e);
  }

  body.innerHTML = `
    ${Object.entries(groups).map(([key, evs]) => `
      <div class="up-month">
        <div class="up-month-hdr">${escapeHtml(_monthLabel(key))}</div>
        ${evs.map(e => {
          const attendees = (e.upcoming_event_attendees || []).map(a => a.user_id);
          const iAmGoing  = attendees.includes(me);
          const others    = attendees
            .filter(id => id !== me)
            .map(id => _profilesIndex[id])
            .filter(Boolean);
          const d = e.event_date ? new Date(e.event_date) : null;
          const dateBlock = d && !isNaN(d)
            ? `<div class="up-date-d">${d.getDate()}</div>
               <div class="up-date-w">${d.toLocaleDateString('en-GB',{weekday:'short'})}</div>`
            : `<div class="up-date-d">—</div>`;
          return `<div class="up-row">
            <div class="up-date">${dateBlock}</div>
            <div class="up-info">
              <div class="up-name">${escapeHtml(e.name)}</div>
              ${e.location ? `<div class="up-loc">📍 ${escapeHtml(e.location)}</div>` : ''}
              ${e.url      ? `<a class="up-link" href="${escapeAttr(e.url)}" target="_blank" rel="noopener">↗ More info</a>` : ''}
              ${e.notes    ? `<div class="up-notes">${escapeHtml(e.notes)}</div>` : ''}
              ${others.length ? `<div class="up-others">Also going: ${escapeHtml(others.join(', '))}</div>` : ''}
            </div>
            <div class="up-actions">
              <button class="up-start" onclick="startShowFromUpcoming('${escapeJsSq(String(e.id))}')" title="Start a bingo show for this event">▶ Start show</button>
              <button class="up-rsvp ${iAmGoing?'up-rsvp-on':''}" onclick="toggleUpcomingRSVP('${escapeJsSq(String(e.id))}', ${iAmGoing})">${iAmGoing?'✓ Going':'＋ Going'}</button>
              ${e.created_by === me ? `<button class="up-del" onclick="confirmDeleteUpcoming('${escapeJsSq(String(e.id))}')" title="Delete">✕</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`).join('')}

    <div class="up-add-wrap">
      <button class="primary-btn" onclick="openAddUpcoming()">＋ Add another event</button>
    </div>`;
}

async function openAddUpcoming() {
  const data = await openFormSheet({
    title:       'Add an event',
    submitLabel: 'Add event',
    fields: [
      { id:'name',     label:'Event name', required:true, placeholder:'e.g. Goodwood Revival' },
      { id:'date',     label:'Date',       required:true, type:'date' },
      { id:'location', label:'Location',   placeholder:'e.g. Chichester' },
      { id:'url',      label:'Website',    type:'url',    placeholder:'https://…' },
      { id:'notes',    label:'Notes',      type:'textarea', placeholder:'Optional' },
    ],
  });
  if (!data) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    showSnack('Pick a valid date');
    return;
  }
  // Local-first save — instant, works offline. Cache becomes the
  // source of truth; Supabase sync happens optimistically after.
  const me = (typeof currentUserId === 'function') ? currentUserId() : null;
  const localId = 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const localEntry = {
    id: localId,
    name: data.name,
    event_date: data.date,
    location: data.location,
    url: data.url,
    notes: data.notes,
    upcoming_event_attendees: me ? [{ user_id: me }] : [],
    created_by: me,
    _local: true,
  };
  if (typeof _loadCachedUpcoming === 'function') {
    const list = _loadCachedUpcoming();
    list.push(localEntry);
    _saveCachedUpcoming(list);
  }
  showSnack('Event added');
  await renderUpcoming();
  if (typeof renderNextEventCard === 'function') renderNextEventCard().catch(() => {});
  if (typeof renderHomeHeroCalPill === 'function') renderHomeHeroCalPill();
  // Background Supabase sync — replaces the local entry with the
  // remote one on success. Doesn't block the UI; failures leave
  // the local entry in place.
  if (window.DB && DB.upcoming && typeof DB.upcoming.create === 'function') {
    (async () => {
      try {
        const row = await _raceTimeout(DB.upcoming.create({
          name:       data.name,
          event_date: data.date,
          location:   data.location,
          url:        data.url,
          notes:      data.notes,
        }), 'Add event', 10000);
        try { await _raceTimeout(DB.upcoming.setAttending(row.id, true), 'RSVP', 8000); }
        catch (e) { console.warn('RSVP after create:', e); }
        if (typeof _loadCachedUpcoming === 'function') {
          const list = _loadCachedUpcoming();
          const idx  = list.findIndex(e => e && e.id === localId);
          const entry = { ...row, upcoming_event_attendees: me ? [{ user_id: me }] : [] };
          if (idx >= 0) list[idx] = entry; else list.push(entry);
          _saveCachedUpcoming(list);
        }
      } catch (err) {
        console.warn('Background upcoming sync failed:', err);
      }
    })();
  }
}

async function toggleUpcomingRSVP(id, currentlyGoing) {
  const me   = (typeof currentUserId === 'function') ? currentUserId() : null;
  const goal = !currentlyGoing;
  // Update the cache optimistically so the UI flips instantly.
  if (typeof _loadCachedUpcoming === 'function' && me) {
    const list = _loadCachedUpcoming();
    const ev   = list.find(e => e && String(e.id) === String(id));
    if (ev) {
      const attendees = Array.isArray(ev.upcoming_event_attendees) ? ev.upcoming_event_attendees : [];
      if (goal && !attendees.some(a => a.user_id === me)) attendees.push({ user_id: me });
      if (!goal) ev.upcoming_event_attendees = attendees.filter(a => a.user_id !== me);
      else       ev.upcoming_event_attendees = attendees;
      _saveCachedUpcoming(list);
    }
  }
  await renderUpcoming();
  if (typeof renderNextEventCard === 'function') renderNextEventCard().catch(() => {});
  if (typeof renderHomeHeroCalPill === 'function') renderHomeHeroCalPill();
  // Skip the backend round-trip for local-only events.
  if (String(id).startsWith('local-')) return;
  try {
    await _raceTimeout(DB.upcoming.setAttending(id, goal), 'RSVP', 8000);
  } catch (err) {
    console.warn('RSVP sync failed:', err);
  }
}

// Pre-fills the "Start a new show" sheet with the upcoming event's
// name, location and date so the user can start spotting against
// that show in one tap. They can still tweak the form before
// confirming — the underlying startEvent reads from the inputs.
function startShowFromUpcoming(id) {
  const list = (typeof _loadCachedUpcoming === 'function') ? _loadCachedUpcoming() : [];
  const ev = list.find(e => e && String(e.id) === String(id));
  if (!ev) { showSnack('Event not found'); return; }
  if (typeof openNewShowSheet === 'function') openNewShowSheet();
  // The sheet has a slide-in animation; wait for it to settle then
  // populate the inputs so the user sees the prefilled values.
  setTimeout(() => {
    const nameEl = document.getElementById('ev-input');
    const locEl  = document.getElementById('loc-input');
    const dateEl = document.getElementById('date-input');
    if (nameEl) nameEl.value = ev.name || '';
    if (locEl)  locEl.value  = ev.location || '';
    if (dateEl) dateEl.value = ev.event_date || '';
  }, 60);
}

async function confirmDeleteUpcoming(id) {
  const ok = await confirmSheet({
    title:        'Delete this upcoming event?',
    confirmLabel: 'Delete',
    danger:       true,
  });
  if (!ok) return;
  // Optimistic local removal so the UI updates immediately.
  if (typeof _loadCachedUpcoming === 'function') {
    const list = _loadCachedUpcoming().filter(e => e && String(e.id) !== String(id));
    _saveCachedUpcoming(list);
  }
  showSnack('Deleted');
  await renderUpcoming();
  if (typeof renderNextEventCard === 'function') renderNextEventCard().catch(() => {});
  if (typeof renderHomeHeroCalPill === 'function') renderHomeHeroCalPill();
  if (String(id).startsWith('local-')) return;
  try { await DB.upcoming.remove(id); }
  catch (err) { console.warn('Delete sync failed:', err); }
}
