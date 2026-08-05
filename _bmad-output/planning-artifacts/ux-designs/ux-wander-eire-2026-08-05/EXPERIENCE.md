---
name: Wander Éire
description: Information architecture, states, interactions, and flows for the Wander Éire v1 build.
status: final
created: 2026-08-05
updated: 2026-08-05
sources:
  - /Users/markhoare/wander-eire/PROJECT-BRIEF.md
  - /Users/markhoare/wander-eire/_bmad-output/planning-artifacts/prds/prd-wander-eire-2026-08-05/prd.md
  - /Users/markhoare/wander-eire/wander-eire-map-mockup.jsx
---

# Wander Éire — Experience Spine

> Solo-build (Claude Code), consumer + one-person admin. Paired with `DESIGN.md`. Two distinct surfaces with different form factors: the public app (mobile-viewport PWA) and `/admin` (responsive, mobile through desktop).

## Foundation

Mobile-viewport-first PWA for the public app — React + Vite, MapLibre GL JS, installable, no native app-store build in v1. No named UI system; components are custom, built to `DESIGN.md` tokens. `/admin` is the one responsive surface (see Responsive & Platform). `DESIGN.md` is the visual identity reference; this spine is the behavior.

Two distinct user roles with entirely separate surfaces and no crossover UI: **anonymous/signed-in visitors** (map, search, detail, profile) and **admin** (`role: admin` only, `/admin`), enforced server-side (FR-18), not a client-side toggle.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Map (default landing) | App open | Primary browse surface: search bar, filter chips, pins over real geography |
| List drawer | Map/list toggle | Same filtered location set as a scrollable list, sliding up over the map (map stays mounted underneath) |
| Search results | Typing in the search bar | Live name-match list, replaces the map area until dismissed |
| Detail view | Pin tap, list-row tap, or search-result tap | Full-screen: photos, cost, distance, description, how-to-get-there, parking, tick/save, Photos & Comments |
| Sign-up/Sign-in modal | Anonymous Gate (4th distinct detail view) or profile icon tap | Overlay on the triggering context; closes back into it on success |
| Profile | Profile icon (signed-in) | Ticked/Saved tabs, progress stat, account settings, account deletion |
| Privacy policy | Auth modal footer link, profile menu | Static policy page |
| `/admin` dashboard | Admin nav entry (role-gated) | Location list (add/edit/remove), moderation queue entry point |
| Admin location form | Dashboard "+ Add", or edit on a list row | Collapsible-section form + coordinate picker (map click or address/Eircode geocode) |
| Moderation queue | Admin dashboard nav | List of pending photo/comment contributions, inline approve/reject |

→ Composition reference: `imports/wander-eire-map-mockup.jsx` illustrates Map, filter chips, pin interaction, and the bottom-sheet concept the Detail view supersedes (see reconciliation note below). Spine wins on conflict.

## Voice and Tone

Microcopy only — brand voice and aesthetic posture live in `DESIGN.md` → Brand & Style. Warm, in-voice even in edge cases — "Where to next?" is the register everywhere, not just the happy path.

| Do | Don't |
|---|---|
| "Nothing here yet — try a different spot or widen your search." | "No results found." |
| "Couldn't reach the map — check your connection and try again." | "Network error (500)." |
| "You're in! Welcome to Wander Éire." (post sign-up) | "Account created successfully." |
| "Submitted — this goes live once we've had a look." (contribution pending) | "Your submission is pending moderation review." |
| Short, complete sentences, contractions welcome | Exclamation-heavy hype copy, streak/gamification language |
| Data (cost, distance, county) always in `{typography.meta-mono}`, never dressed up in prose | Burying a cost/distance figure inside a sentence instead of its own mono line |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md` → Components.

| Component | Use | Behavioral rules |
|---|---|---|
| Tack pin | Map | Tap opens Detail view directly (no intermediate peek). Filtered-out pins dim to reduced opacity, never removed (FR-3) — geography stays legible under any filter. No clustering: overlapping pins at low zoom are resolved by the user zooming in, not by merging. |
| Filter chip | Map header | Horizontal scroll, "All" + one chip per category. Single active filter at a time (tapping a new chip replaces, doesn't add to, the active one) — filter narrows visual focus, it isn't a multi-select query builder. |
| Search bar | Map header | Live as-you-type. Non-empty query swaps the map area for the Search results list; clearing the query restores the map. The slider icon is decorative in v1 (no second filter mechanism behind it — FR-3 note). |
| Drawer sheet (List) | Map/list toggle | Slides up as a sheet over the still-mounted map; respects the active category filter and dims the same way the map would. Dismiss returns to the map, filter state preserved. Same `Drawer sheet` component reused for the Sign-up/Sign-in modal below, different content. |
| Detail view | Pin / list / search tap | Full-screen, not a sheet. Header: back affordance + category icon badge + name/county/cost/distance meta line. Body scrolls: photo gallery, description, how-to-get-there (copyable address/Eircode, FR-7), parking info, tick/save buttons, Photos & Comments section. |
| Tick / save buttons | Detail view header block | Independent toggles (FR-11/FR-12) — ticking doesn't imply saving or vice versa. Both visible and reachable without scrolling, matching the mockup's paired-icon-button layout. Unauthenticated tap → same Sign-up/Sign-in modal as the Anonymous Gate, framed as "Sign up to tick this off" rather than the generic gate copy. |
| Photos & Comments section | Detail view, scrolled section | Feed of approved photos/comments; the submitting user's own pending items appear inline marked "Pending review" (visible only to them, not other users). Inline add control at the top of the section — no separate modal/FAB flow. |
| Sign-up/Sign-in modal | Gate trigger, profile icon, tick/save on unauthenticated | Overlay, one level deep. Email or Google (Supabase Auth). Footer: privacy policy link. On success, closes and resumes the exact action that triggered it (opens the gated Detail view, completes the tick/save). |
| Anonymous Gate | 4th distinct Detail view open | Blocking — the modal appears *instead of* the Detail view opening; no teaser content shown first. Re-opening one of the first 3 already-seen locations never triggers it (FR-8). |
| Profile tabs | Profile screen | Ticked / Saved as switchable tabs, each a list using pin category-colour + icon styling per row. Display name (FR-10) heads the screen, editable from Profile settings. Progress stat ("X of 32 counties" or similar) sits above the tabs, framed as a personal record, never comparative. Locations the admin has since archived (FR-22) are filtered out of both tabs silently — a tick/save record persists in the database for admin's own audit trail, but never renders a dead link. |
| Admin table row | `/admin` dashboard — location list, and `/admin` moderation — pending contributions | **Location list:** edit and remove per row; removed locations show a distinct "archived" badge rather than disappearing from the admin's own list (soft-delete, FR-22) — admin can still find and restore them here. **Moderation queue:** thumbnail/text preview + submitter + target location + Approve/Reject inline per row; Approve makes the item immediately public, Reject removes it from the queue (the submitter's own Detail view no longer shows it as pending — no separate "rejected" notice in v1). |
| Admin location form | Add / edit flow | Collapsible sections: Basics, Location & Access, Cost & Distance, Photos. Coordinate picker supports both map-click and address/Eircode geocode entry (FR-20) within the Location & Access section. Submit publishes immediately (FR-21) — no draft state. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold map load | Map | Spinner centered over the cream base while pins/tiles fetch; map interaction disabled until first paint. |
| Location permission denied | Map | Map stays at the full-Ireland default view; no banner, no re-prompt nag — geolocation is a convenience, not a requirement, so denial is silent and non-blocking (FR-2). |
| Zero pins for active filter | Map / List | Pins/list rows simply thin out to none for that category — no blocking empty-state message, since geography (dimmed inactive pins) remains visible as context. `[ASSUMPTION: no location for a category anywhere on the map is a real possibility pre-launch; treat as a normal, non-error empty state]` |
| Search — no matches | Search results | "Nothing here yet — try a different spot or widen your search." No suggested alternates in v1. |
| Network/load failure | Map, Detail view, any fetch | "Couldn't reach the map — check your connection and try again." with a retry action. Never blocks the whole app — cached/already-loaded content stays visible where possible. |
| Detail view loading | Detail view (opening) | Spinner in place of content while the record fetches; header/back affordance renders immediately so the user isn't stranded. |
| Anonymous Gate hit | Blocking modal | See Component Patterns — always blocking, always the same copy regardless of which location triggered it. |
| Auth failure | Sign-up/Sign-in modal | "That didn't work — check your details and try again." inline below the form; modal stays open, doesn't dismiss or lose entered email. Covers bad credentials, already-registered email, and a cancelled/failed Google auth alike — no need to distinguish the cause in copy. |
| Contribution pending | Photos & Comments section | "Submitted — this goes live once we've had a look." shown inline where the photo/comment would render, in the submitter's own view only. |
| Upload failure (no signal) | Photo/comment add | "Couldn't send that — check your connection and try again." Fails cleanly, no offline queue (FR-17 — explicit non-goal). |
| Admin form validation error | Admin location form | Inline, per-field, at the point of error — required fields (name, category, county, coordinates) block submit; optional fields (distance, parking info) never block. |
| Geocode failure | Admin location form — Location & Access | "Couldn't find that address — try a different search or click the map instead." inline under the address field; coordinates stay unset and the map-click method remains available as the fallback (FR-20 names both entry paths as always-available, not primary/backup). |
| Empty Ticked/Saved tab | Profile | "Nothing ticked off yet — start exploring the map." / "Nothing saved yet — bookmark something for later." Each tab's empty state links back to the map. |
| Empty moderation queue | `/admin` moderation | "Nothing waiting on you." — plain confirmation, not a call to action (there's nothing for admin to do). |
| Account deletion confirm | Profile settings | Two-step confirm (not a single button) — see Accessibility Floor / GDPR note below. No colour-coded "danger" treatment (`DESIGN.md` — no system-state colour); weight + copy carry the seriousness. |

## Interaction Primitives

- Tap opens: pin → Detail view, list/search row → Detail view, filter chip → replace active filter, "All" → clear filter.
- Drag: the List variant and the Sign-up/Sign-in modal both slide up/dismiss via drag, sharing the `Drawer sheet` component; the Detail view uses a back affordance instead of a swipe-dismiss (it's a view, not a sheet).
- Copy-to-clipboard: tapping the address/Eircode in Detail view copies it and shows a brief confirmation ("Copied.") — no deep-link to Google/Apple Maps in v1 (FR-7, explicit fast-follow).
- Live filtering: category chips and search both filter in real time, no submit step.
- **Banned:** teardrop/marker pin silhouettes anywhere; a second filter mechanism behind the search bar's slider icon (decorative only, FR-3 note); hard delete of locations (soft-delete/archive only, FR-22); offline upload queueing (FR-17); any visible-to-others tick/save count or leaderboard (non-goal, PRD §5); system-state colour reuse of a category hue (`DESIGN.md`).

## Accessibility Floor

Behavioral rules; visual contrast lives in `DESIGN.md`.

- Category is always colour **+ icon** — never colour alone (PRD §8 NFR, carried through every component in the table above).
- **Contrast flag carried from `DESIGN.md`:** `{colors.amber}` (`#F0A93A`) pins/badges need an icon outline/halo treatment to clear WCAG non-text contrast (~2:1 bare, needs 3:1) — apply wherever a white icon sits directly on Amber fill (pin, active filter chip, icon badge).
- Tap targets ≥ 44×44px for every interactive element (pins, chips, tick/save buttons, form controls) — the tack-pin's 32px default visual size sits inside a ≥44px tap area.
- Destructive/system-state actions (account deletion, reject-contribution, remove-location) are never colour-coded red or otherwise; they're distinguished by copy, icon (e.g. trash/warning glyph in ink), and — for account deletion specifically — a two-step confirm.
- Focus traversal follows reading order on every surface; the Sign-up/Sign-in modal and the List variant of the Drawer sheet trap focus while open (standard modal/sheet behavior) and return focus to the trigger on dismiss.
- Photo uploads: alt text is not collected from users in v1 `[ASSUMPTION: no alt-text field specified in PRD FR-14; user-submitted photos render without meaningful alt text at launch — flag for a fast-follow if this matters before public launch]`.

## Responsive & Platform

Public app (Map, List, Detail, Profile, auth) is designed and built mobile-viewport-first, matching the PRD's PWA-first framing — no desktop-specific reflow in v1 (`DESIGN.md` → Layout & Spacing).

`/admin` is the exception: responsive from mobile through desktop, since the admin (the builder) does bulk data entry from a desk but needs quick-edit access from the field too. Desktop widens the location list to a denser table and gives the coordinate-picker map more screen real estate; mobile keeps the same collapsible-section form and list, single-column. No breakpoint-specific behavioral differences beyond density — the same components, sections, and validation rules apply at every width.

## Inspiration & Anti-patterns

- **Rejected — Roady's free-to-paid pivot:** named directly in PRD §12 and §7 (SM-C2) as a trust-damaging move by a direct competitor. Wander Éire's "free to use, no monetization in v1" isn't a placeholder pending a business model — it's a deliberate posture this spine should never quietly erode (no soft paywalls, no "premium" location badges, no ad-shaped UI slots reserved for later).
- **Rejected — leaderboards/social visibility:** explicit PRD non-goal (§5). The progress stat on Profile is framed as a personal record for exactly this reason — never a rank, never visible to other users, never comparative language in its copy.

## Key Flows

### Flow 1 — Mary discovers and visits a spot (Map, Detail, Anonymous Gate)

1. Mary opens the app, unauthenticated. Map loads to a full-Ireland view (location permission not yet granted).
2. She allows location access; the map re-centers on her area.
3. She taps a nearby pin — Detail view opens full-screen: photos, cost, how-to-get-there.
4. She backs out, taps two more pins she's curious about (2nd and 3rd distinct views).
5. She taps a 4th, different pin.
6. **Climax:** the Anonymous Gate modal appears instead of the Detail view — "create a free account to keep exploring." She wasn't blocked from browsing or filtering at any point before this, only from a 4th detail read.
7. She signs up via Google in the modal; on success it closes and the 4th location's Detail view opens automatically — the interrupted action resumes rather than dropping her back at the map.
8. She copies the address/Eircode and leaves the app to drive there, using her own maps app.

Failure: location permission denied at step 2 → map stays at full-Ireland view, no feature blocked by the missing permission (FR-2).

### Flow 2 — Admin adds a new location (Admin dashboard, Location form)

1. Admin, signed in with `role: admin`, opens `/admin`.
2. Taps "+ Add Location" from the dashboard.
3. Fills the Basics section (name, category, county, description).
4. Expands Location & Access, types an address to auto-geocode coordinates (rather than clicking the map for this one).
5. Fills Cost & Distance, uploads photos in the Photos section.
6. Submits.
7. **Climax:** the location publishes immediately — it's live on the public map with no draft/review step.
8. Back on the dashboard's location list, admin finds the new entry to confirm it, available for later edit or archive.

Failure: a required field (name, category, county, coordinates) is missing at submit → inline validation error at that field, publish blocked until resolved (FR-19).

### Flow 3 — Mary contributes a photo at the spot (Detail view, Photos & Comments)

1. Mary — now signed in, continuing from Flow 1 — is physically at a location she's already viewed, and opens its Detail view.
2. Scrolls to Photos & Comments, taps the inline add control.
3. Captures a photo, optionally adds a short comment, and submits — a one-time upload-consent acknowledgment covers this (already agreed at signup or first upload, not re-shown per submission).
4. **Climax:** her own view shows the photo inline marked "Pending review" — she knows it was received, but not yet live for anyone else.
5. No signal at the spot → the attempt simply fails with a retry prompt; she tries again later manually (FR-17, no offline queue).

### Flow 4 — Admin moderates a contribution (Moderation queue)

1. Admin opens `/admin` → Moderation queue, sees a list of pending photo/comment submissions with thumbnail, submitter, and target location per row.
2. Reviews one row's photo and comment text inline.
3. **Climax:** taps Approve — the item becomes publicly visible on that location's Detail view immediately, no further step.
4. On a separate row admin judges unsuitable, admin taps Reject instead: it's removed from the queue and no longer shown as pending in the submitter's own Detail view either.

---

## Reconciliation note (mockup import)

`imports/wander-eire-map-mockup.jsx` is the locked visual reference for palette, type, pin styling, filter chips, and the overall bright/bold posture — all carried forward into `DESIGN.md` unchanged. Two structural decisions in this spine diverge from what the mockup literally shows, both made explicitly in Discovery, not by accident:

- The mockup's **bottom sheet** (compact, docked under the map) is the Detail *peek* pattern — this spine instead opens Detail as a **full-screen view** on every tap. The bottom sheet's visual language (rounded top, grabber, white surface) is preserved and reused for the List drawer and the Sign-up/Sign-in modal instead.
- The mockup's dashed lines between pins are explicitly decorative (PRD §5 non-goal: no route planning) — not carried into any interactive component.
