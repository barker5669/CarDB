// ══════════════════════════════════════════════════════════════════════
// AUTH FLOW — login screen + session gating
// ══════════════════════════════════════════════════════════════════════

// Cache of the current session for synchronous access elsewhere.
let CURRENT_SESSION = null;
let CURRENT_PROFILE = null;

function currentUserId()      { return CURRENT_SESSION?.user?.id || null; }
function currentEmail()       { return CURRENT_SESSION?.user?.email || null; }
function currentDisplayName() { return CURRENT_PROFILE?.display_name || currentEmail()?.split('@')[0] || 'You'; }

// ─── Screen routing ──────────────────────────────────────────────────

function showAuthScreen() {
  document.getElementById('s-auth')?.classList.add('active');
  document.getElementById('s-app')?.classList.remove('active');
  showAuthEmailView();
}

function showAppScreen() {
  document.getElementById('s-auth')?.classList.remove('active');
  document.getElementById('s-app')?.classList.add('active');
}

function showAuthEmailView() {
  const emailView = document.getElementById('auth-email-view');
  const checkView = document.getElementById('auth-check-view');
  if (emailView) emailView.style.display = '';
  if (checkView) checkView.style.display = 'none';
  const errEl = document.getElementById('auth-error');
  if (errEl) errEl.textContent = '';
}

function showAuthCheckView(email) {
  const emailView = document.getElementById('auth-email-view');
  const checkView = document.getElementById('auth-check-view');
  if (emailView) emailView.style.display = 'none';
  if (checkView) checkView.style.display = '';
  const sentTo = document.getElementById('auth-sent-to');
  if (sentTo) sentTo.textContent = email;
}

function authReset() {
  showAuthEmailView();
  const input = document.getElementById('auth-email-input');
  if (input) { input.value = ''; input.focus(); }
}

// ─── Login form submit ───────────────────────────────────────────────

async function handleAuthSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('auth-email-input');
  const errEl = document.getElementById('auth-error');
  const btn   = e.target.querySelector('button[type="submit"]');
  if (!input || !errEl || !btn) return;

  const email = input.value.trim().toLowerCase();
  // Cheap email shape check; Supabase will validate properly server-side.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errEl.textContent = 'Please enter a valid email address';
    return;
  }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await sbSendMagicLink(email);
    showAuthCheckView(email);
  } catch (err) {
    console.error(err);
    errEl.textContent = err?.message || 'Could not send the link. Try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send sign-in link';
  }
}

// ─── Sign out ────────────────────────────────────────────────────────

async function doSignOut() {
  const ok = await confirmSheet({
    title:        'Sign out of Car Bingo?',
    body:         "You'll need a new sign-in link to come back.",
    confirmLabel: 'Sign out',
    danger:       true,
  });
  if (!ok) return;
  await sbSignOut();
  // onAuthChange will fire SIGNED_OUT and route back to the auth screen.
}

// ─── Settings: account row ───────────────────────────────────────────

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
    console.error(err);
    showSnack('⚠️ Could not update name');
  }
}

function refreshAccountRow() {
  const nameEl  = document.getElementById('sr-account-name');
  const emailEl = document.getElementById('sr-account-email');
  if (nameEl)  nameEl.textContent  = currentDisplayName();
  if (emailEl) emailEl.textContent = currentEmail() || '—';
}

// ─── Bootstrap ───────────────────────────────────────────────────────

async function bootAuth() {
  // Subscribe BEFORE the initial getSession so we don't miss the
  // SIGNED_IN event that fires when detectSessionInUrl exchanges the
  // magic-link code on page load.
  sbOnAuthChange(async (event, session) => {
    CURRENT_SESSION = session || null;
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      if (session) {
        // Strip ?code from URL once handled, so a refresh doesn't re-run.
        if (window.location.search.includes('code=')) {
          history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
        await afterSignIn(session);
      } else if (event === 'INITIAL_SESSION') {
        showAuthScreen();
      }
    } else if (event === 'SIGNED_OUT') {
      CURRENT_PROFILE = null;
      showAuthScreen();
    }
  });

  // Belt-and-braces: if for any reason the listener didn't fire within a
  // short window (e.g. no code in URL, no stored session), make sure we
  // route to a sensible screen.
  setTimeout(async () => {
    if (CURRENT_SESSION) return;
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
  // Drain anything queued from a previous session.
  if (typeof Queue !== 'undefined') Queue.drain().catch(() => {});
}
