# Wander Éire

An installable Ireland discovery guide built with React, TypeScript, MapLibre, MapTiler and Supabase.

## Current development status

Read [project status and session handoff](docs/PROJECT-STATUS.md) before continuing
development. It records the current phase, unfinished changes, checks, connections,
and zero-cost requirement. The [architecture proposal](docs/IRELAND_MAP_PLATFORM_ARCHITECTURE.md)
describes the intended direction, not the current deployed feature set.

## What is working

- Database-backed places across all five categories
- Interactive map, search, filters, list view and location details
- All-island satellite imagery, 3D elevation and hillshade with the existing MapTiler key
- Ireland overview, 2D/3D toggle, regional landscape shortcuts and search-to-map exploration
- Email/password and optional Google sign-in
- Private saved places and visited-place tracking
- Community notes and private photo uploads with admin moderation
- Admin location publishing, editing, archiving and restoring
- Profile editing and permanent account deletion
- Password recovery, privacy page and installable PWA shell

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Fill in the three public browser values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
VITE_MAPTILER_API_KEY=YOUR_MAPTILER_KEY
```

Never put a Supabase `service_role` key in this app.

3. Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Supabase setup

Run these files in the Supabase SQL Editor, in order:

1. `supabase/schema.sql`
2. `supabase/next-step.sql`
3. `supabase/photos-step.sql`
4. `supabase/account-step.sql`
5. `supabase/security-step.sql`

The final security step limits profile edits to `display_name`, so a normal user cannot turn themselves into an administrator.

Content batches (e.g. `supabase/locations-batch-2.sql`) can be run any time afterwards to seed more locations — each upserts by `id`, so re-running is safe.

In Supabase **Authentication → URL Configuration**, use `http://localhost:5173` as the local Site URL and add `http://localhost:5173/**` as a local redirect URL. Add the production site and `/reset-password` redirect when the app is deployed.

To make an existing account an administrator, run this in the SQL Editor with the correct email:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'you@example.com'
);
```

## Checks

```bash
npm run lint
npm run build
node scripts/check-landscape.mjs
npm run preview
```

The production files are written to `dist/`.

## Map storage trial

A small Wicklow vector sample is hosted on Supabase Free and combined in MapLibre
with hosted satellite imagery, 3D elevation and hillshade; R2 remains disabled.
Run `npm run dev` and open `/geo/trial/` to view the development-only trial.
Run `node scripts/check-map-storage.mjs` for the bounded, read-only range check.
See [trial results and limits](docs/MAP-STORAGE-TRIAL.md). Satellite and terrain
are now also integrated into the main app locally; the Supabase PMTiles sample
remains a separate trial. Nothing has been deployed by this continuation.
