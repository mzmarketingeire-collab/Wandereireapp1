# Reconciliation: wander-eire-map-mockup.jsx vs. prd.md + addendum.md

Input: `wander-eire-map-mockup.jsx`
Checked against: `prd.md`, `addendum.md`
Date: 2026-08-05

Method: every UI element, interaction, copy string, and visual/styling detail in the mockup was checked for an explicit match, an equivalent requirement, or a deliberate visible scope decision in the PRD/addendum. Items with a clear match are noted as covered; items with no match are listed as gaps, split into structural (data-model/behavior) and cosmetic (visual/micro-interaction) severity.

## Structural gaps (affect data model or documented behavior)

1. **Distance/length field on Locations (`dist`) is not in the data model.**
   The mockup's `PINS` data includes a `dist` field ("2.4km loop" for the Glendalough trail, "5km strand" for Inch Beach) and renders it prominently in the bottom sheet's metadata line (`County · Cost · Distance`). Neither FR-19 (admin's fixed preset fields: name, category, county, description, how-to-get-there, parking info, cost type/amount, photos) nor FR-6 (Detail Sheet fields: name, category, county, cost type/amount, description, how-to-get-there, parking info, photos) nor the Glossary's Location definition mentions a distance/length field. It appears to be category-conditional in the mockup (populated for trail/beach, empty for historic/viewpoint/camp), which is exactly the kind of nuance that needs an explicit FR or Glossary note if it's intended for v1.

2. **The search bar's `SlidersHorizontal` icon is a second, undocumented filter affordance.**
   The mockup places a sliders/settings icon inside the search bar itself, separate from the category filter chip row below it. FR-3 only documents chip-based category filtering and FR-5 only documents name search — nothing describes what this icon does (advanced filters? sort order? distance radius? cost filter?). This is a distinct, visible control with no corresponding requirement or explicit "decorative/not built" call-out (unlike the dashed lines, which §5 explicitly disclaims).

3. **Filter behavior: dim vs. hide is unspecified.**
   FR-3 says a user can "filter visible pins by category," which reads as hiding non-matching pins. The mockup instead dims non-matching pins to 30% opacity (`dimmed ? 0.3 : 1`) rather than removing them — they stay visible and, per the code, still occupy screen space (though not confirmed tappable). This is a real UX decision (keep spatial context vs. decolutter the view) that isn't addressed either way in the PRD.

4. **Cost display sometimes qualifies what the cost applies to, not captured in the Cost Type/Amount model.**
   Pin data shows `'€18'` (Blarney Castle, presumably entry) alongside `'€10 parking'` (Cliffs of Moher) — i.e., cost is sometimes for entry and sometimes specifically for parking, with the qualifier baked into display text. The Glossary's Cost Type/Cost Amount pairing (Free vs. Paid + amount) doesn't account for "what the paid amount is for," which matters for a location like a free-to-enter viewpoint with paid parking.

## Cosmetic / interaction gaps (visual and micro-interaction detail, not covered even by the "reference lives in mockup" blanket statement)

5. **Selected-pin enlarge state.** Tapping a pin grows its badge from 32px to 40px and its icon from 14px to 17px (plus a `0.15s` opacity/all transition on filtering). §10's "reference lives in the mockup" statement is explicitly scoped to "palette, type, and pin-style" (i.e., static token table) — it doesn't obviously extend to this kind of interaction-state animation, so it's not clearly covered anywhere.

6. **Tick-off/Save button styling states.** `CheckCircle2` (tick) and `Bookmark` (save, filled when active) icons, with tick going emerald-filled and save going amber-filled/solid on activation, vs. a neutral `#F3EFE6` grey circle when inactive. FR-11/FR-12 describe the actions but not these icons or color states; same ambiguity as #5 re: whether §10's blanket mockup-reference line covers secondary action icons or only pins/palette/type.

7. **Bottom sheet drag handle.** A small grey rounded bar (`36×4px`) atop the sheet signals it's draggable/dismissible. §11 says the Detail Sheet is "a bottom sheet over the map screen (per mockup)" which arguably covers this by reference, but the drag/dismiss gesture itself is never described as a requirement (e.g., swipe-to-dismiss, tap-outside-to-dismiss).

8. **Map decorative texture.** Low-opacity triangular "terrain" polygons overlaid on the island shape, and an ocean-tinted (`${COLORS.ocean}22`) map background behind the landmass. FR-1 just says "styled to the bright/bold theme" via real MapLibre tiles — these are mockup-only stand-ins for a real tile style and are reasonably assumed superseded by the real map data, so this is low-priority/likely non-issue, included for completeness.

## Explicitly covered (verified, not gaps)

- Dashed lines between pins — explicitly called out as decorative-only, not itinerary routing (§5 Non-Goals).
- Pin "tack" style (solid ring, no teardrop tail, drop shadow, white icon on category color) — §10 Pins bullet, verbatim match.
- "Where to next?" search placeholder copy — §10 Voice, cited directly as the one example of established UI copy.
- Color-coded category + paired icon (not color-only) — §8 Accessibility NFR matches the mockup's actual implementation (every pin/chip has both a color and an Icon).
- Fonts (Space Grotesk / Inter / IBM Plex Mono for display/body/data) — §10 Type, exact match including IBM Plex Mono's use for the distance/cost mono-styled data.
- Full hex palette and exact category color assignments — §10 explicitly defers to the mockup rather than duplicating the token table.
- Profile icon in header as an entry point to sign-up/sign-in — §11 IA ("from the profile icon").
- Filter chips with "All" toggle — FR-3, direct match.

## Summary count

- 4 structural gaps (distance field, sliders icon, dim-vs-hide filtering, cost-qualifier nuance)
- 4 cosmetic/interaction gaps (pin enlarge-on-select, tick/save button styling, drag handle, decorative map texture)
