# Glendalough living-landscape pilot

> Status, 21 September 2026: retired from the product UI. The user preferred the
> information-rich MapLibre landscape and considered this eye-level scene a visual
> downgrade. Preserve this implementation only as historical reference; do not
> restore it without a new product decision. Unreal Engine may be evaluated
> separately as a future high-fidelity terrain direction.

Local implementation started 20 September 2026. No deployment, billing, R2 or new
OAuth connection. User prefers MCPs when they save work; catalogue search found
no Blender/QGIS plugin, and neither desktop app is installed. Existing libraries
are reused directly instead of spending time setting up optional modelling tools.

## Data and dependencies

- Three.js 0.180.0 (MIT), its existing Water2 reflection/refraction renderer, and
  EZ-Tree 1.1.0 (MIT) with existing tree generation and leaf wind shaders.
- MapTiler satellite-v2 and terrain-rgb-v2 through the existing browser API key.
  Two TileJSON reads, then four imagery and four DEM tiles per scene load before
  browser caching. No credentials are embedded in files. No terrain/imagery copied
  into the repository or uploaded to another host.
- Upper Lake outline: OpenStreetMap way 4892081 version 18, retrieved through
  https://api.openstreetmap.org/api/0.6/way/4892081/full.json on 20 September 2026.
  247 ring coordinates, attributed to © OpenStreetMap contributors, ODbL 1.0.
  The attributed GeoJSON derivative is `src/map/glendalough-lake.json`; preserve
  attribution and ODbL obligations when distributing or modifying this extract.
- Local Mercator scale uses the pilot latitude. DEM elevations are decoded and
  bilinearly sampled; terrain exaggeration is 1.0. Lake level is sampled from
  the same DEM. Interior mesh vertices are lowered slightly under the surface
  to avoid z-fighting. This is visual water flattening, not bathymetry.

## Scope and honesty

Map view remains MapLibre with existing place data. The full-screen scene was
previously lazy-loaded through a pilot card and Glendalough pin previews; those
entry points have been removed. Lake-edge and aerial positions are camera presets;
dragging/arrow keys turn the view. This is not a walking/collision simulator. The
camera starts 1.7 m above sampled terrain with a water clearance minimum; it is
not a surveyed viewpoint position.

Eight foreground trees are reconstructed for the prototype, not surveyed. Wind,
lighting and water are simulated calm conditions, not live weather. Real terrain
and satellite texture retain broad geography; ground detail is limited by the
provider DEM/imagery resolution. The lake polygon may differ from current water
levels or imagery date. No nationwide vegetation or animated-water coverage yet.

## Controls and resource limits

Back/Escape closes the dialog, restores focus and preserves the map underneath.
Touch/mouse drag and arrow keys look around. Pause motion freezes animation;
reduced-motion preference starts paused. Hidden tabs skip rendering. Pixel ratio
is capped at 1.5 and water reflection/refraction targets are 512×512. The scene
renderer, geometry/materials, listeners, requests and animation loop are cleaned
up on close. Its private GPU targets are released with the owned context.

Initial production scene chunk: approximately 4.54 MB, 3.13 MB gzip, including
EZ-Tree's embedded assets. It is not downloaded by the initial map. Mobile
performance and asset-size reduction remain release gates; no 30fps claim yet.
Current npm audit still reports the seven previously observed issues; this task
does not resolve the existing dependency security backlog.

## Verification

Build and lint passed after initial implementation (five existing lint warnings).
Geographic checks: `node scripts/check-scene-geography.mjs`.
Browser visual/interaction checks are in progress; do not treat compilation alone
as proof of a realistic finished scene. Final evidence will be recorded here.
