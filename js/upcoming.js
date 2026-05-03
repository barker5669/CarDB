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

  let events;
  try { events = await DB.upcoming.list(); }
  catch (err) {
    console.error('renderUpcoming:', err);
    body.innerHTML = `<div class="up-error">⚠️ Could not load events. Check your connection.</div>`;
    return;
  }
  await _loadProfilesIndex();

  if (!events.length) {
    body.innerHTML = `
      <div class="up-empty">
        <div class="up-empty-icon">📅</div>
        <h3>No upcoming events</h3>
        <p>Add a show or event you'd like to attend.</p>
        <button class="primary-btn" onclick="openAddUpcoming()">＋ Add an event</button>
      </div>`;
    return;
  }

  const me = currentUserId();
  const groups = {};
  for (const e of events) {
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
              <button class="up-rsvp ${iAmGoing?'up-rsvp-on':''}" onclick="toggleUpcomingRSVP(${e.id}, ${iAmGoing})">${iAmGoing?'✓ Going':'＋ Going'}</button>
              ${e.created_by === me ? `<button class="up-del" onclick="confirmDeleteUpcoming(${e.id})" title="Delete">✕</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`).join('')}

    <div class="up-add-wrap">
      <button class="primary-btn" onclick="openAddUpcoming()">＋ Add another event</button>
    </div>`;
}

async function openAddUpcoming() {
  const name = prompt('Event name (e.g. "Goodwood Revival"):');
  if (!name || !name.trim()) return;
  const dateStr = prompt('Date (YYYY-MM-DD):');
  if (!dateStr) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { alert('Please use YYYY-MM-DD format.'); return; }
  const location = prompt('Location (optional):',     '') || null;
  const url      = prompt('Website URL (optional):',   '') || null;
  const notes    = prompt('Notes (optional):',         '') || null;
  try {
    const row = await DB.upcoming.create({
      name: name.trim(), event_date: dateStr, location, url, notes,
    });
    await DB.upcoming.setAttending(row.id, true);
    showSnack('📅 Event added!');
    await renderUpcoming();
  } catch (err) {
    console.error('openAddUpcoming:', err);
    showSnack('⚠️ Could not save event');
  }
}

async function toggleUpcomingRSVP(id, currentlyGoing) {
  try {
    await DB.upcoming.setAttending(id, !currentlyGoing);
    await renderUpcoming();
  } catch (err) {
    console.error('toggleUpcomingRSVP:', err);
    showSnack('⚠️ Could not update RSVP');
  }
}

async function confirmDeleteUpcoming(id) {
  if (!confirm('Delete this upcoming event?')) return;
  try {
    await DB.upcoming.remove(id);
    showSnack('Deleted');
    await renderUpcoming();
  } catch (err) {
    console.error('confirmDeleteUpcoming:', err);
    showSnack('⚠️ Could not delete');
  }
}
