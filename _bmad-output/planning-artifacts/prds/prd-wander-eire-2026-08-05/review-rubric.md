# PRD Quality Review — Wander Éire (prd-wander-eire-2026-08-05)

## Overall verdict

This is a strong PRD for its stakes — a solo-builder personal project treated seriously (§1). Decisions are stated as decisions with real trade-offs surfaced (immediate publish, copy/paste vs. deep-link, both coordinate-entry methods), scope omissions are tagged honestly (`[NON-GOAL for MVP]`, `[ASSUMPTION]`, `[NOTE FOR PM]`, all roundtripping cleanly to §15), and the feature set follows a stated thesis grounded in real competitor research (addendum.md's Roady analysis) rather than reading as a backlog. The main soft spot is done-ness clarity: the gating, security, and core-map FRs (FR-1, FR-2, FR-3, FR-8, FR-18) carry explicit testable consequences, but roughly a third of the FRs (FR-4, FR-5, FR-9, FR-10, FR-14, FR-15, FR-22) state the capability without any acceptance bound, leaving search semantics, profile constraints, contribution limits, and delete-cascade behavior to downstream inference. There's also one ID-continuity defect worth a fast fix: FR-17 is referenced twice (§2.3, §6.1) but never formally defined.

## Decision-readiness — strong

Trade-offs are named with what was given up, not just what was chosen. The addendum documents two real decisions with their reasoning made explicit: copy/paste vs. deep-link directions ("deep-linking is not meaningfully harder to build than copy/paste... flagged as a near-term fast-follow rather than a deferred-indefinitely item") and immediate vs. staged admin publish (the user's own ambiguous phrase — "goes live the next day or next update cycle" — was clarified rather than assumed, and the PRD records that it initially read as a possible draft workflow before correction). This is exactly the kind of surfaced tension the rubric is looking for.

`[NOTE FOR PM]` callouts land on a real risk rather than a safe checkpoint: §4.3 FR-8 Notes and §6.3 both flag that the Anonymous Gate is "a soft, client-tracked gate — a user clearing cookies/using incognito can reset it," explicitly deferred rather than silently accepted. Open Questions (§14) are genuinely open — e.g. "Whether a public leaderboard/social layer gets added post-v1 — not decided" has no answer smuggled into the next sentence.

No findings — this dimension does its job.

## Substance over theater — strong

Only two personas (Mary, the Admin/builder), both under the rubric's four-persona ceiling, and both drive concrete decisions rather than sitting decoratively: Mary's journeys (UJ-1, UJ-3) motivate the Anonymous Gate design (FR-8) and the moderation queue (FR-16); the Admin's journey (UJ-2) motivates FR-18–FR-23. No persona theater.

The competitor-research section in addendum.md is earned, not templated — it cites specific facts (Roady's ~NZ$17.99 subscription switch, "missing over half" the advertised spots per user reviews, inconsistent UGC follow-through) and each finding is traced to a specific PRD decision (Monetization §12, counter-metric SM-C2, the hard moderation gate FR-16). This is differentiation work that Discovery actually surfaced, not a section written because the template had one.

NFR section (§8) avoids boilerplate: Security states the specific mechanism (RLS, server-side admin-role check tied to FR-18) rather than "must be secure"; Performance is honest about not yet having a number rather than papering over the gap with "reasonable performance" language — it's tagged `[ASSUMPTION]` instead. Vision (§1) is product-specific ("pins read like tacks pushed into a corkboard map rather than generic teardrops," "bright and bold rather than corporate-travel-app neutral") — it would not swap cleanly into another travel PRD.

No findings — this dimension does its job.

## Strategic coherence — strong

The PRD has a legible thesis, made explicit by contrast with Roady in the addendum: honest, complete per-location info plus a personal tick-off record is the core hook; gamification/social/commerce layers are optional, not load-bearing, and are deliberately deferred (§5, §14 Q2). Feature prioritization follows from this — §6.1's build sequence puts map + admin CRUD first ("usable on its own") before auth, tracking, and contributions, matching a discovery-first, content-quality-first thesis rather than "what's easy first."

Success Metrics validate the thesis rather than measuring raw activity: SM-1 is the builder's own continued use (not a vanity metric), SM-2 is content coverage against a stated bar (1 location/county). Counter-metrics are named and specifically tied to competitor failure modes: SM-C1 stops the Anonymous Gate from being over-optimized into a blocker, and SM-C2 explicitly cites Roady's coverage-gap criticism to stop location count from being chased over per-location accuracy. This is counter-metric work grounded in research, not a rubric checkbox.

No findings — this dimension does its job.

### Findings
- **low** MVP scope kind is implicit, not named (§6) — The PRD reads as a hybrid of "experience" (map/discovery polish) and "problem-solving" (honest, complete info per spot) scope logic but never states which kind it's optimizing for. *Fix:* one sentence in §6 naming the scope logic would make the build-sequence rationale in §6.1 self-evident rather than inferred.

## Done-ness clarity — adequate

The FRs that gate access, money, or security are unforgiving in the right way: FR-1, FR-2, FR-3, and FR-8 each carry an explicit "Consequences (testable)" block, and FR-18 nails down that admin access control is server-side RLS, "not merely a client-side route guard." This is the dimension the rubric asks to be strictest on, and where it matters most the PRD delivers.

But roughly a third of the FRs state a capability with no consequence block and no bound, leaving genuine ambiguity for a downstream engineer:

### Findings
- **medium** FR-5 (Search by name) has no acceptance bound (§4.1) — No definition of match semantics (substring? prefix? fuzzy?), case sensitivity, or empty-results behavior. *Fix:* add a Consequences block, even minimal ("case-insensitive substring match against Location name; empty results show a 'no matches' state").
- **medium** FR-14/FR-15 (photo upload, comments) have no bounds (§4.5) — No file-size/format limit on photo upload, no comment length limit, no stated cap on number of photos/comments per Location or per user. This matters more than usual here because these are the two FRs with real storage-cost and abuse-surface implications. *Fix:* even placeholder bounds (`[ASSUMPTION: max N MB, JPEG/PNG, no length cap for v1 — confirm]`) would let architecture size Supabase Storage and moderation-queue load correctly.
- **medium** FR-22 (Edit and remove locations) doesn't specify delete-cascade behavior (§4.6) — Removing a Location presumably orphans or cascades associated ticks, saves, and contributions, but the PRD is silent on which. This is exactly the kind of decision that becomes a silent data-loss bug if left to whoever implements it first. *Fix:* one sentence stating the intended behavior (e.g. "removing a Location cascades to delete its ticks/saves/contributions") or explicitly punting it to architecture with a `[NOTE FOR PM]`.
- **low** FR-4 (map/list toggle), FR-9 (account creation), FR-10 (profile) have no Consequences block (§4.1, §4.3) — Lower stakes than the above (toggle behavior and Supabase Auth flows are fairly self-evident), but FR-10 in particular leaves display-name constraints (uniqueness? length? profanity?) fully unstated. *Fix:* low priority; can likely be resolved during UX/architecture without PRD amendment, but worth a pass if time allows.
- **low** §8 Performance NFR has no numeric target — Already self-flagged via `[ASSUMPTION]` and Open Question 5, so this is not a scope-honesty problem, but it does mean "done" for perceived map responsiveness is currently unverifiable. *Fix:* already tracked to be resolved at architecture stage per the PRD's own plan — no action needed beyond following through.

## Scope honesty — strong

§5 Non-Goals is doing real work (seven explicit exclusions, each with a one-line rationale, e.g. the mockup's dashed lines being "decorative only"), and §6.3 separately captures MVP-specific deferrals with honest framing distinguishing "deferred, no committed version" (route planning) from "fast-follow, not deferred indefinitely" (deep-link directions). The one inline `[NON-GOAL for MVP]` tag (§12, Monetization) is used precisely where an omission could otherwise read as an oversight rather than a considered stance ("staying genuinely free is a decision, not a placeholder").

All three inline `[ASSUMPTION: …]` tags (FR-13 in §4.4, §8 Performance, §10 Voice) round-trip cleanly to the §15 Assumptions Index — no orphans in either direction. `[NOTE FOR PM]` appears exactly where the PRD has a real unresolved tension (the Anonymous Gate's client-side bypassability, §4.3 and §6.3) rather than at a safe checkpoint. Open-items density (6 Open Questions + 3 Assumptions + 2 NOTE FOR PM instances) is proportionate to a personal project's stakes — not the sparse cover of an under-specified PRD, not the red flag of a green-light-to-build enterprise doc smuggling unresolved risk.

No findings — this dimension does its job.

## Downstream usability — adequate

The Glossary (§3) is genuinely load-bearing — terms like Location, Detail Sheet, Tick-off, Contribution, Cost Type, and Anonymous Gate are defined once and then used consistently (case and all) across the UJs, FRs, and NFRs that reference them. Each Feature section (§4.1–4.6) is self-contained enough to pull out alone, cross-referencing via Glossary terms and FR numbers rather than "see above."

### Findings
- **medium** FR-17 is referenced but never defined (§2.3, §6.1) — UJ-3's Resolution clause cites "(FR-17, out of scope)" for offline-queueing behavior, and §6.1's Build Sequence phase 2 lists the range "FR-8–FR-17," but no `#### FR-17:` heading exists anywhere in §4. The content that should be FR-17 appears only as an unlabeled "Out of Scope" note under FR-16 (§4.5), and is also covered in §6.3 ("Offline upload queueing (deferred to phase 3, §6.1)"). This is a genuine ID gap, not just a stylistic inconsistency — anyone doing FR-based traceability (epics, story generation, coverage checks) will go looking for FR-17 and find nothing. *Fix:* either give the offline-queueing exclusion its own `#### FR-17:` heading (even as a stated non-requirement), or renumber FR-18–FR-23 down by one and strike the FR-17 references in §2.3/§6.1.
- **low** Inconsistent "Realizes UJ-X" tagging at the FR level (§4.3–§4.6) — Some FRs tag their realized UJ directly (FR-1, FR-2, FR-8, FR-19, FR-20, FR-21), others rely on the parent section's description line to carry it (FR-9, FR-10, FR-14, FR-15, FR-16, FR-22, FR-23 have no per-FR tag). Every FR is still covered at the section level, so this doesn't break traceability, but it means "does this FR realize a UJ" isn't answerable by scanning the FR alone. *Fix:* low priority; either tag consistently at the FR level or note explicitly that the section-level tag is inherited by all FRs in that section.

## Shape fit — strong

This is a solo-builder personal project with a genuine consumer-facing surface (a close circle now, a possible public launch later per §1), and the PRD's formality matches that shape well. Two personas and three UJs are proportionate — not the UJ-density overkill the rubric warns about for single-operator tools, and not under-formalized either, since Mary's journeys (UJ-1, UJ-3) are load-bearing for the Anonymous Gate and moderation-queue design. The Admin UJ (UJ-2) correctly gets capability-spec treatment (a form, a workflow) rather than being dressed up with unnecessary persona narrative. No forcing of the PRD into a shape — e.g., there's no fabricated stakeholder-approval section, no SLA table, nothing that would only belong in an enterprise PRD.

No findings — this dimension does its job.

## Mechanical notes

- **Glossary case drift (low):** "Cost Type" and "Cost Amount" are capitalized as defined terms in §3, but FR-19/FR-20/§6.2 mostly refer to them lowercase ("cost type/amount"). Cosmetic only — the underlying concept is unambiguous throughout.
- **ID continuity:** FR-1 through FR-23 are otherwise contiguous and unique, with the single exception of the missing FR-17 heading noted above under Downstream usability. UJ-1/UJ-2/UJ-3 and SM-1–SM-4 plus SM-C1/SM-C2 are all contiguous with no gaps or duplicates.
- **Assumptions Index roundtrip:** Clean. All three inline `[ASSUMPTION]` tags (FR-13, §8, §10) appear in §15, and no §15 entry lacks an inline counterpart.
- **UJ protagonist naming:** All three UJs carry a named/contextualized protagonist inline (Mary for UJ-1 and UJ-3, "the admin (the builder)" for UJ-2) — no floating UJs.
- **Required sections for stakes:** Present and proportionate for a solo personal-project PRD — no enterprise-only sections (stakeholder sign-off, ROI, SLAs) expected or missing.
