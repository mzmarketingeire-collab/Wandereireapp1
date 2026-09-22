# Immersive Ireland: research and proposed direction

Researched 20 September 2026. Proposal, not implemented immersive functionality.
Budget remains €0 upfront/ongoing; R2 is on hold. No new integrations installed.

## Recommendation

Keep MapLibre for the all-island map and add an on-demand Three.js scene for
selected viewpoints. Start with one location, provisionally Glendalough, subject
to checking detailed elevation and reference-photo coverage. A cinematic flight
into a map is achievable sooner than an accurate ground-level reconstruction.
Do not equate the two or promise a complete photorealistic Ireland at €0.

Use two levels of interaction: a low-angle map preview everywhere, and an explicit
“Step into this view” action where a prepared scene exists. Clicking a pin should
first show its name, county, image and actions. Keep the map state when returning.

## Tools and their roles

| Tool | Project use | Decision |
| --- | --- | --- |
| MapLibre + Three.js custom layer | Georeferenced trees/models over the existing map | Supported integration pattern; test depth and terrain alignment against our installed version |
| Three.js standalone scene | Eye-height camera, look-around, water, foliage and atmospheric effects | Recommended for a small immersive location with independent camera/collision control |
| EZ-Tree | Procedural Three.js trees, wind and levels of detail | Candidate for prototype; pin/review a version and licence before installing |
| Blender | Optimise existing assets, author materials, export reusable GLB models | Useful preparation tool, not required in the visitor's browser |
| QGIS | Inspect/reproject/clip existing terrain and land-cover data | Use existing geography; do not invent mountain geometry |
| Poly Haven | CC0 models, materials and environment lighting | Bundle selected optimised assets; asset licence and hosted API terms are separate |
| Photo Sphere Viewer | Real photographed 360° views and linked viewpoint tours | Excellent authenticity fallback if licensed panoramas exist; rotation is not free 3D walking |
| CesiumJS | Large geospatial 3D datasets and photogrammetry | Credible alternative, but avoid replacing MapLibre for this first increment; hosted ion data has separate conditions |

MapLibre documents the Three.js custom-layer approach [1]. Three.js provides
first-person controls [2] and instancing for repeated meshes [3]. Camera controls
alone do not provide gravity, collision or accurate ground. For mobile use drag
to look and accessible controls rather than requiring pointer lock.

EZ-Tree's current repository describes wind updates across detail levels [4].
This supplies believable vegetation, not surveyed tree positions/species.
Poly Haven's assets are CC0, including commercial use; its API has separate
terms [5]. A runtime dependency on an asset-library API is unnecessary.

## Geography and realism

- Preserve actual coordinates, camera bearing, distance scale and terrain. Use
  elevation exaggeration 1.0 in an accuracy-focused eye-level view.
- Existing country-scale DEM gives mountain shape, not accurate steps or rocks.
  Copernicus GLO-30 provides 30 m global coverage and is a surface model, not a
  fine bare-earth trail survey [6]. Do not interpret it as centimetre accuracy.
- GSI provides downloadable LiDAR-derived DTM/DSM datasets through its open
  topographic viewer [7]. Coverage is a mosaic, not a verified all-island survey.
  Check the chosen location, resolution, capture date, licence and coordinate/
  vertical reference; Northern Ireland coverage needs a separate check.
- Place vegetation only in supported land-cover areas, excluding paths, water
  and unsuitable slopes. Use consistent species/scale and stable random seeds.
  Procedural placement must be described as reconstructed, not individually surveyed.
- Use shared wind direction/speed with branch stiffness, gentler trunk motion and
  leaf flutter. This can be an artistic preset; do not describe it as live weather.
- Position sunlight from location/time if that mode is offered; separate a
  cinematic twilight preset from actual current conditions. Match water polygons
  and level, with subtle surface motion rather than animating a satellite image.
- Exact photographic authenticity requires licensed panoramas, local photography
  or suitable scans. Satellite images cannot reveal hidden sides of trees/buildings.
  Gaussian splats/photogrammetry are later options when capture data exists;
  neither automatically creates moving foliage or reliable collision geometry.

## MCP connections

MCPs help us build and inspect the project. They are not the app's rendering engine
and should not be called for every visitor or animation frame.

1. **MCP for Blender** (community, not official Blender): scene/model/material
   editing and GLB export. Its repository documents local setup, safe mode and
   telemetry controls [8]. Best new connection for asset preparation. Review/pin
   the implementation, keep its socket local, enable safe mode and disable
   optional telemetry. Avoid optional paid AI model-generation integrations.
2. **QGIS MCP** (community): layer loading, processing and PyQGIS execution [9].
   Useful later for terrain preparation; README only claims testing on QGIS 3.22.
   Treat as experimental and validate against the installed QGIS. A scripted
   QGIS/GDAL workflow is a reasonable alternative; an MCP is not mandatory.
3. **Figma integration**: found available but not installed in the plugin catalogue.
   Suggested for editable interface exploration. Optional, proprietary, and not
   required for a directly coded redesign. No account plan or paid feature verified.
4. Existing Supabase connection can continue supporting place/scene metadata;
   no database or bucket changes are needed for this research. Do not stream a
   large detailed landscape from a free bucket without measuring transfer limits.

Blender/QGIS MCPs were found on the web, not verified as connected here. No new
server was installed, no permissions expanded, and no paid services enabled.

## Interface direction

### Required lake animation (user clarification)

Lakes must move gently rather than remain static satellite textures. Prototype
a separate Three.js water mesh clipped to the real lake outline, at a consistent
surface elevation. Animate low-amplitude wind ripples and changing highlights/
reflections. Fade disturbance near the shore where suitable, prevent land
overlap, and use a calmer preset than ocean waves. Do not add ocean surf to lakes.
Use the same wind direction for water and vegetation; time/wind presets are
simulated unless a verified live weather source is explicitly added.

Three.js provides a reusable Water2 implementation [12]. This is a starting
point, not a physically complete lake
simulation. Reflection/refraction render passes need mobile profiling; use
environment reflections and animated normals at lower quality. Hide or replace
the satellite water patch in the detailed scene so baked-in waves/reflections do
not fight the animated surface. Accurate shore/depth transitions require local
data; do not invent bathymetry. Water animation remains proposed, not implemented.

Proposal: an immersive Irish landscape with an Avatar-inspired sense of wonder.
Make the landscape fill the screen, replacing the large permanent marketing
column with a compact floating search bar and collapsible discovery panel.

Use deep forest/charcoal surfaces, translucent panels, restrained turquoise and
soft gold highlights, readable place names, subtle mist and slow transitions.
Reserve glow for selection and navigation. Actual Irish vegetation and terrain
remain grounded; fantasy colour treatment is an explicitly optional mood.

Selected pin: name and county visible immediately, then photo, View place and,
when supported, Step into this view. An immersive scene keeps a small compass,
place title and obvious Back to map control. Audio starts muted. Respect reduced
motion; provide a static/low-detail mode and keyboard-accessible place list.

## Delivery and €0 constraints

### Later phase: weather and traffic (user requested)

Reserve space in the selected-place panel for destination weather and a Travel
here action with traffic-aware ETA from the visitor's location. These are future
integrations, not part of the current prototype. Request geolocation when the
visitor invokes travel, with a manually entered origin as fallback. Select a
weather provider and a traffic-capable routing provider separately after checking
coverage, current terms, free limits and costs; MapLibre does not supply either.
Do not enable billing. Show forecast/observation timestamps and distinguish live
traffic from ordinary route estimates. Keep route/provider adapters separate
from the renderer; disclose destination/origin sharing with the routing service.

Weather could drive scene wind, cloud/light and rain later. Until connected,
scene weather is a clearly labelled visual preset. Even after connection, model
conditions as an approximation, not a live camera at the destination. Use bounded
caching and on-demand requests; do not continuously transmit visitor location.

1. Fix missing pin name now; preserve existing work.
2. Redesign the full-screen map shell and selection panel in local code.
3. Check data/licences for one pilot viewpoint; prepare a small local scene using
   real elevation plus reusable, clearly reconstructed vegetation.
4. Add subtle wind/water/lighting, progressive loading and touch look-around.
5. Measure real load size, device frame rate, memory and hosting transfer before
   expanding to more places. Aim for 30 fps on a representative phone; this is a
   target, not a measured result. Stop animation when the scene is hidden.

The animation runs on the visitor's GPU, so it needs no per-frame AI/API calls.
Delivery still uses bandwidth: a hypothetical 5 MB scene downloaded by 1,000
uncached visitors is 5 GB, before map tiles; 10,000 is 50 GB. Repeat exploration
increases that. Local development can use free tools; unlimited production
hosting of a detailed Ireland has not been established within €0. Keep scene
assets reusable/compressed and load only the selected location. No R2 needed
for the local pilot and no commitment to paid hosting is implied.

## Sources

1. https://maplibre.org/maplibre-gl-js/docs/examples/add-a-3d-model-using-threejs/
2. https://threejs.org/docs/pages/PointerLockControls.html
3. https://threejs.org/docs/pages/InstancedMesh.html
4. https://github.com/dgreenheck/ez-tree
5. https://polyhaven.com/license
6. https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
7. https://www.gsi.ie/en-ie/data-and-maps/pages/groundwater.aspx
8. https://github.com/ahujasid/mcp-for-blender
9. https://github.com/jjsantos01/qgis_mcp
10. https://photo-sphere-viewer.js.org/
11. https://cesium.com/platform/cesiumjs
12. https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Water2.js

GSI search extracts were available, but opening its topographic-news page failed.
No location-specific LiDAR coverage has been verified. Tool capabilities above
are documentation findings, not an integration benchmark.
The older hosted webgl_water and webgl_water_flowmap demo URLs returned 404;
use the source implementation reference rather than those demo links.
