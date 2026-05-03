// ══════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — Auth + DB access
//
// The supabase-js library is loaded via CDN in index.html and exposes
// the global `supabase` namespace (with createClient on it).
// ══════════════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://itjdpmxqsxodrqmwfoyf.supabase.co';
const SUPABASE_ANON = 'sb_publishable_iiFm7jpE-pweUlSCFYdtyw_ImNM1L-I';

// Single shared client instance. PKCE + autoRefresh + persistSession is
// the modern browser-app default; detectSessionInUrl handles the
// magic-link redirect callback automatically.
const SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    flowType:           'pkce',
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
  const { error } = await SB.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// First-time setup or "forgot password": Supabase emails a recovery link
// that, when clicked, opens the app authenticated and fires the
// PASSWORD_RECOVERY event. The Set-Password view then lets the user
// pick a password via sbUpdatePassword.
async function sbSendPasswordReset(email) {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await SB.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

async function sbUpdatePassword(password) {
  const { error } = await SB.auth.updateUser({ password });
  if (error) throw error;
}

async function sbSignOut() {
  const { error } = await SB.auth.signOut();
  if (error) console.warn('sbSignOut:', error);
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
