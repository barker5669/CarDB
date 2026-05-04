// Car Bingo Service Worker v2
//
// Key behaviours:
//
// - Non-GET requests (POST/PUT/DELETE etc.) NEVER touch the cache.
//   Previously the supabase auth POST would fall through to a cached
//   GET response on network blips — which corrupted login flows.
//
// - HTML navigations are network-first: stale auth/UI code shouldn't
//   linger on FIL's phone. Falls back to cache only if offline.
//
// - JS / CSS / fonts are stale-while-revalidate: instant load from
//   cache for speed, refreshed in the background so the next reload
//   gets the new build. Critical for upgrade gap recovery.
//
// - Supabase / Wikipedia / Nominatim API calls are network-first
//   with a cache fallback for offline (only useful for prior reads).
//
// - Storage API responses for photos in the 'photos' bucket are
//   cache-first when present so a slow connection doesn't blank the
//   bingo card.
const CACHE = 'carbingo-v60';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/cars.js',
  '/js/db.js',
  '/js/forms.js',
  '/js/localphotos.js',
  '/js/mycars.js',
  '/js/photobin.js',
  '/js/photocache.js',
  '/js/queue.js',
  '/js/supabase.js',
  '/js/upcoming.js',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  // Page can ask the SW to nuke its cache as a recovery action.
  if (e.data && e.data.type === 'CB_RESET_CACHE') {
    e.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => e.source && e.source.postMessage({ type: 'CB_RESET_CACHE_DONE' }))
    );
  }
});

function _isApi(url) {
  return url.hostname.includes('supabase')
      || url.hostname.includes('nominatim')
      || url.hostname.includes('wikipedia');
}

function _isPhotoStorage(url) {
  return url.hostname.includes('supabase') && url.pathname.includes('/storage/v1/object/public/photos/');
}

function _isHtmlNav(req, url) {
  return req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Non-GET: never cache, never fall back. Let it reach the network.
  if (req.method !== 'GET') return;

  // Photos in the public bucket: cache-first (poor signal at shows).
  if (_isPhotoStorage(url)) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Other API calls: network-first, fallback to cache on offline.
  if (_isApi(url)) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // HTML navigations: network-first so new auth/UI code lands fast.
  if (_isHtmlNav(req, url)) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // Other GETs (JS, CSS, fonts): stale-while-revalidate.
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
