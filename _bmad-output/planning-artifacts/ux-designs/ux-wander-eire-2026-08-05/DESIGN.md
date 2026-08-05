---
name: Wander Éire
description: Interactive road-trip discovery map for Ireland. Bright, bold, corkboard-tack pins over real geography — colour is the category label, not decoration.
status: final
created: 2026-08-05
updated: 2026-08-05
colors:
  cream: '#FBF3E7'
  ink: '#1E2A22'
  surface: '#FFFFFF'
  neutral-muted: '#F3EFE6'
  emerald: '#1F7A4D'
  terracotta: '#E2603D'
  amber: '#F0A93A'
  ocean: '#1C7293'
  plum: '#6B4A85'
typography:
  display:
    fontFamily: 'Space Grotesk'
    fontWeight: 700
    fontSize: 21px
  heading:
    fontFamily: 'Space Grotesk'
    fontWeight: 700
    fontSize: 17px
  body:
    fontFamily: 'Inter'
    fontWeight: 400
    fontSize: 15px
  label:
    fontFamily: 'Inter'
    fontWeight: 600
    fontSize: 13px
  meta-mono:
    fontFamily: 'IBM Plex Mono'
    fontWeight: 500
    fontSize: 12px
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '7': 32px
components:
  tack-pin:
    diameter-default: 32px
    diameter-selected: 40px
    ring: '{spacing.1}px solid {colors.cream}'
    fill: category-color
    icon-color: '{colors.surface}'
    shadow: elevated
  filter-chip:
    height: 28px
    rounded: '{rounded.full}'
    active-fill: category-color-or-ink
    inactive-fill: '{colors.surface}'
    text: '{typography.label}'
  search-bar:
    height: 44px
    rounded: '{rounded.full}'
    fill: '{colors.surface}'
    shadow: subtle
  category-icon-badge:
    size: 56px
    rounded: '{rounded.md}'
    fill: category-color
    icon-color: '{colors.surface}'
  tick-save-button:
    size: 36px
    rounded: '{rounded.full}'
    inactive-fill: '{colors.neutral-muted}'
    active-fill-tick: '{colors.emerald}'
    active-fill-save: '{colors.amber}'
    icon-color-active: '{colors.surface}'
    icon-color-inactive: '{colors.ink}'
  drawer-sheet:
    rounded-top: '{rounded.lg}'
    fill: '{colors.surface}'
    grabber: '{colors.ink}' at 13% opacity
    shadow: elevated
  button:
    height: 48px
    rounded: '{rounded.full}'
    primary-fill: '{colors.ink}'
    primary-text: '{colors.surface}'
    secondary-fill: '{colors.surface}'
    secondary-text: '{colors.ink}'
    secondary-border: '{colors.ink}' at 15% opacity
    text: '{typography.label}'
  admin-table-row:
    height: 56px
    rounded: '{rounded.sm}'
    fill: '{colors.surface}'
    divider: '{colors.ink}' at 8% opacity
    archived-badge-fill: '{colors.neutral-muted}'
    archived-badge-text: '{colors.ink}' at 60% opacity
  photo-grid:
    thumbnail-rounded: '{rounded.sm}'
    gap: '{spacing.2}'
    pending-badge-fill: '{colors.neutral-muted}'
    pending-badge-text: '{typography.label}'
  profile-tab:
    active-underline: '{colors.ink}'
    inactive-text: '{colors.ink}' at 55% opacity
    stat-text: '{typography.meta-mono}'
---

## Brand & Style

Wander Éire looks like a corkboard travel map, not a corporate trip-planning tool. Real geography, real coordinates — but styled bright and bold, with saturated category colour doing the work that a legend usually does. The reference posture is a pin pushed into cork, not a teardrop dropped from above: solid rings, drop shadows, a physical object sitting on the map rather than a UI marker floating over it.

Colour is never decorative here — it is the primary category label, read at a glance before any text loads. Every other surface (chips, sheets, buttons) stays quiet — cream, ink, white — so the five (soon more) category hues are the only saturated colour competing for attention anywhere in the app.

## Colors

- **Cream (`#FBF3E7`)** — the app's base canvas. Warm, not sterile white; everything sits on this.
- **Ink (`#1E2A22`)** — primary text and chrome (header bar, nav icons, borders). Never used as a category colour, so it always reads as "structure," not "content."
- **Surface (`#FFFFFF`)** — raised surfaces sitting on cream: search bar, bottom sheets, category icon badges, cards. The white-on-cream lift is the only elevation cue besides shadow.
- **Neutral Muted (`#F3EFE6`)** — inactive-state fill for the tick/save buttons and other toggle controls before they're activated.
- **Emerald (`#1F7A4D`) — Trail.**
- **Terracotta (`#E2603D`) — Historic.**
- **Amber (`#F0A93A`) — Viewpoint.**
- **Ocean (`#1C7293`) — Beach/Coast.**
- **Plum (`#6B4A85`) — Camping.**

Category hues are load-bearing, not swappable per-screen: a Trail location is Emerald on the pin, the filter chip, and the Detail view's icon badge, everywhere it appears. New categories (Food, Stay, etc.) get their own hue following the same saturation/warmth family — never a tint or shade of an existing category's hue. (The tick/save buttons are a deliberate exception — see Components: their active-state colour is fixed, not category-driven.)

**No colour is reserved for system state** (error, destructive, warning). The palette has five category hues and that's the full saturated set — repurposing one (e.g. Terracotta for "error") would make a system message misread as a Historic-category cue. Errors, destructive actions (remove location, delete account), and validation problems are carried by **icon + weight + copy**, not colour. See Do's and Don'ts.

## Typography

Three families, each with one job: **Space Grotesk** for display/headings (app title, screen titles, location names) — it's the voice that says "this is a place worth stopping for." **Inter** for everything functional — body copy, buttons, chip labels, form fields. **IBM Plex Mono** for data specifically: cost, distance, timestamps, coordinates, Eircode — anywhere a number needs to read as a fact, not prose.

Never substitute Inter for a data value or Plex Mono for prose — the mono treatment is a deliberate "this is measured, not written" signal, so it only appears attached to real data.

## Layout & Spacing

Scale: `{spacing.1}`–`{spacing.7}` (4/8/12/16/20/24/32px). Screen-edge margins use `{spacing.5}` (20px) on mobile, matching the reference mockup. Tight relationships (icon-to-label inside a chip, icon-to-value in a meta line) use `{spacing.2}`; card/section separation uses `{spacing.4}`–`{spacing.6}`.

Single-column, mobile-viewport-first throughout the consumer app — no desktop-specific reflow in v1 `[ASSUMPTION: consumer surfaces are designed and tested at mobile widths; a desktop browser visitor gets the same layout, not a repositioned one — confirm before wide-viewport polish work]`. The admin route is the one surface that reflows for wide viewports (see `EXPERIENCE.md` → Responsive & Platform).

## Elevation & Depth

Two elevation states only: **flat** (sits directly on cream — the map itself, page backgrounds) and **raised** (white surface + soft drop shadow — search bar, pins, drawer sheets, modals). No intermediate elevation tiers, no gradients. The tack-pin's shadow is the one place elevation carries literal meaning: it's what makes the pin read as pushed *into* the board rather than printed on it.

## Shapes

`{rounded.full}` for anything that reads as an object you tap — pins, chips, tick/save buttons, the search bar. `{rounded.lg}` (24px) for sheet/modal top corners — the corkboard's edge, not a hard app-panel line. `{rounded.md}` (16px) for category icon badges and cards. `{rounded.sm}` (8px) for form inputs. Nothing square; nothing sharp — every shape in the system has at least a small radius.

## Components

- **Tack pin** — circular badge, category-colour fill, white icon centered, `{spacing.1}` cream ring, drop shadow. 32px default, 40px when selected. This is the app's signature shape — never rendered as a teardrop/marker silhouette anywhere (map, list thumbnails, admin coordinate picker).
- **Filter chip** — pill, `{colors.surface}` when inactive with a small category-colour dot, full category-colour fill (white text/dot) when active. "All" chip uses `{colors.ink}` fill when active instead of a category hue.
- **Search bar** — pill, white, search icon left, placeholder text at 45% ink opacity, filter/sort icon right (decorative in v1 — see `EXPERIENCE.md`).
- **Category icon badge** — 56px rounded-square, category-colour fill, white icon. Anchors the top of the Detail view and the profile's ticked/saved list rows.
- **Tick / save buttons** — paired circular icon buttons, muted-fill when inactive, category-independent active colours (Emerald for ticked, Amber for saved — chosen to read consistently regardless of the location's own category colour, since a Trail location's tick button shouldn't visually double as "this is a trail").
- **Drawer sheet** — white, rounded top corners, centered grabber bar, slides up over the map. Shared component reused for two distinct surfaces: the List drawer (map/list toggle) and the Sign-up/Sign-in modal — same visual language, different content.
- **Detail view** — not a bottom sheet; a dedicated full-screen view with a back affordance in the header, category icon badge + name/meta block up top, then scrollable content (photos, description, how-to-get-there, parking, Photos & Comments section).
- **Admin form section** — collapsible card (label header + chevron), `{rounded.md}`, grouping related fields (Basics / Location & Access / Cost & Distance / Photos). The **Admin location form** (add/edit) is composed of four of these sections in sequence — it has no visual spec of its own beyond that composition.
- **Button** — `{components.button}`. Two variants only: **primary** (`{colors.ink}` fill, white text — sign-up/sign-in CTAs, "+ Add Location", form submit) and **secondary** (white fill, ink border/text — Approve/Reject in the moderation queue, cancel actions). Full-rounded, `{typography.label}`. No third "danger" variant — destructive actions (Reject, Remove location, Delete account) use the secondary style plus an icon/copy cue, never a colour change (see Do's and Don'ts).
- **Admin table row** — `{components.admin-table-row}`. Used for both the Admin location list and the Moderation queue: thumbnail/icon left, label + meta centre, action(s) right, hairline divider between rows. Archived locations and reviewed queue items (if ever re-shown) get a muted `archived-badge` pill instead of being visually removed from admin's own view.
- **Photo grid** — `{components.photo-grid}`. Square thumbnails in a wrapping grid, `{spacing.2}` gap, used in the Detail view's photo gallery and the Photos & Comments feed. A submitter's own pending photo gets a small `neutral-muted` "Pending review" badge overlaid bottom-left; approved photos carry no badge.
- **Profile tabs** — `{components.profile-tab}`. Two-tab switcher (Ticked / Saved), active tab underlined in `{colors.ink}`, inactive at 55% opacity, no fill change. The progress stat above the tabs renders in `{typography.meta-mono}`, consistent with how every other measured value (cost, distance) is styled. Display name (FR-10) renders as `{typography.heading}` at the top of Profile, above the stat.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use colour as the category label everywhere that category appears (pin, chip, icon badge, tick colour) | Introduce a new saturated hue for a non-category purpose (error, warning, destructive) |
| Pair every category colour with a distinct icon, always | Rely on colour alone to distinguish categories |
| Carry errors/destructive actions with icon + weight + copy | Recolour a category hue to signal "error" |
| Keep pins circular, tack-style, with the cream ring + shadow | Use a teardrop/marker silhouette anywhere, including thumbnails |
| Reserve `{colors.surface}` (white) for raised UI, `{colors.cream}` for base canvas | Introduce a third base tone or off-white variant |
| **Flag: white icon directly on `{colors.amber}` (`#F0A93A`) fill measures ~2:1 contrast — below the 3:1 WCAG non-text minimum.** Give Amber-category icons (pin, chip dot, icon badge) a thin ink outline/halo so they stay legible; the four other category hues pass without it. | Ship the Amber pin/badge with a bare white icon and no outline — it will be genuinely hard to see, not just a theoretical audit finding |
