---
stepsCompleted: [1, 2, 3, 4, 5, 6]
documentsUsed:
  prd: _bmad-output/planning-artifacts/prds/prd-wander-eire-2026-08-05/prd.md
  prdAddendum: _bmad-output/planning-artifacts/prds/prd-wander-eire-2026-08-05/addendum.md
  architecture: _bmad-output/planning-artifacts/architecture/architecture-wander-eire-2026-08-05/ARCHITECTURE-SPINE.md
  ux:
    - _bmad-output/planning-artifacts/ux-designs/ux-wander-eire-2026-08-05/DESIGN.md
    - _bmad-output/planning-artifacts/ux-designs/ux-wander-eire-2026-08-05/EXPERIENCE.md
  epics: _bmad-output/planning-artifacts/epics.md
  projectBrief: PROJECT-BRIEF.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-08-06
**Project:** Wander Éire

## Document Discovery

**PRD:**
- Whole: `prds/prd-wander-eire-2026-08-05/prd.md`
- Companion: `prds/prd-wander-eire-2026-08-05/addendum.md` (competitor research / discovery context)

**Architecture:**
- Whole: `architecture/architecture-wander-eire-2026-08-05/ARCHITECTURE-SPINE.md`

**UX Design:**
- Spine pair: `ux-designs/ux-wander-eire-2026-08-05/DESIGN.md` + `EXPERIENCE.md`

**Epics & Stories:**
- Whole: `epics.md` (5 epics, 24 stories)

**Additional:**
- `PROJECT-BRIEF.md` (superseded by PRD per PRD §0, but its Build Order section governs epic-level phase sequencing)

**No duplicates found** — each document type exists in exactly one location (whole file, not sharded). No conflicting versions to resolve.

## PRD Analysis

### Functional Requirements

FR-1: View published locations on the map — any user (anonymous or signed-in) can view an overview map of Ireland showing pins for all published Locations.
FR-2: See own location on the map — a user can allow the app to show their current position on the map (device geolocation), to identify nearby pins.
FR-3: Filter by category — a user can filter visible pins by category using filter chips, and toggle back to "All."
FR-4: Map/list toggle — a user can switch between the map view and a scrollable list view of the same (filtered) set of locations.
FR-5: Search by name — a user can search for a Location by name via a search bar.
FR-6: View location detail sheet — tapping a pin (or list item) opens a Detail Sheet showing: name, category, county, Cost Type/Amount, distance (where applicable), description, how-to-get-there info, parking info, and admin-uploaded photos.
FR-7: Get directions — the Detail Sheet displays the Location's address/Eircode as copyable text, so the user can paste it into their own maps app.
FR-8: Anonymous detail-view limit — an unauthenticated user can open the Detail Sheet for up to 3 distinct Locations (lifetime, per-device/browser). On the 4th distinct Location, the user is prompted to create a Free Account before the Detail Sheet opens.
FR-9: Account creation — a user can create a Free Account via email or Google sign-in (Supabase Auth).
FR-10: Profile — a signed-in user has a profile with a display name.
FR-11: Tick off a location — a signed-in user can mark a Location as visited from its Detail Sheet.
FR-12: Save a location — a signed-in user can save/bookmark a Location from its Detail Sheet, independent of tick-off state.
FR-13: View own ticks and saves — a signed-in user can view their own list of ticked-off and saved locations, via their Profile.
FR-14: Upload a photo — a signed-in user can upload a photo to a Location from within the app.
FR-15: Leave a comment — a signed-in user can leave a text comment on a Location.
FR-16: Contributions are pending by default — user-submitted photos and comments are not publicly visible until an Admin approves them from the moderation queue.
FR-17: Offline contribution behavior — offline queueing of uploads is explicitly out of scope for v1; an upload attempt with no signal simply fails, and the user retries manually.
FR-18: Protected admin route — only a user with `role: admin` on their profile can access `/admin`; the route and its data are inaccessible (not just hidden) to other users. Access control enforced server-side (RLS).
FR-19: Add a location — Admin can create a new Location via a form with the fixed preset fields matching the data model.
FR-20: Set location coordinates — Admin can set a Location's coordinates either by clicking the point on a map, or by entering an address/Eircode that auto-geocodes to coordinates.
FR-21: Immediate publish — submitting the admin form publishes the Location immediately — no draft or staged-review step exists in v1.
FR-22: Edit and remove locations — Admin can edit or remove any existing Location. "Remove" is a soft-delete/archive, not a hard delete.
FR-23: Moderate contributions — Admin can view pending user-submitted photos/comments and approve or reject each before it becomes publicly visible.

Total FRs: 23

### Non-Functional Requirements

NFR1 (Performance): Map should feel responsive on a mobile connection while browsing rural areas with pins loaded from Supabase/PostGIS; no specific numeric latency target set for v1.
NFR2 (Security): Row-Level Security enforced in Supabase so users can only modify their own ticks/saves/contributions; admin role check enforced server-side, not merely UI-hidden.
NFR3 (Accessibility): Category is colour-coded but always paired with a distinct icon per category; no further accessibility target set beyond that in the PRD itself (UX spine adds more detail — see UX-DR analysis).

Total NFRs: 3 (PRD-stated) — expanded to 5 in epics.md by folding in §9's Privacy/GDPR and Content Moderation constraints as NFR-4/NFR-5, since the PRD itself frames those as "real v1 requirements, not deferred" even though it doesn't label them NFR.

### Additional Requirements

- Baseline GDPR compliance: privacy policy published and accessible in-app; account deletion removes personal data; photo upload requires clear consent at time of upload (PRD §9).
- Content moderation: all user-submitted photos/comments held pending until Admin approval — chosen deliberately over live-then-remove (PRD §9).
- Minimum content bar: at least 1 published location per county (~32) before calling v1 "launched" (PRD §6.2) — an operational/content milestone, not a code deliverable; correctly out of scope for epics/stories.
- Platform constraints (§13): React+Vite, MapLibre GL JS, Supabase (Postgres+PostGIS, Auth, Storage), Vercel/Netlify hosting, PWA-first with Capacitor as a later phase — fully reflected in the Architecture Spine and epics.md's Additional Requirements section.
- No starter-template requirement stated in Architecture, but the repo already has a Vite+React+TS scaffold in place (confirmed via git history) — epics.md's Epic 1 Story 1.1 correctly builds on it rather than re-scaffolding.

### PRD Completeness Assessment

The PRD is unusually thorough for a solo-builder project: every FR has explicit "Consequences (testable)" sub-bullets, all ambiguous points are tagged `[ASSUMPTION]` and indexed in §15, and open questions are separated out in §14 rather than left implicit. The Architecture Spine (read in the prior epics/stories workflow) resolves nearly all of the PRD's own `[ASSUMPTION]` tags via specific ADs (AD-5, AD-13, AD-19, AD-22, AD-23, AD-27), which is atypical completeness for this stage — most of the residual risk by this point is in cross-document sequencing (epic/story order), not missing requirements. No PRD-level gaps found during this analysis.

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement (short) | Epic Coverage | Status |
|---|---|---|---|
| FR-1 | View published locations on map | Epic 1, Story 1.1 | ✓ Covered |
| FR-2 | See own location on map | Epic 1, Story 1.2 | ✓ Covered |
| FR-3 | Filter by category | Epic 1, Story 1.3 | ✓ Covered |
| FR-4 | Map/list toggle | Epic 1, Story 1.4 | ✓ Covered |
| FR-5 | Search by name | Epic 1, Story 1.5 | ✓ Covered |
| FR-6 | View location detail sheet | Epic 1, Story 1.6 | ✓ Covered |
| FR-7 | Get directions (copy address) | Epic 1, Story 1.6 | ✓ Covered |
| FR-8 | Anonymous detail-view limit | Epic 3, Story 3.1 | ✓ Covered |
| FR-9 | Account creation | Epic 3, Story 3.3 | ✓ Covered |
| FR-10 | Profile | Epic 3, Story 3.4 | ✓ Covered |
| FR-11 | Tick off a location | Epic 3, Story 3.5 | ✓ Covered |
| FR-12 | Save a location | Epic 3, Story 3.5 | ✓ Covered |
| FR-13 | View own ticks and saves | Epic 3, Story 3.6 | ✓ Covered |
| FR-14 | Upload a photo | Epic 4, Story 4.1 | ✓ Covered |
| FR-15 | Leave a comment | Epic 4, Story 4.2 | ✓ Covered |
| FR-16 | Contributions pending by default | Epic 4, Stories 4.1/4.2/4.3 | ✓ Covered |
| FR-17 | Offline contribution behavior | Epic 4, Stories 4.1/4.2 + Epic 5, Story 5.3 | ✓ Covered |
| FR-18 | Protected admin route | Epic 2, Story 2.1 | ✓ Covered |
| FR-19 | Add a location | Epic 2, Stories 2.2/2.3 | ✓ Covered |
| FR-20 | Set location coordinates | Epic 2, Story 2.2 | ✓ Covered |
| FR-21 | Immediate publish | Epic 2, Story 2.2 | ✓ Covered |
| FR-22 | Edit and remove locations | Epic 2, Story 2.4 | ✓ Covered |
| FR-23 | Moderate contributions | Epic 4, Story 4.4 | ✓ Covered |

### Missing Requirements

None. No FR appears in epics.md without a traceable story, and no story references an FR number absent from the PRD.

### Coverage Statistics

- Total PRD FRs: 23
- FRs covered in epics: 23
- Coverage percentage: 100%

## UX Alignment Assessment

### UX Document Status

Found — `DESIGN.md` (visual identity/tokens) + `EXPERIENCE.md` (behavior/IA/flows), the bmad-ux spine pair, both read in full.

### Alignment Issues

**UX ↔ PRD:** Fully aligned. `EXPERIENCE.md`'s four Key Flows map directly to PRD's UJ-1/UJ-2/UJ-3. The UX spine explicitly documents its own two deliberate divergences from the reference mockup (full-screen Detail view instead of a bottom sheet; dashed route-lines dropped as decorative) in its "Reconciliation note" section — these are resolved decisions, not unflagged drift. FR-8 (Anonymous Gate), FR-16 (moderation-pending), FR-20 (dual coordinate entry), and FR-21 (immediate publish) all have matching, non-contradictory UX treatment.

**UX ↔ Architecture:** Fully aligned, unusually tightly — the Architecture Spine was authored with the UX spine as a direct input and cites it explicitly in several places: AD-11's photo-visibility RLS rule is written to match `EXPERIENCE.md`'s stated rejected-content behavior verbatim; AD-26 (OAuth pending-action resume via `sessionStorage`) exists specifically to satisfy a gap `EXPERIENCE.md` Flow 1 would otherwise have left unhandled; and the Consistency Conventions table instructs that all error/empty-state copy must match `EXPERIENCE.md`'s State Patterns table exactly, not be re-authored ad hoc. No UI component or interaction pattern in either UX file lacks a supporting architectural decision.

### Warnings

None. No unaddressed UX requirement, no architecture gap against UX, no missing UX documentation.

## Epic Quality Review

### A. User Value Focus Check

| Epic | Title | User-Centric? |
|---|---|---|
| 1 | Map & Location Discovery | ✓ Clear user outcome (browse/find/view places) |
| 2 | Admin Location Management | ✓ Clear user outcome (admin grows content without code) |
| 3 | Accounts & Personal Tracking | ✓ Clear user outcome (create account, track visits) |
| 4 | User Contributions & Moderation | ✓ Clear user outcome (contribute + admin review loop) |
| 5 | PWA Installability & Offline-Read Hardening | ⚠️ Borderline, reviewed — flagged deliberately, same category as the checklist's own "Authentication System" example. Verdict: **passes**. Its goal statement is framed entirely from the user's vantage ("a user can install... stays available with no signal"), not as a technical milestone ("set up service worker") — the underlying Workbox/manifest work is real, but every AC is phrased as an observable user outcome, not an implementation task. |

No epic reads as a disguised technical milestone ("Database Setup," "API Development," etc.).

### B. Epic Independence Validation

| Epic | Requires (past epics only) | Requires future epic? |
|---|---|---|
| 1 | — (seed data, self-contained) | No |
| 2 | Epic 1's `locations`/`categories`/`counties` schema | No |
| 3 | Epic 1 (locations to tick/save), Epic 2 (the `profiles` table Story 2.1 creates) | No |
| 4 | Epic 1 (locations), Epic 3 (signed-in users, `profiles` extended by 3.3) | No |
| 5 | Epic 1 (fetch to cache), Epics 3/4 (write behaviors it hardens) | No |

No epic requires a future epic to function. This was not automatic — two fixes applied during the epics/stories workflow's own final-validation pass are what make this hold:
1. Epic 2 Story 2.1 was revised to create the `profiles` table and a minimal admin-only sign-in itself, rather than implicitly depending on Epic 3's public auth flow — otherwise FR-18 (Phase 1 scope) would have silently required Phase 2 work to function.
2. Epic 3's story order was corrected so Privacy Policy Page (linked from the auth modal footer) precedes Account Creation, rather than following it.

Re-verified here independently and both hold.

### C. Within-Epic Story Dependency Check

Walked every epic's story sequence checking for forward references (a story depending on a *later* story):

- **Epic 1** (1.1→1.6): each story builds only on prior ones. No violations.
- **Epic 2** (2.1→2.4): 2.2 depends on 2.1's auth/profiles (past); 2.3 depends on 2.2's form existing (past); 2.4 depends on 2.2's location existing (past). No violations.
- **Epic 3** (3.1→3.7): 3.3 depends on 3.2's `/privacy` route (past, post-fix); 3.4–3.7 each depend only on 3.3 (signed-in) or earlier. No violations.
- **Epic 4** (4.1→4.5): 4.3 validates behavior established in 4.1/4.2 (past); 4.4 moderates content created in 4.1–4.3 (past); 4.5 extends Epic 3 Story 3.7 (past epic). No violations.
- **Epic 5** (5.1→5.3): 5.3 verifies write-failure behavior already specified in Epics 3/4 (past epics). No violations.

### D. Database/Entity Creation Timing

Each table is created in the first story that actually needs it, not upfront:

| Table | Created in | Needed for |
|---|---|---|
| `categories`, `counties`, `locations` | Epic 1, Story 1.1 | Map rendering |
| `profiles` (minimal) | Epic 2, Story 2.1 | FR-18 admin RLS check |
| `location_photos` | Epic 2, Story 2.3 | Admin photo upload |
| `profiles` (auto-provisioning trigger added) | Epic 3, Story 3.3 | Public sign-up |
| `user_ticks`, `user_saves` | Epic 3, Story 3.5 | Tick/save |
| `user_photos` | Epic 4, Story 4.1 | Photo contributions |
| `comments` | Epic 4, Story 4.2 | Comment contributions |
| `profiles.photo_upload_consent_at` (column added) | Epic 4, Story 4.1 | Upload consent tracking |

No "create all tables upfront" violation found.

### E. Starter Template / Greenfield Checks

- Architecture specifies no formal starter template; the repo already carries a Vite+React+TS scaffold (confirmed via `git log`), and Epic 1 Story 1.1 correctly builds on it rather than re-scaffolding — noted explicitly in epics.md's Additional Requirements section.
- No dedicated "project setup" or "CI/CD pipeline" story exists. This is **not** flagged as a gap: the Architecture Spine's own Deferred section explicitly states automated testing/CI strategy is "left to implementation discretion for a solo builder using Claude Code" — its absence as a story is consistent with that explicit deferral, not an oversight.

### Findings by Severity

**🔴 Critical Violations:** None found.

**🟠 Major Issues:** None found.

**🟡 Minor Concerns:**
- Epic 5's user-value framing is legitimate but sits closer to the line than Epics 1–4 (see 3A) — worth a final gut-check from you before implementation, though no change is recommended.

## Summary and Recommendations

### Overall Readiness Status

**READY**

### Critical Issues Requiring Immediate Action

None. Zero critical or major violations found across FR coverage, UX alignment, or epic/story quality.

### Recommended Next Steps

1. Proceed to **Sprint Planning** (`bmad-sprint-planning`) — the required next step in Phase 4, producing the implementation sequence for `bmad-create-story`/`bmad-dev-story` to follow story-by-story.
2. Before or during Story 1.2's implementation, resolve the one open `[ASSUMPTION]` it carries: whether the geolocation permission prompt fires automatically on map load or behind a manual "locate me" control — neither the PRD nor EXPERIENCE.md specifies the trigger.
3. Before or during Story 2.3's implementation, confirm the inferred assumption that admin location photos are optional (a location can publish with zero photos) — inferred from EXPERIENCE.md only naming distance/parking as explicitly optional, not stated outright either way.
4. Optional: sanity-check Epic 5's epic-level framing (PWA Installability & Offline-Read Hardening) against your own sense of user value before implementation — it passed review but was the closest call of the five epics.

### Final Note

This assessment reviewed the full PRD → UX → Architecture → Epics/Stories chain and found **zero critical or major issues**. Two real structural problems were caught and fixed *during* the epics/stories workflow itself (a hidden Phase-1 auth dependency, and a forward-referencing story order in Epic 3) — both were re-verified clean in this independent pass. What remains are two low-stakes, already-flagged implementation-time assumptions and one worth-a-glance framing call, none of which block moving into Phase 4. The artifact set is ready for sprint planning.
