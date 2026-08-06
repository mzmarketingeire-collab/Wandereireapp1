---
stepsCompleted: [1, "confirmed", 2, "approved", 3, 4, "validated"]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-wander-eire-2026-08-05/prd.md
  - _bmad-output/planning-artifacts/prds/prd-wander-eire-2026-08-05/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-wander-eire-2026-08-05/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-wander-eire-2026-08-05/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-wander-eire-2026-08-05/ARCHITECTURE-SPINE.md
  - PROJECT-BRIEF.md
---

# Wander Éire - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Wander Éire, decomposing the requirements from the PRD, UX design (DESIGN.md + EXPERIENCE.md), and Architecture Spine into implementable stories, sequenced per PROJECT-BRIEF.md's 3-phase Build Order.

## Requirements Inventory

### Functional Requirements

FR-1: View published locations on the map — any user (anonymous or signed-in) sees pins for all published Locations on a real, styled map of Ireland.
FR-2: See own location on the map — device geolocation shows the user's position; denial degrades silently to full-Ireland view, no feature blocked.
FR-3: Filter by category — filter chips narrow visual focus; non-matching pins dim (reduced opacity), never disappear.
FR-4: Map/list toggle — switch between map view and a scrollable list view of the same filtered set.
FR-5: Search by name — secondary path to map browsing; case-insensitive substring match; explicit "no matches" state.
FR-6: View location detail sheet — tapping a pin/list item opens a Detail view with name, category, county, cost, distance (where applicable), description, how-to-get-there, parking, photos.
FR-7: Get directions — Detail view shows address/Eircode as copyable text (no deep-link in v1, explicit fast-follow).
FR-8: Anonymous detail-view limit — unauthenticated users get 3 distinct Detail view opens (lifetime, per-device); 4th triggers a Free Account prompt before the Detail view opens. Browsing/filtering never gated.
FR-9: Account creation — Free Account via email or Google sign-in (Supabase Auth).
FR-10: Profile — signed-in user has a profile with a display name.
FR-11: Tick off a location — signed-in user marks a Location visited from its Detail view; self-reported, no verification.
FR-12: Save a location — signed-in user bookmarks a Location from its Detail view, independent of tick-off state.
FR-13: View own ticks and saves — signed-in user views their ticked/saved list via Profile.
FR-14: Upload a photo — signed-in user uploads a photo to a Location in-app.
FR-15: Leave a comment — signed-in user leaves a text comment on a Location.
FR-16: Contributions are pending by default — user photos/comments are not publicly visible until Admin approves them.
FR-17: Offline contribution behavior — no offline queueing in v1; a failed upload attempt fails cleanly, user retries manually.
FR-18: Protected admin route — only `role: admin` profiles can access `/admin`; enforced server-side (RLS), not just a client route guard.
FR-19: Add a location — Admin creates a Location via a form with the fixed preset fields (name, category, county, description, how-to-get-there, parking, Cost Type/Amount, distance where applicable, photos).
FR-20: Set location coordinates — Admin sets coordinates by map click or address/Eircode auto-geocode; both methods always available.
FR-21: Immediate publish — submitting the admin form publishes the Location immediately; no draft/staged-review step.
FR-22: Edit and remove locations — Admin edits or soft-deletes (archives) any Location; associated ticks/saves/contributions retained, not destroyed.
FR-23: Moderate contributions — Admin views pending photos/comments and approves or rejects each before public visibility.

### NonFunctional Requirements

NFR-1 (Performance): Map should feel responsive on a mobile connection browsing rural areas with pins loaded from Supabase/PostGIS. No numeric target set for v1 — qualitative "feels fast on typical mobile data" bar.
NFR-2 (Security): Row-Level Security enforced in Supabase so users can only modify their own ticks/saves/contributions; admin role check enforced server-side (FR-18), never merely UI-hidden.
NFR-3 (Accessibility): Category is always colour + a distinct icon, never colour alone. Tap targets ≥44×44px for every interactive element. Focus traversal follows reading order; modal/List-drawer surfaces trap focus and return it to the trigger on dismiss. `{colors.amber}` (#F0A93A) needs an icon outline/halo wherever a white icon sits on it directly (pin, active filter chip, icon badge) to clear WCAG non-text 3:1 contrast (bare measures ~2:1).
NFR-4 (Privacy/GDPR): A privacy policy is published and accessible in-app. Account deletion removes the user's personal data (profile, photos/comments where feasible, auth record) and tied tick/save history. Photo upload requires clear consent at time of upload.
NFR-5 (Content Moderation): All user-submitted photos/comments are held pending until Admin approval — no AI flagging or automated moderation in v1, manual review only.

### Additional Requirements

Technical requirements from the Architecture Spine that constrain implementation (AD = Architecture Decision reference):

- **Platform/stack (AD-1):** React + Vite frontend; MapLibre GL JS over real coordinates (MapTiler vector tiles), illustrated-look styling; Supabase (Postgres+PostGIS, Auth, Storage) backend; PWA-first, Capacitor wrap deferred to phase 3; `/admin` is a route inside the same app/repo/deployment, never separate. Repo already has a Vite+React+TS scaffold in place (per git history) — Epic 1 Story 1 builds on it, does not reinitialize.
- **No custom backend (AD-2, AD-3):** Every write path is gated by Postgres RLS keyed to `auth.uid()`; admin checks live inside RLS policies (`profiles.role = 'admin'`), not just client route guards. No Express/Node/Edge Function API layer — app calls Supabase directly via `supabase-js`, routed through `lib/supabase/` wrappers.
- **Pin data strategy (AD-4):** Client fetches all `status = 'published'` locations in one query on load (TanStack Query, cached); category filter and name search are pure client-side operations over that set, never a re-query. `locations.geo` stored as `geography(Point, 4326)` with GIST index (AD-20) even though v1 doesn't query by bbox.
- **Geocoding (AD-5):** Admin address/Eircode→coordinate auto-fill calls Nominatim (OpenStreetMap), free/keyless, direct client call, no secret-hiding needed. Map-click remains the always-available fallback.
- **Status/moderation pattern (AD-6):** `locations.status`: `published | archived` (archive = soft-delete, never hard delete). `user_photos.status` / `comments.status`: `pending | approved | rejected`. `locations` SELECT RLS: `status = 'published' OR role = 'admin'`.
- **Category and County as lookup tables (AD-7, AD-8):** `categories(id, name, color_hex, icon_key, sort_order)` seeded with the v1 five; `counties(id, name)` seeded with Ireland's 32. Adding a category/county is an INSERT, not a migration.
- **Photo pipeline (AD-9):** Every photo-upload path (admin and user) resizes to max ~2000px, re-encodes JPEG at ~1–2MB target, client-side, before the Storage call.
- **Server-state layer (AD-10):** Every Supabase read/write goes through a TanStack Query hook wrapping a `lib/supabase/` call; tick/save toggles use optimistic updates with rollback on failure.
- **Photo storage buckets (AD-11):** `location-photos` bucket — public read, admin-write only. `user-contributions` bucket — private, RLS-gated: visible to admin, the submitter (if pending), or publicly only if approved. Rejected rows visible only to admin.
- **Anonymous Gate (AD-12):** Client-tracked via a `localStorage` array of distinct viewed `location_id`s; no server-side view tracking, no DB table, matches PRD's accepted cookie-clear bypass at v1 scale.
- **Search (AD-13):** Case-insensitive client-side substring match against `locations.name` over the already-fetched published set.
- **Profile provisioning (AD-14):** A Postgres trigger on `auth.users` INSERT creates the matching `profiles` row (`role='user'`); a second `BEFORE UPDATE` trigger blocks a user from self-changing their own `role`.
- **Migrations (AD-15):** Every schema/RLS/trigger/bucket-policy change ships as a `supabase/migrations/*.sql` file via Supabase CLI — never hand-edited live in the dashboard.
- **Account deletion cascade (AD-16):** `user_ticks`/`user_saves` hard-deleted. Pending/rejected `user_photos`/`comments` hard-deleted with Storage objects. Approved ones anonymized (`user_id` set NULL), content retained. `profiles` and `auth.users` hard-deleted.
- **Single Supabase project pre-launch (AD-17):** One project for dev+prod until public launch; split deferred.
- **PWA offline scope (AD-18):** App shell precached; locations dataset `NetworkFirst` with cached fallback; map tiles `CacheFirst` capped (~500 entries/30 days); no offline write queue — writes fail cleanly with retry copy.
- **Distance field (AD-19):** `locations.distance_display` — nullable free-form text (e.g. "2.4km loop"), no numeric column in v1.
- **Location photos as child table (AD-21):** `location_photos(id, location_id FK, storage_path, sort_order, created_at)`. Admin form stages files client-side; Storage upload + row inserts happen only after the `locations` row itself is inserted (sequenced client-side operation), since FK is NOT NULL and FR-21 forbids a draft location state.
- **Photo upload input constraints (AD-22):** Accepted MIME types `image/jpeg`, `image/png`, `image/heic`, `image/webp`; hard input-size cap 15MB/file, rejected client-side before compression; no per-location/per-user count cap in v1.
- **Comment length cap (AD-23):** `comments.text` capped at 500 characters via DB `CHECK` constraint, matched by client `maxlength`.
- **Photo-upload consent tracking (AD-24):** `profiles.photo_upload_consent_at` (nullable timestamptz), set once on first upload/signup; consent acknowledgment shown only when NULL.
- **Privacy policy route (AD-25):** `/privacy`, statically rendered, no CMS/DB table, linked from auth modal footer and profile menu.
- **OAuth redirect pending-action resume (AD-26):** Before `supabase.auth.signInWithOAuth` (Google), the app writes the pending gated action (`{type, location_id}`) to `sessionStorage`; the auth callback route reads/clears it and resumes the action on return.
- **Address and cost fields (AD-27):** `locations.address_display` (text, always admin-entered regardless of coordinate-entry path); `locations.cost_type` (enum `free | paid`); `locations.cost_amount` (nullable text, allows a qualifier).
- **Naming/ID/timestamp conventions:** snake_case Postgres tables/columns, plural table names, `{singular}_id` FK columns; `uuid` PKs everywhere including lookup tables; `timestamptz` with `created_at` default `now()`, `updated_at` only where rows mutate post-insert.
- **Explicit non-blocking note from the spine itself:** nothing in the architecture blocks phase 1 (map + admin CRUD, no accounts) shipping before phase 2 — RLS allows anonymous SELECT on published locations without signup; auth-dependent tables simply go unused until phase 2 wires up Supabase Auth.

### UX Design Requirements

UX-DR1: Implement the DESIGN.md token system (colour palette, typography scale, spacing scale, radii, elevation) as the shared style foundation before/alongside first components — five category hues (Emerald/Trail, Terracotta/Historic, Amber/Viewpoint, Ocean/Beach, Plum/Camping), Cream/Ink/Surface/Neutral-Muted base, Space Grotesk/Inter/IBM Plex Mono type families.
UX-DR2: Tack pin component — circular badge, category-colour fill, white icon centered, cream ring, drop shadow; 32px default / 40px selected; never rendered as a teardrop/marker silhouette anywhere (map, list thumbnails, admin coordinate picker).
UX-DR3: Amber contrast fix — give Amber-filled elements (pin, active filter chip, icon badge) a thin ink outline/halo on their white icon so they clear the 3:1 WCAG non-text contrast minimum (bare measures ~2:1); the other four category hues need no such treatment.
UX-DR4: Filter chip component — pill shape, horizontal scroll, "All" + one chip per category; single active filter at a time (tapping a new chip replaces, not adds to, the active one); "All" active state uses Ink fill instead of a category hue.
UX-DR5: Search bar component — pill, live-as-you-type; non-empty query swaps the map area for a Search results list, clearing restores the map; the adjacent slider icon is decorative only in v1, no second filter mechanism behind it.
UX-DR6: Drawer sheet component, shared between two contexts — the List view (map/list toggle) and the Sign-up/Sign-in modal — same visual language (rounded top, grabber, white surface, slide up/dismiss via drag), different content per context.
UX-DR7: Detail view as a dedicated full-screen view (not a bottom sheet, diverging from the mockup by deliberate spine decision) — back affordance in header, category icon badge + name/meta block, then scrollable body: photo gallery, description, how-to-get-there, parking, Photos & Comments section.
UX-DR8: Tick/save button pair — independent toggles (ticking doesn't imply saving), category-independent active colours (Emerald for ticked, Amber for saved), both visible without scrolling in the Detail view header block; unauthenticated tap opens the Sign-up/Sign-in modal framed as "Sign up to tick this off" rather than generic gate copy.
UX-DR9: Photos & Comments section — feed of approved photos/comments; a submitter's own pending item renders inline marked "Pending review," visible only to that submitter; inline add control at the top of the section, no separate modal/FAB flow.
UX-DR10: Profile tabs component (Ticked / Saved) — active tab underlined in Ink, inactive at 55% opacity; progress stat ("X of 32 counties") in mono type above the tabs, framed strictly as a personal record, never comparative/ranked language; display name heads the screen.
UX-DR11: Admin table row component, shared between the Admin location list and the Moderation queue — thumbnail/icon, label + meta, action(s), hairline divider; archived locations get a muted "archived" badge rather than disappearing from admin's own view (supports restore-from-archive).
UX-DR12: Admin location form — four collapsible sections in sequence (Basics / Location & Access / Cost & Distance / Photos); coordinate picker (map-click + address/Eircode geocode) lives inside Location & Access; inline per-field validation, required fields (name, category, county, coordinates) block submit, optional fields never do.
UX-DR13: Copy-to-clipboard interaction on the address/Eircode in Detail view, with a brief "Copied." confirmation; no deep-link to Google/Apple Maps in v1.
UX-DR14: State-pattern copy library, applied verbatim per EXPERIENCE.md's State Patterns table — cold map load spinner, location-permission-denied silent fallback, zero-pins-for-filter thinning (no blocking empty state), search no-matches ("Nothing here yet — try a different spot or widen your search."), network/load failure with retry ("Couldn't reach the map — check your connection and try again."), Detail view loading spinner, Anonymous Gate blocking modal copy, auth failure inline ("That didn't work — check your details and try again."), contribution pending inline ("Submitted — this goes live once we've had a look."), upload failure inline ("Couldn't send that — check your connection and try again."), admin form validation inline, geocode failure inline ("Couldn't find that address — try a different search or click the map instead."), empty Ticked/Saved tab states, empty moderation queue ("Nothing waiting on you.") — warm, in-voice, never raw error codes.
UX-DR15: Account deletion two-step confirm in Profile settings — no colour-coded "danger" treatment anywhere in the app (no system-state colour exists in the palette); destructive actions carried by icon + weight + copy only.
UX-DR16: Accessibility floor across all interactive surfaces — 44×44px minimum tap targets (tack pin's 32px visual sits inside a ≥44px tap area), focus traversal in reading order, focus trap + return-to-trigger for the Sign-up/Sign-in modal and the List drawer; user-submitted photos ship without meaningful alt text in v1 (flagged gap, not fixed here).
UX-DR17: Responsive `/admin` surface — the one surface that reflows: desktop widens the location list to a denser table and gives the coordinate-picker map more room; mobile keeps the same collapsible-section form and list, single-column; no behavioral differences beyond density at any width. Public app (Map/List/Detail/Profile/auth) stays mobile-viewport-only, no desktop-specific reflow, in v1.
UX-DR18: Voice/tone application — warm, in-voice register even in edge cases (per the Do/Don't microcopy table), no exclamation-heavy hype or streak/gamification language; every data value (cost, distance, county, timestamps) renders in mono type on its own line, never buried inside a prose sentence.

### FR Coverage Map

FR-1: Epic 1 — View published locations on the map
FR-2: Epic 1 — See own location on the map
FR-3: Epic 1 — Filter by category
FR-4: Epic 1 — Map/list toggle
FR-5: Epic 1 — Search by name
FR-6: Epic 1 — View location detail sheet
FR-7: Epic 1 — Get directions (copy address/Eircode)
FR-8: Epic 3 — Anonymous detail-view limit
FR-9: Epic 3 — Account creation
FR-10: Epic 3 — Profile
FR-11: Epic 3 — Tick off a location
FR-12: Epic 3 — Save a location
FR-13: Epic 3 — View own ticks and saves
FR-14: Epic 4 — Upload a photo
FR-15: Epic 4 — Leave a comment
FR-16: Epic 4 — Contributions pending by default
FR-17: Epic 4 — Offline contribution behavior (fails cleanly)
FR-18: Epic 2 — Protected admin route
FR-19: Epic 2 — Add a location
FR-20: Epic 2 — Set location coordinates
FR-21: Epic 2 — Immediate publish
FR-22: Epic 2 — Edit and remove locations
FR-23: Epic 4 — Moderate contributions

PWA installability (§6.2, no FR number) → Epic 5, reinforcing FR-17's "fails cleanly" behavior at the network layer.

## Epic List

### Epic 1: Map & Location Discovery
Any user — anonymous or signed-in — can open the app, see a real styled map of Ireland populated with published locations, browse by panning/zooming, filter by category, toggle to a list view, search by name, and open a full-screen Detail view for any location (photos, cost, distance, description, how-to-get-there, parking) — all without an account. Establishes the initial Supabase/PostGIS schema and RLS foundation, plus a small seeded dataset so the map is meaningfully browsable before Admin CRUD exists.
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7
**Also addresses:** NFR-1 (performance), NFR-3 (accessibility, baked in per-story); AD-1, AD-4, AD-6 (published-only filter), AD-7, AD-8, AD-13, AD-19, AD-20, AD-27; UX-DR1–5, UX-DR7, UX-DR13, UX-DR14 (subset), UX-DR16, UX-DR18

### Epic 2: Admin Location Management
A user with `role: admin` can access a protected `/admin` dashboard, add new locations via a form covering every preset field, set coordinates by map-click or geocoded address, publish immediately, and edit or archive (soft-delete) existing locations — enabling ongoing content growth without code changes or redeploys.
**FRs covered:** FR-18, FR-19, FR-20, FR-21, FR-22
**Also addresses:** NFR-2 (security/RLS), NFR-3 (accessibility); AD-2, AD-5, AD-6, AD-7, AD-8, AD-9 (admin photo compression), AD-15, AD-21, AD-27; UX-DR11, UX-DR12, UX-DR14 (admin validation, geocode failure), UX-DR16, UX-DR17 (responsive admin)

### Epic 3: Accounts & Personal Tracking
A visitor can create a Free Account (email or Google) — whether prompted by the Anonymous Gate or proactively via the profile icon — get a profile with a display name, tick off and save locations independently from any Detail view, view their own ticked/saved lists with a personal (never comparative) progress stat, and delete their account with a GDPR-compliant cascade. Includes the static privacy-policy route the auth modal links to.
**FRs covered:** FR-8, FR-9, FR-10, FR-11, FR-12, FR-13
**Also addresses:** NFR-2 (RLS on ticks/saves), NFR-3 (accessibility, modal focus trap), NFR-4 (privacy/GDPR); AD-10, AD-12, AD-14, AD-16, AD-24, AD-25, AD-26; UX-DR6, UX-DR8, UX-DR10, UX-DR14 (gate, auth failure, empty tabs), UX-DR15, UX-DR16, UX-DR18

### Epic 4: User Contributions & Moderation
A signed-in user can upload a photo and/or leave a comment on a location, see their own submission inline marked "Pending review," and — once admin reviews it from the moderation queue — see it approved and publicly visible (or silently absent if rejected). Admin gets a dedicated moderation queue to approve/reject pending contributions.
**FRs covered:** FR-14, FR-15, FR-16, FR-17, FR-23
**Also addresses:** NFR-2 (RLS/two-bucket storage), NFR-3 (accessibility), NFR-5 (content moderation); AD-6, AD-9, AD-11, AD-15, AD-22, AD-23, AD-24 (consent-on-first-upload); UX-DR9, UX-DR11 (moderation-queue variant), UX-DR14 (contribution pending, upload failure, empty queue), UX-DR16, UX-DR18

### Epic 5: PWA Installability & Offline-Read Hardening
A user can install Wander Éire to their home screen as a standalone app; the app shell and last-loaded map/location data stay available with no signal, map tiles cache opportunistically as the user browses, and no feature silently pretends to support offline writes. Native app-store (Capacitor) wrap is explicitly excluded from this epic — deferred past v1 per PRD §6.1/§6.3, despite PROJECT-BRIEF.md's Build Order literally naming it under this phase.
**FRs covered:** none directly (PWA installability is an in-scope §6.2 item with no FR number); reinforces FR-17's "fails cleanly, no offline write queue" behavior at the network layer.
**Also addresses:** NFR-1 (performance/perceived speed via caching); AD-1 (PWA-first), AD-18; reinforces UX-DR14's network-failure copy.

## Epic 1: Map & Location Discovery

Any user — anonymous or signed-in — can open the app, see a real styled map of Ireland populated with published locations, browse by panning/zooming, filter by category, toggle to a list view, search by name, and open a full-screen Detail view for any location — all without an account. Establishes the initial Supabase/PostGIS schema and RLS foundation, plus a small seeded dataset so the map is meaningfully browsable before Admin CRUD exists.

### Story 1.1: View Published Locations on the Map

As a visitor (anonymous or signed-in),
I want to see a real, styled map of Ireland with pins for published locations,
So that I can discover places to go without creating an account.

**Acceptance Criteria:**

**Given** the `categories`, `counties`, and `locations` tables exist with RLS allowing anonymous `SELECT` on locations where `status = 'published'` (AD-6/7/8), and a seed migration has populated at least one real location per category across a handful of counties, styled from the shared DESIGN.md token system (colours, type, spacing, radii — UX-DR1)
**When** the app loads
**Then** MapLibre GL JS renders a map of Ireland via MapTiler vector tiles, illustrated-look styling (AD-1)
**And** a tack-pin (UX-DR2) appears for every seeded published location, coloured by its category hue, white icon, cream ring, drop shadow.

**Given** the map is loading
**When** the app first opens
**Then** a spinner shows centered over the cream base until tiles/pins complete first paint; map interaction is disabled until then (UX-DR14 cold-load state).

**Given** a location has `status = 'archived'`
**When** the map loads
**Then** no pin renders for it.

**Given** the Amber (Viewpoint) category is present
**When** its pin renders
**Then** the white icon carries a thin ink outline/halo clearing 3:1 WCAG non-text contrast (UX-DR3).

**Given** the map/tile fetch fails
**When** the failure occurs
**Then** the app shows "Couldn't reach the map — check your connection and try again." with a retry action (UX-DR14), without blocking any already-rendered content.

### Story 1.2: See My Own Location on the Map

As a visitor,
I want to allow the app to show my current position on the map,
So that I can identify nearby pins to visit.

**Acceptance Criteria:**

**Given** the browser prompts for geolocation permission on map load `[ASSUMPTION: automatic prompt on load, not a manual "locate me" button — EXPERIENCE.md Flow 1 doesn't specify the trigger; flagged for confirmation]`
**When** the user grants permission
**Then** the device's current position renders as a marker and the map re-centers on the user's area.

**Given** permission is denied or not yet granted
**When** the map loads
**Then** it defaults to a full-Ireland view with no banner and no re-prompt nag — no feature is blocked (FR-2 consequence).

**Given** permission was previously denied
**When** the user revisits
**Then** the app relies on native browser permission UI and does not build a custom nag/re-prompt.

### Story 1.3: Filter Pins by Category

As a visitor,
I want to filter visible pins by category,
So that I can narrow my focus to the kind of place I'm looking for.

**Acceptance Criteria:**

**Given** the map has pins rendered (Story 1.1)
**When** I tap a category filter chip (UX-DR4)
**Then** pins not matching the active category dim to reduced opacity rather than disappearing — geography stays legible (FR-3 consequence).

**Given** a filter chip is active
**When** I tap a different chip
**Then** it replaces the active filter (single-select, not additive).

**Given** any filter is active
**When** I tap "All"
**Then** all pins return to full opacity; "All" active state uses Ink fill, not a category hue.

**Given** the chip row
**When** rendered
**Then** it scrolls horizontally and every chip meets the ≥44×44px tap target (UX-DR16).

### Story 1.4: Toggle Between Map and List View

As a visitor,
I want to switch between the map and a scrollable list of the same locations,
So that I can browse in whichever format suits me.

**Acceptance Criteria:**

**Given** I'm on the map view
**When** I tap the list toggle
**Then** a Drawer sheet (UX-DR6) slides up over the still-mounted map showing the same (filtered, if a filter is active) location set as a scrollable list.

**Given** the list is open
**When** I dismiss it (drag down or explicit close)
**Then** it returns to the map view with filter state preserved.

**Given** no locations match the active filter
**When** the list is open
**Then** rows simply thin to none — no blocking empty-state message (EXPERIENCE.md "Zero pins for active filter" state).

**Given** the list drawer is open
**When** focus enters it
**Then** it traps focus and returns focus to the toggle control on dismiss (UX-DR16 accessibility floor).

### Story 1.5: Search Locations by Name

As a visitor,
I want to search for a location by name,
So that I can quickly find a specific place I already know about.

**Acceptance Criteria:**

**Given** the search bar (UX-DR5) in the map header
**When** I type a query
**Then** results filter live (as-you-type) via case-insensitive substring match against `locations.name` over the already-fetched published set (AD-13) — no server re-query.

**Given** a non-empty query
**When** typed
**Then** the map area is replaced by the Search results list.

**Given** I clear the query
**When** the field becomes empty
**Then** the map view is restored.

**Given** no location name matches the query
**When** results render
**Then** the app shows "Nothing here yet — try a different spot or widen your search." with no suggested alternates (UX-DR14).

**Given** the search bar's adjacent slider icon
**When** tapped
**Then** nothing happens — it is decorative only in v1, not a second filter mechanism (FR-3 note, UX-DR5).

### Story 1.6: View Location Detail and Copy Directions

As a visitor,
I want to open a location's full detail — photos, cost, how to get there, parking — and copy its address,
So that I can decide whether to go and navigate there using my own maps app.

**Acceptance Criteria:**

**Given** I tap a pin, list row, or search result
**When** the tap registers
**Then** a full-screen Detail view (UX-DR7, not a bottom sheet) opens with a back affordance in the header, a category icon badge, and a name/county/cost/distance meta line.

**Given** the Detail view is opening
**When** the record is still fetching
**Then** a spinner shows in place of body content while the header/back affordance renders immediately (UX-DR14).

**Given** the record has loaded
**When** I scroll the body
**Then** I see the photo gallery (photo-grid component), description, how-to-get-there text, parking info, and cost/distance rendered in `{typography.meta-mono}` on their own line, never buried in prose — data is always mono, prose is always in voice (UX-DR18).

**Given** the location has an `address_display` value (AD-27)
**When** I tap it
**Then** it copies to the clipboard and shows a brief "Copied." confirmation (FR-7, UX-DR13) — no deep-link to a maps app in v1.

**Given** the location's `distance_display` is null (not applicable to its category)
**When** the Detail view renders
**Then** the distance line is omitted entirely, not shown as empty/zero.

**Given** the detail fetch fails (network/load failure)
**When** it fails
**Then** the app shows "Couldn't reach the map — check your connection and try again." with a retry action (UX-DR14), consistent with the map's own failure copy.

## Epic 2: Admin Location Management

A user with `role: admin` can access a protected `/admin` dashboard, add new locations with photos, and edit/archive/restore existing ones — enabling ongoing content growth without code changes or redeploys.

### Story 2.1: Protected Admin Route Access

As an admin (profile with `role: admin`),
I want `/admin` to be accessible only to me,
So that the location database and moderation tools stay protected from the public.

**Note:** PRD §6.1 labels Phase 1 "no auth," but FR-18 itself requires `profiles.role = 'admin'` enforced via RLS — which needs a `profiles` table and *some* way for the admin to authenticate, ahead of Epic 3's public sign-up flow. The Architecture Spine's own deferral language is precise here: it defers "the profiles trigger" (the public auto-provisioning trigger, AD-14) to Phase 2 — not the `profiles` table itself. So this story creates the minimal slice: the `profiles` table and an admin-only sign-in, with no public-facing sign-up UI (that ships in Epic 3, Story 3.3).

**Acceptance Criteria:**

**Given** the `profiles` table doesn't yet exist
**When** this story ships
**Then** it's created (`id uuid PK` referencing `auth.users.id`, `role text default 'user'`, `display_name text nullable`) — ahead of Epic 3's auto-provisioning trigger, since FR-18 needs it now.

**Given** no public sign-up UI exists yet in Phase 1
**When** the admin needs to authenticate
**Then** a minimal Supabase Auth email/password sign-in (not a public "Sign up" flow) is available for the admin's own use only.

**Given** the admin's `auth.users` account exists
**When** their `profiles` row needs `role = 'admin'`
**Then** it is set directly via DB access (AD-14) — no self-service admin-promotion UI exists in v1.

**Given** a profile has `role = 'admin'`
**When** that user signs in and navigates to `/admin`
**Then** the dashboard shell loads.

**Given** an unauthenticated user or one with `role = 'user'`
**When** they navigate directly to `/admin` by URL
**Then** a client-side route guard redirects them away — this is UX only, not the real boundary.

**Given** the underlying tables
**When** any client — including one bypassing the UI entirely — attempts an admin-only write or a `status != 'published'` read without `role = 'admin'`
**Then** Postgres RLS denies it (AD-2), independent of any client guard.

**Given** the `/admin` dashboard renders on a desktop vs. mobile viewport
**When** either loads
**Then** desktop widens the location list to a denser table and gives the coordinate-picker map more room, while mobile keeps a single-column list and form — density differs, behavior doesn't (UX-DR17).

### Story 2.2: Add a Location

As an admin,
I want to add a new location with its core details and coordinates,
So that it publishes immediately and becomes visible on the public map.

**Acceptance Criteria:**

**Given** I open "+ Add Location" from the dashboard
**When** the form renders
**Then** I see four collapsible sections in sequence — Basics, Location & Access, Cost & Distance, Photos (UX-DR12; Photos covered in Story 2.3).

**Given** the Basics section
**When** I fill name, category (from the `categories` lookup, AD-7), county (from the `counties` lookup, AD-8), and description
**Then** those values are staged for submit.

**Given** the Location & Access section
**When** I click a point on the coordinate-picker map
**Then** `geo` (`geography(Point,4326)`, AD-20) is set to that point.

**Given** the Location & Access section
**When** I instead type an address/Eircode that resolves via Nominatim (AD-5)
**Then** coordinates auto-fill from the result
**And** `address_display` is populated with the entered address regardless of which coordinate method was used (AD-27).

**Given** a geocode attempt fails to resolve
**When** the failure occurs
**Then** the form shows "Couldn't find that address — try a different search or click the map instead." inline, coordinates stay unset, and map-click remains available (UX-DR14).

**Given** the Cost & Distance section
**When** I set Cost Type (free/paid) and, if paid, a Cost Amount (free-form text with optional qualifier, AD-27), and optionally a Distance value (free-form text, shown only where relevant to category, AD-19)
**Then** those values are staged for submit.

**Given** required fields (name, category, county, coordinates) are missing at submit
**When** I click submit
**Then** inline validation errors appear at each and publish is blocked; optional fields never block submit (UX-DR12).

**Given** all required fields are valid
**When** I submit
**Then** the `locations` row inserts with `status = 'published'` immediately — no draft/staged-review step (FR-21) — and I'm returned to the dashboard where the new location appears in the list.

**Given** the location publishes
**When** I check the public map (Epic 1)
**Then** the new pin appears with no further action.

### Story 2.3: Add Photos to a Location

As an admin,
I want to upload photos to a location I'm adding or editing,
So that visitors can see what the place actually looks like before they go.

**Acceptance Criteria:**

**Given** the admin form's Photos section
**When** I select image files
**Then** each is compressed client-side to max ~2000px, re-encoded JPEG at ~1–2MB target (AD-9), before any upload happens.

**Given** I'm still filling in the rest of the Add Location form
**When** I've staged photos
**Then** they're held as in-memory object URLs, not yet uploaded (AD-21).

**Given** I submit the form
**When** the `locations` row insert succeeds
**Then** staged photos upload to `location-photos/{location_id}/{location_photos.id}.{ext}`, with a matching `location_photos` row per file, sequenced after the location insert so the NOT NULL FK is always satisfiable (AD-21).

**Given** I add photos while editing an already-published location
**When** I upload
**Then** the same compress → upload → insert sequence runs immediately against the existing `location_id`.

**Given** zero photos are staged
**When** I submit the location form
**Then** it still publishes successfully — Photos is optional, not blocking `[ASSUMPTION: neither PRD FR-19 nor EXPERIENCE.md explicitly marks photos required vs. optional; inferred from EXPERIENCE.md only naming distance/parking as explicitly optional — flagged for confirmation]`.

**Given** the location detail page later renders (Epic 1, Story 1.6)
**When** it fetches photos
**Then** they display via the photo-grid component in `location_photos.sort_order`.

### Story 2.4: Edit, Archive, and Restore a Location

As an admin,
I want to edit an existing location's details or archive/restore it,
So that I can correct information over time and remove a place from public view without losing its data.

**Acceptance Criteria:**

**Given** the dashboard's location list (admin-table-row, UX-DR11)
**When** it renders
**Then** it shows every location regardless of status — RLS's admin exception makes archived rows visible only to admin (AD-6).

**Given** a location row
**When** I tap edit
**Then** the same four-section form opens pre-filled with its current values, including existing photos.

**Given** I change any field and submit
**When** the update succeeds
**Then** the row updates in place (no versioning/history in v1) and reflects immediately on the public map if published.

**Given** a published location
**When** I choose "Remove"
**Then** its `status` is set to `archived` (soft-delete) — the row and its associated ticks, saves, and contributions are retained, not destroyed (FR-22).

**Given** an archived location
**When** it appears in the admin's own list
**Then** it shows a distinct muted "archived" badge rather than disappearing.

**Given** an archived location
**When** the public map or list queries locations
**Then** it never appears there.

**Given** an archived location in the admin list
**When** I choose "Restore"
**Then** its `status` is set back to `published` and it reappears on the public map.

## Epic 3: Accounts & Personal Tracking

A visitor can create a Free Account — whether prompted by the Anonymous Gate or proactively via the profile icon — get a profile with a display name, tick off and save locations independently from any Detail view, view their own ticked/saved lists with a personal progress stat, and delete their account with a GDPR-compliant cascade. Includes the static privacy-policy route the auth modal links to. Full GDPR account-deletion cascade (AD-16) also touches `user_photos`/`comments`, which don't exist until Epic 4 — deletion is split into two stories to avoid Epic 3 depending on later work: this epic covers everything that exists by this point (ticks, saves, profile, auth); Epic 4 extends it once contributions exist.

### Story 3.1: Anonymous Detail-View Gate

As an anonymous visitor,
I want to browse freely but be prompted to sign up after my 4th distinct location detail view,
So that I can keep exploring by creating a free account.

**Acceptance Criteria:**

**Given** I'm unauthenticated viewing my 1st–3rd distinct location details
**When** I open a Detail view
**Then** it opens normally and the location's id is added to a `localStorage` array of viewed ids (AD-12) if not already present.

**Given** I've viewed 3 distinct locations
**When** I tap a 4th, different one
**Then** the Anonymous Gate modal appears instead of the Detail view opening — blocking, no teaser content shown first.

**Given** I re-open one of the first 3 already-viewed locations
**When** I tap it again
**Then** it opens normally, no allowance consumed, gate not triggered.

**Given** the gate is not time-boxed
**When** a day passes
**Then** the count does not reset.

**Given** localStorage is cleared or incognito is used
**When** the user returns
**Then** the gate resets — an accepted v1 limitation (FR-8 note), not a bug.

**Given** map/list browsing and category filtering
**When** performed anonymously
**Then** neither is ever gated — only Detail view opens count.

### Story 3.2: Privacy Policy Page

As any user,
I want to read the privacy policy,
So that I understand what happens to my data before I sign up or upload a photo.

**Acceptance Criteria:**

**Given** the `/privacy` route
**When** I navigate to it from the auth modal footer or profile menu
**Then** a statically-rendered policy page loads — no CMS/DB dependency (AD-25).

**Given** the policy content
**When** published
**Then** it covers at minimum: what personal data is collected, that photo uploads become publicly visible once approved, and how to request account deletion (NFR-4).

**Given** this story ships before Story 3.3 (Account Creation), which links to it from the auth modal footer
**When** sequenced this way
**Then** the footer link has a real route to point to — avoiding a forward dependency.

### Story 3.3: Account Creation via Email or Google

As a visitor,
I want to create a Free Account using email or Google sign-in,
So that I can tick off, save, and contribute to locations.

**Acceptance Criteria:**

**Given** the Sign-up/Sign-in modal (Drawer sheet, UX-DR6) is triggered by the Anonymous Gate or the profile icon
**When** it opens
**Then** it offers email and Google sign-in, plus a footer link to `/privacy` (AD-25, Story 3.2).

**Given** I sign up via email
**When** I submit valid credentials
**Then** a Supabase Auth account is created and a matching `profiles` row is auto-provisioned by a DB trigger (`role='user'`, `display_name=NULL`, AD-14) — not by app-code insert; extends the `profiles` table Epic 2 Story 2.1 already created.

**Given** I sign up via Google
**When** the OAuth flow completes
**Then** the same trigger fires and I'm signed in.

**Given** I trigger Google sign-in from a gated action (gate, tick, or save)
**When** the app is about to redirect for OAuth
**Then** it writes the pending action (`{type, location_id}`) to `sessionStorage` first (AD-26)
**And** when the redirect returns, the callback route reads/clears it and resumes the action automatically rather than dropping me at the map.

**Given** sign-up fails (bad credentials, already-registered email, cancelled/failed Google auth)
**When** it fails
**Then** "That didn't work — check your details and try again." shows inline; the modal stays open and doesn't lose entered email.

**Given** I sign up successfully
**When** the modal closes
**Then** I see "You're in! Welcome to Wander Éire." and resume whatever action triggered the modal.

### Story 3.4: Profile with Display Name

As a signed-in user,
I want a profile with a display name,
So that my account feels like mine.

**Acceptance Criteria:**

**Given** I'm signed in with no display name set
**When** I open Profile
**Then** the display-name field is empty/prompting.

**Given** I set a display name
**When** I save it
**Then** `profiles.display_name` updates and renders at the top of Profile in `{typography.heading}` (UX-DR10).

**Given** I tap the profile icon while unauthenticated
**When** I tap it
**Then** the Sign-up/Sign-in modal opens instead of Profile.

### Story 3.5: Tick Off and Save a Location

As a signed-in user,
I want to tick off and/or save a location from its Detail view,
So that I can build a personal record of where I've been and want to go.

**Acceptance Criteria:**

**Given** I'm signed in on a Detail view
**When** I tap tick
**Then** a `user_ticks` row inserts (unique on `user_id, location_id`) via optimistic update — ticked immediately, rolled back only on failure (AD-10).

**Given** I'm signed in on a Detail view
**When** I tap save
**Then** a `user_saves` row inserts the same way, independent of tick state.

**Given** an already-ticked/saved location
**When** I tap tick/save again
**Then** the row is removed (toggle off), optimistically.

**Given** I'm unauthenticated
**When** I tap tick or save
**Then** the Sign-up/Sign-in modal opens framed as "Sign up to tick this off" (UX-DR8) rather than generic gate copy, and the action resumes automatically after sign-in (AD-26).

**Given** RLS on `user_ticks`/`user_saves`
**When** any client attempts to write a row for a `user_id` other than their own `auth.uid()`
**Then** Postgres denies it (NFR-2).

### Story 3.6: View My Ticked and Saved Locations

As a signed-in user,
I want to see my own ticked and saved locations on my Profile,
So that I have a personal record of where I've been and what's next.

**Acceptance Criteria:**

**Given** I'm signed in and open Profile
**When** it renders
**Then** I see a Ticked/Saved two-tab switcher (UX-DR10), each row styled with the location's category colour + icon.

**Given** my ticked locations
**When** the progress stat renders above the tabs
**Then** it shows "X of 32 counties" (`COUNT(DISTINCT county_id)`, AD-8) in mono type, framed strictly as a personal record — never comparative/ranked language.

**Given** a ticked/saved location has since been archived (FR-22)
**When** my tabs render
**Then** it's filtered out silently — no dead link — while the tick/save row persists in the DB for admin's audit trail.

**Given** my Ticked tab has zero entries
**When** it renders
**Then** it shows "Nothing ticked off yet — start exploring the map."; Saved shows "Nothing saved yet — bookmark something for later." — each linking back to the map.

### Story 3.7: Delete My Account

As a signed-in user,
I want to permanently delete my account and personal data,
So that I control my own data per my privacy rights.

**Acceptance Criteria:**

**Given** I'm in Profile settings
**When** I choose "Delete account"
**Then** a two-step confirmation is required — no single-button deletion, no colour-coded danger styling (UX-DR15).

**Given** I confirm deletion
**When** it processes
**Then** my `user_ticks` and `user_saves` rows are hard-deleted (AD-16).

**Given** I confirm deletion
**When** it completes
**Then** my `profiles` row and `auth.users` record are hard-deleted and I'm signed out.

**Given** this story ships before Epic 4 exists
**When** deletion runs
**Then** it covers every personal-data table that exists at this point in the build; the `user_photos`/`comments` portion of AD-16's cascade is added in Epic 4 once those tables exist.

## Epic 4: User Contributions & Moderation

A signed-in user can upload a photo and/or leave a comment on a location, see their own submission inline marked "Pending review," and — once admin reviews it from the moderation queue — see it approved and publicly visible (or silently absent if rejected). Admin gets a dedicated moderation queue to approve/reject pending contributions. Also completes Epic 3's account-deletion cascade now that `user_photos`/`comments` exist.

### Story 4.1: Upload a Photo to a Location

As a signed-in user,
I want to upload a photo to a location I'm at,
So that I can contribute to the map for others.

**Acceptance Criteria:**

**Given** I'm signed in on a Detail view's Photos & Comments section
**When** I tap the inline add control and select a photo
**Then** accepted MIME types are `image/jpeg`, `image/png`, `image/heic`, `image/webp`, with a hard 15MB input-size cap rejected client-side before compression (AD-22).

**Given** a valid photo
**When** selected
**Then** it's compressed client-side to max ~2000px, ~1–2MB JPEG (AD-9), before upload.

**Given** this is my first-ever upload (or I haven't consented at signup)
**When** I attempt to submit
**Then** a one-time upload-consent acknowledgment is shown and must be accepted; `profiles.photo_upload_consent_at` is set on acceptance (AD-24) — later uploads skip this once the field is non-NULL.

**Given** I submit
**When** the upload succeeds
**Then** a `user_photos` row inserts with `status = 'pending'` and the file uploads to the private `user-contributions` bucket at `user-contributions/{location_id}/{user_photos.id}.{ext}` (AD-11).

**Given** my own pending photo
**When** I view the Detail view
**Then** it renders inline in the Photos & Comments feed marked "Pending review" (UX-DR9), visible only to me — RLS on both the row and the Storage object restrict pending visibility to submitter/admin only (AD-11).

**Given** no signal at the spot
**When** the upload attempt fails
**Then** "Couldn't send that — check your connection and try again." shows and the attempt simply drops — no offline queue (FR-17).

### Story 4.2: Leave a Comment on a Location

As a signed-in user,
I want to leave a text comment on a location,
So that I can share notes with other visitors.

**Acceptance Criteria:**

**Given** I'm signed in on a Detail view's Photos & Comments section
**When** I type a comment and submit
**Then** the text is capped at 500 characters via both a client `maxlength` and a DB `CHECK` constraint (AD-23) — a direct API call bypassing the client is still rejected by the DB.

**Given** I submit a valid comment
**When** it succeeds
**Then** a `comments` row inserts with `status = 'pending'`.

**Given** my own pending comment
**When** I view the Detail view
**Then** it renders inline marked "Pending review," visible only to me (same submitter/admin-only RLS pattern as photos).

**Given** no signal
**When** the submit attempt fails
**Then** "Couldn't send that — check your connection and try again." shows, no offline queue (FR-17).

### Story 4.3: Contributions Stay Private Until Approved

As any user,
I want other people's pending or rejected contributions to stay invisible to me,
So that only reviewed, appropriate content ever appears publicly.

**Acceptance Criteria:**

**Given** a pending photo or comment submitted by another user
**When** I (signed-in, not the submitter, not admin) view that location's Detail view
**Then** it does not appear in the Photos & Comments feed.

**Given** the same pending item
**When** an anonymous visitor views the location
**Then** it likewise does not appear.

**Given** a rejected photo or comment
**When** anyone other than admin queries it (including its own original submitter)
**Then** it is invisible to them (FR-16, AD-11).

**Given** an approved photo or comment
**When** any user (signed-in or anonymous) views the location
**Then** it appears in the feed with no "pending" badge.

### Story 4.4: Moderate Contributions

As an admin,
I want to review pending photos/comments and approve or reject each,
So that only appropriate content goes live.

**Acceptance Criteria:**

**Given** `/admin` → Moderation queue
**When** it renders
**Then** it lists every `status = 'pending'` `user_photos`/`comments` row across all locations, using the admin-table-row moderation variant (UX-DR11): thumbnail/text preview + submitter + target location + inline Approve/Reject.

**Given** a pending row
**When** I tap Approve
**Then** its `status` becomes `'approved'` and it's immediately publicly visible on that location's Detail view.

**Given** a pending row
**When** I tap Reject
**Then** its `status` becomes `'rejected'`, it's removed from the queue, and it no longer shows as pending in the submitter's own Detail view — no separate "rejected" notice in v1.

**Given** the moderation queue has zero pending items
**When** it renders
**Then** it shows "Nothing waiting on you." — plain confirmation, not a call to action (UX-DR14).

### Story 4.5: Extend Account Deletion to Cover Contributions

As a signed-in user,
I want my account deletion to also remove or anonymize my photo/comment contributions,
So that my personal data is fully handled per GDPR once contributions exist.

**Acceptance Criteria:**

**Given** I confirm account deletion (Story 3.7's flow)
**When** my `pending` or `rejected` `user_photos`/`comments` exist
**Then** they are hard-deleted along with their Storage objects (AD-16).

**Given** my `approved` `user_photos`/`comments` exist
**When** account deletion processes
**Then** they are anonymized (`user_id` set NULL) — content/photo file retained so the location's public page stays intact, not deleted outright (AD-16).

**Given** this story extends Story 3.7 rather than replacing it
**When** both are complete
**Then** account deletion fully satisfies AD-16's cascade across every personal-data table in the schema.

## Epic 5: PWA Installability & Offline-Read Hardening

A user can install Wander Éire to their home screen as a standalone app; the app shell and last-loaded map/location data stay available with no signal; map tiles cache opportunistically as the user browses; no feature silently pretends to support offline writes. Native app-store (Capacitor) wrap is explicitly excluded from this epic — deferred past v1 per PRD §6.1/§6.3, despite PROJECT-BRIEF.md's Build Order literally naming it under this phase.

### Story 5.1: Install Wander Éire to Home Screen

As a user,
I want to install Wander Éire to my home screen,
So that it feels like a native app I can open directly.

**Acceptance Criteria:**

**Given** `vite-plugin-pwa` (Workbox `generateSW`) is configured with a valid manifest (name, icons, theme colour matching DESIGN.md tokens)
**When** the app is served over HTTPS
**Then** the browser offers an install prompt (or the user can manually "Add to Home Screen").

**Given** the app is installed
**When** opened from the home screen
**Then** it launches in standalone mode (no browser chrome).

**Given** the app shell/static assets
**When** first loaded
**Then** they're precached by the service worker.

**Given** a new deploy ships
**When** the user revisits
**Then** the app shell uses `StaleWhileRevalidate` — the cached version serves instantly while a fresh version fetches in the background for next load (AD-18).

### Story 5.2: Browse Cached Map Data with No Signal

As a user,
I want the map and last-loaded locations to remain visible when I lose signal,
So that I'm not stranded mid-trip.

**Acceptance Criteria:**

**Given** the locations dataset fetch (Epic 1 Story 1.1's fetch-all query)
**When** requested
**Then** it uses `NetworkFirst` with a short timeout, falling back to the last cached response if the network is slow/unavailable (AD-18).

**Given** map tiles
**When** fetched during normal browsing
**Then** they cache opportunistically via `CacheFirst`, capped at ~500 entries/30 days — never pre-cached for the whole country upfront.

**Given** I've previously loaded the map with signal
**When** I reopen the app with no signal
**Then** the map still renders using the last-cached locations dataset and any tiles for areas I'd already browsed.

**Given** I pan to an area whose tiles were never cached
**When** offline
**Then** those tiles simply don't render (no crash, no blocking error) — a partial map is acceptable, consistent with "cached reads only."

### Story 5.3: Writes Fail Cleanly Offline

As a user,
I want any action requiring a write (tick, save, upload, comment) to fail clearly when I have no signal,
So that nothing silently disappears or hangs.

**Acceptance Criteria:**

**Given** no offline write queue exists anywhere in the app (AD-18, FR-17)
**When** I attempt a tick, save, photo upload, or comment with no signal
**Then** the existing per-feature failure copy shows (already specified in Epics 3 and 4) and I can retry manually once signal returns.

**Given** this story verifies behavior across Epics 3 and 4's features
**When** checked
**Then** no feature silently implies offline write support — optimistic updates (AD-10) still roll back correctly on a "no network" failure, not just server errors.
