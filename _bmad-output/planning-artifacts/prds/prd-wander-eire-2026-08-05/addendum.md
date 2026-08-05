# Addendum: Wander Éire

Depth that informed the PRD but doesn't belong in its main narrative.

## Competitor research: Roady (roady.co.nz)

Researched as grounding context during Discovery — a New Zealand road-trip discovery app, closest existing comparable to Wander Éire's core concept.

**What it does:** Mobile app covering NZ (and since 2024, Australia), built around an interactive map of 2,500+ curated spots (swimming holes, hikes, waterfalls, viewpoints, geothermal sites). Users browse, save to a personal "bucket list," and build itineraries with drive-time calculations between saved stops. Has a real social/gamification layer: mark a place "visited" via photo upload, earn badges, compete on a leaderboard, and a profile page shows a visited-places map as a personal travel record. Layers in commerce: in-app booking of campervans/rental cars (commission deals with Juicy, THL, Mad Campers) and discounted tourism activities. Some UGC (ratings, tips, photos) supplements an editorially curated base map.

**What it gets right (per app store reviews, NZ Herald):** Discovery value ("opens up so many opportunities to spots I never knew existed") and the tick-off/collection mechanic are the core hook — reviewers call it addictive in a good way. Trip-planning is well-executed. Founder's framing (Pokémon-Go-inspired: turn exploration into a game that gets people outdoors) is coherent and resonant.

**Gaps / criticism (opportunity for Wander Éire):**
- **Free-to-paid switch damaged trust** — Roady reportedly moved from free to a paid subscription model (up to ~NZ$17.99) with no warning, alienating users who valued the original "free spirits collaborating" ethos, especially budget travelers. Directly informs Wander Éire's Monetization decision (PRD §12) to stay genuinely free as a deliberate choice, not a placeholder.
- **Coverage/content gaps** — users paying for subscriptions found the app "missing over half" the advertised waterfalls/walks/hotspots for a region, despite editorial curation. Directly informs the counter-metric SM-C2 (PRD §7) — location count should never be chased at the expense of per-location accuracy/thoroughness.
- **UGC follow-through was inconsistent** — some user-submitted spots were accepted, others "ignored for months," suggesting weak/slow moderation. Informs the decision to make admin review a hard gate (FR-16) rather than live-then-remove, so nothing sits in limbo indefinitely — though note this is a process discipline, not (yet) a technical guarantee against the same failure mode at scale.

**Business model (for contrast):** Freemium/subscription (~NZ$7.99/mo, up to $29.99 for broader access) plus commission revenue on campervan/rental-car bookings and tourism-experience bookings, plus a separate in-house travel-media/content arm doing commissioned shoots for tourism boards. Company started as a travel media business in 2017 before the app launched in 2022.

**Content strategy (for contrast):** Hybrid — core map built 2017–2021 by the founding team physically touring NZ (first-party editorial), later supplemented by user ratings/tips/photos and tourism-board partnerships. Not an open user-submission-first model.

**Relevance:** Roady validates the map → pin detail → tick-off/save → plan loop as a proven format, and shows gamification/leaderboards as optional rather than load-bearing — consistent with the brief's decision to defer the social layer (PRD §5, §14 Open Question 2).

## Directions: copy/paste vs. deep-link (why v1 chose copy/paste)

Discussed directly with the user during Discovery (not independently researched). v1 shows the address/Eircode as copyable text rather than a one-tap "Open in Maps" deep link (`geo:` URI / `maps://` / Google Maps intent). This was a direct scope call, not a technical constraint — deep-linking is not meaningfully harder to build than copy/paste, and is flagged in the PRD (§4.2, FR-7 Out of Scope) as a near-term fast-follow rather than a deferred-indefinitely item. Worth revisiting early once the core browsing/detail flow is stable, since it's low-effort relative to the UX improvement.

## Pin placement: why both methods, not one

The user's answer to "how does admin set a pin's location" was "1 or 2" against a forced-choice question (click-to-drop on map vs. type address/Eircode with auto-geocode) — read as "support both," not "pick one," since a solo admin doing county-by-county research will sometimes have a precise map view in mind and other times just have an address on hand. Both are captured as FR-20. If auto-geocoding turns out to need a paid API tier or adds real implementation cost, click-to-drop alone is the fallback — worth a quick sanity check at the architecture stage before committing to both.

## Admin publish timing: why immediate, not staged

The user's own phrase during Discovery — "goes live the next day or next update cycle" — initially read as a possible deliberate draft/review workflow. Clarified directly with the user: it was describing an expectation that publish wouldn't be *instant*, not a request for a staging/approval step. With Supabase's real-time backend, there's no technical reason to withhold publish, so FR-21 makes it immediate. This only applies to admin-authored locations — user *contributions* (photos/comments) still get a hard moderation gate (FR-16), which is a different concern (public-facing UGC quality/safety, not admin content velocity).
