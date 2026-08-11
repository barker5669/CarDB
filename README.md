# 🏎️ Car Bingo

Spot classic cars at car shows. You get a bingo card of cars that might
turn up, tick them off as you find them in the flesh, and photograph the
good ones. Keep a collection of everything you've ever spotted, a log of
your own cars, and a calendar of shows worth going to.

**→ [barker5669.github.io/CarDB](https://barker5669.github.io/CarDB/)**

Works on a phone, offline, at a muddy showground with no signal.

---

# Using Car Bingo

## Getting an account

> ⚠️ **Not wired up yet.** Accounts currently have to be created from
> the Supabase dashboard (Authentication → Users → Add User). The app's
> "First time / Forgot password?" screen only sends recovery links to
> people who *already* have an account — for a new email it silently
> does nothing, so a new visitor gets stuck on "Check your email".
> Self-serve signup needs a `signUp()` call adding to the auth screen.

Once you have an account:

1. Open the app and tap **First time / Forgot password?**
2. Type your email, tap **Send reset link**
3. Open the email **on the same device** and tap the link
4. Choose a password, twice, and you're in

After that it's just email + password. You stay signed in indefinitely —
the session refreshes itself — until you sign out.

Set your name under **Settings → Account**; everyone starts as
"New spotter".

## Put it on your home screen

Worth doing properly, not just for the full-screen look.

- **iPhone**: Safari → Share → Add to Home Screen
- **Android**: Chrome → menu → Install app

**Your photos live on your phone, not on a server.** Installing the app
tells iOS the storage is worth keeping — otherwise Safari can clear it
when space runs low or after a stretch of not using the site, and the
photos go with it. See *Backing up* below.

## Running a show

Tap **Bingo → Start a new show**, name it, and you get a card of cars
that plausibly turn up at that sort of event. Not all common ones — the
mix is weighted so there's something to chase.

- Tap a car to see what you're looking for: photo, years, maker, and why
  it matters
- Found one? **I've spotted it**, then photograph it
- **Reroll** swaps the card out if the mix is hopeless — three per show
- Card size and which eras appear: **Settings → Bingo card**

Shows don't have to be finished in one go. End it and pick it up later
from **Shows → Past**; the card and everything you spotted come back.

Spotting a car that isn't on your card still counts — **Spotted → + Add**
logs anything, and it all lands in your collection.

## Spotting together

Shows are private to you. To spot alongside someone at the same event,
share the code:

1. You: open the show → menu → **Event Summary** → read the 8-character
   code
2. Them: Bingo tab → menu → **Join a show with a code**

You'll both see a combined leaderboard and a shared list of what's been
found. Photos stay private to whoever took them.

Anyone with the code can see what's spotted at that show, and there's no
way to remove someone afterwards short of deleting the show — so treat
the code as the permission.

## Your collection

**Collection** is everything you've ever spotted, across every show,
filterable by era, maker, country, rarity or event. Lifetime counts live
on the home screen.

**My Cars** is your own vehicles — service, modifications, drives, notes
and photos against each one, so it doubles as a history file.

## Upcoming shows

The **Shows → Upcoming** calendar is shared with everyone using the app.
Add one you've spotted, and tap **Going** to RSVP. Anyone can add and
RSVP; only whoever added an event can edit or delete it.

Note it's genuinely shared — everyone signed in can read the name,
location and notes on every entry, so don't put anything private in the
notes field.

## Photos, and backing up

Photos never leave your device. Nobody else can see them, which is the
upside, and nothing restores them if the phone goes in a canal, which is
not.

**Settings → Back up data** saves one file with every car, show,
sighting and photo. Do it after a good show.

**Settings → Restore from backup** loads it back, on this device or a
new one. It's also how you move to a new phone.

## When there's no signal

Showgrounds are bad for reception, so the app expects it. Everything
keeps working offline — spot cars, take photos, browse the catalogue —
and anything that needs the server queues up and syncs when you have
bars again. The banner along the bottom tells you where you stand.

If it ever gets properly stuck, **Trouble signing in? Reset app** on the
sign-in screen clears the local cache without touching your data.

## What's private

| | Who can see it |
|---|---|
| Your photos | You — they never leave your device |
| Your collection and My Cars | You |
| Your bingo card | You |
| A show and what's spotted at it | You, plus anyone you gave the join code |
| Upcoming events calendar | Everyone signed in |
| Your display name | You, plus people you share a show with |

Your email address is never shown to other users.

---

# Self-hosting

Static frontend on GitHub Pages, Supabase for auth and data. No build
step — it's plain HTML, CSS and JS.

## 1. Apply the database schema

Supabase Dashboard → **SQL Editor → New Query**, paste
[`schema.sql`](schema.sql), run.

Destructive: it drops any existing schema first. Fresh projects only.

## 2. Create the photos Storage bucket

Dashboard → **Storage → New Bucket** — name `photos`, public **on**.

New photos don't go here; they're saved to IndexedDB on the device (see
`js/localphotos.js`). The bucket only holds legacy photos from before
that change, and `DB.storage.uploadPhoto` in `js/db.js` is dead code.

## 3. Apply the patches — required

Run [`schema-patch-harden.sql`](schema-patch-harden.sql), then
[`schema-patch-unassigned-photos.sql`](schema-patch-unassigned-photos.sql)
(that table is referenced by `js/db.js` but isn't in `schema.sql`, so
"Photos to sort" fails cross-device without it).

`schema.sql` was written when this was a two-person app, so most of its
policies read `using (true)` — fine when "authenticated" meant two
family members, wrong once anyone can register. The patch re-scopes
every table to the privacy table above and closes two holes:

- **Storage enumeration.** `photos public read` granted SELECT on
  `storage.objects` to the `public` role — which is what the Storage
  *list* API checks. Anyone holding the publishable key (it ships in
  `js/supabase.js`, so: anyone) could walk the bucket and download every
  legacy photo. Public `<img src>` URLs still work after the patch; the
  bucket just can't be listed.
- **Self-join.** `event_attendees` accepted any insert where
  `user_id = auth.uid()`, so any account could add itself to any event
  id and read that show's sightings. Joining now goes through
  `join_event_by_code()`.

Legacy photo URLs already handed out stay valid forever. To make them
revocable, switch the bucket to private and swap `getPublicUrl` for
`createSignedUrl` in `js/db.js`.

## 4. Auth configuration

**Authentication → URL Configuration**

- Site URL: `https://<you>.github.io/CarDB/`, or your custom domain
- Redirect URLs: the same

That's where password-recovery emails land — the only mail the app
sends.

**Authentication → Sign In / Providers → Email**

- Keep **Confirm email** on
- Turn on **CAPTCHA** (Settings → Bot and Abuse Protection) before
  publicising the URL, or scripted signups will fill the auth table

New users get a `profiles` row automatically from the
`on_auth_user_created` trigger, with display name "New spotter".

## 5. Deploy

```bash
git push origin main
```

[`deploy.yml`](.github/workflows/deploy.yml) publishes to Pages on every
push to `main`. [`keep-warm.yml`](.github/workflows/keep-warm.yml) pings
Supabase daily so the free tier doesn't pause the project.

Note the deploy uploads the whole repo, so anything committed here is
served publicly — including `schema.sql` and `tests.html`.

## File layout

```
CarDB/
├── index.html                 ← App shell and all markup
├── css/main.css               ← All styles
├── sw.js                      ← Service worker (offline cache)
├── manifest.json              ← PWA manifest
├── tests.html                 ← Browser test harness
├── schema.sql                 ← Run-once DB schema
├── schema-patch-*.sql         ← Apply in order after schema.sql
├── icons/
├── js/
│   ├── cars.js                ← Car catalogue + image map
│   ├── supabase.js            ← Client, auth helpers, session locking
│   ├── auth.js                ← Sign-in / recovery screens
│   ├── db.js                  ← Every Supabase read and write
│   ├── queue.js               ← Offline mutation queue
│   ├── localphotos.js         ← On-device photo store (IndexedDB)
│   ├── photocache.js          ← Blob cache for legacy remote photos
│   ├── photobin.js            ← "Photos to sort" bin
│   ├── forms.js               ← Bottom-sheet form helper
│   ├── mycars.js              ← My Cars tab
│   ├── upcoming.js            ← Upcoming events calendar
│   └── app.js                 ← Everything else
└── .github/workflows/
```
