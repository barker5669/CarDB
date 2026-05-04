// ══════════════════════════════════════════════════════════════════════
// AUTH FLOW — email + password sign-in, with first-time / forgot
// password flow that uses Supabase's recovery link to set the password.
// ══════════════════════════════════════════════════════════════════════

let CURRENT_SESSION  = null;
let CURRENT_PROFILE  = null;
let _inPasswordRecovery = false;  // true between PASSWORD_RECOVERY and the user submitting their new password

function currentUserId()      { return CURRENT_SESSION?.user?.id || null; }
function currentEmail()       { return CURRENT_SESSION?.user?.email || null; }
function currentDisplayName() { return CURRENT_PROFILE?.display_name || currentEmail()?.split('@')[0] || 'You'; }

// ─── View routing inside the auth screen ────────────────────────────

const _AUTH_VIEWS = ['auth-signin-view','auth-reset-view','auth-check-view','auth-setpw-view'];

function _showAuthView(visibleId) {
  _AUTH_VIEWS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === visibleId ? '' : 'none';
  });
  ['auth-error','auth-reset-error','auth-setpw-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function showAuthScreen() {
  document.getElementById('s-auth')?.classList.add('active');
  document.getElementById('s-app')?.classList.remove('active');
  showAuthSigninView();
}

function showAppScreen() {
  document.getElementById('s-auth')?.classList.remove('active');
  document.getElementById('s-app')?.classList.add('active');
}

function showAuthSigninView() { _showAuthView('auth-signin-view'); }
function showAuthResetView()  { _showAuthView('auth-reset-view'); }

function showAuthCheckView(email) {
  _showAuthView('auth-check-view');
  const sentTo = document.getElementById('auth-sent-to');
  if (sentTo) sentTo.textContent = email;
}

function showAuthSetPasswordView() {
  // Make sure the auth screen is the active one (recovery links land
  // back in the app, supabase-js may have flipped to s-app already).
  document.getElementById('s-auth')?.classList.add('active');
  document.getElementById('s-app')?.classList.remove('active');
  _showAuthView('auth-setpw-view');
  setTimeout(() => document.getElementById('auth-setpw-input')?.focus(), 280);
}

// ─── Form handlers ──────────────────────────────────────────────────

async function handleAuthSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('auth-email-input');
  const pwInput    = document.getElementById('auth-password-input');
  const errEl      = document.getElementById('auth-error');
  const btn        = e.target.querySelector('button[type="submit"]');
  if (!emailInput || !pwInput || !errEl || !btn) return;

  const email = emailInput.value.trim().toLowerCase();
  const password = pwInput.value;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errEl.textContent = 'Please enter a valid email address';
    return;
  }
  if (!password) {
    errEl.textContent = 'Password required';
    return;
  }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    await sbSignIn(email, password);
    // onAuthChange handles the routing after a successful sign-in.
  } catch (err) {
    console.error(err);
    errEl.textContent = err?.message || 'Could not sign in';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

async function handleAuthResetSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('auth-reset-email');
  const errEl      = document.getElementById('auth-reset-error');
  const btn        = e.target.querySelector('button[type="submit"]');
  if (!emailInput || !errEl || !btn) return;

  const email = emailInput.value.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errEl.textContent = 'Please enter a valid email address';
    return;
  }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await sbSendPasswordReset(email);
    showAuthCheckView(email);
  } catch (err) {
    console.error(err);
    errEl.textContent = err?.message || 'Could not send reset link';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send reset link';
  }
}

async function handleAuthSetPasswordSubmit(e) {
  e.preventDefault();
  const pwInput      = document.getElementById('auth-setpw-input');
  const confirmInput = document.getElementById('auth-setpw-confirm');
  const errEl        = document.getElementById('auth-setpw-error');
  const btn          = e.target.querySelector('button[type="submit"]');
  if (!pwInput || !confirmInput || !errEl || !btn) return;

  const password = pwInput.value;
  const confirm  = confirmInput.value;
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters';
    return;
  }
  if (password !== confirm) {
    errEl.textContent = "Passwords don't match";
    return;
  }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    await sbUpdatePassword(password);
    _inPasswordRecovery = false;
    showSnack('✓ Password set');
    if (CURRENT_SESSION) await afterSignIn(CURRENT_SESSION);
  } catch (err) {
    console.error(err);
    errEl.textContent = err?.message || 'Could not save password';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save and sign in';
  }
}

// ─── Recovery: nuke local state and reload ──────────────────────────
//
// The "Trouble signing in?" button on the sign-in view. Wipes the
// service worker cache, supabase localStorage, and any IndexedDB stores
// the app uses, then reloads. This is the in-app equivalent of "open
// in private tab" — useful when iOS Safari has corrupted persistent
// state (the v45 → v46 SW swap should make this rarer, but still
// possible).
async function resetAuthCache() {
  try {
    if (typeof SB !== 'undefined') { try { await SB.auth.signOut(); } catch {} }
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    if (navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({ type: 'CB_RESET_CACHE' });
      } catch {}
    }
    if (typeof indexedDB !== 'undefined') {
      try {
        const dbs = await indexedDB.databases?.();
        for (const d of (dbs || [])) {
          if (d.name) indexedDB.deleteDatabase(d.name);
        }
      } catch {}
    }
    if (navigator.serviceWorker) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      } catch {}
    }
  } finally {
    // Hard reload bypassing browser cache.
    location.replace(location.pathname + '?reset=' + Date.now());
  }
}

// ─── Sign out ───────────────────────────────────────────────────────

async function doSignOut() {
  const ok = await confirmSheet({
    title:        'Sign out of Car Bingo?',
    body:         "You'll need to enter your password again to come back.",
    confirmLabel: 'Sign out',
    danger:       true,
  });
  if (!ok) return;
  await sbSignOut();
  // onAuthChange fires SIGNED_OUT and routes back to the auth screen.
}

// ─── Settings: account row ──────────────────────────────────────────

async function showAccountInfo() {
  const data = await openFormSheet({
    title:       'Your account',
    submitLabel: 'Save',
    fields: [
      { id:'display_name', label:'Display name', required:true, placeholder:'How others see you' },
    ],
    initial: { display_name: currentDisplayName() },
  });
  if (!data) return;
  try {
    await sbUpdateDisplayName(data.display_name);
    if (CURRENT_PROFILE) CURRENT_PROFILE.display_name = data.display_name;
    refreshAccountRow();
    showSnack('✓ Name updated');
  } catch (err) {
    showErr('Could not update name', err);
  }
}

function refreshAccountRow() {
  const nameEl  = document.getElementById('sr-account-name');
  const emailEl = document.getElementById('sr-account-email');
  if (nameEl)  nameEl.textContent  = currentDisplayName();
  if (emailEl) emailEl.textContent = currentEmail() || '—';
}

// ─── Bootstrap ──────────────────────────────────────────────────────

async function bootAuth() {
  sbOnAuthChange(async (event, session) => {
    CURRENT_SESSION = session || null;

    // Recovery link clicked → user has a session but the only thing they
    // should be able to do right now is set a new password.
    if (event === 'PASSWORD_RECOVERY') {
      _inPasswordRecovery = true;
      // Strip ?code from URL so a refresh doesn't re-fire recovery.
      if (window.location.search.includes('code=')) {
        history.replaceState(null, '', window.location.pathname + window.location.hash);
      }
      showAuthSetPasswordView();
      return;
    }

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      if (_inPasswordRecovery) return;  // don't navigate away from set-password view
      if (session) {
        if (window.location.search.includes('code=')) {
          history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
        await afterSignIn(session);
      } else if (event === 'INITIAL_SESSION') {
        showAuthScreen();
      }
      return;
    }

    if (event === 'SIGNED_OUT') {
      CURRENT_PROFILE = null;
      _inPasswordRecovery = false;
      showAuthScreen();
    }
  });

  // Belt-and-braces — if no event has fired in a quarter second, route
  // based on the current session.
  setTimeout(async () => {
    if (CURRENT_SESSION || _inPasswordRecovery) return;
    const session = await sbGetSession();
    if (!session) showAuthScreen();
  }, 250);
}

async function afterSignIn(session) {
  CURRENT_SESSION = session;
  CURRENT_PROFILE = await sbGetProfile();
  showAppScreen();
  refreshAccountRow();
  if (typeof initSetup === 'function') {
    try { await initSetup(); } catch (e) { console.warn('initSetup:', e); }
  }
  if (typeof buildNav === 'function') buildNav('home');
  if (typeof Queue !== 'undefined') Queue.drain().catch(() => {});
  if (typeof PhotoBin !== 'undefined') {
    PhotoBin.sync()
      .then(() => { if (typeof refreshHomeShortcuts === 'function') refreshHomeShortcuts(); })
      .catch(() => {});
  }
}
