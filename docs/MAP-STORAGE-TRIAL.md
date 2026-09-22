# MapLibre 3D landscape and Supabase storage trial

Verified 20 September 2026. R2 remains disabled; no billing or paid plan enabled.

## Result

MapLibre successfully rendered a real Wicklow landscape in Chrome with the three
required baseline layers: satellite imagery, elevation-driven 3D terrain, and
client-rendered hillshade. Supabase Storage served the small PMTiles vector
overlay; the existing MapTiler development API key served satellite and elevation
tiles. This proves the composition works, not production capacity, full Ireland
coverage, offline support, or a permanent zero-cost data source.

- Bucket: `map-trial`, public read, 10 MiB per-file cap; no client write policies.
- Existing `location-photos` bucket remains private and unchanged.
- Archive: `wicklow-trial.pmtiles`, **758,889 bytes**, 23 tiles, zooms 0–12.
- Requested bounds: west -6.42, south 52.97, east -6.27, north 53.06.
- Source: `https://build.protomaps.com/20260920.pmtiles`, tileset 4.15.2.
- SHA-256: `5c07ed0b1502f1a650963b6402a6553cc8b4ca57d958f588dedc0a32164a41eb`.
- Source data: OpenStreetMap contributors, ODbL; attribution shown in the map.
- PMTiles CLI 1.31.2 verified the archive; browser library pinned to 4.5.0.
- Renderer: MapLibre GL JS. No MapTiler SDK was added.
- Hosted landscape data: MapTiler Satellite v2 and Terrain RGB v2 APIs.
- Terrain exaggeration: 1.45; camera pitch: 63 degrees; separate elevation
  sources are used for terrain mesh and hillshade quality.

Extraction preserves whole intersecting tiles, including geography outside the
requested box at low zoom. This is not an Ireland-only clipping pipeline.
Do not overwrite a published archive in place: publish a new versioned filename
and update the consumer URL so cached byte ranges cannot mix versions.

## Reproduce

With the official PMTiles CLI installed:

```sh
pmtiles extract https://build.protomaps.com/20260920.pmtiles wicklow-trial.pmtiles --bbox=-6.42,52.97,-6.27,53.06 --maxzoom=12
pmtiles verify wicklow-trial.pmtiles
node scripts/check-map-storage.mjs
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/geo/trial/`. This is a development-only entry point;
the production app/build does not import or ship this trial page. The existing
application basemap has not been replaced. No map assets are committed to Git.
Older public Protomaps builds may expire; retain the hosted sample or choose a
new available build and record its metadata before recreating it.

## Measurements and limits

- HTTP Range: 206 response, exact requested bytes, cross-origin access allowed.
- Final 3D Chrome view: 9 completed Supabase range reads, **113,423
  response-body bytes**, map idle after 1.91 seconds (one local run, not a
  benchmark). Satellite and elevation traffic is excluded from these figures.
- Camera-flight interaction completed with all three baseline layers active:
  19 Supabase range reads and 248,582 vector-archive bytes in that session.
- Metrics count completed PMTiles reads and returned bytes, including browser
  cache hits; not actual billed requests, CDN misses, or total application traffic.
- Excludes JS/CSS, photos, database traffic, satellite/elevation API traffic,
  fonts, and larger-area use.
- Storage metadata before trial: 75 photo files, 81,839,381 bytes. After adding
  sample: 82,598,270 bytes in this project. Organisation-wide usage and monthly
  cached/uncached egress have not been measured.

Supabase Free currently includes 1 GB storage, 50 MB maximum per file, and
separate monthly allowances of 5 GB uncached and 5 GB cached egress. Cache hits
still consume the cached allowance. Splitting archives solves file size only;
it does not increase storage or transfer capacity. These quotas also support
the existing application's data and photos.

Before expanding: measure a representative higher-detail region and repeated
mobile sessions, inspect organisation usage, then decide maximum coverage and
detail within Free. Do not upgrade or activate R2 automatically.

## Renderer and hosted data decision

MapLibre is the long-term renderer: it is open source and does not create a
per-user renderer licence cost. MapLibre does not include global satellite or
elevation data, so those layers must come from hosted APIs or self-hosted files.
The user explicitly prefers using existing hosted datasets rather than building
those datasets from source.

The current MapTiler Free plan lists 5,000 map sessions, 100,000 API requests,
and 2,000 3D sessions per month; Free usage pauses at the limit instead of
charging overage. MapTiler describes Free as suitable for testing and
personal/non-commercial use. These terms make it appropriate for this prototype,
but it is not yet the approved production data plan for thousands of users.

## R2 cost scenarios (not measured forecasts)

Standard storage, at most 10 GB-month total, at most 1 million Class A operations,
no other R2 usage consuming the allowances. USD before tax, R2 only:

| Monthly users | 500 R2 reads each/month | 2,000 R2 reads each/month |
| --- | ---: | ---: |
| 1,000 | $0 | $0 |
| 5,000 | $0 | $0 |
| 10,000 | $0 | $3.60 |
| 50,000 | $5.40 | $32.40 |

R2 includes 10 million Class B reads/month, then $0.36/million; 10 GB-month
storage, then $0.015/GB-month; 1 million Class A operations, then $4.50/million.
Billable units round up. Internet egress is free. Workers, Supabase, domains,
other services and taxes are separate. Free allowances are not a spending cap.

## Separate existing issues

Checks passed: TypeScript/production build; lint has five existing warnings.
Dependency audit reports seven findings (six high, one critical), including
MapLibre; none names PMTiles. These concern existing dependencies and need a
separate remediation review before a release, not an automatic bulk upgrade.

Supabase advisors report existing PostGIS-in-public / spatial_ref_sys RLS,
executable SECURITY DEFINER functions and disabled leaked-password protection.
No application database schema/functions were changed in this trial. See:

- [RLS finding](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- [Extension schema finding](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [Anonymous function execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Authenticated function execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Sources

- https://supabase.com/pricing
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://developers.cloudflare.com/r2/pricing/
- https://docs.protomaps.com/pmtiles/maplibre
- https://docs.protomaps.com/pmtiles/cli
- https://docs.maptiler.com/guides/maps-apis/maps-platform/how-to-build-a-3d-map-with-maplibre-v2-gl-js/
- https://docs.maptiler.com/schema-raster/terrain-rgb/
- https://www.maptiler.com/cloud/pricing/
- https://www.openstreetmap.org/copyright
