// ══════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — Auth + DB access
//
// The supabase-js library is loaded via CDN in index.html and exposes
// the global `supabase` namespace (with createClient on it).
// ══════════════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://itjdpmxqsxodrqmwfoyf.supabase.co';
const SUPABASE_ANON = 'sb_publishable_iiFm7jpE-pweUlSCFYdtyw_ImNM1L-I';

// In-process mutex used as the auth lock. supabase-js v2's default lock
// uses navigator.locks, which on iOS Safari can deadlock when the
// surrounding localStorage state is mid-corruption (the symptom is
// signInWithPassword hanging forever, button stuck at "Signing in…").
// We only ever have one auth client in this app and don't fire
// concurrent auth ops, so a tiny FIFO-serialised mutex is a safe
// drop-in replacement that never deadlocks.
//
// The inner callback is also timeout-bounded: a token refresh stuck on
// a flaky-show-Wi-Fi fetch was holding the lock indefinitely, queueing
// every subsequent SB operation forever (symptom: tap a car, nothing
// happens, only sign-out fixes it). 20s is generous for any real
// auth/refresh round-trip; past that the request is dead anyway.
const _authLockQueue = [];
let   _authLockBusy  = false;
async function _appAuthLock(_name, _acquireTimeout, fn) {
  if (_authLockBusy) {
    await new Promise(resolve => _authLockQueue.push(resolve));
  }
  _authLockBusy = true;
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(
        () => reject(new Error('Auth lock timed out — releasing to avoid deadlock')),
        20000
      )),
    ]);
  } finally {
    _authLockBusy = false;
    const next = _authLockQueue.shift();
    if (next) next();
  }
}

// Promise.race-based timeout — supabase-js calls can hang indefinitely
// on iOS in some flaky-network scenarios; we'd rather show an error
// than leave the user staring at "Signing in…".
function _withAuthTimeout(promise, label, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(
      () => reject(new Error(`${label} timed out — check your connection and try again`)),
      ms
    )),
  ]);
}

const SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    flowType:           'pkce',
    lock:               _appAuthLock,
    debug:              false,
  },
});

// ─── Session ─────────────────────────────────────────────────────────

async function sbGetSession() {
  const { data: { session } } = await SB.auth.getSession();
  return session;
}

async function sbGetUserId() {
  const session = await sbGetSession();
  return session?.user?.id || null;
}

async function sbGetEmail() {
  const session = await sbGetSession();
  return session?.user?.email || null;
}

function sbOnAuthChange(cb) {
  return SB.auth.onAuthStateChange((event, session) => cb(event, session));
}

// ─── Email + password sign-in ────────────────────────────────────────

async function sbSignIn(email, password) {
  const { error } = await _withAuthTimeout(
    SB.auth.signInWithPassword({ email, password }),
    'Sign in'
  );
  if (error) throw error;
}

// First-time setup or "forgot password": Supabase emails a recovery link
// that, when clicked, opens the app authenticated and fires the
// PASSWORD_RECOVERY event. The Set-Password view then lets the user
// pick a password via sbUpdatePassword.
async function sbSendPasswordReset(email) {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await _withAuthTimeout(
    SB.auth.resetPasswordForEmail(email, { redirectTo }),
    'Send reset email'
  );
  if (error) throw error;
}

async function sbUpdatePassword(password) {
  const { error } = await _withAuthTimeout(
    SB.auth.updateUser({ password }),
    'Save password'
  );
  if (error) throw error;
}

async function sbSignOut() {
  // Best-effort: kick off the network signOut, but don't let it block the
  // UI. supabase-js v2's signOut walks the auth lock and POSTs /logout;
  // either of those can hang on flaky show-Wi-Fi or a corrupted local
  // session, leaving FIL stuck on a screen that looks like nothing
  // happened. We always clear our own session state and let the caller
  // route to the auth screen immediately.
  try { SB.auth.signOut().catch(e => console.warn('sbSignOut network:', e)); }
  catch (e) { console.warn('sbSignOut sync:', e); }
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k.includes('supabase')) {
        localStorage.removeItem(k);
      }
    });
  } catch {}
}

// ─── Profile ─────────────────────────────────────────────────────────

async function sbGetProfile() {
  const userId = await sbGetUserId();
  if (!userId) return null;
  const { data, error } = await SB.from('profiles').select('*').eq('id', userId).single();
  if (error) { console.warn('sbGetProfile:', error); return null; }
  return data;
}

async function sbUpdateDisplayName(name) {
  const userId = await sbGetUserId();
  if (!userId) return;
  const { error } = await SB.from('profiles').update({ display_name: name }).eq('id', userId);
  if (error) throw error;
}
