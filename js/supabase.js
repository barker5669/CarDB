// ══════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG — replace these with your actual project values
// ══════════════════════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://itjdpmxqsxodrqmwfoyf.supabase.co';
const SUPABASE_ANON = 'sb_publishable_iiFm7jpE-pweUlSCFYdtyw_ImNM1L-I';
// ══════════════════════════════════════════════════════════════════════
// CLIENT — lazy-initialised, works whether Supabase is configured or not
// ══════════════════════════════════════════════════════════════════════
let _sb = null;
function sb() {
  if (!_sb) {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return null; // not yet configured
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _sb;
}

function sbReady() { return !!sb(); }

// ══════════════════════════════════════════════════════════════════════
// EVENTS  — name, location, date
// ══════════════════════════════════════════════════════════════════════

async function sbGetEvents() {
  if (!sbReady()) return [];
  const { data, error } = await sb()
    .from('events')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.warn('sbGetEvents:', error); return []; }
  return data;
}

async function sbUpsertEvent(ev) {
  // ev = { name, location, date }
  if (!sbReady()) return null;
  const { data, error } = await sb()
    .from('events')
    .upsert({ name: ev.name, location: ev.location, date: ev.date }, { onConflict: 'name' })
    .select()
    .single();
  if (error) { console.warn('sbUpsertEvent:', error); return null; }
  return data;
}

// ══════════════════════════════════════════════════════════════════════
// SIGHTINGS  — one row per car spotted per event
// ══════════════════════════════════════════════════════════════════════

async function sbGetSightings(eventName) {
  if (!sbReady()) return [];
  const { data, error } = await sb()
    .from('sightings')
    .select('*')
    .eq('event_name', eventName)
    .order('spotted_at', { ascending: true });
  if (error) { console.warn('sbGetSightings:', error); return []; }
  return data;
}

async function sbGetAllSightings() {
  if (!sbReady()) return [];
  const { data, error } = await sb()
    .from('sightings')
    .select('*')
    .order('spotted_at', { ascending: false });
  if (error) { console.warn('sbGetAllSightings:', error); return []; }
  return data;
}

async function sbAddSighting(sighting) {
  // sighting = { event_name, car_name, car_era, car_make, car_rarity, count, spotted_at }
  if (!sbReady()) return null;
  const { data, error } = await sb()
    .from('sightings')
    .upsert(sighting, { onConflict: 'event_name,car_name' })
    .select()
    .single();
  if (error) { console.warn('sbAddSighting:', error); return null; }
  return data;
}

async function sbUpdateSightingCount(eventName, carName, count) {
  if (!sbReady()) return;
  const { error } = await sb()
    .from('sightings')
    .update({ count, spotted_at: new Date().toISOString() })
    .eq('event_name', eventName)
    .eq('car_name', carName);
  if (error) console.warn('sbUpdateSightingCount:', error);
}

async function sbDeleteSighting(eventName, carName) {
  if (!sbReady()) return;
  const { error } = await sb()
    .from('sightings')
    .delete()
    .eq('event_name', eventName)
    .eq('car_name', carName);
  if (error) console.warn('sbDeleteSighting:', error);
}

// ══════════════════════════════════════════════════════════════════════
// CARS  — seed from CAR_DB if table is empty (run once)
// ══════════════════════════════════════════════════════════════════════

async function sbSeedCarsIfEmpty() {
  if (!sbReady()) return;
  const { count } = await sb().from('cars').select('*', { count: 'exact', head: true });
  if (count > 0) return; // already seeded
  console.log('Seeding cars table...');
  // Batch in chunks of 100
  for (let i = 0; i < CAR_DB.length; i += 100) {
    const chunk = CAR_DB.slice(i, i + 100).map(c => ({
      name: c.name, make: c.make, model: c.model,
      era: c.era, country: c.country, rarity: c.rarity,
      years: c.years, produced: c.produced, surviving: c.surviving,
      value: c.value, "desc": c.desc, hagerty: c.hagerty || null,
      wiki: WIKI_PAGES[c.name] || null, flag: c.flag
    }));
    const { error } = await sb().from('cars').insert(chunk);
    if (error) console.warn('sbSeedCars chunk error:', error);
  }
  console.log('Cars seeded.');
}

// ══════════════════════════════════════════════════════════════════════
// SYNC HELPER — merge Supabase sightings into local S.spotted format
// ══════════════════════════════════════════════════════════════════════

function sightingsToSpotted(sightings) {
  const spotted = {};
  sightings.forEach(row => {
    const key = `fil-${row.car_era}-${row.car_name}`;
    spotted[key] = {
      event:    row.event_name,
      ts:       row.spotted_at,
      sightings: Array.from({ length: row.count }, (_, i) => ({
        id:     `${key}-${i}`,
        event:  row.event_name,
        ts:     row.spotted_at,
        photos: []
      }))
    };
  });
  return spotted;
}
