# Spine Pair Review — wander-eire

## Overall verdict
The spine pair inherits cleanly from the PRD/brief/mockup — every UJ, FR, and locked design decision is traceable, tokens are complete and correctly cross-referenced, and the mockup's conflict points are explicitly reconciled. The weak spot is the Components layer: several components used with real behavioral rules in EXPERIENCE.md (Photos & Comments, Profile tabs, Admin location list, Moderation queue row) have no matching visual spec in DESIGN.md, there is no generic Button component at all, and a handful of component names drift between the two files (`Filter chip` vs `Filter chip row`, `Drawer sheet` vs `List drawer`). A few real states (auth failure, geocode failure) are also unaddressed. Fixable in a short pass; not build-blocking for the map/detail/browse core, but blocking for the auth, admin, and contribution surfaces as currently specified.

## 1. Flow coverage — strong
Extracted UJ-1/UJ-2/UJ-3 from PRD §2.3, plus FR-23 (moderation) as an implicit fourth flow under §4.6. All three named UJs have a matching Key Flow with numbered steps and an explicit **Climax** beat; Flow 4 (moderation) is additional coverage beyond the PRD's named UJs, not a gap. All 23 FRs trace to a flow, component pattern, or state pattern row.
### Findings
- **low** Flow 2 (Admin adds a new location) has no `Failure:` line, unlike Flows 1 and 3 — admin form validation errors exist as a real path (State Patterns → "Admin form validation error") but aren't woven into the flow itself (EXPERIENCE.md § Key Flows → Flow 2). *Fix:* add a one-line failure branch, e.g. "Failure: a required field is missing at submit → inline error, publish blocked (FR-19)."
- **low** Flow 3's protagonist is generic ("a signed-in user" / "she") where PRD UJ-3 frames it as a continuation of Mary's story ("e.g. Mary, having created an account") (PRD §2.3 UJ-3 vs EXPERIENCE.md § Key Flows → Flow 3). *Fix:* name her Mary for continuity, or note the genericization is deliberate.
- **low** FR-10 (signed-in user has a profile with a display name) has no surface treatment anywhere in EXPERIENCE.md — not in the Profile IA row, not in the "Profile tabs" Component Patterns row (EXPERIENCE.md § Information Architecture → Profile; § Component Patterns → Profile tabs). *Fix:* add a line noting where/how display name is shown or edited, or explicitly defer it.

## 2. Token completeness — strong
Extracted every frontmatter key (`colors`, `typography`, `rounded`, `spacing`, `components`) and every `{path.to.token}` reference in DESIGN.md prose and EXPERIENCE.md prose. All resolve — no missing hex values, no dangling references. The one load-bearing contrast risk (white icon on Amber fill, ~2:1) is explicitly flagged with a required mitigation in both files (DESIGN.md § Do's and Don'ts; EXPERIENCE.md § Accessibility Floor).
### Findings
None.

## 3. Component coverage — thin
Extracted every component name from DESIGN.md § Components (frontmatter + body) and every component named in EXPERIENCE.md § Component Patterns. Core map/browse components (Tack pin, Filter chip, Search bar, Tick/Save buttons, Detail view, Admin form) are covered on both sides with real rules. Several components with real behavioral specs in EXPERIENCE.md have no corresponding visual spec in DESIGN.md.
### Findings
- **high** No generic Button component exists anywhere in DESIGN.md, yet several EXPERIENCE.md flows depend on one: the Sign-up/Sign-in modal's email/Google CTAs, Admin's "+ Add Location" button, and the Moderation queue's Approve/Reject buttons (EXPERIENCE.md § Component Patterns → "Sign-up/Sign-in modal", "Admin location form", "Moderation queue row"; DESIGN.md § Components has no button entry). *Fix:* add a `button` (or `button-primary`/`button-secondary`) component with fill, text style, and radius tokens.
- **medium** "Photos & Comments section" (EXPERIENCE.md § Component Patterns) has no DESIGN.md row — no spec for photo grid/thumbnail layout, comment list styling, or the "Pending review" inline marker's visual treatment. *Fix:* add a Components row, even brief, covering thumbnail size/grid and the pending-marker treatment.
- **medium** "Profile tabs" (EXPERIENCE.md § Component Patterns) has no DESIGN.md row — active/inactive tab styling and the progress-stat display are undefined visually. *Fix:* add a row specifying tab underline/fill state and the stat's type role.
- **medium** "Admin location list" and "Moderation queue row" (EXPERIENCE.md § Component Patterns) have no DESIGN.md rows — table/row layout, the archived badge, and thumbnail sizing are unspecified. *Fix:* add rows for both, or fold into a shared "Admin table row" component spec.

## 4. State coverage — adequate
Walked every IA surface (Map, List drawer, Search results, Detail view, Sign-up/Sign-in modal, Profile, Privacy policy, `/admin` dashboard, Admin location form, Moderation queue) against expected states (cold-load, empty, error, permission-denied, offline). Most are covered well — the State Patterns table is dense and specific, with warm in-voice copy for each. Two real, likely-to-occur states are missing entirely.
### Findings
- **medium** No auth-failure state for the Sign-up/Sign-in modal — bad credentials, email already registered, or a cancelled/failed Google auth have no copy or treatment anywhere (EXPERIENCE.md § State Patterns table has no row for this; § Component Patterns → "Sign-up/Sign-in modal" doesn't mention it either). *Fix:* add a row, e.g. "Auth failure | Sign-up/Sign-in modal | inline error below the form, modal stays open."
- **medium** No geocode-failure state for the Admin location form — address/Eircode entry that fails to resolve to coordinates (FR-20) isn't covered; only generic per-field validation is (EXPERIENCE.md § State Patterns → "Admin form validation error" row doesn't mention geocoding). *Fix:* add a row or extend the existing one to cover a failed geocode lookup, with a fallback to manual map-click.
- **low** Geolocation permission-denied (FR-2) is documented only inline in Key Flows (Flow 1 failure line), not as a State Patterns table row alongside the Map surface's other states (Cold map load, Zero pins, Network/load failure) (EXPERIENCE.md § Key Flows → Flow 1 vs § State Patterns). *Fix:* add a Map row for symmetry with the other cold-load/failure states.
- **low** No state defined for opening a Detail view of a location that has since been archived (e.g. reached via a stale Saved/Ticked list entry after admin soft-deletes it per FR-22) (EXPERIENCE.md § State Patterns; § Component Patterns → "Profile tabs"). *Fix:* add a row, or explicitly note archived locations are filtered out of Ticked/Saved lists.

## 5. Visual reference coverage — strong
Only one file exists under the UX workspace (`imports/wander-eire-map-mockup.jsx`; no `mockups/` or `wireframes/` directories). It's linked inline at the relevant section (EXPERIENCE.md § Information Architecture, "Composition reference") with a clear statement of what it illustrates (Map, filter chips, pin interaction, bottom-sheet concept) and "Spine wins on conflict" stated explicitly. The two structural divergences from the mockup (full-screen Detail vs bottom sheet; decorative dashed lines) are each named and reconciled in a dedicated closing section.
### Findings
None. No orphans, no unspecific references.

## 6. Bloat & overspecification — strong
DESIGN.md's editorial voice (Brand & Style, per-color rationale) is appropriate for that file's role and doesn't leak into EXPERIENCE.md, which stays behavioral/tabular throughout. FR/PRD-section citations in EXPERIENCE.md tables (e.g. "(FR-11/FR-12)", "(FR-3 note)") read as traceability pointers, not restatement — they don't quote FR text. No prose-where-a-table-works violations found; no decorative narrative untied to a decision.
### Findings
None.

## 7. Inheritance discipline — adequate
`sources` frontmatter in EXPERIENCE.md resolves cleanly (PROJECT-BRIEF.md, prd.md, wander-eire-map-mockup.jsx all exist and were used). DESIGN.md correctly omits a `sources` field per the spec (not a required DESIGN.md frontmatter key). The PRD's "Detail Sheet" was deliberately renamed to "Detail view" (full-screen, not a sheet) — documented in the Reconciliation note and memlog, and applied consistently everywhere in both files with no leftover "Detail Sheet" usage. Where component names exist in both files, several don't match verbatim, which breaks clean name-keyed extraction.
### Findings
- **medium** Component names drift between DESIGN.md § Components and EXPERIENCE.md § Component Patterns for four components that clearly refer to the same thing: "Filter chip" vs "Filter chip row"; "Drawer sheet" vs "List drawer" (also used as an IA surface name); "Admin form section" vs "Admin location form"; "Full-screen Detail view" vs "Detail view". *Fix:* pick one name per component and use it identically in both files.
- **low** EXPERIENCE.md's Accessibility Floor restates the Amber hex literally (`#F0A93A`) rather than as `{colors.amber}` (EXPERIENCE.md § Accessibility Floor, "Contrast flag carried from `DESIGN.md`" bullet). *Fix:* use the token reference for consistency with the rest of the cross-referencing convention (DESIGN.md itself does the same in its Do's and Don'ts row, so this is a minor, paired inconsistency rather than a one-off).

## 8. Shape fit — strong
DESIGN.md sections appear in canonical order with none omitted: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. EXPERIENCE.md has all required defaults (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows) plus Responsive & Platform, correctly triggered by the two-surface (mobile consumer app / responsive admin) split. The invented "Reconciliation note" section earns its place — it resolves a real, otherwise-unstated conflict between the locked mockup and the spine's decisions.
### Findings
- **low** No Inspiration & Anti-patterns section, despite the PRD naming a reference competitor with an explicit rejected pattern — Roady's free-to-paid pivot, cited as a deliberate contrast in PRD §12 and as a counter-metric rationale in §7 SM-C2 (PRD §12, §7 vs EXPERIENCE.md, section absent). *Fix:* optional — this is a business-model rejection more than a UX/interaction-pattern one, so omitting it is defensible; add a short entry only if the "stay genuinely free" posture needs to be visible to downstream UX/story work.

## Mechanical notes
- No Mermaid diagrams in either file — N/A for syntax checking.
- Frontmatter is complete on both files (name/description/status/created/updated present; EXPERIENCE.md additionally has `sources`).
- Naming inconsistencies beyond the component-name drift already noted in §7: none found — glossary terms (Tick, Save, Anonymous Gate, Category, County) are used identically across both files and match the PRD Glossary (§3), aside from the deliberate, well-documented "Detail Sheet" → "Detail view" rename.
- No broken cross-refs: every `EXPERIENCE.md` reference to `DESIGN.md` (and vice versa) points to a section that exists; every `{path.to.token}` resolves.
