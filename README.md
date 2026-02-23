# 🏎️ Car Bingo

A classic car spotting app for shows and events. PIN-protected, with optional Supabase sync.

## Setup

### 1. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/car-bingo.git
git push -u origin main
```

Then in your GitHub repo: **Settings → Pages → Source: main branch / root**

Your app will be live at: `https://YOUR_USERNAME.github.io/car-bingo/`

---

### 2. Change the PIN

The default PIN is `2407`. To change it:

1. Open `index.html`
2. Find the line `const PIN_HASH = 'MjQwNw==';`
3. Generate your new hash in your browser console:
   ```js
   btoa('your-new-pin')
   ```
4. Replace the hash value and push to GitHub

---

### 3. Set up Supabase (optional — enables sync across devices)

#### Create tables

In your Supabase project → **SQL Editor**, run:

```sql
-- Events
create table events (
  id           bigserial primary key,
  name         text not null unique,
  location     text,
  date         text,
  created_at   timestamptz default now()
);

-- Sightings
create table sightings (
  id           bigserial primary key,
  event_name   text not null references events(name) on delete cascade,
  car_name     text not null,
  car_era      text,
  car_make     text,
  car_rarity   text,
  count        int default 1,
  spotted_at   timestamptz default now(),
  unique(event_name, car_name)
);

-- Cars (optional — populated by the app on first load)
create table cars (
  name       text primary key,
  make       text,
  model      text,
  era        text,
  country    text,
  rarity     text,
  years      text,
  produced   text,
  surviving  text,
  value      text,
  desc       text,
  hagerty    text,
  wiki       text,
  flag       text
);

-- Row Level Security (allow public read/write — app is PIN-protected)
alter table events   enable row level security;
alter table sightings enable row level security;
alter table cars     enable row level security;

create policy "public access" on events    for all using (true) with check (true);
create policy "public access" on sightings for all using (true) with check (true);
create policy "public access" on cars      for all using (true) with check (true);
```

#### Wire up the app

1. Go to your Supabase project → **Settings → API**
2. Copy your **Project URL** and **anon public key**
3. Open `js/supabase.js` and replace:
   ```js
   const SUPABASE_URL  = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
   ```
4. Commit and push

The app will now sync spotted cars and events to Supabase automatically. It falls back to localStorage if Supabase is unavailable.

---

## File Structure

```
car-bingo/
├── index.html        ← App shell, PIN gate, all CSS
├── js/
│   ├── cars.js       ← 500 cars database + Wikipedia image map
│   ├── supabase.js   ← Supabase client and DB helpers
│   └── app.js        ← All app logic
└── README.md
```

## Features

- 500 classic cars across 5 eras (Pre-War → 1990s)
- Filter by make, country, era, rarity
- Log sightings with photo capture
- Garage view — all cars spotted across all events
- Hagerty valuation links
- Wikipedia images for every car
- PIN-protected (shared family access)
- Supabase sync — spot on one device, see it on all
- Works offline (localStorage fallback)
