# Rubric Walker Review — Wander Éire Architecture Spine

**Reviewer:** rubric-walker
**Target:** `ARCHITECTURE-SPINE.md` (architecture-wander-eire-2026-08-05)
**Inputs cross-checked:** `PROJECT-BRIEF.md`, `prd-wander-eire-2026-08-05/prd.md`
**Date:** 2026-08-05

## Verdict

The spine is strong overall — 26 well-formed ADs, a genuinely enforceable RLS-centric security model, honest and specific Deferred entries, and a Capability → Architecture Map that covers almost all of FR-1–FR-23. It is not launch-blocking-broken, but it has one real enforceability gap in a security-critical AD and two data-model completeness gaps (address/Eircode display, Cost Type/Amount) that are exactly the kind of "silent dimension" the checklist asks to catch — both are FR-backed requirements with no governing AD and no field in the ERD, and one of them (AD-19) references a decision as "already adopted" that was never actually made anywhere in the document.

## Findings

### 1. [HIGH] AD-11's storage-bucket RLS policy has no specified correlation mechanism between `storage.objects` and `user_photos` — the Prevents claim isn't actually implementable as written

**Where:** AD-11 (lines 102–106), also touches AD-9/AD-21.

AD-11's Rule states the `user-contributions` bucket's `storage.objects` `SELECT` RLS policy must allow access only if "the linked `user_photos` row is `status = 'approved'`, OR the requester is the submitter, OR the requester has `role = 'admin'`." Evaluating "the linked `user_photos` row" from within a `storage.objects` policy requires some way to derive the owning `user_photos.id` from the object's `name`/`bucket_id`/metadata (typically a path convention like `{user_photos_id}/{filename}` or a metadata field) so the policy's subquery can join to it. Nowhere in the spine — not in AD-11, not in AD-21's sibling pattern for `location_photos.storage_path`, not in the Consistency Conventions table — is that path/metadata convention specified.

This matters because AD-11's own "Prevents" clause is that a pending photo must never be publicly fetchable by URL before approval — the single most security-critical claim in the document (backed by FR-16 and §9 privacy). Without a fixed path convention, an implementer could structure `storage_path` any number of ways, and the RLS policy as described literally cannot be written without first re-deciding that convention — meaning the AD doesn't yet fully prevent what it claims to prevent; it prevents it only once a follow-on decision (undocumented) is made correctly.

**Suggested fix:** Add one sentence to AD-11 (or a new short AD) fixing the storage path convention, e.g. `user-contributions/{user_photos_id}/{filename}`, so the RLS subquery has something concrete to join on.

### 2. [MEDIUM-HIGH] FR-7 (address/Eircode display) has no governing AD, no ERD field, and an unresolved conflict with the dual coordinate-entry paths in FR-20

**Where:** Capability → Architecture Map, "Location Detail (FR-6, FR-7)" row (line 354); AD-5 (lines 66–70); AD-20; ERD (lines 269–321).

FR-7 requires: "The Detail Sheet displays the Location's address/Eircode as copyable text." This is an unconditional requirement on every published location's detail view. But:

- The ERD's `LOCATIONS` entity lists only `id`, `status`, `geo` — no address/Eircode text field exists anywhere in the spine's data model.
- AD-5 only discusses address/Eircode as an *input* to the admin's coordinate auto-fill (FR-20), not as a stored, displayable field.
- FR-20 explicitly allows two coordinate-entry methods — map-click **or** typed address/Eircode — "whichever is convenient per entry." If admin uses map-click, no address/Eircode string is ever captured, yet FR-7 still requires one to display.
- The Capability Map's "Location Detail (FR-6, FR-7)" row cites only AD-6 (status filter) as governing — nothing addresses where this data comes from or whether it's admin-required-text vs. derived-from-geocoding.

This is exactly the kind of feature-level divergence the spine exists to prevent: one implementer could assume the address auto-populates from a reverse-geocode of the coordinates; another could assume admin must always separately type a display address regardless of entry method — two incompatible admin-form shapes for FR-19/FR-20.

**Suggested fix:** Add an AD (or extend AD-19's Distance pattern) declaring `locations.address_display`: nullable free-text, always a distinct admin-entered field independent of the coordinate-entry mechanism, populated regardless of whether coordinates came from map-click or geocode auto-fill.

### 3. [MEDIUM] Cost Type / Cost Amount fields are referenced as an "already adopted pattern" but no such AD exists anywhere in the document

**Where:** AD-19 (line 153): "matching the same free-form-with-qualifier pattern **already adopted for Cost Amount**."

AD-19 (Distance) justifies its own free-text approach by analogy to Cost Amount, implying Cost Type/Cost Amount were decided earlier in the spine. They were not — there is no AD for `cost_type`/`cost_amount` anywhere in the Invariants & Rules section, and the ERD's minimal `LOCATIONS` entity doesn't list them either. This is a real field on the Detail Sheet (FR-6) and the admin form (FR-19), explicitly called out in the PRD Glossary as needing a "short qualifier" pattern (e.g. "€10 parking" vs. "€18") — i.e. it's non-trivial (not a plain numeric column), which is precisely the kind of thing this spine otherwise takes care to pin down for every comparable field (AD-7 category, AD-8 county, AD-19 distance).

Two consequences: (a) the document contains a factually incorrect internal claim ("already adopted" when it wasn't), and (b) the underlying decision — is `cost_type` an enum/lookup, is `cost_amount` free text, is there a `CHECK` constraint — is left genuinely undecided, which is a real divergence risk for whoever builds the admin form vs. whoever builds the detail-sheet renderer.

**Suggested fix:** Add a short AD (or fold into AD-19) explicitly: `locations.cost_type`: text enum `free | paid`; `locations.cost_amount`: nullable free-text, shown only when `paid`, matching the qualifier pattern from the PRD glossary.

### 4. [LOW] Broken internal cross-reference: AD-14 cites AD-16 for "direct DB access," but AD-16 is about GDPR account-deletion cascade

**Where:** AD-14 (line 124): "it only changes via direct DB access (AD-16) or a future admin-promotion tool."

AD-16 is titled "Account deletion cascade (GDPR)" and has nothing to do with role promotion or direct DB access mechanics. This looks like a copy/reference error — most likely intended to reference AD-17 (Single Supabase project / CLI access) or no AD at all. Low stakes (doesn't change any Rule's substance) but worth fixing since a reader chasing the citation will land on the wrong AD and could momentarily doubt whether GDPR deletion and admin-role-promotion are secretly coupled.

**Suggested fix:** Remove the `(AD-16)` citation or correct it to the intended reference.

## What's solid (not findings, noted for completeness)

- **Named tech is current and plausible:** React 19, Vite 5/6.x, MapLibre GL JS, Supabase, TanStack Query v5, vite-plugin-pwa, Capacitor 7.x are all real, current, compatible choices for an Aug 2026 build.
- **Deferred section is safe:** every deferred item either has an explicit resolution default (AD-5's Edge-Function-if-unsure), is additive-not-breaking (AD-4's bbox query, AD-19's numeric distance), or is a PRD-level non-goal already fenced off (leaderboard, offline writes). Nothing there could let two build sessions diverge incompatibly if left unresolved.
- **The six altitude-owned dimensions are all addressed:** deployment/environments (AD-17, Vercel + single Supabase project), infra/provider strategy (Supabase/Vercel/MapTiler stack table), operations/observability (explicitly deferred with a clear revisit trigger tied to SM-1–SM-4), data model (mostly complete — see findings 2–3 for the gaps), auth/authorization (AD-2, AD-14, AD-26 plus the RLS convention row), testing strategy (explicitly deferred to implementation discretion for a solo builder, with a stated revisit trigger). None are silently missing.
- **AD Prevents-clauses are mostly real, not vague:** AD-2, AD-4, AD-6, AD-12, AD-16, AD-26 in particular name a concrete, specific two-implementation divergence and a concrete mechanism that blocks it — this is the strongest part of the document.
- **Capability → Architecture Map is nearly complete:** all of FR-1–FR-23 are placed except the FR-7 gap in Finding 2.
