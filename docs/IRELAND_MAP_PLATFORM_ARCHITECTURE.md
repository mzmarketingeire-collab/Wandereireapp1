# Ireland Outdoor Platform --- Architecture & Product Blueprint

> **Working project reference**
>
> This document consolidates the product direction and technical
> architecture discussed for rebuilding the existing Ireland hiking
> concept into a fast, scalable outdoor platform. It is intended to live
> in the project root and be referenced against the implementation as it
> evolves.

## 1. Product Vision

The current application is a proof of concept: a simple 2D hiking map
backed by a low-cost API. It demonstrates the basic idea, but the
existing experience has several limitations:

-   Geographic data leaks outside Ireland, including locations in
    England.
-   The map can be slow to load.
-   The experience is visually flat and primarily 2D.
-   Large numbers of pins clutter the map when zoomed out.
-   The current architecture is a long way from the intended finished
    product.

The rebuild should be treated as an **Ireland outdoor platform**, not
merely a replacement hiking map.

Hiking is the first major experience, but the foundation should be
capable of later supporting:

-   Hiking and trail discovery
-   Mountains, peaks, lakes, cliffs and viewpoints
-   Waterfalls and natural features
-   Parking and trailheads
-   Saunas and wellness experiences
-   Kayaking, surfing and other outdoor activities
-   Bike/equipment rental
-   Guided activities
-   Booking and availability
-   Saved/favourite locations and routes
-   User history and completed hikes
-   Rich geographic content
-   Offline/cached outdoor areas
-   Augmented reality experiences in V2+

The platform should feel like exploring the landscape of Ireland rather
than opening a generic map covered in pins.

------------------------------------------------------------------------

## 2. Core Product Principle

The map should reveal information progressively as the user explores.

The desired interaction is:

**Ireland → Region → Mountain area → Hikes → Trails → Viewpoints/POIs →
Detailed information**

Not:

**Ireland → hundreds of pins**

The physical landscape should remain the primary visual object.
Application data should appear only when it becomes relevant to the
user's zoom level and intent.

------------------------------------------------------------------------

## 3. High-Level Architecture

``` text
                    IRELAND OUTDOOR PLATFORM
                              |
        +---------------------+----------------------+
        |                     |                      |
     EXPLORE                PLACES                  USER
        |                     |                      |
  MapLibre Map           Activities              Profile
  Hikes                  Saunas                  Favourites
  Mountains              Rentals                 Saved hikes
  Lakes                  Guides                  History
  Cliffs                 Attractions             Completed hikes
  Viewpoints
        |                     |
        +----------+----------+
                   |
             BOOKING DOMAIN
                   |
          Services / Availability
             Reservations
                   |
          +--------+---------+
          |                  |
   Supabase/PostGIS    Static Map Assets
          |                  |
    Dynamic data       Vector/terrain tiles
    Spatial queries    CDN/cache delivery
    Auth/users         Elevation/DEM
    App records        Geographic layers
          |                  |
          +--------+---------+
                   |
              MapLibre GL
                   |
        2D + 3D Ireland experience

                   |
                 V2+
                   v

           AUGMENTED REALITY
                   |
       Same POIs / trails / places
       Same coordinates / elevation
       Same stable IDs / backend
```

------------------------------------------------------------------------

## 4. Technology Direction

### Frontend / Map Rendering

Use **MapLibre GL** as the primary geographic rendering engine.

MapLibre should be responsible for:

-   Vector map rendering
-   WebGL rendering
-   Point clustering
-   Zoom-dependent styling
-   Layer visibility
-   3D terrain
-   Hillshade
-   Contour presentation
-   Trail rendering
-   Geographic labels
-   Camera pitch/bearing
-   User interaction with map features

Avoid building the primary map from hundreds of HTML/DOM markers.
Geographic features should normally be rendered as MapLibre
sources/layers so WebGL handles the heavy visual work.

HTML/application components should primarily be used for
selected-feature cards, menus, sheets, filters and other interface
elements.

### Backend

Use **Supabase** as the application backend.

Primary capabilities:

-   PostgreSQL
-   PostGIS/geospatial data
-   Authentication
-   User profiles
-   Application records
-   Spatial queries
-   Storage
-   CDN delivery for appropriate static assets
-   Realtime features where genuinely useful
-   Edge/server functions where required

### Design / UI

Astra or the chosen design workflow can help create the surrounding
frontend experience, but it should not own the geographic architecture.

The map engine, geographic data model and backend should remain
independent from the design-generation layer.

------------------------------------------------------------------------

## 5. Ireland Map Engine

Treat the map itself as a distinct platform component:

**Ireland Map Engine**

The hiking product is then built on top of this engine.

The map engine should support:

-   Ireland coastline
-   Islands
-   Lakes
-   Rivers
-   Mountains
-   Peaks
-   Cliffs
-   Forests
-   Land cover
-   Elevation
-   Hillshade
-   Contours
-   Paths/trails
-   Regions
-   Outdoor POIs

This separation means future products---activities, booking, AR, outdoor
navigation---can use the same geographic foundation.

------------------------------------------------------------------------

## 6. Ireland-Only Geographic Experience

The current application's England leakage should be eliminated at
multiple levels rather than merely hidden visually.

### Map behaviour

Configure sensible Ireland-focused bounds and camera defaults.

The normal user experience should remain focused on the island of
Ireland rather than presenting a generic world map.

Where appropriate:

-   Disable unnecessary world copies.
-   Use Ireland-specific initial bounds.
-   Prevent accidental extreme panning where it damages the product
    experience.
-   Keep Northern Ireland naturally included as part of the island-wide
    outdoor experience.

### Data behaviour

Do not depend on frontend bounds alone.

Application geographic records should be validated/filterable so
unrelated records from Great Britain or elsewhere cannot populate the
Ireland experience because of a third-party API error.

The long-term goal is to control the core location dataset rather than
depend on an external hiking API returning the correct geography.

------------------------------------------------------------------------

## 7. Static Geography vs Dynamic Application Data

This distinction is critical.

### Dynamic/queryable data --- PostgreSQL + PostGIS

Store objects that the application needs to query, filter, relate or
update.

Examples:

``` text
hikes
trails
places
viewpoints
peaks
waterfalls
parking
trailheads
activities
businesses
regions
services
availability
bookings
users
favourites
completed_hikes
```

These records can be spatially queried according to the current
viewport.

Example concept:

``` text
"Return relevant viewpoints and hikes inside the map's current bounds."
```

The browser should not need to download every dynamic location in
Ireland at startup.

### Static/heavy geographic assets --- tiled delivery

Examples:

``` text
coastline
lakes
rivers
land cover
forests
base paths
contours
terrain/elevation
```

These should generally be preprocessed into map-friendly tiled formats
rather than shipped as one enormous GeoJSON document.

Supabase Storage/CDN may be used as an asset delivery layer where
appropriate.

The important performance principle is:

> **Do the expensive geographic processing ahead of time, not every time
> a user opens the application.**

------------------------------------------------------------------------

## 8. Do Not Use One Giant Ireland GeoJSON

Avoid an architecture where the browser downloads something such as:

``` text
ireland_everything.geojson
```

containing every contour, river, forest, coastline coordinate and
geographic feature.

This creates unnecessary:

-   Network transfer
-   Parsing
-   Memory usage
-   Rendering work
-   Mobile-device load
-   Startup latency

Instead, divide geographic information into tiles and levels of detail.

When viewing all of Ireland, only low-detail tiles are needed.

When the user zooms into Wicklow, detailed Wicklow tiles are requested.

The client should not simultaneously download detailed geography for
Cork, Kerry, Galway, Donegal and every other area.

------------------------------------------------------------------------

## 9. Terrain / Topography

Ireland's terrain should become an important part of the product
identity.

Use elevation/DEM data to support:

-   3D terrain
-   Hillshade
-   Elevation
-   Contours
-   Mountain forms
-   Terrain-aware route presentation

Mountains do not need to be individually modelled as 3D objects.

The elevation dataset supplies height information, and the map renderer
creates the terrain surface.

The target visual experience should communicate Ireland's actual
landscape: valleys, ridges, mountains, lakes and coastline.

------------------------------------------------------------------------

## 10. Zoom-Dependent Clustering

This is one of the most important UI behaviours.

The existing map becomes visually overwhelmed because individual markers
remain visible while zoomed out.

Replace that behaviour with clustering.

### National level

At Ireland-wide zoom, individual hikes/viewpoints should not appear.

Example:

``` text
              Donegal
                12

  Mayo 9                   Antrim 6


              Wicklow
                28


        Kerry
          17
```

The number represents the quantity of relevant features within that
cluster.

The map remains primarily about Ireland's terrain.

### Regional level

As the user zooms in, large clusters split into smaller geographic
clusters.

Example:

``` text
             8
        Glendalough

     6                 5

             4

         3        2
```

### Mountain/local level

Clusters progressively resolve into actual geographic objects:

``` text
        Peak: Djouce
             |
        Viewpoint
             |
       ----- trail -----
             |
          Parking
```

### Close exploration

At close zoom:

-   Individual viewpoints appear.
-   Peaks appear.
-   Trailheads appear.
-   Parking appears.
-   Trail names become visible.
-   Relevant facilities can appear.
-   Labels gain more detail.

At still closer zoom or selection, richer information becomes available.

------------------------------------------------------------------------

## 11. Progressive Disclosure

Do not simply toggle everything from hidden to visible.

Information should progressively gain detail.

Example viewpoint lifecycle:

### Far away

``` text
28
```

### Closer

``` text
5 hikes
```

or multiple smaller clusters.

### Closer again

``` text
Viewpoint icon
```

### Local zoom

``` text
Spinc Viewpoint
570 m
```

### Selected

Open the full UI card:

``` text
Spinc Viewpoint

Elevation
Description
Photos
Nearby trail
Distance
Difficulty/context
Save
Directions/navigation
Nearby activities
```

The map should increase information density as user intent becomes
clearer.

------------------------------------------------------------------------

## 12. Suggested Zoom Philosophy

Exact zoom thresholds should be tuned during implementation rather than
hard-coded permanently from this document.

Conceptually:

  -----------------------------------------------------------------------
  Map scale                           Information
  ----------------------------------- -----------------------------------
  Ireland                             Terrain, coastline, major
                                      lakes/landscape, large clusters

  Region                              Regional labels, smaller clusters,
                                      important landscape features

  Mountain area                       Hikes, peaks, selected natural POIs

  Local                               Viewpoints, trailheads, parking,
                                      waterfalls, detailed trails

  Close                               Names, detailed labels, facilities
                                      and rich interaction
  -----------------------------------------------------------------------

Each feature type should have a deliberate minimum useful zoom.

Do not display a feature merely because the database contains it.

------------------------------------------------------------------------

## 13. Marker Strategy

Avoid hundreds or thousands of DOM markers.

Prefer MapLibre layers for:

-   Clusters
-   Cluster counts
-   Hikes
-   Peaks
-   Viewpoints
-   Parking
-   Trailheads
-   Activities
-   Natural features

Benefits:

-   GPU/WebGL rendering
-   Better scaling
-   Easier zoom styling
-   Easier filtering
-   Cleaner interaction model
-   Less DOM overhead

Traditional UI components should appear primarily after selection.

------------------------------------------------------------------------

## 14. Viewport-Based Queries

Dynamic application data should increasingly be requested based on the
visible geographic area.

Concept:

``` text
Map moves
    |
    v
Determine viewport bounds
    |
    v
Query relevant dynamic records
    |
    v
Return compact dataset
    |
    v
Cluster/render in MapLibre
```

This prevents the client from requesting every viewpoint, hike, activity
and business in Ireland whenever the application launches.

Appropriate caching/debouncing should prevent unnecessary queries during
continuous map movement.

------------------------------------------------------------------------

## 15. Suggested Geographic/Application Model

A flexible `places` model is preferable to creating unrelated systems
for every future feature.

Possible conceptual structure:

``` text
places
------
id
name
type
location
elevation
region_id
description
metadata
status
created_at
updated_at
```

Possible `type` values:

``` text
viewpoint
peak
waterfall
trailhead
parking
sauna
activity_provider
rental
attraction
```

Not every object must literally share one table if implementation
requirements suggest otherwise, but they should share a coherent
geographic model and stable identity.

### Hikes

Possible domain:

``` text
hikes
trail_geometries
hike_waypoints
hike_places
difficulty
distance
elevation_gain
duration
route_metadata
```

Trail geometry should be stored/queryable geospatially.

------------------------------------------------------------------------

## 16. Users

V1 can support a relatively small user model while keeping room for
expansion.

Potential features:

``` text
profiles
favourites
saved_hikes
completed_hikes
saved_places
preferences
```

Do not add social complexity until it is actually part of product scope.

------------------------------------------------------------------------

## 17. Booking Architecture

Future sauna/activity booking should **not** be hard-coded into hiking.

A sauna is fundamentally a place/business offering one or more services.

A scalable conceptual model is:

``` text
business/place
    |
    +-- services
           |
           +-- availability
                   |
                   +-- booking
```

For example:

``` text
Business: Mountain Sauna
    |
    +-- 60-minute sauna
    +-- 90-minute sauna
    +-- private session
```

The same model can later support:

-   Kayaking
-   Guided hikes
-   Surf lessons
-   Bike hire
-   Equipment rental
-   Wellness experiences
-   Other bookable outdoor activities

This avoids redesigning the booking database every time a new activity
category is added.

Payments can be introduced when the booking product requires them rather
than being forced into the first map release.

------------------------------------------------------------------------

## 18. AR-Ready Architecture --- V2+

Augmented reality is **not a Phase 1 requirement**.

However, Phase 1 geographic records should avoid decisions that make AR
difficult later.

Important geographic objects should have:

-   Stable ID
-   Latitude/longitude or geospatial point
-   Elevation where useful/available
-   Type/category
-   Name
-   Relationships to hikes/places
-   Appropriate metadata

Future AR experience:

``` text
Phone camera
     |
     v
Device position/orientation
     |
     v
Nearby platform POIs
     |
     +-- peak
     +-- viewpoint
     +-- trail
     +-- activity
     +-- landmark
```

Example future scenario:

A user in a mountain area points the phone toward the landscape.

The AR experience could identify:

-   A visible peak
-   Peak elevation
-   Nearby trail
-   Viewpoint
-   Direction/distance
-   Relevant activity/location

AR should be another presentation layer over the **same geographic
database**, not a separate geographic system.

------------------------------------------------------------------------

## 19. Offline / Poor Connectivity

Outdoor users may have weak mobile connectivity.

Full offline support does not need to ship in the first release, but the
architecture should make future caching practical.

Potential future capability:

``` text
Download Wicklow hiking area
```

which could cache:

-   Relevant map tiles
-   Terrain
-   Trail geometry
-   Selected POIs
-   Essential hike information
-   Safety information

A tiled geographic architecture makes this significantly easier than a
monolithic online-only map.

------------------------------------------------------------------------

## 20. Scalability

The target should comfortably support thousands of users without
requiring an unnecessarily complex distributed architecture in V1.

The main scalability principles are:

### Do not send unnecessary data

Use:

-   Tiles for heavy geography
-   Spatial queries for dynamic objects
-   Clustering
-   Zoom thresholds
-   CDN/cache delivery

### Keep the database spatially indexed

PostGIS geometry/geography columns should use appropriate indexes for
common spatial queries.

### Cache static content aggressively

Coastlines, terrain and other static geographic assets do not need
repeated database computation.

### Keep client payloads compact

Do not send large descriptions/photos/full objects when the map only
needs:

``` text
id
coordinates
type
cluster-relevant metadata
```

Fetch richer information when a user selects something.

### Measure before over-engineering

Thousands of users do not justify building a highly distributed
infrastructure prematurely.

Start with a clean Supabase/PostGIS + tiled map architecture, instrument
it, then scale the components that actually become constrained.

------------------------------------------------------------------------

## 21. Performance Strategy

Performance should be designed into the map rather than added later.

### Startup

The first usable view should require only what is necessary to display
Ireland.

### Geographic detail

Higher detail should load only as the user zooms.

### POIs

Cluster large datasets and use zoom-dependent visibility.

### Dynamic data

Query the current/nearby viewport rather than the whole country where
appropriate.

### Static geography

Preprocess once and serve cached/tiled assets.

### Selection

Fetch rich details only when needed.

### Images

Use appropriately sized image variants/thumbnails rather than
full-resolution assets for every map card.

------------------------------------------------------------------------

## 22. Data Quality

Moving away from the cheap hiking API should also improve control over
data quality.

Core platform data should increasingly be:

-   Normalized
-   Deduplicated
-   Geographically validated
-   Ireland-focused
-   Assigned stable IDs
-   Categorized consistently
-   Source-aware where appropriate

Third-party sources may still be useful for importing/enriching data,
but they should not dictate the runtime user experience.

------------------------------------------------------------------------

## 23. Suggested Repository Structure

This is conceptual and should be adapted to the actual framework.

``` text
/
├── README.md
├── IRELAND_MAP_PLATFORM_ARCHITECTURE.md
│
├── src/
│   ├── app/
│   ├── components/
│   │   ├── map/
│   │   ├── places/
│   │   ├── hikes/
│   │   ├── booking/
│   │   └── user/
│   │
│   ├── map/
│   │   ├── config/
│   │   ├── sources/
│   │   ├── layers/
│   │   ├── clustering/
│   │   ├── terrain/
│   │   ├── interactions/
│   │   └── styles/
│   │
│   ├── services/
│   │   ├── supabase/
│   │   ├── geospatial/
│   │   └── map-data/
│   │
│   ├── features/
│   │   ├── explore/
│   │   ├── hikes/
│   │   ├── places/
│   │   ├── favourites/
│   │   └── booking/
│   │
│   └── types/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed/
│   └── geo/
│
├── geo/
│   ├── source/
│   ├── processing/
│   ├── generated/
│   └── README.md
│
└── docs/
    ├── map-data.md
    ├── database-schema.md
    ├── zoom-layers.md
    └── roadmap.md
```

Large generated geographic assets should generally **not** be committed
blindly to Git. Keep source/processing documentation in the repository
and deploy generated assets to the appropriate storage/tile
infrastructure.

------------------------------------------------------------------------

## 24. Recommended Map Layer Organisation

Conceptual ordering:

``` text
background
land
land-cover
forest
water
terrain/hillshade
contours
roads/paths
trails
regional labels
mountain/peak labels
clusters
individual outdoor POIs
selected route
selected POI
user/location/navigation overlays
```

Exact ordering will depend on the final visual style.

The selected hike/feature should visually rise above general map
information without destroying geographic context.

------------------------------------------------------------------------

## 25. V1 Scope

V1 should concentrate on making the core outdoor discovery experience
excellent.

### V1 priorities

1.  Ireland-focused MapLibre experience
2.  Fast initial loading
3.  Terrain/elevation foundation
4.  Strong Ireland visual identity
5.  Coastline/lakes/rivers/landscape
6.  Hikes and trail geometry
7.  Clustered map discovery
8.  Progressive zoom disclosure
9.  Viewpoints/peaks/natural POIs
10. Selected-place/hike information UI
11. Supabase/PostGIS geographic backend
12. Authentication where required
13. Favourites/saved hikes if product scope requires
14. Clean data model capable of supporting future activities

### Not required for initial V1

-   Full AR
-   Complex social network
-   Every possible activity type
-   Full marketplace
-   Sophisticated booking engine unless explicitly brought into V1
-   Premature microservices
-   Custom 3D modelling of every mountain
-   Massive offline system

Build the foundation correctly without building the entire future
product now.

------------------------------------------------------------------------

## 26. V1 → V2 Roadmap

### Phase A --- Foundation

-   Audit existing concept application.
-   Identify reusable UI/business logic.
-   Establish new map architecture.
-   Configure MapLibre.
-   Configure Supabase/PostGIS.
-   Define geographic schema.
-   Establish Ireland bounds and data validation.
-   Establish tile/data pipeline.

### Phase B --- Ireland Map

-   Base geographic style.
-   Coastline.
-   Water.
-   Land cover.
-   Terrain/DEM.
-   Hillshade.
-   Contours.
-   Mountains/peaks.
-   Performance tuning.

### Phase C --- Hiking Experience

-   Import/normalize hikes.
-   Trail geometry.
-   Cluster behaviour.
-   Zoom-level disclosure.
-   Viewpoints.
-   Trailheads.
-   Parking.
-   Selected hike presentation.
-   Elevation information/profile where useful.

### Phase D --- User Layer

-   Authentication.
-   Profiles.
-   Favourites.
-   Saved hikes.
-   Completed hikes/history where appropriate.

### Phase E --- Activities / Commerce

-   Businesses.
-   Activity providers.
-   Services.
-   Availability.
-   Booking.
-   Payments when required.

### Phase F --- Advanced Outdoor Experience

-   Downloadable/offline areas.
-   Navigation enhancements.
-   Richer user/community features where justified.

### V2+ --- Augmented Reality

-   AR map/landscape presentation.
-   Peak identification.
-   POI overlays.
-   Trail/location overlays.
-   Same backend and stable geographic IDs.

------------------------------------------------------------------------

## 27. Map Acceptance Criteria

The map rebuild should not be considered complete merely because
MapLibre renders.

### Ireland-wide

-   The map opens quickly.
-   Ireland is the clear geographic focus.
-   England/Wales do not pollute the hiking dataset.
-   The map is not covered in individual pins.
-   Large POI/hike collections appear as cluster counts.
-   Terrain and major landscape features remain readable.

### Zooming

-   Cluster counts change naturally as the user zooms.
-   Large clusters split into smaller clusters.
-   Individual features appear only at useful zoom levels.
-   Viewpoints/peaks do not clutter national/regional views.
-   Labels progressively gain detail.
-   Transitions feel deliberate rather than chaotic.

### Local exploration

-   Trails are easy to distinguish.
-   Viewpoints/peaks/trailheads are selectable.
-   Selected objects clearly stand out.
-   Detailed information is available without permanently covering the
    map.

### Performance

-   No hundreds-of-DOM-markers implementation.
-   Heavy geographic data is not delivered as one giant startup GeoJSON.
-   Static geographic assets are cacheable.
-   Dynamic queries are spatially constrained where appropriate.
-   Panning/zooming remains responsive on realistic mobile hardware.

------------------------------------------------------------------------

## 28. Architectural Rules

Use these as guardrails during development.

### Rule 1

**The map should reveal information, not dump information.**

### Rule 2

**Static geography and dynamic application data are different systems.**

### Rule 3

**Do expensive geographic processing ahead of time whenever possible.**

### Rule 4

**Do not download all of Ireland's detailed data merely because it
exists.**

### Rule 5

**Use clustering and zoom visibility to control information density.**

### Rule 6

**Use WebGL map layers instead of hundreds of DOM markers.**

### Rule 7

**Store queryable geographic application objects in PostGIS.**

### Rule 8

**Keep important geographic objects AR-ready through stable IDs and
coordinates.**

### Rule 9

**Bookings belong to a reusable services/availability model, not to
hiking-specific code.**

### Rule 10

**Design for future capabilities without implementing unnecessary V2
complexity in V1.**

------------------------------------------------------------------------

## 29. Recommended Development Integrations

For implementation work, the most useful project integrations are:

### GitHub

Useful for:

-   Inspecting the existing project
-   Reviewing architecture
-   Editing the actual codebase
-   Tracking changes
-   Working with branches/PRs
-   Comparing the prototype with the rebuild

### Supabase

Useful for:

-   Database/schema work
-   SQL
-   Migrations
-   PostGIS/geospatial queries
-   Authentication
-   Storage
-   Functions
-   Logs/debugging

Additional design tooling can be introduced when useful, but GitHub +
Supabase are the core integrations for the implementation itself.

------------------------------------------------------------------------

## 30. What to Reuse From the Existing App

Do not assume the prototype must be thrown away completely.

Audit it for:

-   Useful UI components
-   Authentication code
-   Supabase integration
-   Existing hike records
-   Images/content
-   Routing/navigation
-   Mobile responsiveness
-   Search/filter logic
-   User-facing ideas that tested well

However, do not preserve weak architecture merely because it already
exists.

The prototype should be treated as **reference material and potentially
reusable components**, not as a constraint on the new map platform.

------------------------------------------------------------------------

## 31. Target Experience

The finished product should feel approximately like this:

``` text
Open app
   |
   v
Beautiful terrain view of Ireland
   |
   v
See regional hike/activity counts
   |
   v
Zoom toward Wicklow / Kerry / Donegal / etc.
   |
   v
Clusters split naturally
   |
   v
Mountains, trails and relevant POIs emerge
   |
   v
Viewpoints and trailheads become visible
   |
   v
Choose a hike/place
   |
   v
Route becomes visually prominent
   |
   v
Terrain can pitch into 3D
   |
   v
Explore details / save / navigate
   |
   v
Future: nearby activities / booking / AR
```

The objective is not simply a faster version of the existing 2D pin map.

The objective is a **scalable geographic platform for exploring Ireland
outdoors**, with hiking as its first major product surface.

------------------------------------------------------------------------

## 32. Immediate Next Step

Before implementing the rebuild:

1.  Audit the existing project against this document.
2.  Identify components/data worth retaining.
3.  Document the current frontend stack.
4.  Document the existing Supabase schema.
5.  Identify the current hiking API dependencies.
6.  Identify which geographic data is currently loaded client-side.
7.  Establish the new MapLibre map shell.
8.  Establish PostGIS/geographic schema.
9.  Prototype clustering and zoom disclosure with a small real dataset.
10. Add terrain/tiled geographic layers incrementally.
11. Measure load/render performance before expanding the dataset.

The first technical milestone should prove the architecture with a
**small but real Ireland slice** before ingesting every possible
dataset.

------------------------------------------------------------------------

## 33. Definition of Success

The rebuild succeeds when a user can open the application, immediately
understand that it is an outdoor map of Ireland, smoothly explore from
country level down to an individual hike/viewpoint, and receive
progressively richer information without clutter or long waits.

The architecture succeeds when adding future activities, bookings,
offline areas and AR does **not** require replacing the geographic
foundation.
