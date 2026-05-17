// ══════════════════════════════════════════════════════════════════════
// FORMS — generic modal form-sheet helper
//
// Replaces native prompt()/confirm() with a proper bottom-sheet form
// that's friendly on touch and matches the rest of the app's visual
// language. Returns a Promise<data | null>.
//
// Usage:
//   const out = await openFormSheet({
//     title: 'Add a car',
//     submitLabel: 'Add car',
//     fields: [
//       { id:'name',  label:'Name', required:true, placeholder:'e.g. MGB' },
//       { id:'year',  label:'Year', type:'number', inputmode:'numeric' },
//       { id:'notes', label:'Notes', type:'textarea' },
//     ],
//     initial: { name: 'Old name' },     // optional pre-fill (for edit)
//   });
//   if (out) console.log(out.name, out.year, out.notes);
// ══════════════════════════════════════════════════════════════════════

async function openFormSheet({
  title, fields, submitLabel = 'Save', initial = {},
}) {
  const overlay   = document.getElementById('form-overlay');
  const titleEl   = document.getElementById('form-title');
  const fieldsEl  = document.getElementById('form-fields');
  const submitBtn = document.getElementById('form-submit-btn');
  const cancelBtn = overlay?.querySelector('.form-cancel');
  if (!overlay || !titleEl || !fieldsEl || !submitBtn || !cancelBtn) {
    throw new Error('form-overlay is missing from index.html');
  }

  titleEl.textContent   = title;
  submitBtn.textContent = submitLabel;

  fieldsEl.innerHTML = fields.map(f => {
    const id    = `form-field-${f.id}`;
    const val   = initial[f.id] ?? '';
    const reqMk = f.required ? ' *' : '';
    const ph    = escapeAttr(f.placeholder || '');
    if (f.type === 'textarea') {
      return `<div class="form-field-wrap">
        <label for="${id}">${escapeHtml(f.label)}${reqMk}</label>
        <textarea id="${id}" rows="3" placeholder="${ph}"${f.required?' required':''}>${escapeHtml(val)}</textarea>
      </div>`;
    }
    if (f.type === 'photo') {
      // Photo field — hidden file input + dashed "take/choose" button +
      // preview that swaps in once a file is picked. capture="environment"
      // nudges phones to open the rear camera by default; user can still
      // pick from the library.
      return `<div class="form-field-wrap form-photo-wrap">
        <label>${escapeHtml(f.label)}${reqMk}</label>
        <div class="form-photo-preview" id="${id}-preview" style="display:none">
          <img id="${id}-img" alt="">
          <button type="button" class="form-photo-remove" data-target="${id}">✕ Remove</button>
        </div>
        <button type="button" class="form-photo-btn" data-target="${id}" id="${id}-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Take or choose a photo
        </button>
        <input id="${id}" type="file" accept="image/*" capture="environment" hidden>
      </div>`;
    }
    const inputType = f.type || 'text';
    const inputmode = f.inputmode ? ` inputmode="${escapeAttr(f.inputmode)}"` : '';
    const autocap   = (f.type === 'email' || f.type === 'url') ? ' autocapitalize="none" autocorrect="off"' : '';
    return `<div class="form-field-wrap">
      <label for="${id}">${escapeHtml(f.label)}${reqMk}</label>
      <input id="${id}" type="${inputType}" value="${escapeAttr(val)}" placeholder="${ph}"${f.required?' required':''}${inputmode}${autocap}>
    </div>`;
  }).join('');

  // Wire any photo-field controls: trigger button → file picker,
  // change event → preview swap, remove button → reset state.
  fieldsEl.querySelectorAll('.form-photo-btn').forEach(btn => {
    btn.onclick = () => document.getElementById(btn.dataset.target)?.click();
  });
  fieldsEl.querySelectorAll('.form-photo-remove').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.target;
      const input = document.getElementById(id);
      if (input) input.value = '';
      const preview = document.getElementById(`${id}-preview`);
      const trigger = document.getElementById(`${id}-btn`);
      if (preview) preview.style.display = 'none';
      if (trigger) trigger.style.display = '';
    };
  });
  fieldsEl.querySelectorAll('input[type="file"]').forEach(input => {
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const preview = document.getElementById(`${input.id}-preview`);
      const img     = document.getElementById(`${input.id}-img`);
      const trigger = document.getElementById(`${input.id}-btn`);
      if (img) img.src = URL.createObjectURL(file);
      if (preview) preview.style.display = '';
      if (trigger) trigger.style.display = 'none';
    };
  });

  overlay.classList.add('open');
  // Focus the first field once the sheet's slide-in transition has settled.
  setTimeout(() => {
    const firstInput = fieldsEl.querySelector('input:not([type="file"]),textarea');
    firstInput?.focus();
  }, 280);

  return new Promise(resolve => {
    function close(value) {
      overlay.classList.remove('open');
      submitBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick   = null;
      resolve(value);
    }
    cancelBtn.onclick = () => close(null);
    overlay.onclick   = (e) => { if (e.target === overlay) close(null); };
    submitBtn.onclick = () => {
      const out = {};
      // Validate required fields up-front; bail with focus on the first miss.
      for (const f of fields) {
        const el = document.getElementById(`form-field-${f.id}`);
        if (f.type === 'photo') {
          // Photo field — output the File blob (or null if nothing picked).
          out[f.id] = el?.files?.[0] || null;
          if (f.required && !out[f.id]) {
            document.getElementById(`form-field-${f.id}-btn`)?.focus();
            return;
          }
          continue;
        }
        const raw = (el?.value ?? '').trim();
        if (f.required && !raw) {
          el?.focus();
          el?.classList.add('form-field-err');
          return;
        }
        if (el) el.classList.remove('form-field-err');
        out[f.id] = raw || null;
      }
      close(out);
    };
  });
}

// Convenience: confirm replacement that matches the rest of the app.
// Falls back to native confirm if openFormSheet isn't available.
async function confirmSheet({ title, body, confirmLabel = 'Confirm', danger = false }) {
  const overlay   = document.getElementById('confirm-overlay');
  const titleEl   = document.getElementById('confirm-title');
  const bodyEl    = document.getElementById('confirm-body');
  const okBtn     = document.getElementById('confirm-ok');
  const cancelBtn = overlay?.querySelector('.confirm-cancel');
  if (!overlay || !titleEl || !bodyEl || !okBtn || !cancelBtn) {
    return window.confirm(`${title}\n\n${body || ''}`);
  }
  titleEl.textContent = title;
  bodyEl.textContent  = body || '';
  okBtn.textContent   = confirmLabel;
  okBtn.classList.toggle('confirm-ok-danger', !!danger);
  overlay.classList.add('open');
  return new Promise(resolve => {
    function close(value) {
      overlay.classList.remove('open');
      okBtn.onclick     = null;
      cancelBtn.onclick = null;
      overlay.onclick   = null;
      resolve(value);
    }
    cancelBtn.onclick = () => close(false);
    overlay.onclick   = (e) => { if (e.target === overlay) close(false); };
    okBtn.onclick     = () => close(true);
  });
}
