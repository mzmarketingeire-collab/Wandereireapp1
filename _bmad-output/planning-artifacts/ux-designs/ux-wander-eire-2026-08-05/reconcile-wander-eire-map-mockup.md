# Reconciliation — wander-eire-map-mockup.jsx

Source: `imports/wander-eire-map-mockup.jsx` (React/Tailwind, referenced by both PROJECT-BRIEF.md and the PRD as the locked visual-direction reference).

## Adopted as-is (locked design system — carried into DESIGN.md unchanged)

- Full colour palette (Cream/Ink/Emerald/Terracotta/Amber/Ocean/Plum) and category-hue mapping.
- Type trio: Space Grotesk (display), Inter (body/UI), IBM Plex Mono (data).
- Tack-pin concept: circular badge, category-colour fill, white icon, cream ring, drop shadow — explicitly not a teardrop marker.
- Filter chip visual pattern: pill shape, category-colour dot + fill on active state.
- Search bar visual pattern: white pill, search icon, placeholder copy tone ("Where to next?").
- Category icon set: Mountain (Trail), Landmark (Historic), Eye (Viewpoint), Waves (Beach/Coast), Tent (Camping) — locked in Discovery rather than left as placeholder (see `.memlog.md`).
- Tick/save button pairing and general layout (icon buttons adjacent to the location name/meta block).

## Adapted (same visual language, different structural decision)

- **Bottom sheet → Full-screen Detail view.** The mockup shows a compact bottom sheet docked under the map as the tap-a-pin result. Discovery resolved this toward a full-screen Detail view instead (more room for photos, description, Photos & Comments, contribution flow — see EXPERIENCE.md → Key Flows, Flow 1). The bottom sheet's *visual* language (white surface, rounded top corners, grabber bar) wasn't discarded — it's reused for the List drawer and the Sign-up/Sign-in modal, which are genuinely sheet-shaped interactions in this spine.
- **Single-view phone frame → List drawer over persistent map.** The mockup only shows the map view; the map/list toggle wasn't demonstrated. Discovery resolved it as a drawer sliding over a map that stays mounted underneath, not a tab-style full swap.

## Explicitly not carried forward

- **Dashed lines between pins** — decorative in the mockup, and the PRD names this directly as a non-goal (no route/itinerary planning in v1, PRD §5). Not present in any interactive component in EXPERIENCE.md.
- **Slider icon next to the search bar** — visually present in the mockup but the PRD flags it as decorative/placeholder, not a second filter mechanism (PRD FR-3 note). Carried into DESIGN.md/EXPERIENCE.md as explicitly decorative, not wired to any behavior.

## Gaps the mockup didn't cover (resolved via Discovery, not inferred from the mockup)

The mockup shows one screen (map + bottom sheet) and doesn't address: list view, search results state, anonymous gate, auth screens, profile, contribution UI, admin routes, or any empty/loading/error state. All of these were closed via direct questions in this UX pass rather than extrapolated from the single reference screen — see `.memlog.md` for the full decision trail.
