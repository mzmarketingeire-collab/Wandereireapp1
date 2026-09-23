# Wander Éire: project status and session handoff

Last updated: 23 September 2026 (Europe/Dublin).

## Current phase

SEO/AEO and organic growth implementation completed and deployed on 23 September 2026.
The app now has canonical crawlable place URLs, 32 county guide hubs, 40
inventory-qualified topic guides, a 196-URL sitemap, route-specific metadata and
JSON-LD, visible quick answers, related internal links, and Cloudflare Worker HTML
transformation so useful route content exists before React runs. The origin is
environment-configurable for the planned custom domain; Cloudflare is not treated
as the long-term analytics system.

A portable measurement and editorial pipeline is scaffolded: consent-aware
Microsoft Clarity, Google Search Console query ingestion, SerpBear rank ingestion,
opportunity scoring, 40 reviewable evidence-led content briefs, and a weekly
GitHub Actions pull-request workflow. Article prose is not auto-published; the
automation handles factual inventory and drafts briefs for human verification.
See `docs/SEO-AEO-GROWTH-SYSTEM.md`.

Verified locally: TypeScript, scoped oxlint, production build and `git diff
--check` pass; existing fast-refresh/ref cleanup warnings remain. Direct Worker
requests return route-specific HTML, private routes are `noindex`, and old numeric
place URLs redirect to canonical slugs. Chrome verified the Wicklow guide at seven
live places/two topics and the Glendalough page at three quick answers/three related
places, with no console errors or horizontal overflow.

Deployment commit `1d421d0` was pushed to `master` and the Cloudflare Workers
test site updated successfully. Live checks confirmed 32 county links at
`/guides`, seven crawlable place links in the Wicklow server HTML, canonical
Glendalough metadata and TouristAttraction JSON-LD, the 196-URL sitemap, and the
expected private-route exclusions in `robots.txt`. The deployed county hub is
open in Chrome for review.

External connection status: the existing GitHub remote is configured and the
official `gh` CLI is installed and verified. The Hostinger connector was missing
its VPS and ecommerce server registrations; both were added on 23 September.
Codex must be fully restarted once before VPS inventory can be read and the exact
SerpBear Docker project write can be confirmed. No VPS project, paid scraper,
billing or R2 service was created or activated.

Analytics/SEO connection resumed later on 23 September 2026. Google Search
Console URL-prefix ownership for the live Workers origin was verified with the
checked-in HTML verification file, and Google accepted the existing 196-URL
`sitemap.xml`. Microsoft Clarity project `Wander Éire` was created on the free
service and `VITE_CLARITY_ID` was saved as a Cloudflare Workers build variable;
the app's existing consent gate remains mandatory and advertising storage stays
denied. Cloudflare deployed commit `addb4f7`; the live site showed no analytics
script before consent and loaded the expected Clarity project script only after
the test browser selected Allow analytics. GitHub Actions repository variables
`PUBLIC_SITE_URL` and `GSC_SITE_URL` were added.

A dedicated Google Cloud project named `Wander Eire SEO` was created without a
billing account for Search Console reporting. A dedicated service account with
no Google Cloud IAM roles was created, given Restricted access to the Wander
Éire Search Console property, and its JSON key was stored directly as the
encrypted GitHub Actions secret `GSC_SERVICE_ACCOUNT_JSON`. The Search Console
API was enabled and the local reporting script authenticated successfully; it
returned zero rows, which is expected for the newly verified property.

GitHub Actions run `35865717067` completed inventory refresh, Search Console
ingestion and brief generation. Rank ingestion was correctly skipped because
SerpBear is not deployed. The initial run pushed its review branch but could not
create the pull request because the repository forbade Actions from creating or
approving pull requests. After explicit user confirmation, that permission was
enabled. Retry run `35866441021` then passed end to end and created review pull
request `#1`; it did not merge or publish the generated content. The workflow
branch naming is retry-safe because it includes the Actions run ID.

The missing Hostinger VPS and ecommerce MCP registrations were added to the
shared Codex configuration and verified with `codex mcp list`; the app must be
restarted before the VPS connector can inventory the existing machine and the
SerpBear deployment can continue. R2 remains untouched and no paid service or
billing was enabled.

Map framing/data correction on 21 September 2026: replaced the percentage-based
default framing with a generous all-island overview that must show visible sea
beyond all four coasts while leaving place-focused landscape zoom unchanged.
The earlier wider view was still being forced inward by a tight MapLibre
`maxBounds`; the camera boundary is now broad enough to permit the intended
overview while still limiting navigation to Ireland and its surrounding waters.
Corrected live Supabase location 22, Murlough Beach (Down), from the erroneous
inland coordinate `54.2544, -5.9463` to the OpenStreetMap-mapped Murlough National
Nature Reserve centre `54.2392238, -5.8413066`; updated the local seed to match.
The live row was read back successfully. Chrome verified the wider overview and
showed the focused beach pin on the coastal dune system beside the strand, with no
browser warnings or errors. Build, lint, landscape validation and diff checks pass;
lint retains the same five existing warnings.

Product direction clarified on 21 September 2026: retain the information-rich
MapLibre landscape experience reached through Explore landscape on place pages,
including satellite imagery, topography and optional terrain pitch. Remove the
separate Glendalough eye-level Three.js scene from the product UI because it is a
visual downgrade from the terrain map and does not fit the current experience.
Its prototype source and research remain in the repository as inactive reference
only. A future high-fidelity custom terrain experience may be evaluated with
Unreal Engine, but this is a long-term direction rather than approved implementation;
delivery format, device support, performance and the €0 budget constraint must be
resolved before work begins.

Completed and verified: removed the pilot card, Glendalough Open 3D view action,
immersive state and lazy runtime import. The prototype files remain untouched and
inactive. The production build no longer emits the former 4.54 MB immersive scene
chunk. Lint passes with the same five existing warnings, the production build and
landscape style check pass, and `git diff --check` passes. In a fresh Chrome run,
Glendalough's place page Explore landscape action opened the satellite/topography
map focused on the place with terrain controls available; no browser warnings or
errors were recorded.

On 21 September 2026, the map's long-session failure handling was hardened after
the user reported that tiles stopped loading with continued use. MapTiler is now
held behind a completed six-second health check instead of being used immediately
from the presence of a key. 3D remains opt-in. MapLibre no longer refreshes
already-visible expired tiles during the same session, isolated tile errors no
longer block the whole map, and four provider errors within 15 seconds trigger an
automatic reload onto the basic map. Hillshade and 3D keep the separate DEM
sources MapLibre recommends, but the hillshade layer is disabled while 3D terrain
is active so both elevation tile sets are not downloaded simultaneously.

Verified after this change: the landscape style check, lint, production build and
`git diff --check` pass (lint retains the same five existing warnings). A fresh
Chrome run cycled Wicklow, Kerry, Donegal and Mournes in 3D with repeated zoom-in
and zoom-out passes; imagery stayed visible and the fresh tab recorded no console
warnings or errors. This is a bounded stress test, not proof of all-day operation
or of MapTiler quota availability. Provider-plan and usage-limit verification is
still required before production deployment.

Map regression traced to the app automatically enabling MapTiler terrain/3D on every load and then repeatedly requesting higher-detail map tiles as the user zoomed. The fallback path was also too weak, so repeated provider requests and a zoomed-in style load could leave the map in a stuck "couldn't load map" state. The fix keeps 3D terrain off by default, checks MapTiler health before enabling terrain layers, and falls back to the standard map instead of failing silently. User-location tracking is now live and displayed as a blue position pin, while the original place detail flow remains the default and terrain pitch is an optional map control.

The earlier Glendalough immersive pilot is retired from the active UI. See
`IMMERSIVE-PILOT.md` and `IMMERSIVE-IRELAND-RESEARCH.md` for preserved historical
implementation and research notes. Do not restore or continue that scene without
a new user decision; use the existing terrain map as the product experience.
Future phase requested: destination weather and traffic-aware routing/ETA from
the visitor's location. Reserve UI space and provider adapters; do not implement
or activate providers yet. Location permission/manual-origin fallback and €0
provider verification are required. Weather may later drive scene atmosphere.

Fixed `PinPreview` to render the selected place's name and county visibly, with a
named View place action. Build and lint passed (five existing warnings), and
`git diff --check` passed. Browser verification of this latest small
change is pending: Chrome automation timed out, then reported debugger unattached.
Prior browser checks below predate the pin-name fix.

Supabase Free storage trial completed successfully. A 758,889-byte real Wicklow
PMTiles sample is hosted in the new `map-trial` bucket and renders in a local
MapLibre development page. R2 remains on hold; no paid service or billing was
enabled. The trial now includes the required visual baseline: MapTiler-hosted
satellite imagery, Terrain RGB elevation, MapLibre 3D terrain, and hillshade.
The main application now integrates all-island satellite imagery, 3D terrain and
hillshade locally. It has not been deployed. Existing Supabase content currently
shows 72 places; all-island map coverage does not mean every place has been curated.

Read `docs/MAP-STORAGE-TRIAL.md` for reproducible checks, scope, measurements,
R2 cost scenarios, and remaining limits. Next: measure representative detail and
organisation usage before expanding the free-hosted dataset.

## User intent and decisions

- Compare the existing app with the user's Ireland map architecture proposal and
  improve the app while reusing its existing UI, accounts, and community features.
- The correct proposal is `IRELAND_MAP_PLATFORM_ARCHITECTURE.md`, originally in
  `/Users/markhoare/Downloads/`; a verbatim snapshot lives beside this file.
  The Roady NZ comparison document was explicitly rejected as the intended input.
- Latest budget instruction: €0 upfront and €0 ongoing. Do not enable paid
  services or billing without explicit agreement.
- R2 activation is on hold. This supersedes the earlier conditional Cloudflare
  approval for activation purposes; do not activate R2.
- User authorized Cloudflare OAuth and installed the Supabase plugin.
- MapLibre is already an application dependency, not an account or MCP to connect.
- MapLibre is the chosen long-term renderer. The user prefers connecting it to
  existing hosted satellite/elevation APIs instead of building those datasets.
  A data provider is still required; MapLibre itself does not supply imagery or
  elevation.
- User wants lawful open map data alternatives, including a path to offline maps.
  MapTiler satellite/elevation is integrated using the existing browser key.
  A sustainable production data plan within €0 remains to be verified.

## Workspace and baseline

- Work in `/Users/markhoare/wander-eire-codex`, not the separate Downloads copy.
- Branch at handoff: `master`; baseline commit `b30b589`.
- React 19, TypeScript, Vite 8, MapLibre GL JS 6.2, Supabase JS 2.112,
  Cloudflare Vite integration. See `package.json` for current versions.
- Existing features: map/list/search/filter, location detail, auth, saves/visits,
  community notes/photos, moderation and admin location management, PWA shell.
- Current basemap uses MapTiler raster tiles with vector contour/trail overlays.
  OSM raster fallback exists. This is not yet a self-hosted vector basemap.
- App currently fetches all nonarchived locations and filters on the client.
- PostGIS extension exists in schema, but spatial point/index/viewport RPC work
  remains to be designed and verified against the live database.
- Earlier browser check showed 72 places; this is an observation, not a fixed
  inventory. README's original seven-place claim was stale.
- `.env.local` already exists. Do not overwrite it or print its values.

## Uncommitted implementation

These changes predate this documentation handoff and must be preserved:

- `src/App.tsx`: replaced per-place DOM markers with a clustered GeoJSON source
  and MapLibre circle/symbol layers; cluster-click expansion, point selection,
  filtering via source updates, selected-point styling, and map error guidance.
- `src/App.css`: removed obsolete DOM marker styles.
- `vite.config.ts`: excludes `maplibre-gl` from dependency optimization following
  a development worker-module loading failure during browser checks.

Before the storage trial, no bucket or archive had been created. The subsequent
trial created a public `map-trial` bucket with a 10 MiB file cap and uploaded one
758,889-byte archive. No application deployment, commit, database migration,
client write policy, or billing change was performed. The private photo bucket
was unchanged.

New local trial files: `geo/trial/index.html`, `src/map/storage-trial.ts`,
`scripts/check-map-storage.mjs`, `docs/MAP-STORAGE-TRIAL.md`. PMTiles 4.5.0 was
added with an exact version and lockfile. Trial page is development-only.

Fresh checks: range/CORS script passed (447 bytes); Chrome rendered and completed
the MapLibre 3D landscape using satellite, Terrain RGB and hillshade. Final load:
1.91 seconds and 113,423 bytes from the Supabase vector archive; MapTiler traffic
was not measured. Build passed; lint passed with five existing warnings. npm audit
and Supabase advisors flagged existing issues, recorded in the trial report. They
are not fixed by this storage trial.

## Verification and remaining issues

Fresh main-app checks on 20 September 2026:

- `npm run lint`: passed with five warnings (four component-export warnings and
  an existing auth-modal ref cleanup warning).
- `npm run build`: passed.
- `git diff --check`: passed.
- `node scripts/check-landscape.mjs`: passed. Validates both style variants,
  separate DEM sources and island bounds including Northern Ireland.
- Chrome at `http://127.0.0.1:5174/`: satellite country view and 72 places loaded;
  Kerry shortcut visibly rendered mountains and lakes in 3D; 2D/3D toggle,
  Glendalough search-to-map preview and Trails list (24 places) worked.
- Mobile viewport 390×844: map, wrapped controls, provider attribution and filters
  displayed. This is a responsive smoke check, not physical-device performance testing.

Main-app implementation: `src/map/ireland.ts` defines island bounds and Wicklow,
Kerry, Donegal and Mournes shortcuts; `src/map/landscape-style.ts` supplies satellite,
separate terrain/hillshade DEMs and detail overlays. `src/App.tsx` integrates
overview/3D controls, loading/error/retry UI and Explore landscape actions in search,
list and place details. Provider logo and TileJSON attribution are retained.
No-key OSM fallback remains. No billing, deployment or R2 activation occurred.

Review before considering the clustering change complete:

- Fixed singleton visibility at country zoom; points now scale with zoom.
- Correction to earlier glyph concern: installed MapLibre 6 supports local fonts
  without a glyph endpoint. Both style variants pass style-spec validation.
- Check keyboard accessibility after DOM marker removal, mobile interaction,
  individual point-to-detail navigation, and selected places inside clusters.
- Cluster expansion now catches errors and checks lifecycle/filter changes.
- Circle markers no longer have the original category icons; review usability.
- Main-app terrain/hillshade integration is complete locally. Deployment, offline
  downloads, first-class route geometry and viewport queries remain undone.
- Separate prior review noted account deletion may remove storage metadata rather
  than stored bytes; inspect and address separately before claiming this is fixed.

## Connection status

### Cloudflare

Wrangler OAuth login succeeded and account access was verified previously.
`npx wrangler r2 bucket list` returned API code 10042 requesting R2 enablement in
the dashboard. OAuth success does not mean R2 is enabled. The latest user instruction keeps R2 activation on hold; no activation occurred
in this continuation session.
Do not copy Wrangler credentials into project files.

### Supabase

Verified through Supabase MCP on 20 September 2026 in the continuation session:

- `list_projects` succeeded. `wander-eire-codex` project reference:
  `stbkxmzoyonerkyacblp`, region `eu-west-1`, status `ACTIVE_HEALTHY`.
- `get_organization` returned the `free` plan.
- Read-only `execute_sql` (`select current_database(), current_user, version();`)
  succeeded: database `postgres`, PostgreSQL 17.6.
- MCP authentication and database read access are verified. No remote writes,
  billing changes, or new services were performed.

Reverify access in the new session. Read the Supabase skill before Supabase work.
Live schema/RLS inspection and matching the local configured project before any
mutation remain pending. Do not expose environment values.

The continuation read the full Downloads proposal and preserved existing diffs.
Storage-trial schema/advisor observations are recorded in MAP-STORAGE-TRIAL.md;
no application schema migration was made. Main-app checks above are fresh.

## Architecture direction under evaluation

The proposal calls for MapLibre clustered layers and progressive disclosure,
vector basemap, terrain/hillshade, PostGIS viewport queries, and first-class
routes/POIs. Booking, AR and full offline regions can come later.

Potential open-data path discussed: OSM Ireland and Northern Ireland extract from
Geofabrik, Planetiler/Protomaps to generate PMTiles locally, then suitable hosting.
This is a candidate, not an approved paid infrastructure commitment. Respect ODbL
and source-specific terrain licences. OSM public tile servers are not an offline
download source. Open-source software does not make all hosting free.

R2 Standard pricing checked on 20 September 2026: free monthly 10 GB-month storage,
1 million Class A and 10 million Class B operations; beyond that $0.015/GB-month,
$4.50/million Class A, $0.36/million Class B; outbound bandwidth free. USD before
tax. Other Cloudflare services can charge separately. Recheck before deciding.

References:

- https://developers.cloudflare.com/r2/pricing/
- https://docs.protomaps.com/pmtiles/
- https://download.geofabrik.de/europe/ireland-and-northern-ireland.html
- https://github.com/onthegomap/planetiler
- https://operations.osmfoundation.org/policies/tiles/

## Next actions and phase gates

1. Read this file and the proposal; inspect current diff without discarding it.
2. Verify Supabase MCP tools and read-only project access in the new session.
3. Continue accessibility and device testing of clustering and landscape controls.
4. Measure a proposed Ireland map archive and assess a genuinely free deployment
   path, including requests, storage, attribution, and overage behavior. Present
   any unavoidable cost before enabling services. R2 activation remains on hold;
   no paid service or billing activation is authorized.
5. Prepare spatial schema/query changes after inspecting live schema and RLS;
   preserve existing data and do not blindly rerun setup SQL against production.
6. Verify the MapTiler account plan, usage and production terms before deployment;
   open-source rendering does not guarantee unlimited free imagery/elevation.
7. Update this status with checks, decisions, and blockers as work proceeds.

Run locally: `npm run dev`; check: `npm run lint` and `npm run build`.
Fresh storage-trial checks are recorded above and in `MAP-STORAGE-TRIAL.md`.
Current main-app preview: `http://127.0.0.1:5174/`; trial at `/geo/trial/`.
Port 5173 was already occupied when starting this preview. Auth redirect flows on
5174 were not retested and may need an allowed local redirect URL.

## 2026-09-22 — Repo/Cloudflare re-link and MapLibre pins fix

Session summary for future reference. Live app: https://wander-eire.markhoare28.workers.dev/

### What happened

The old GitHub repo and (separately) part of the Cloudflare setup were deleted by
Mark outside of any session. This session rebuilt the deployment pipeline from
scratch and fixed a real product bug along the way.

1. Local codebase had 226 files of uncommitted work (3D map, topography, terrain
   hardening) that had never been pushed. Committed as `19fac60`.
2. Created a fresh GitHub repo: https://github.com/mzmarketingeire-collab/Wandereireapp1
   Pushed via HTTPS using a user-supplied classic PAT embedded in the remote URL
   for the push only, then reset `origin` back to the plain HTTPS URL afterward
   (the token is never stored in `.git/config` or committed anywhere).
3. Reconnected Cloudflare's native git integration ("Workers Builds") to the new
   repo/branch (`master`), build command `npm run build`, deploy command
   `npx wrangler deploy`.
4. Root-caused the map showing a plain fallback style instead of MapTiler
   satellite/terrain: the Cloudflare Workers Build had no build-time env vars.
   `.env.local` is gitignored and only exists on Mark's machine, but Vite bakes
   `VITE_*` vars in at build time, and the build runs on Cloudflare's own
   servers. Fixed by adding `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
   `VITE_MAPTILER_API_KEY` under Cloudflare dashboard → wander-eire → Settings →
   Builds → "Variables and Secrets", then triggering a rebuild.
5. Map then loaded with the correct style but got stuck on "Loading the map..."
   forever, with zero pins. Root cause was a two-file chained missing-asset bug:
   - MapLibre GL JS resolves its own web-worker script URL **dynamically at
     runtime** (`new URL(\`./${filename}\`, import.meta.url)`), which Vite's
     static bundler cannot detect, so `maplibre-gl-worker.mjs` was never copied
     into the production build. Cloudflare's SPA fallback
     (`not_found_handling: 'single-page-application'`) then silently served
     `index.html` (200, `text/html`) for that missing asset instead of a 404,
     which masked the bug until the network request's content-type was checked.
   - Fixed by copying `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
     verbatim into `public/assets/maplibre-gl-worker.mjs` (Vite's `public/` dir
     is copied to the build output root unchanged). Commit `54cf48f`.
   - That worker script itself has a static import of a second file,
     `maplibre-gl-shared.mjs` (MapLibre's shared code-splitting chunk), which
     had the exact same problem and also needed to be shipped by hand. Fixed by
     copying `node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs` into
     `public/assets/maplibre-gl-shared.mjs`. Commit `574a1f2`.
   - Confirmed fixed by clearing the app's service worker (`public/sw.js` caches
     `/assets/*` cache-first, which was serving a stale broken response even
     after the server-side fix deployed) and hard-reloading: the map now loads
     the MapTiler satellite/terrain style and all 122 places render as
     clusters (32 counties).

### Diagnostic techniques that worked (reusable for next time)

- `fetch('/assets/whatever.mjs').then(r => r.headers.get('content-type'))` in
  the browser console to catch an SPA-fallback 404 masquerading as a 200 HTML
  response.
- React Fiber introspection via `el.__reactFiber$...` DOM properties to read
  component state/props directly from the console without React DevTools
  (used to confirm `mapReady` was `true` while `map.isStyleLoaded()` was
  `false`, isolating the bug to the clustering worker rather than React state).
- `new Worker('/assets/maplibre-gl-worker.mjs', { type: 'module' })` run
  directly in console to catch the worker's own module-evaluation error.
- `grep -o 'from"\./[a-zA-Z0-9_.-]*"' <bundle>` on a MapLibre dist file to find
  further static imports/chained dependencies before assuming a file is a safe
  terminal copy target.
- Clearing service workers/caches before re-testing any deploy:
  `navigator.serviceWorker.getRegistrations()` → unregister each, then
  `caches.keys()` → delete each. Always do this before concluding a fix
  didn't work.

### Known constraints carried into future sessions

- Local `npm run build` / `wrangler deploy` cannot run in this sandboxed
  Linux environment (native binary mismatches: rolldown for Vite, workerd for
  wrangler). Cloudflare's own git-based "Workers Builds" CI is the only
  working deploy path from here — push to `master` on the GitHub repo above
  and Cloudflare builds/deploys automatically.
- `api.cloudflare.com` and most non-github.com hosts are blocked by network
  policy from both the cloud container and the local device shell, so the
  Cloudflare REST API cannot be used directly; verification/config changes on
  Cloudflare go through browser automation (Claude in Chrome) against the
  dashboard instead.
- Budget constraint remains €0 upfront / €0 ongoing (see AGENTS.md). R2 is not
  activated. Don't enable paid services without explicit sign-off.
- If any future MapLibre/Vite dependency upgrade changes worker filenames,
  re-check `node_modules/maplibre-gl/dist/*.mjs` for new dynamically-resolved
  worker/shared chunks and re-mirror them into `public/assets/`.

### Status

Deployment pipeline is fully working end-to-end (push to GitHub → Cloudflare
Workers Build → live). Map, terrain, and all 122 place pins render correctly
on the live site. Original SEO/tracking-stack work (Google Search Console,
SerpBear, analytics, Astro subdomain article site for county-by-county
content) has not been started yet and is the next planned phase.
