# Wander Éire preferences and findings

## User preferences and constraints

- Budget is capped at €0 upfront and €0 ongoing. Do not enable paid services or billing without explicit agreement.
- R2 activation is on hold; do not activate it.
- Keep the normal detailed place/info/photo pages as the default route when a location is selected.
- Keep the information-rich Explore landscape map reached from place pages, with satellite imagery, topography and optional terrain pitch.
- Remove the separate Glendalough eye-level 3D scene from the UI; it is visually weaker than the terrain map and does not fit the current product.
- Treat Unreal Engine as a possible long-term route for a genuinely custom, high-fidelity terrain experience, not as current implementation scope.
- The app should track the user’s live location and show it as a distinct pulsing GPS pin.
- The app should be resilient under repeated zooming and scaling without becoming stuck in a failed map state.
- The default fresh-load overview must show the whole island with visible sea beyond all four coasts; place-focused landscape views retain their detailed zoom.
- Prefer open-source or low-cost tooling and avoid unnecessary service activation.
- Preserve existing working code and document decisions before committing to new infrastructure.

## Findings from debugging and map reliability work

- The issue was caused by the app enabling terrain-heavy MapTiler layers on every load and continuing to request higher-detail tiles while the user zoomed.
- The fallback path was too weak, so repeated provider requests and loaded style changes could leave the map stuck in a failed state.
- A single recoverable MapLibre tile error was incorrectly promoted to a blocking whole-map error.
- Hillshade and 3D used separate elevation sources simultaneously, doubling active DEM tile traffic in terrain mode. They now remain separate for rendering correctness but only one is visible at a time.
- MapLibre's default expired-tile refresh could add avoidable provider requests during a long open session; the app now keeps already-visible tiles for that session.
- Direct MapTiler endpoints were successfully responding, which suggests the problem was the app’s default behavior and resilience strategy rather than complete provider outage.
- The map is more reliable when 3D/terrain is gated behind a health check and a clean fallback path.
- The user-location marker should be treated as its own map feature and styled separately from place pins.
- The custom immersive scene and the main map’s terrain mode are distinct concepts and should not be conflated.
- The custom Three.js scene is now retained as inactive reference only; the MapLibre landscape is the approved user experience.

## Recommended technical direction

- Use MapLibre as the primary map renderer.
- Keep MapTiler as a high-detail provider behind a strict health gate.
- Use 2D fallback automatically when the terrain layer is unavailable or unstable.
- Add request budgeting and stale-request cancellation to reduce zoom-induced load spikes.
- Treat isolated tile failures as recoverable; fall back only after a short burst of repeated provider failures.
- Keep provider-specific logic isolated so failures degrade gracefully instead of locking the map.
- Evaluate PMTiles and Cloudflare R2 for a more scalable long-term basemap storage strategy, without activating paid services prematurely.
- Keep the app data flow bounded with query limits and progressive loading as the dataset grows.

## Verified evidence

- Production build succeeded with `npm run build` in the current session.
- The app continues to work with the current local stack and no paid provider activation was performed.

## Notes for future work

- Revisit map-provider health checks and layer gating before turning 3D on by default in production.
- Keep the GPS indicator visually distinct and intentionally not mistaken for a location category pin.
- Treat performance and reliability as first-class requirements as user count and zoom activity grow.
