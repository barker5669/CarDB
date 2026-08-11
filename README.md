# 🏎️ Car Bingo

A classic car spotting & bingo app for car shows. Open signup — anyone
can register and spot. Frontend lives on GitHub Pages; backend (auth,
data) is Supabase.

**Privacy model** — worth knowing before you change anything:

| Data | Who can see it |
|---|---|
| Your collection, my-cars, boards | You only |
| Photos | You only — they never leave your device (IndexedDB) |
| A show and its sightings | You, plus anyone you give the show's join code to |
| Upcoming events calendar | Everyone signed in; only the creator can edit their entry |
| Display name | You, plus people you share a show with |

---

## Setup

### 1. Apply the database schema

Open the Supabase Dashboard → **SQL Editor → New Query**, paste the
contents of [`schema.sql`](schema.sql), and run.

This creates all tables, RLS policies, and triggers. It is destructive
(drops any existing schema first) and is meant to be run on a fresh
project.

### 2. Create the photos Storage bucket

Dashboard → **Storage → New Bucket**

- Name: `photos`
- Public bucket: **on**

New photos no longer go here — they're saved to IndexedDB on the
device (see `js/localphotos.js`). The bucket only holds legacy photos
uploaded before that change, and `DB.storage.uploadPhoto` in
`js/db.js` is now dead code.

### 2b. Apply the hardening patch — required

Run [`schema-patch-harden.sql`](schema-patch-harden.sql), then
[`schema-patch-unassigned-photos.sql`](schema-patch-unassigned-photos.sql)
(that table is referenced by `js/db.js` but was never created, so
"Photos to sort" fails cross-device without it).

`schema.sql` was written when this was a two-person app, so most of
its policies read `using (true)` — fine when "authenticated" meant two
family members, wrong once anyone can register. The patch re-scopes
every table to the model in the table above, and closes two live
holes:

- **Storage enumeration.** The original `photos public read` policy
  granted SELECT on `storage.objects` to the `public` role — which is
  what the Storage *list* API checks. Anyone holding the publishable
  key (it ships in `js/supabase.js`, so: anyone) could walk the whole
  bucket and download every legacy photo. Public `<img src>` URLs
  still work after the patch; the bucket just can't be listed.
- **Self-join.** `event_attendees` accepted any insert where
  `user_id = auth.uid()`, so any account could add itself to any event
  id and then read that show's sightings. Joining now goes through
  `join_event_by_code()`.

Legacy photo URLs that have already been handed out stay valid
forever. To make them revocable, switch the bucket to private and swap
`getPublicUrl` for `createSignedUrl` in `js/db.js`.

### 3. Add the GitHub Pages URL to the Auth allow-list

Dashboard → **Authentication → URL Configuration**

- Site URL: `https://<you>.github.io/CarDB/` (or your custom domain)
- Redirect URLs: add the same URL

This is what the password-reset emails redirect back to (the only emails the app sends are first-time / forgot-password recovery links).

### 4. Signup

Signup is open — people register themselves from the app's "First time
/ Forgot password?" flow. A profile row is created automatically by the
`on_auth_user_created` trigger, with the neutral display name
"New spotter"; users rename themselves in Settings → Account.

Two things to turn on before you tell anyone about it:

- **Email confirmation** must stay on (Authentication → Sign In /
  Providers → Email → "Confirm email"). It's the only thing making a
  signup cost more than a keystroke.
- **CAPTCHA** (Authentication → Settings → Bot and Abuse Protection).
  Without it, nothing stops scripted signups filling your auth table.

### 4b. Sharing a show

Shows are private to their attendees. To spot alongside someone:

1. Host opens the show → menu → **Event Summary**, reads the code.
2. Guest taps the Bingo tab menu → **Join a show with a code**.

Codes are 8 hex characters (4.3bn combinations) and grant read access
to that show's sightings only. There's no way to un-share short of
deleting the show, so treat the code as the permission.

### 5. Deploy the frontend

```bash
git push origin main
```

GitHub Pages serves the static frontend from `main`. The
[deploy workflow](.github/workflows/deploy.yml) handles publishing,
and the [keep-warm workflow](.github/workflows/keep-warm.yml) pings
Supabase daily to prevent the free-tier inactivity pause.

---

## Sign-in flow

The app uses **Supabase email + password**.

**First time** (each user does this once):

1. Open the app URL
2. Tap "First time / Forgot password?"
3. Type your email and tap "Send reset link"
4. Open the email on the same device, tap the link
5. The app shows "Choose a password" — enter it twice, tap "Save and sign in"
6. Done — you're in. Future visits use email + password.

**Returning**: type your email + password, tap "Sign in". Session persists indefinitely (auto-refreshed) until you sign out.

**Forgot your password later**: same as first time — tap "First time / Forgot password?" and you'll get a reset email.

Add the app to the iPhone home screen via Safari's Share sheet for the
best experience (full-screen, durable storage).

---

## File layout

```
CarDB/
├── index.html           ← App shell + all CSS (extracted in a later phase)
├── schema.sql           ← Run-once DB schema for Supabase
├── manifest.json        ← PWA manifest
├── sw.js                ← Service worker (offline asset cache)
├── icons/               ← PWA icons
├── js/
│   ├── cars.js          ← Car catalogue + Wikipedia image map
│   ├── supabase.js      ← Supabase client + auth helpers
│   ├── auth.js          ← Login/sign-out flow
│   └── app.js           ← Main app logic (being progressively rewired
│                          to the per-user data layer)
└── .github/workflows/
    ├── deploy.yml       ← GitHub Pages deploy on push
    └── keep-warm.yml    ← Daily Supabase ping
```
