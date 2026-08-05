# Wander Éire — Project Brief
*(placeholder name — not final)*

## What this is
An interactive road-trip discovery map for the island of Ireland (32 counties, no border distinction). Users browse trails, historic sites, viewpoints, beaches, and camping spots on a real map, tap a pin for details (photos, directions, parking, cost), and can tick off places they've visited and save favourites. Admin (owner) adds/edits locations as new recommendations come in. Free to use.

**Builder:** solo, using Claude Code. **Status:** pre-build, scaffolding now.

## v1 Scope
- Real map (actual roads/geography — not illustrated), styled to a custom bright/bold theme
- Browse by category, filter chips, map/list toggle
- Tap pin → detail sheet: photos, how to get there, parking, cost, tick-off, save
- Signed-in users can upload their own photos + comments per location
- Admin route: add/edit locations (protected by role flag)
- No leaderboards / public social layer in v1 — personal tick-offs and saves only

## Tech Stack
- **Frontend:** React + Vite, MapLibre GL JS
- **Map tiles:** MapTiler free tier or OpenStreetMap (real geography — decided against a purely illustrated map; vector tile styling gets the illustrated *look* while keeping real coordinates)
- **Backend:** Supabase — Postgres + PostGIS (location queries), Auth (email/Google sign-in, required for uploads/comments), Storage (user + admin photos)
- **Hosting:** Vercel or Netlify, free tier
- **Mobile:** PWA first (installable, no app store needed); Capacitor wraps the same codebase into iOS/Android later — no rebuild
- **Admin:** a protected `/admin` route inside the same app, gated by a `role` field on the user's profile — not a separate app

## Data Model (draft)
- `locations` — name, lat, lng, county, category, description, how_to_get_there, parking_info, cost_type (free/paid), cost_amount, admin_photos[]
- `user_ticks` — user_id, location_id, ticked_at
- `user_saves` — user_id, location_id, saved_at
- `user_photos` — user_id, location_id, photo_url, uploaded_at
- `comments` — user_id, location_id, text, created_at
- `profiles` — user_id, role (admin/user), display_name

## Design System
**Palette**
| Name | Hex | Use |
|---|---|---|
| Cream | #FBF3E7 | app background |
| Ink | #1E2A22 | text, chrome |
| Emerald | #1F7A4D | Trail category |
| Terracotta | #E2603D | Historic category |
| Amber | #F0A93A | Viewpoint category |
| Ocean | #1C7293 | Beach/Coast category |
| Plum | #6B4A85 | Camping category |

Colour = category throughout — it's the primary label, not decoration. New categories (Food, Stay, etc.) get their own hue following the same logic.

**Type:** Space Grotesk (display/headings), Inter (body/UI), IBM Plex Mono (data — distances, costs, timestamps)

**Pins:** circular "tack" badges (solid ring + drop shadow), not teardrop map markers — white icon on category colour. Reference concept: a pin pushed into a corkboard travel map, not a generic Google Maps pin.

**Reference mockup:** `wander-eire-map-mockup.jsx` (React/Tailwind, built earlier in this project's design pass) — shows the map screen, filter chips, pin interaction, and bottom sheet with tick-off/save buttons live.

## Build Order
1. **Map + seeded locations + admin CRUD** — no auth yet. Usable v1 on its own.
2. **Auth + tick-offs + saves + user photos/comments** — layer in Supabase Auth and the social/personal-tracking features.
3. **Polish + PWA + Capacitor wrap** — app-store-ready build once the web version is solid.

## Content
Starting from scratch — no location data compiled yet. Admin will research/compile county by county.

## Open decisions (not yet locked in)
- Final app name (Wander Éire is a placeholder)
- Whether a public leaderboard/social layer gets added post-v1
- Native app store timeline (post-PWA)
