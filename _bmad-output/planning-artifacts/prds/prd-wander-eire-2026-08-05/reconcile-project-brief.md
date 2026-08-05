# Reconciliation: PROJECT-BRIEF.md vs. PRD + Addendum

**Input:** PROJECT-BRIEF.md
**Compared against:** prd.md, addendum.md (both in `_bmad-output/planning-artifacts/prds/prd-wander-eire-2026-08-05/`)
**Date:** 2026-08-05

## Method

Read PROJECT-BRIEF.md section by section (What this is, v1 Scope, Tech Stack, Data Model, Design System, Build Order, Content, Open decisions) and checked each claim/idea — functional and qualitative — against the PRD's FRs, Non-Goals, NFRs, Aesthetic/Tone section, and the addendum. Looked specifically for content that vanished silently versus content that was deliberately deferred with a visible marker (`[ASSUMPTION]`, Open Question, Out of Scope note, etc.).

## Findings

### 1. Build Order / phased delivery strategy — not preserved (real gap)

The brief has a dedicated "Build Order" section describing three incremental phases:
1. Map + seeded locations + admin CRUD — **no auth yet, explicitly called "usable v1 on its own."**
2. Auth + tick-offs + saves + user photos/comments.
3. Polish + PWA + Capacitor wrap.

This is a meaningful strategic idea: the brief's author considered an authless map+admin-CRUD build to already qualify as a shippable v1. The PRD's MVP Scope (§6.1) instead bundles auth, personal tracking, and moderated contributions into a single flat v1 definition, with no acknowledgment that this could/should be staged, and no restatement of the "phase 1 alone is usable" framing. The only surviving trace is one passing reference in §6.2 ("Capacitor iOS/Android native wrap ... deferred to polish phase per brief's Build Order step 3") — steps 1 and 2, and the sequencing logic itself, aren't mentioned anywhere in the PRD or addendum. Since the PRD's own Document Purpose (§0) states only "the brief's design-system table and mockup remain the visual reference," the Build Order section was implicitly not carried forward and no equivalent lives elsewhere (e.g. an epics/sprint-sequencing note) to signal this was a deliberate call rather than a drop.

### 2. "Distance" as a displayed data point — not captured

The brief's Design System type spec assigns IBM Plex Mono to "data — distances, costs, timestamps," implying distance-to-location was an anticipated UI element (alongside cost and timestamp data, both of which the PRD does cover via Cost Type/Amount and ticked_at/saved_at-style fields). No FR, glossary entry, or IA element in the PRD references displaying a distance value (e.g., distance from the user's current position to a pin or list item), even though FR-2 covers showing the user's own position on the map. This is a small but concrete feature implied by the brief that the PRD's FR list doesn't carry forward.

### 3. Addendum misattributes a quote to the brief (data-integrity note, not a scope gap)

The addendum's "Admin publish timing" section states: *"The brief's phrase 'goes live the next day or next update cycle' initially read as a possible deliberate draft/review workflow."* No such phrase appears anywhere in PROJECT-BRIEF.md as provided — the brief's Build Order section says nothing about publish timing or update cycles. This likely reflects something said verbally during Discovery rather than written in the brief, but as currently worded it cites the brief for content the brief doesn't contain. Worth a quick correction (e.g. "clarified directly with the user" rather than "the brief's phrase") so the audit trail stays accurate.

### 4. Data Model section — functionally covered, but not explicitly carried forward (minor, likely non-issue)

The brief's explicit `locations`/`user_ticks`/`user_saves`/`user_photos`/`comments`/`profiles` schema sketch has no equivalent section in the PRD. Every field is functionally represented through the FRs and Glossary (e.g. FR-19's preset fields match the `locations` columns; FR-10/FR-18 cover `profiles.role`), so this isn't a requirements gap — schema detail is reasonably deferred to the architecture phase. Flagging only because, per §0, the PRD names design-system table and mockup as the two brief artifacts still treated as authoritative reference; the data model isn't named either way, leaving it ambiguous whether it's superseded-by-equivalent-FRs (true) or simply dropped.

## Not flagged (explicitly, deliberately handled)

- Design System palette/type/pin-style table — deliberately not duplicated, explicit pointer back to brief (§10).
- Voice/tone for copy — flagged by the PRD itself as an open assumption (§10, §14.6), not silently dropped.
- Directions as copy/paste vs. deep-link — deliberate scope call, documented in FR-7 Out of Scope and addendum.
- Leaderboard/social layer, native app timeline, final app name — all carried into Open Questions (§14).
- Tech stack, hosting, PWA/Capacitor plan — matches brief near-verbatim in PRD §13.
