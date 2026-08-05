---
title: Wander Éire
status: final
created: 2026-08-05
updated: 2026-08-05
---

# PRD: Wander Éire
*Working title — not final. See Open Questions.*

## 0. Document Purpose

This PRD scopes v1 of Wander Éire for its solo builder (using Claude Code) going forward into UX detailing and architecture. It builds on `PROJECT-BRIEF.md` and `wander-eire-map-mockup.jsx` (both in the project root) — this document supersedes the brief as the source of truth for scope and requirements; the brief's design-system table and mockup remain the visual reference. The brief's draft Data Model section is likewise superseded by this document's Glossary (§3) and Functional Requirements (§4) — not dropped, just carried forward in a different shape. Vocabulary is Glossary-anchored (§3); requirements are grouped by feature with globally numbered FRs; inferred details are tagged `[ASSUMPTION]` inline and indexed in §15.

## 1. Vision

Wander Éire is an interactive road-trip discovery map for the island of Ireland. Instead of scrolling listicles or generic map-pin clutter, a user opens a real, styled map of Ireland, sees what's nearby, and taps into a place — a trail, a ruin, a viewpoint, a beach, a campsite — to see what it actually looks like, how to get there, what it costs, and whether it's worth the detour.

It's built to be used, not browsed idly: tick off where you've been, save what's next, and let the map fill in as a personal record of the country over time. Category is colour-coded throughout, pins read like tacks pushed into a corkboard map rather than generic teardrops, and the whole thing is styled bright and bold rather than corporate-travel-app neutral.

v1 starts as a tool the builder uses for their own trips and shares with a close circle, but it's built to hold up as a small public launch to strangers — real accounts, real moderation, real data-protection basics — not a throwaway prototype.

## 2. Target User

### 2.1 Jobs To Be Done

- As someone planning a day or weekend in Ireland, I want to see what's actually nearby (not a generic listicle) so I can decide where to go next.
- As someone standing at a trailhead or beach car park, I want quick, honest info — cost, parking, how to actually get there — before I commit the drive.
- As someone who travels around Ireland over time, I want a personal record of where I've been and what I still want to see.
- As the builder/admin, I want a fast way to add a place I've researched or heard about without touching code, so the database grows as I travel and learn about new spots.

### 2.2 Non-Users (v1)

- Trip-planners wanting multi-stop route optimization or itinerary building — not in v1 (see §5 Non-Goals).
- Users outside Ireland looking for other countries' content — out of scope entirely.
- Anyone expecting a social/competitive layer (leaderboards, public profiles, following other users) — explicitly deferred, see §14 Open Questions.

### 2.3 Key User Journeys

- **UJ-1. Mary discovers and visits a spot, on the day.**
  - **Persona + context:** Mary is visiting an area of Ireland for the day and wants to find something worth doing nearby.
  - **Entry state:** Unauthenticated, opens the app fresh, location permission available.
  - **Path:** Opens the app → sees an overview map of Ireland with pins, her current location shown → zooms into her area to see nearby pins → taps a pin, reads the detail sheet (photos, cost, how to get there) → repeats across a couple more pins she's curious about → copies the address/Eircode for the one she picks.
  - **Climax:** She leaves the app and pastes the address/Eircode into Google/Apple Maps to start driving.
  - **Resolution:** Later, back in signal or at the next stop, she reopens the app to tick off the place she visited or browse for the next one.
  - **Edge case:** If Mary is unauthenticated and this is her 4th distinct location detail view, she's prompted to create a free account before the detail sheet opens (FR-8).

- **UJ-2. Admin adds a new location.**
  - **Persona + context:** The admin (the builder) has researched or heard about a place worth adding.
  - **Entry state:** Authenticated with `role: admin`, on the protected `/admin` route.
  - **Path:** Opens the admin dashboard → starts a new location entry → fills the fixed set of preset fields (name, category, county, description, how-to-get-there, parking info, Cost Type/Amount, photos) → sets the pin's coordinates by clicking the spot on a map or typing an address/Eircode to auto-geocode → submits.
  - **Climax:** The location publishes immediately and is live on the public map.
  - **Resolution:** Admin can find it in the dashboard's location list to edit or remove later.

- **UJ-3. A signed-in user contributes a photo, in-app, at the spot.**
  - **Persona + context:** A signed-in user (e.g. Mary, having created an account) is physically at a location she's already viewed.
  - **Entry state:** Authenticated, on the location's detail sheet.
  - **Path:** Taps to add a photo or comment → captures/selects a photo and optionally adds text → submits.
  - **Climax:** The submission is accepted into a pending-review queue — the user sees it as "submitted," not yet live.
  - **Resolution:** It becomes publicly visible only once admin approves it (FR-16). If there's no signal at the spot, the submission simply fails and the user retries manually later — no offline queueing in v1 (FR-17, out of scope).

## 3. Glossary

- **Location** — A single point of interest (trail, historic site, viewpoint, beach, or camping spot) with fixed admin-authored fields. Also called a **Pin** when referring to its map representation.
- **Category** — One of a fixed set of location types (Trail, Historic, Viewpoint, Beach/Coast, Camping, extensible later). Drives the pin's colour and icon.
- **County** — One of Ireland's 32 counties (no north/south border distinction), a field on every Location.
- **Detail Sheet** — The panel shown when a user taps a pin: photos, cost, distance, how-to-get-there, parking info, tick-off/save controls.
- **Tick-off** — A signed-in user's self-reported record that they've visited a Location. Not independently verified.
- **Save** — A signed-in user's bookmark of a Location for later, independent of tick-off status.
- **Free Account** — A Wander Éire account created via email or Google sign-in, required to tick off, save, or contribute past the anonymous browsing limit.
- **Anonymous Gate** — The limit of 3 distinct Location Detail Sheet views allowed before an unauthenticated user must create a Free Account to view further details (FR-8).
- **Admin** — A user whose profile has `role: admin`, with access to the protected `/admin` dashboard.
- **Contribution** — A user-submitted photo or comment attached to a Location, held in a pending-review state until Admin approval.
- **Cost Type** — Whether a Location is Free or Paid, paired with a Cost Amount when Paid; the amount may carry a short qualifier (e.g. "€10 parking" vs. plain "€18") rather than always being a bare price.
- **Distance** — An optional trail-length or walk-distance value (e.g. "2.4km loop") shown on the Detail Sheet where relevant to the Category (primarily Trail).

## 4. Features

### 4.1 Map & Discovery
**Description:** The primary surface of the app — a real, styled map of Ireland (real coordinates, illustrated-look vector styling) that a user browses by panning/zooming and filtering by category. Map exploration is the primary, encouraged interaction; search is a secondary tool for finding a known place by name. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: View published locations on the map
Any user (anonymous or signed-in) can view an overview map of Ireland showing pins for all published Locations. Realizes UJ-1.

**Consequences (testable):**
- Map renders with real underlying geography (MapLibre GL JS + real tile source), styled to the bright/bold theme.
- Only published Locations appear — pending/removed entries never render publicly.

#### FR-2: See own location on the map
A user can allow the app to show their current position on the map (device geolocation), to identify nearby pins. Realizes UJ-1.

**Consequences (testable):**
- If location permission is denied, the map still functions (defaults to full-Ireland view); no feature is fully blocked by a missing permission.

#### FR-3: Filter by category
A user can filter visible pins by category using filter chips, and toggle back to "All." Realizes UJ-1.

**Consequences (testable):**
- Pins not matching the active filter stay visible but dim to a reduced-opacity state, rather than being removed from the map — filtering narrows visual focus, it doesn't hide geography.

**Notes:** The search bar's adjacent slider-style icon in the mockup is decorative/placeholder — it does not represent a second, separate filter mechanism. Category chips (this FR) and name search (FR-5) are the only v1 filter/find paths.

#### FR-4: Map/list toggle
A user can switch between the map view and a scrollable list view of the same (filtered) set of locations.

#### FR-5: Search by name
A user can search for a Location by name via a search bar. Search is a secondary path — the app's default/encouraged interaction is map browsing, not search-first.

**Consequences (testable):**
- `[ASSUMPTION: case-insensitive substring match against Location name; empty/no-match results show an explicit "no matches" state rather than a blank list — confirm at architecture stage.]`

### 4.2 Location Detail
**Description:** What a user sees once they tap into a specific Location — everything needed to decide whether to go and how to get there. Realizes UJ-1.

**Functional Requirements:**

#### FR-6: View location detail sheet
Tapping a pin (or list item) opens a Detail Sheet showing: name, category, county, Cost Type/Amount, distance (where applicable to the category), description, how-to-get-there info, parking info, and admin-uploaded photos. Realizes UJ-1.

#### FR-7: Get directions
The Detail Sheet displays the Location's address/Eircode as copyable text, so the user can paste it into their own maps app. Realizes UJ-1.

**Out of Scope:** One-tap "Open in Maps" deep-linking to Google/Apple Maps is a deliberate fast-follow, not required for v1 — copy/paste is the intended v1 experience, not a stopgap being tolerated.

### 4.3 Access Gate & Accounts
**Description:** Browsing the map and list stays fully open to anonymous users. Detail views are capped to encourage account creation without blocking the core "see what's out there" experience. Realizes UJ-1.

**Functional Requirements:**

#### FR-8: Anonymous detail-view limit
An unauthenticated user can open the Detail Sheet for up to 3 distinct Locations (lifetime, per-device/browser). On the 4th distinct Location, the user is prompted to create a Free Account before the Detail Sheet opens. Map/list browsing and category filtering are never gated. Realizes UJ-1.

**Consequences (testable):**
- Re-viewing one of the same 3 already-seen locations does not consume additional allowance.
- The limit is not time-boxed (does not reset daily) in v1.

**Notes:** `[NOTE FOR PM]` This is a soft, client-tracked gate — a user clearing cookies/using incognito can reset it. Acceptable for v1 given the personal/close-circle launch scale (§2.1); revisit if abuse becomes real at public-launch scale.

#### FR-9: Account creation
A user can create a Free Account via email or Google sign-in (Supabase Auth).

#### FR-10: Profile
A signed-in user has a profile with a display name.

### 4.4 Personal Tracking
**Description:** The core retention loop — a personal, private record of where a user has been and wants to go. No public/social visibility in v1. Realizes UJ-1.

**Functional Requirements:**

#### FR-11: Tick off a location
A signed-in user can mark a Location as visited from its Detail Sheet. Self-reported; no photo or location verification required. Realizes UJ-1.

#### FR-12: Save a location
A signed-in user can save/bookmark a Location from its Detail Sheet, independent of tick-off state. Realizes UJ-1.

#### FR-13: View own ticks and saves
A signed-in user can view their own list of ticked-off and saved locations, via their Profile (§11).

### 4.5 User Contributions
**Description:** Signed-in users can add their own photos and comments to a Location, in-app, in real time (typically while at the spot). Everything enters a pending-review queue before it's publicly visible. Realizes UJ-3.

**Functional Requirements:**

#### FR-14: Upload a photo
A signed-in user can upload a photo to a Location from within the app.

**Consequences (testable):**
- `[ASSUMPTION: photo upload capped at ~10MB per file, JPEG/PNG only, no stated cap on number of photos per Location or per user for v1 — placeholder bound to size Supabase Storage and moderation load, confirm/adjust at architecture stage.]`

#### FR-15: Leave a comment
A signed-in user can leave a text comment on a Location.

**Consequences (testable):**
- `[ASSUMPTION: comment text capped at ~500 characters, no stated cap on number of comments per Location or per user for v1 — placeholder bound, confirm/adjust at architecture stage.]`

#### FR-16: Contributions are pending by default
User-submitted photos and comments are not publicly visible until an Admin approves them from the moderation queue (§4.6, FR-23).

#### FR-17: Offline contribution behavior
Offline queueing of uploads (auto-send once signal returns) is explicitly out of scope for v1 — an upload attempt with no signal simply fails, and the user retries manually.

**Out of Scope:** Revisit at the PWA/Capacitor polish phase (§6.1, phase 3).

### 4.6 Admin Management
**Description:** A protected `/admin` route, gated by the `role` field on the user's profile, inside the same app (not a separate build). This is where the location database is actually built out, county by county. Realizes UJ-2.

**Functional Requirements:**

#### FR-18: Protected admin route
Only a user with `role: admin` on their profile can access `/admin`; the route and its data are inaccessible (not just hidden) to other users.

**Consequences (testable):**
- Access control is enforced server-side (Supabase Row-Level Security / policy), not merely a client-side route guard.

#### FR-19: Add a location
Admin can create a new Location via a form with the fixed preset fields matching the data model (name, category, county, description, how-to-get-there, parking info, Cost Type/Amount, distance where applicable, photos). Realizes UJ-2.

#### FR-20: Set location coordinates
Admin can set a Location's coordinates either by clicking the point on a map, or by entering an address/Eircode that auto-geocodes to coordinates. Both methods are available; admin uses whichever is convenient per entry. Realizes UJ-2.

#### FR-21: Immediate publish
Submitting the admin form publishes the Location immediately — no draft or staged-review step exists in v1. Realizes UJ-2.

#### FR-22: Edit and remove locations
Admin can edit or remove any existing Location.

**Consequences (testable):**
- "Remove" is a soft-delete/archive, not a hard delete: the Location and its associated ticks, saves, and contributions are retained and hidden from the public map, not destroyed — allowing admin to restore a Location later without data loss.

#### FR-23: Moderate contributions
Admin can view pending user-submitted photos/comments and approve or reject each before it becomes publicly visible (realizes the moderation approach required by FR-16).

## 5. Non-Goals (Explicit)

- No multi-stop route planning or itinerary building in v1 (the mockup's dashed lines between pins are decorative only).
- No public leaderboard or social layer (no following other users, no public activity feed, no visible-to-others tick-off counts) — personal tick-offs/saves only. Revisit post-v1, see §14.
- No in-app turn-by-turn navigation — directions hand off to the user's own maps app.
- No monetization in v1 — see §12 for detail and rationale.
- No offline support for contributions (photo/comment uploads) — requires signal at time of submission.
- No native app store build in v1 — PWA-installable only; Capacitor wrap is a later phase (§6.1, phase 3).
- No content moderation automation (AI flagging, profanity filters) — admin manual review only.

## 6. MVP Scope

### 6.1 Build Sequence
All items in §6.2 are v1 scope, but not built in one pass — the brief's original phasing holds and downstream planning (epics/stories) should preserve it:

1. **Map + admin CRUD, no auth.** FR-1–FR-7, FR-18–FR-22 (excluding FR-23, which needs contributions to exist). Usable on its own — a browsable, admin-maintained map with no accounts yet.
2. **Auth + personal tracking + contributions.** FR-8–FR-17, FR-23. Layers in Supabase Auth, the Anonymous Gate, ticks/saves, and the photo/comment contribution + moderation loop.
3. **Polish, PWA, Capacitor wrap.** PWA installability (already §6.2 in-scope) hardens here; native iOS/Android wrap is explicitly deferred past this phase (§6.3).

### 6.2 In Scope
- Real map (MapLibre GL JS, real geography, illustrated-look styling) with category-colour pins, filter chips, map/list toggle, search.
- Location Detail Sheet: photos, cost, how-to-get-there (address/Eircode copy), parking info.
- Anonymous browsing with a 3-detail-view gate before requiring a Free Account.
- Email/Google sign-in via Supabase Auth.
- Personal tick-offs and saves (private to the user).
- Signed-in user photo/comment contributions, admin-moderated before going live.
- Protected `/admin` dashboard: add/edit/remove locations, dual coordinate-entry (map click or geocoded address), immediate publish, contribution moderation queue.
- PWA installability (installable home-screen app, no app store required).
- Baseline GDPR compliance: privacy policy, consent for photo uploads, account deletion removes personal data.
- Minimum content bar: at least 1 published location per county (~32) before calling v1 "launched."

### 6.3 Out of Scope for MVP
Everything in §5 Non-Goals is, by definition, also out of MVP scope (route planning, the leaderboard/social layer, offline contribution support, and native app wrap — see §5 for detail and rationale on each). Two items are MVP-specific deferrals not already covered there:
- Deep-link "Open in Maps" (fast-follow after v1, not deferred indefinitely).
- Gate-abuse hardening (cookie-clear bypass of the 3-view limit) — `[NOTE FOR PM]` acceptable at personal/close-circle scale, revisit if/when public launch materializes.

## 7. Success Metrics

**Primary**
- **SM-1**: Builder's own usage — the admin/builder actually uses the app for their own trip planning and doesn't abandon it after the initial build. Validates FR-1, FR-6, FR-7, FR-11, FR-12.
- **SM-2**: Content coverage — at least 1 published location per county reached (the v1 launch bar, §6.2). Validates FR-19–FR-22.

**Secondary**
- **SM-3**: Close-circle adoption — friends/family who are given access actually create accounts and tick off/save real places. Validates FR-8, FR-9, FR-11, FR-12.
- **SM-4**: Contribution loop works end to end at least once (a real photo/comment submitted, reviewed, and approved). Validates FR-14–FR-16, FR-23.

**Counter-metrics (do not optimize)**
- **SM-C1**: Anonymous-gate conversion rate should not be optimized upward at the cost of making browsing feel restrictive — the gate exists to nudge account creation, not to block discovery. Counterbalances SM-3.
- **SM-C2**: Number of locations added should not be chased at the cost of accuracy/thoroughness per location — competitor research (Roady, addendum) shows incomplete/inaccurate coverage is a named pain point even for well-resourced competitors. Counterbalances SM-2.

## 8. Cross-Cutting NFRs

- **Performance:** Map should feel responsive on a mobile connection while browsing rural areas with pins loaded from Supabase/PostGIS; no specific latency target set yet. `[ASSUMPTION: no numeric target was given — treat as "feels fast on typical mobile data," confirm/quantify during architecture.]`
- **Security:** Row-Level Security enforced in Supabase so users can only modify their own ticks/saves/contributions; admin role check enforced server-side (FR-18), not merely UI-hidden.
- **Accessibility:** Category is colour-coded but always paired with a distinct icon per category (per the mockup and brief) — mitigates colour-only reliance for colourblind users. No further accessibility target set for v1.

## 9. Constraints and Guardrails

### Privacy (baseline GDPR compliance)
Ireland-based app handling EU user accounts and user-submitted photos — treated as real v1 requirements, not deferred:
- A privacy policy is published and accessible in-app.
- Account deletion removes the user's personal data (profile, uploaded photos/comments where feasible, auth record); their tick/save history tied to their account is removed with it.
- Photo upload requires clear consent at time of upload (what it's used for, that it becomes publicly visible once approved).

### Content Moderation
- All user-submitted photos/comments are held pending until Admin approval (FR-16, FR-23) — chosen over live-then-remove specifically because a solo admin can't rely on catching bad content after the fact at any meaningful volume.

## 10. Aesthetic and Tone

Full palette, type, and pin-style reference lives in `PROJECT-BRIEF.md` (Design System section) and `wander-eire-map-mockup.jsx` (both in project root) — this PRD does not duplicate the token table. Summary:
- **Palette:** Cream background, Ink text/chrome, five category hues (Emerald/Trail, Terracotta/Historic, Amber/Viewpoint, Ocean/Beach, Plum/Camping) — colour is the primary category label, paired with an icon.
- **Type:** Space Grotesk (display), Inter (body/UI), IBM Plex Mono (data — distances, costs, timestamps).
- **Pins:** Circular "tack" badges — solid ring, drop shadow, white icon on category colour — not teardrop map markers.
- **Voice:** Not established beyond UI copy already in the mockup (e.g. "Where to next?"). `[ASSUMPTION: no broader tone/voice guidance given for description copy, comments, admin-authored text — confirm if this matters before content population begins.]`

## 11. Information Architecture

- **Map screen** (default landing) — search bar, filter chips, map/list toggle, pins.
- **Detail Sheet** — bottom sheet over the map screen (per mockup), not a separate route: photos, info, tick-off/save actions, contribution entry point.
- **Profile** — signed-in user's own ticks/saves list (FR-13), account management.
- **Sign-up/Sign-in** — triggered contextually by the Anonymous Gate (FR-8) or from the profile icon.
- **/admin** — protected dashboard: location list (add/edit/remove), contribution moderation queue.

## 12. Monetization

Free to use, no monetization in v1 — no ads, no paid tiers, no booking commissions. `[NON-GOAL for MVP]` This is a deliberate contrast with competitor research (Roady's free-to-paid switch damaged user trust, addendum) — staying genuinely free is a decision, not a placeholder.

## 13. Platform

- **Frontend:** React + Vite, MapLibre GL JS.
- **Map tiles:** MapTiler free tier or OpenStreetMap — real coordinates with illustrated-look vector styling.
- **Backend:** Supabase (Postgres + PostGIS, Auth, Storage).
- **Hosting:** Vercel or Netlify, free tier.
- **Mobile:** PWA first (installable, no app store) in v1; Capacitor wrap to iOS/Android is a later phase, same codebase, no rebuild (see §6.1, phase 3).

## 14. Open Questions

1. Final app name — "Wander Éire" is an explicit placeholder (brief, title of this doc).
2. Whether a public leaderboard/social layer gets added post-v1 — not decided; v1 deliberately ships without it.
3. Native app store timeline — post-PWA, no date set.
4. Whether the Anonymous Gate (FR-8) needs hardening against cookie-clear/incognito bypass — deferred until/unless public-launch scale makes it a real problem.
5. Numeric performance target for map load/pin render on mobile data — not yet quantified (§8).
6. Voice/tone guidance for location description copy and other product-authored text — not yet defined (§10).

## 15. Assumptions Index

- §8 — No numeric performance target given; treated as a qualitative "feels fast on mobile" bar pending architecture-phase quantification.
- §10 — No voice/tone guidance beyond existing mockup UI copy; flagged for confirmation before content population.
- §4.1 FR-5 — Search match semantics (case-insensitive substring match, explicit "no matches" state) placeholder pending architecture-stage confirmation.
- §4.5 FR-14 — Photo upload bound (~10MB, JPEG/PNG, no per-Location/per-user cap) is a placeholder to size Storage and moderation load, pending confirmation.
- §4.5 FR-15 — Comment length bound (~500 characters, no per-Location/per-user cap) is a placeholder, pending confirmation.
