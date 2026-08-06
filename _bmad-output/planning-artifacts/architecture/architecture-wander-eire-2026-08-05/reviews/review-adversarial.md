# Adversarial Review — Wander Éire Architecture Spine

**Reviewer posture:** adversarial. Goal: construct concrete pairs of features/units, each individually compliant with every AD in the spine to the letter, that nonetheless build incompatibly with each other — clashing data shapes, dual ownership of an entity, conflicting mutation paths, RLS/UI mismatches, or ambiguous Rule text a literal implementer could satisfy two ways.

**Target:** `/Users/markhoare/wander-eire/_bmad-output/planning-artifacts/architecture/architecture-wander-eire-2026-08-05/ARCHITECTURE-SPINE.md`
**Context:** `/Users/markhoare/wander-eire/_bmad-output/planning-artifacts/ux-designs/ux-wander-eire-2026-08-05/EXPERIENCE.md`

---

## Verdict

The spine is unusually disciplined about RLS shapes where it bothers to specify them (AD-11's three-way condition for `user_photos`/`comments` is a genuine strength — it correctly gives admin an unconditional bypass, so the moderation queue's `WHERE status='pending'` query is actually satisfiable under RLS as stated). But the spine is silent in exactly the places that matter most: the `locations` table has **no stated SELECT RLS policy at all** for the published/archived split that AD-6 introduces, the write-protection mechanism for `profiles.role` (AD-14) names an outcome without naming a mechanism, and AD-11's own admin-bypass logic accidentally leaves a "rejected" content leak into the submitter's own view that contradicts EXPERIENCE.md. These are real, concrete, buildable-both-ways holes — not nitpicks.

---

## Finding 1 — CRITICAL: `locations` SELECT RLS is unspecified; admin's archived-location list can silently return empty

**The pair:** the RLS migration author (schema/AD-15 owner) vs. `features/admin/` (location list + restore, per EXPERIENCE.md's Admin table row spec and FR-22).

**What each does, individually spine-compliant:**

- AD-6's Rule states: *"Every public-facing query filters `WHERE status = 'published'`... RLS policies key off the same column."* A literal-minded migration author reads "RLS policies key off the same column" as an instruction to encode the boundary **in RLS itself**, and ships:
  ```sql
  CREATE POLICY locations_select ON locations FOR SELECT USING (status = 'published');
  ```
  This satisfies AD-6's Rule text exactly, and satisfies AD-2's "RLS is the real boundary, not app-level filtering" spirit — arguably *more* faithfully than leaving SELECT open and relying on the client's `.eq('status','published')` (AD-4) as the only gate.
- Independently, `features/admin/` is built exactly to EXPERIENCE.md's Admin table row spec: *"removed locations show a distinct 'archived' badge rather than disappearing from the admin's own list ... admin can still find and restore them here."* This requires a query like `supabase.from('locations').select('*')` (no status filter) so both published and archived rows come back for the dashboard's location list.

**The incompatibility:** under the RLS policy above, the admin's unfiltered query silently returns **zero archived rows**, even to a signed-in admin — RLS filters rows, it doesn't error. The admin dashboard's "archived badge" and FR-22's restore capability break invisibly. Nobody notices until an admin archives a location and then can't find it again.

**Why this is a real spine gap, not implementer error:** AD-2's admin-bypass language ("Admin-only reads/writes require `profiles.role = 'admin'` inside the policy itself") is stated as a rule for *admin-only* operations. Whether *listing archived locations* counts as "admin-only" (and therefore needs an explicit `OR role='admin'` bypass clause on `locations` SELECT) is never resolved. Contrast with AD-11, which is scrupulously explicit about the identical situation for `user_photos`/`comments` (the three-way `approved OR own OR admin` condition is spelled out verbatim). The spine gives `locations` no equivalent sentence. Two equally literal readings of AD-2/AD-6 produce a working system and a silently-broken one, and nothing in the spine tells you which.

**Fix shape:** add an explicit Rule (either folded into AD-2 or AD-6, or a new AD) stating the `locations` SELECT policy verbatim: `USING (status = 'published' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')` — mirroring AD-11's precedent exactly.

---

## Finding 2 — HIGH: AD-11's RLS condition leaks rejected contributions back to their submitter, contradicting EXPERIENCE.md

**The pair:** the RLS/schema layer implementing AD-11's three-way condition literally vs. `features/contributions/` (Photos & Comments section) built literally to EXPERIENCE.md's State Patterns table.

**What each does, individually spine-compliant:**

- AD-11's Rule: table-row RLS SELECT on `user_photos`/`comments` = `status = 'approved' OR auth.uid() = user_id OR role = 'admin'`. Implemented exactly as written — no status qualifier on the "own" clause, so a submitter can SELECT their own row **regardless of its status**, including `rejected`.
- `features/contributions/` — or wherever the Photos & Comments section lives — queries "approved OR mine" per AD-11 (the only sanctioned read path; AD-10 forbids ad-hoc filtering logic scattered outside the `lib/supabase/` wrapper) and renders whatever comes back, per the Component Patterns table's instruction that the submitter's own pending items render inline marked "Pending review."

**The incompatibility:** EXPERIENCE.md's Admin table row spec is explicit that Reject "removes it from the queue (the submitter's own Detail view no longer shows it as pending — **no separate 'rejected' notice in v1**)." That requires rejected rows to vanish from the submitter's own view entirely. But AD-11's stated RLS condition permits the submitter to fetch their own rejected row just as readily as their own pending row — RLS doesn't distinguish `pending` from `rejected` for the "own" clause, and the spine never calls out that the **client-side query on top of RLS** additionally needs `AND status != 'rejected'` (or `status IN ('approved','pending')`) for the submitter's-own case. A literal implementer trusting "RLS is the boundary, fetch what's permitted" (AD-2's own framing) ships a component that briefly (or permanently, if no re-render trigger removes it) shows the user their rejected photo/comment — directly contradicting the UX spec's "no separate rejected notice" requirement.

**Fix shape:** tighten AD-11's Rule (or add a note to the Capability→Architecture Map row for Photos & Comments) to state the client query explicitly excludes `rejected` for the own-row case, distinct from the RLS policy which can remain permissive (RLS grants access; the query decides what to ask for).

---

## Finding 3 — HIGH: `profiles.role` write-protection names an outcome, not a mechanism — two safe-looking implementations aren't equally safe

**The pair:** `features/profile/` (display_name edit, FR-10) vs. whatever mechanism (unspecified) is meant to satisfy AD-14's role-protection guarantee.

**What AD-14 says:** *"`profiles.role` is excluded from the set of columns a user's own RLS `UPDATE` policy permits."* This is not how Postgres RLS works — RLS `USING`/`WITH CHECK` clauses are **row-level** predicates; they don't natively exclude individual columns from an `UPDATE`. Real column-level protection needs one of: (a) `REVOKE UPDATE (role) ON profiles FROM authenticated` plus per-column `GRANT`, (b) a `BEFORE UPDATE` trigger that force-resets `NEW.role := OLD.role`, or (c) a `WITH CHECK` clause that compares `NEW.role = OLD.role` (requires an `UPDATE`-specific policy referencing old/new, which Postgres RLS does support via `USING`+`WITH CHECK` together, but this must be written correctly).

**The incompatibility:** `features/profile/`'s display_name-edit mutation is built against the *assumption* that "role is excluded" already holds at the DB layer — the feature code just does `supabase.from('profiles').update({display_name}).eq('id', userId)`. If the actual migration implements this guarantee via, say, a same-row `UPDATE` policy of `USING (id = auth.uid())` with **no `WITH CHECK` role-invariance clause** (a natural, literal reading of "a user's own RLS UPDATE policy" as just an ownership check, since AD-14 doesn't specify *which* of the three mechanisms to use), then any client — not just the sanctioned `features/profile/` code, but a user opening devtools and calling `supabase-js` directly — can `update({role: 'admin'})` on their own row and succeed. This is exactly the self-promotion attack AD-14's "Prevents" clause names, and AD-2 elsewhere insists RLS (not app code) must be the real boundary — but AD-14 doesn't commit to a mechanism that actually delivers column-level exclusion via RLS alone.

**Fix shape:** AD-14 should name the specific mechanism (recommend: `BEFORE UPDATE` trigger forcing `NEW.role := OLD.role` unless the caller is admin — simplest, least likely to be gotten wrong by a solo builder) rather than describing an outcome RLS can't natively produce.

---

## Finding 4 — MEDIUM: no shared TanStack Query key convention — cache collisions and cross-feature staleness

**The pair (two sub-cases):**

**4a. Map feature vs admin location list, same cache key, different underlying query.** AD-4 has `features/map/` fetch all `status='published'` locations; Finding 1 above establishes `features/admin/` needs to fetch *all* locations (published + archived). AD-10 mandates every fetch go through a TanStack Query hook, and the source tree calls out `lib/query/` as owning "shared query keys" — but no convention (e.g., key must encode the status scope, `['locations', 'published']` vs `['locations', 'all']`) is ever stated. Two features built independently, each satisfying AD-10 to the letter, could both key their query as literally `['locations']` since nothing in the spine says otherwise. Whichever mounts second either serves the other's cached (wrong-scope) data or clobbers it on refetch — the map briefly showing archived pins, or the admin list momentarily missing archived rows.

**4b. Tick/save mutation (Detail view) vs Profile's Ticked/Saved tabs, no invalidation contract.** AD-10 requires optimistic updates with rollback for tick/save toggles, scoped naturally to the Detail view's own query cache entry for that location. `features/profile/`'s Ticked/Saved tabs read a separate `user_ticks`/`user_saves`-joined list query. AD-10 never states that a tick mutation must invalidate or otherwise update the profile list's query key. A tick made in Detail view need not appear in Profile without a manual navigation-triggered refetch (which may or may not happen depending on unstated `staleTime`/`gcTime` defaults) — not a hard crash, but a plausible "why isn't my tick showing up" inconsistency the spine doesn't rule out.

**Fix shape:** add a query-key naming convention to `lib/query/`'s description in AD-10 or the Consistency Conventions table (e.g., `['locations', statusScope]`, and require tick/save mutations to invalidate the relevant profile list key on success/rollback).

---

## Finding 5 — MEDIUM: Admin photo-upload ordering vs AD-21's FK requirement vs "no draft state"

**The pair:** the Photos section of the admin location form (AD-9's per-file compress-then-upload rule) vs. the location-CRUD submit path (AD-21's `location_photos.location_id` FK, and AD-6/FR-21's "Submit publishes immediately — no draft state").

**What each does, individually spine-compliant:**

- AD-9's Rule: *"Every photo-upload path ... resizes ... and re-encodes ... client-side, before the Storage call."* Read literally per-file, this describes an upload pipeline that runs **as each photo is selected/added** in the Photos section (step 5 of EXPERIENCE.md's Flow 2, which happens *before* step 6, "Submits").
- AD-21's Rule: `location_photos(id, location_id FK, storage_path, sort_order, created_at)` — every row requires a valid `location_id` foreign key to an existing `locations` row.
- Flow 2 / AD-6 / FR-21: the location row itself is only created at Submit ("publishes immediately... no draft state" — there is no earlier point at which a `locations.id` exists to hang a `location_photos` FK off of).

**The incompatibility:** if the Photos section is built to upload-on-select (satisfying AD-9's literal per-file phrasing), there is no `location_id` yet to satisfy AD-21's FK — the insert has nothing to point at, since the location row doesn't exist until the final Submit and the spine explicitly bans a draft/interim location state. Two consistent-looking resolutions are possible — stage files client-side (File objects in form state) and defer both compression-metadata-persistence and the actual `location_photos` insert until the final Submit transaction; or silently create an implicit draft location row early and update it at Submit (which contradicts "no draft state" as stated) — and the spine picks neither. A dev building the Photos sub-component in isolation from the location-CRUD submit handler could easily implement the former for admin (batch on submit) while contributions' analogous upload path (where the location already exists, so no ordering problem there) reinforces the impression that "upload immediately on select" is the house style — increasing the chance the admin Photos section gets built the incompatible way.

**Fix shape:** state explicitly (in AD-21 or AD-9) that admin-form photo uploads are staged client-side and only committed to Storage + `location_photos` as part of the same submit transaction that creates the `locations` row (transaction ordering: insert location → get id → upload/insert photos), distinguishing this from the contributions upload path where the location already exists and upload can be immediate.

---

## Non-findings (checked, spine holds up)

- **Admin moderation queue vs AD-11's RLS shape** (explicitly flagged by the review brief as a thing to check): this one is *fine*. AD-11's three-way condition includes an unconditional `role = 'admin'` bypass with no status restriction, so `WHERE status = 'pending'` (AD-6) over `user_photos`/`comments` is fully satisfiable by an admin under the stated RLS — admin sees pending rows regardless of who submitted them. Worth noting only because it's the mirror image of Finding 1, where the equivalent bypass for `locations` was never written down.
- **AD-4 fetch-all vs AD-13 client-side search vs AD-20 PostGIS column**: no incompatibility — AD-4 and AD-13 both explicitly operate over the same already-fetched published set, and AD-20's GIST index is inert in v1 by the spine's own admission, not queried by any feature yet.
- **AD-16 GDPR cascade vs AD-6 status enum**: consistent — anonymization path (`user_id → NULL`) only touches `approved` rows, hard-delete only touches `pending`/`rejected`, and Finding 2 above is about a *read* leak, not a conflict with the deletion cascade itself.
