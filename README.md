# 🏎️ Car Bingo

A classic car spotting & bingo app for car shows. Two-user (you + a co-spotter), authenticated, photos backed up to the cloud.

Frontend lives on GitHub Pages. Backend (auth, data, photos) is Supabase.

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
- Public bucket: **on** (URLs are unguessable; this lets `<img src>`
  work without minting signed URLs for every render)

The Storage RLS policies in `schema.sql` restrict uploads to a
per-user folder (`<user_id>/...`), so users can only write under their
own prefix.

### 3. Add the GitHub Pages URL to the Auth allow-list

Dashboard → **Authentication → URL Configuration**

- Site URL: `https://<you>.github.io/CarDB/` (or your custom domain)
- Redirect URLs: add the same URL

This is what the password-reset emails redirect back to (the only emails the app sends are first-time / forgot-password recovery links).

### 4. Create users

Dashboard → **Authentication → Users → Add User** for each person.
A profile row is created automatically by the `on_auth_user_created`
trigger.

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
