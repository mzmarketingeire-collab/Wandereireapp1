import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  ArrowLeft, Binoculars, Bookmark, Check, ChevronLeft, ChevronRight, Compass, Footprints,
  Landmark, List, LocateFixed, Map as MapIcon, MessageCircle, Mountain,
  LockKeyhole, Navigation, Search, SlidersHorizontal, TentTree,
  UserRound, Waves, X,
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Route, Routes, matchPath, useLocation, useNavigate, useParams } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { IRELAND_VIEW, IRELAND_CAMERA, landscapeRegions } from './map/ireland'
import { makeLandscapeStyle } from './map/landscape-style'
import './App.css'
import './map/immersive.css'

export type Category = 'trail' | 'historic' | 'viewpoint' | 'beach' | 'camp'
export type Place = {
  id: number; name: string; county: string; category: Category; coordinates: [number, number]
  cost: string; distance: string; kicker: string; description: string; address: string
  parking: string; facts: string[]; archived?: boolean
}

export type Comment = { id: number; user_id: string; location_id: number; body: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; author?: string }
export type LocationPhoto = {
  id: number; location_id: number; object_path: string; position: number; created_at: string
  bucket_id?: string; creator?: string | null; source_url?: string | null
  license_name?: string | null; license_url?: string | null; url?: string; expiresAt?: number
}

const SIGNED_URL_TTL_SECONDS = 3600
const signedUrlExpiresAt = () => Date.now() + SIGNED_URL_TTL_SECONDS * 1000
export const OFFICIAL_PHOTO_BUCKET = 'official-location-photos'

const resolveOfficialPhoto = async (photo: LocationPhoto) => {
  if (!supabase) return photo
  const bucket = photo.bucket_id || 'location-photos'
  if (bucket === OFFICIAL_PHOTO_BUCKET) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(photo.object_path)
    return { ...photo, url: data.publicUrl, expiresAt: Number.MAX_SAFE_INTEGER }
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(photo.object_path, SIGNED_URL_TTL_SECONDS)
  return { ...photo, url: data?.signedUrl, expiresAt: signedUrlExpiresAt() }
}

export const categories = {
  trail: { label: 'Trails', color: '#1f7a4d', icon: Footprints },
  historic: { label: 'Historic', color: '#e2603d', icon: Landmark },
  viewpoint: { label: 'Viewpoints', color: '#d4880e', icon: Binoculars },
  beach: { label: 'Beaches', color: '#1c7293', icon: Waves },
  camp: { label: 'Camping', color: '#6b4a85', icon: TentTree },
} satisfies Record<Category, { label: string; color: string; icon: typeof Footprints }>


const placeFeatures = (items: Place[]) => ({
  type: 'FeatureCollection' as const,
  features: items.map((place) => ({
    type: 'Feature' as const,
    id: place.id,
    properties: {
      id: place.id,
      name: place.name,
      category: place.category,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: place.coordinates,
    },
  })),
})

const addPlaceLayers = (instance: MapLibreMap, items: Place[]) => {
  instance.addSource('places', {
    type: 'geojson',
    data: placeFeatures(items),
    cluster: true,
    clusterMaxZoom: 11,
    clusterRadius: 56,
  })
  instance.addLayer({
    id: 'place-clusters',
    type: 'circle',
    source: 'places',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#356b4b', 10, '#245a3c', 25, '#173f2a'],
      'circle-radius': ['step', ['get', 'point_count'], 19, 10, 24, 25, 29],
      'circle-stroke-color': '#fbf3e7',
      'circle-stroke-width': 3,
      'circle-opacity': 0.96,
    },
  })
  instance.addLayer({
    id: 'place-cluster-counts',
    type: 'symbol',
    source: 'places',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Open Sans Bold', 'Noto Sans Bold'],
      'text-size': 12,
    },
    paint: {
      'text-color': '#ffffff',
    },
  })
  instance.addLayer({
    id: 'place-points',
    type: 'circle',
    source: 'places',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match', ['get', 'category'],
        'trail', categories.trail.color,
        'historic', categories.historic.color,
        'viewpoint', categories.viewpoint.color,
        'beach', categories.beach.color,
        'camp', categories.camp.color,
        '#1f7a4d',
      ],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 10, 12, 14],
      'circle-stroke-color': '#fbf3e7',
      'circle-stroke-width': 3,
      'circle-opacity': 0.98,
    },
  })
  instance.addLayer({
    id: 'place-labels',
    type: 'symbol',
    source: 'places',
    minzoom: 10,
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semi Bold', 'Noto Sans Semi Bold'],
      'text-size': 11,
      'text-offset': [0, 1.9],
      'text-anchor': 'top',
      'text-max-width': 12,
      'text-optional': true,
    },
    paint: {
      'text-color': '#1e2a22',
      'text-halo-color': 'rgba(251, 243, 231, 0.96)',
      'text-halo-width': 1.8,
    },
  })
}


const places: Place[] = [
  { id: 1, name: 'Glendalough Spinc Trail', county: 'Wicklow', category: 'trail', coordinates: [-6.327, 53.006], cost: 'Free', distance: '9.5 km loop', kicker: 'A high trail above two glacial lakes', description: 'Climb through the pine forest to a sweeping boardwalk over the Spinc ridge, with the Upper Lake opening below you and the Wicklow Mountains beyond.', address: 'Upper Lake Car Park, Glendalough, Co. Wicklow', parking: 'Paid parking at the Upper Lake. Arrive before 10am on bright weekends.', facts: ['3–4 hours', 'Hard', 'Dogs on lead'] },
  { id: 2, name: 'Dunluce Castle', county: 'Antrim', category: 'historic', coordinates: [-6.579, 55.211], cost: '€6', distance: '45 min visit', kicker: 'A cliff-edge castle with a wild history', description: 'Cross the narrow bridge to the dramatic ruins of Dunluce, perched above Atlantic caves and the Causeway Coast.', address: '87 Dunluce Road, Bushmills, BT57 8UY', parking: 'Small free car park beside the visitor centre.', facts: ['Ruins', 'Sea views', 'Family friendly'] },
  { id: 3, name: 'Cliffs of Moher', county: 'Clare', category: 'viewpoint', coordinates: [-9.431, 52.971], cost: '€12 parking', distance: '1–8 km', kicker: 'Ireland’s most famous Atlantic edge', description: 'Walk the clifftop path as dark shale walls rise over the Atlantic. On a clear day, the Aran Islands sit low on the horizon.', address: 'Cliffs of Moher, Liscannor, Co. Clare, V95 KN9T', parking: 'Main visitor-centre parking includes admission. Book online for quieter times.', facts: ['214 m high', 'Exposed path', 'Visitor centre'] },
  { id: 4, name: 'Inch Beach', county: 'Kerry', category: 'beach', coordinates: [-9.981, 52.141], cost: 'Free', distance: '5 km strand', kicker: 'A long golden strand on the Dingle peninsula', description: 'Walk, swim or watch surfers from this broad sandy spit with mountain views in almost every direction.', address: 'Inch, Co. Kerry', parking: 'Park on the firm section of beach near the entrance; mind tide times.', facts: ['Swimming', 'Surf hire', 'Dog friendly'] },
  { id: 5, name: 'Glenveagh National Park', county: 'Donegal', category: 'camp', coordinates: [-8.004, 55.032], cost: 'Free entry', distance: '8 km trail', kicker: 'Lakeside trails in Donegal’s mountain heart', description: 'Follow the valley road beside Lough Veagh to the castle gardens, surrounded by rugged Derryveagh peaks.', address: 'Church Hill, Letterkenny, Co. Donegal, F92 P993', parking: 'Free visitor-centre car park. Shuttle to the castle runs seasonally.', facts: ['Shuttle bus', 'Cafe', 'No wild camping'] },
  { id: 6, name: 'Slieve League', county: 'Donegal', category: 'viewpoint', coordinates: [-8.685, 54.628], cost: '€5 parking', distance: '2.8 km', kicker: 'Immense sea cliffs at the edge of Europe', description: 'A steep coastal viewpoint where the Donegal mountains fall straight into the Atlantic. The upper path is for confident walkers only.', address: 'Bunglas Road, Teelin, Co. Donegal', parking: 'Lower car park with seasonal shuttle; limited access higher up.', facts: ['601 m high', 'Steep', 'Shuttle available'] },
  { id: 7, name: 'Rock of Cashel', county: 'Tipperary', category: 'historic', coordinates: [-7.891, 52.52], cost: '€8', distance: '1 hour visit', kicker: 'A limestone crown above the Golden Vale', description: 'Explore a remarkable collection of medieval buildings gathered on a dramatic outcrop above Cashel town.', address: 'St. Patrick’s Rock, Cashel, Co. Tipperary', parking: 'Paid public parking in Cashel, a short uphill walk away.', facts: ['12th century', 'Guided tours', 'Indoor & outdoor'] },
]

export const fromDatabase = (row: Record<string, unknown>): Place => ({
  id: Number(row.id),
  name: String(row.name ?? ''),
  county: String(row.county ?? ''),
  category: row.category as Category,
  coordinates: [row.longitude == null ? NaN : Number(row.longitude), row.latitude == null ? NaN : Number(row.latitude)],
  cost: String(row.cost ?? 'Free'),
  distance: String(row.distance ?? ''),
  kicker: String(row.kicker ?? ''),
  description: String(row.description ?? ''),
  address: String(row.address ?? ''),
  parking: String(row.parking ?? ''),
  facts: Array.isArray(row.facts) ? row.facts.map(String) : [],
  archived: Boolean(row.archived_at),
})

export const hasValidCoordinates = (place: Place) => {
  const [longitude, latitude] = place.coordinates
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
}

export const toDatabase = (place: Omit<Place, 'id' | 'archived'>) => ({
  name: place.name, county: place.county, category: place.category,
  longitude: place.coordinates[0], latitude: place.coordinates[1],
  cost: place.cost, distance: place.distance, kicker: place.kicker,
  description: place.description, address: place.address, parking: place.parking,
  facts: place.facts,
})

export function CategoryIcon({ category, size = 18 }: { category: Category; size?: number }) {
  const Icon = categories[category].icon
  return <Icon size={size} strokeWidth={2.4} aria-hidden="true" />
}

function MapCanvas({ places: allPlaces, filtered, selected, focus, userPosition, onSelect }: {
  places: Place[]
  filtered: Place[]
  selected: Place | null
  focus: [number, number] | null
  userPosition: [number, number] | null
  onSelect: (p: Place | null) => void
}) {
  const node = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const userMarkerRef = useRef<{ setLngLat: (value: [number, number]) => any; remove: () => void } | null>(null)
  const placesById = useRef(new Map<number, Place>())
  const filteredRef = useRef(filtered)
  const onSelectRef = useRef(onSelect)
  const [mapReady, setMapReady] = useState(false)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const rawMapTilerKey = (import.meta.env.VITE_MAPTILER_API_KEY as string | undefined)?.trim()
  const [mapTilerAvailable, setMapTilerAvailable] = useState<boolean | null>(rawMapTilerKey ? null : false)
  const mapTilerKey = rawMapTilerKey && mapTilerAvailable ? rawMapTilerKey : undefined
  const [threeDimensional, setThreeDimensional] = useState(false)
  const threeDimensionalRef = useRef(threeDimensional)
  threeDimensionalRef.current = threeDimensional
  const [attempt, setAttempt] = useState(0)
  const [mapMessage, setMapMessage] = useState('')
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200

  placesById.current = new Map(allPlaces.map((place) => [place.id, place]))
  filteredRef.current = filtered
  onSelectRef.current = onSelect

  useEffect(() => {
    let active = true
    if (!rawMapTilerKey) { setMapTilerAvailable(false); return () => { active = false } }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 6000)
    void Promise.all([
      fetch(`https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${encodeURIComponent(rawMapTilerKey)}`, { signal: controller.signal }),
      fetch(`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodeURIComponent(rawMapTilerKey)}`, { signal: controller.signal }),
    ]).then(([satellite, terrain]) => {
      if (!active) return
      setMapTilerAvailable(satellite.ok && terrain.ok)
    }).catch(() => {
      if (active) setMapTilerAvailable(false)
    }).finally(() => {
      window.clearTimeout(timeout)
    })
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [rawMapTilerKey])

  useEffect(() => {
    if (!rawMapTilerKey) setThreeDimensional(false)
    else if (mapTilerAvailable === false) setThreeDimensional(false)
  }, [rawMapTilerKey, mapTilerAvailable])

  useEffect(() => {
    if (!node.current || map.current || mapTilerAvailable === null) return
    let cancelled = false
    let fallingBack = false
    const providerFailures: number[] = []
    setMapReady(false)
    setMapStatus('loading')
    setMapMessage('')
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setMapStatus('error')
        setMapMessage('The landscape is taking longer to load. You can still browse the list.')
      }
    }, 20000)
    const mapStyle = makeLandscapeStyle(mapTilerKey)
    void import('maplibre-gl').then((library) => {
      if (cancelled || !node.current) return
      const instance = new library.Map({
        container: node.current,
        bounds: IRELAND_VIEW,
        fitBoundsOptions: { padding: { top: 80, bottom: 110, left: 24, right: 24 }, maxZoom: 6.5 },
        maxBounds: IRELAND_CAMERA,
        minZoom: 4.5, maxZoom: 16, maxPitch: 65,
        style: mapStyle,
        attributionControl: { compact: true },
        fadeDuration: 0,
        refreshExpiredTiles: false,
        renderWorldCopies: false,
      })
      instance.addControl(new library.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right')
      map.current = instance
      instance.on('error', (event) => {
        if (cancelled || event.error?.name === 'AbortError') return
        if (!mapTilerKey || fallingBack) return
        const sourceId = (event as typeof event & { sourceId?: string }).sourceId
        if (sourceId === 'places' || sourceId === 'great-britain-mask') return
        const now = Date.now()
        providerFailures.push(now)
        while (providerFailures[0] < now - 15000) providerFailures.shift()
        if (providerFailures.length < 4) return
        fallingBack = true
        setThreeDimensional(false)
        setMapTilerAvailable(false)
      })
      instance.once('load', () => {
        if (cancelled) return
        window.clearTimeout(timeout)
        setMapStatus('ready')
      })
      instance.once('style.load', () => {
        if (cancelled) return
        addPlaceLayers(instance, filteredRef.current)
        setMapReady(true)

        instance.on('click', 'place-clusters', async (event) => {
          const feature = event.features?.[0]
          const clusterId = Number(feature?.properties?.cluster_id)
          if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== 'Point') return
          const source = instance.getSource('places') as GeoJSONSource
          const clusterData = filteredRef.current
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId)
            if (cancelled || clusterData !== filteredRef.current) return
            instance.easeTo({ center: feature.geometry.coordinates as [number, number], zoom, duration: duration() })
          } catch {
            // Filtering or unmounting can invalidate a cluster while its worker resolves.
          }
        })
        instance.on('click', 'place-points', (event) => {
          const id = Number(event.features?.[0]?.properties?.id)
          const place = placesById.current.get(id)
          if (place) onSelectRef.current(place)
        })
        for (const layer of ['place-clusters', 'place-points']) {
          instance.on('mouseenter', layer, () => { instance.getCanvas().style.cursor = 'pointer' })
          instance.on('mouseleave', layer, () => { instance.getCanvas().style.cursor = '' })
        }
      })
    }).catch(() => {
      if (!cancelled) { setMapStatus('error'); setMapMessage('The map could not start. Use the list to explore places.') }
    })
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      map.current?.remove()
      map.current = null
    }
  }, [attempt, mapTilerAvailable, mapTilerKey])

  useEffect(() => {
    if (!map.current || !mapReady || !mapTilerKey) return
    const instance = map.current
    if (threeDimensional) {
      instance.setLayoutProperty('landscape-shading', 'visibility', 'none')
      instance.setTerrain({ source: 'terrain-3d', exaggeration: 1.2 })
    } else {
      instance.setTerrain(null)
      instance.setLayoutProperty('landscape-shading', 'visibility', 'visible')
    }
    instance.easeTo({ pitch: threeDimensional ? (instance.getZoom() >= 9 ? 58 : 28) : 0, duration: duration() })
  }, [threeDimensional, mapReady, mapTilerKey])

  useEffect(() => {
    if (!map.current || !mapReady) return
    const source = map.current.getSource('places') as GeoJSONSource | undefined
    source?.setData(placeFeatures(filtered))
  }, [filtered, mapReady])

  useEffect(() => {
    if (!map.current || !mapReady) return
    if (!userPosition) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      return
    }
    let cancelled = false
    void import('maplibre-gl').then((library) => {
      if (cancelled || !map.current) return
      if (!userMarkerRef.current) {
        const markerElement = document.createElement('div')
        markerElement.className = 'user-location-marker'
        const marker = new library.Marker({ element: markerElement, anchor: 'center' })
        marker.setLngLat(userPosition).addTo(map.current)
        userMarkerRef.current = marker
      } else {
        userMarkerRef.current.setLngLat(userPosition)
      }
    })
    return () => { cancelled = true }
  }, [userPosition, mapReady])

  useEffect(() => {
    if (!map.current || !mapReady) return
    map.current.setPaintProperty('place-points', 'circle-radius', [
      'interpolate', ['linear'], ['zoom'],
      4, ['case', ['==', ['get', 'id'], selected?.id ?? -1], 9, 5],
      8, ['case', ['==', ['get', 'id'], selected?.id ?? -1], 15, 10],
      12, ['case', ['==', ['get', 'id'], selected?.id ?? -1], 18, 14],
    ])
    map.current.setPaintProperty('place-points', 'circle-stroke-width', [
      'case', ['==', ['get', 'id'], selected?.id ?? -1], 5, 3,
    ])
  }, [selected, mapReady])

  useEffect(() => {
    if (focus && map.current && mapReady) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      map.current.flyTo({ center: focus, zoom: 12, pitch: threeDimensionalRef.current ? 58 : 0, duration: reduceMotion ? 0 : 1200 })
    }
  }, [focus, mapReady])

  const overview = () => {
    onSelectRef.current(null)
    map.current?.fitBounds(IRELAND_VIEW, { padding: { top: 80, bottom: 110, left: 24, right: 24 }, maxZoom: 6.5, pitch: threeDimensional ? 28 : 0, bearing: 0, duration: duration() })
  }

  return <>
    <div ref={node} className="map-canvas" aria-label="Map of places across Ireland" />
    <div className="landscape-controls" aria-label="Landscape controls">
      <button onClick={overview} disabled={!mapReady}><Compass size={16}/>Ireland</button>
      <button aria-pressed={threeDimensional} onClick={() => setThreeDimensional((value) => !value)} disabled={!mapReady || !mapTilerKey}><Mountain size={16}/>{threeDimensional ? '3D on' : '2D view'}</button>
      <label><span className="sr-only">Explore a landscape</span><select value="" disabled={!mapReady} onChange={(event) => {
        const region = landscapeRegions.find((item) => item.name === event.target.value)
        if (region) {
          onSelectRef.current(null)
          map.current?.flyTo({ center: region.center, zoom: region.zoom, bearing: region.bearing, pitch: threeDimensional ? 58 : 0, duration: duration() })
        }
      }}><option value="" disabled>Explore a region</option>{landscapeRegions.map((region) => <option key={region.name}>{region.name}</option>)}</select></label>
    </div>
    {mapTilerKey && <a className="map-provider" href="https://www.maptiler.com/" target="_blank" rel="noreferrer"><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler"/></a>}
    {mapTilerAvailable === false && <p className="landscape-fallback" role="status">Basic map · landscape imagery and 3D are unavailable right now.</p>}
    {mapStatus === 'loading' && <div className="map-loading" role="status"><span/>Loading the map…</div>}
    {mapStatus === 'error' && <div className="map-loading map-loading--error" role="status">{mapMessage}<button onClick={() => setAttempt((value) => value + 1)}>Retry map</button></div>}
  </>
}

function PhotoCarousel({ photos, place, onImageError }: { photos: LocationPhoto[]; place: Place; onImageError: (photo: LocationPhoto) => void }) {
  const rail = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)
    rail.current?.scrollTo({ left: 0 })
  }, [place.id])

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, photos.length - 1))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.current?.scrollTo({ left: next * (rail.current.clientWidth || 1), behavior: reduceMotion ? 'auto' : 'smooth' })
    setActive(next)
  }
  const activePhoto = photos[active]

  return <aside className="location-gallery" aria-label={`${place.name} photo gallery`}>
    {photos.length ? <>
      <div ref={rail} className="location-gallery__rail" onScroll={(event) => {
        const width = event.currentTarget.clientWidth || 1
        setActive(Math.round(event.currentTarget.scrollLeft / width))
      }}>
        {photos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`${place.name}, view ${index + 1} of ${photos.length}`} loading={index === active ? 'eager' : 'lazy'} decoding={index === active ? 'auto' : 'async'} onError={() => onImageError(photo)}/></figure>)}
      </div>
      <div className="location-gallery__shade"/>
      <div className="location-gallery__meta"><span>Wander Éire field notes</span><strong>{place.county}</strong></div>
      {activePhoto?.creator && <a className="location-gallery__credit" href={activePhoto.source_url || activePhoto.license_url || undefined} target="_blank" rel="noreferrer">Photo: {activePhoto.creator}{activePhoto.license_name ? ` · ${activePhoto.license_name}` : ''}</a>}
      {photos.length > 1 && <>
        <div className="location-gallery__arrows"><button onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous photo"><ChevronLeft/></button><button onClick={() => goTo(active + 1)} disabled={active === photos.length - 1} aria-label="Next photo"><ChevronRight/></button></div>
        <div className="location-gallery__dots" aria-label={`Photo ${active + 1} of ${photos.length}`}>{photos.map((photo, index) => <button key={photo.id} className={active === index ? 'active' : ''} onClick={() => goTo(index)} aria-label={`Show photo ${index + 1}`}/>)}</div>
      </>}
    </> : <div className="location-gallery__empty" style={{ '--accent': categories[place.category].color } as React.CSSProperties}><span className="sun"/><Mountain strokeWidth={1}/><p>Photography coming soon</p><small>{place.name} · {place.county}</small></div>}
  </aside>
}

export function PlaceRow({ place, onClick, onMap }: { place: Place; onClick: () => void; onMap?: () => void }) {
  const row = <button className="place-row" onClick={onClick}>
    <span className="place-row__icon" style={{ background: categories[place.category].color }}><CategoryIcon category={place.category} /></span>
    <span className="place-row__copy"><strong>{place.name}</strong><small>{place.county} · {place.cost} · {place.distance}</small></span>
    <ChevronRight size={18} aria-hidden="true" />
  </button>
  return onMap ? <div className="place-result">{row}<button className="place-result__map" onClick={onMap} aria-label={`Explore ${place.name} on the map`}><Mountain size={16}/>Explore landscape</button></div> : row
}

function PinPreview({ place, photoUrl, loading, onClose, onMore, onImageError }: { place: Place; photoUrl: string; loading: boolean; onClose: () => void; onMore: () => void; onImageError: () => void }) {
  const activity = { trail: 'Trail', historic: 'Historic place', viewpoint: 'Viewpoint', beach: 'Beach', camp: 'Camping' }[place.category]
  return <aside className="pin-preview" role="region" aria-label={`${place.name} preview`} style={{ '--accent': categories[place.category].color } as React.CSSProperties}>
    <button className="pin-preview__close" onClick={onClose} aria-label="Close place preview"><X size={16}/></button>
    <div className={`pin-preview__image ${loading ? 'loading' : ''}`}>
      {photoUrl ? <img src={photoUrl} alt={`Preview of ${place.name}`} loading="lazy" decoding="async" onError={onImageError}/> : !loading && <CategoryIcon category={place.category} size={38}/>}
    </div>
    <div className="pin-preview__identity">
      <h2>{place.name}</h2>
      <p>{place.county}</p>
    </div>
    <div className="pin-preview__glass">
      <span><CategoryIcon category={place.category} size={15}/>{activity}</span>
      <button onClick={onMore} aria-label={`View ${place.name} details`}>View place<ChevronRight size={16}/></button>
    </div>
  </aside>
}

export type Viewer = { id: string; email: string; name: string; role: 'user' | 'admin'; demo?: boolean }

const friendlyAuthError = (message: string) => {
  const detail = message.toLowerCase()
  if (detail.includes('invalid login credentials')) return 'That email and password do not match. Try again or reset your password.'
  if (detail.includes('email not confirmed')) return 'This older account needs a one-time account update before it can sign in.'
  if (detail.includes('user already registered')) return 'That account already exists. Choose sign in instead.'
  if (detail.includes('password')) return 'That password was not accepted. Use at least 8 characters for a new password.'
  if (detail.includes('rate') || detail.includes('too many')) return 'Too many tries for now. Wait a minute, then try again.'
  return 'That did not work. Check your details and try again.'
}

function AuthModal({ admin = false, onClose, onAuthenticated }: { admin?: boolean; onClose: () => void; onAuthenticated: (viewer: Viewer) => void }) {
  const dialog = useRef<HTMLElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !dialog.current) return
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [onClose])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    if (mode === 'signup' && !acceptedTerms) {
      setError('Please accept the Wander Éire account terms and privacy notice.')
      return
    }
    setBusy(true); setError(''); setMessage('')
    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
      setBusy(false)
      if (resetError) setError('That reset email could not be sent. Please try again in a moment.')
      else setMessage('Check your inbox. We sent you a link to choose a new password.')
      return
    }
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: email.split('@')[0] } } })
    setBusy(false)
    if (result.error) setError(friendlyAuthError(result.error.message))
    else if (result.data.user && result.data.session) onAuthenticated({ id: result.data.user.id, email: result.data.user.email ?? email, name: result.data.user.user_metadata.display_name ?? email.split('@')[0], role: 'user' })
    else if (result.data.user) setMessage('Check your email to confirm your account.')
  }

  const google = async () => {
    if (!supabase) return
    if (mode === 'signup' && !acceptedTerms) {
      setError('Please accept the Wander Éire account terms and privacy notice.')
      return
    }
    setError('')
    const { error: googleError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (googleError) setError(friendlyAuthError(googleError.message))
  }

  return <div className="modal-backdrop" role="presentation">
    <section ref={dialog} className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
      <span className="auth-mark"><Compass /></span>
      <p className="eyebrow">{admin ? 'Owner access' : 'Keep your own trail'}</p>
      <h2 id="auth-title">{mode === 'forgot' ? 'Find your way back.' : admin ? 'Sign in to manage the guide' : mode === 'signin' ? 'Welcome back, wanderer.' : 'Make the map yours.'}</h2>
      <p>{mode === 'forgot' ? 'Tell us your email and we’ll send you a safe password-reset link.' : admin ? 'Only approved administrators can publish and moderate places.' : 'Save wild places, tick off visits and share your own notes.'}</p>
      {isSupabaseConfigured ? <>
        {mode === 'signup' && <div className="signup-acceptance">
          <label><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)}/><span>I accept the Wander Éire account terms and privacy notice.</span></label>
          <details><summary>Read the small print</summary><p>We keep your email, display name, saved and visited places, and anything you choose to submit. Supabase securely processes and stores this data for Wander Éire; you are not creating a separate Supabase account. You can delete your account and its data from Profile settings.</p></details>
        </div>}
        {mode !== 'forgot' && <><button className="google-button" onClick={google}>Continue with Google</button><span className="or"><i/>or use email<i/></span></>}
        <form onSubmit={submit}>
          <label>Email<input autoFocus type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          {mode !== 'forgot' && <label>Password<input type="password" required minLength={mode === 'signup' ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /></label>}
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create free account' : 'Send reset link'}</button>
        </form>
        {mode === 'signin' && <button className="text-button" onClick={() => { setMode('forgot'); setError(''); setMessage('') }}>Forgot your password?</button>}
        {!admin && mode !== 'forgot' && <button className="text-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); setAcceptedTerms(false) }}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>}
        {mode === 'forgot' && <button className="text-button" onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Back to sign in</button>}
      </> : <div className="demo-gate"><p>Supabase isn’t connected yet. Continue in preview mode to try the complete experience.</p><button className="primary-button" onClick={() => onAuthenticated({ id: 'demo-user', email: 'explorer@wander-eire.ie', name: admin ? 'Wander Éire Admin' : 'Maeve', role: admin ? 'admin' : 'user', demo: true })}>{admin ? 'Open admin preview' : 'Continue as Maeve'}</button></div>}
      {mode !== 'signup' && <small>You’re signing in to Wander Éire. Your trail stays yours.</small>}
    </section>
  </div>
}

const ProfileView = lazy(() => import('./views'))
const AdminView = lazy(() => import('./views').then((module) => ({ default: module.AdminView })))
const ResetPasswordView = lazy(() => import('./views').then((module) => ({ default: module.ResetPasswordView })))

function ViewLoading() {
  return <main className="app"><div className="map-loading" role="status"><span/>Loading…</div></main>
}

function PlaceRoute({ places: allPlaces, loading, children }: { places: Place[]; loading: boolean; children: (place: Place) => React.ReactNode }) {
  const { id } = useParams()
  const numericId = Number(id)
  const place = Number.isInteger(numericId) ? allPlaces.find((item) => item.id === numericId) : undefined
  if (place) return children(place)
  if (loading) return <ViewLoading/>
  return <Navigate to="/" replace/>
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [locationItems, setLocationItems] = useState<Place[]>(places)
  const [locationsLoading, setLocationsLoading] = useState(Boolean(supabase))
  const [category, setCategory] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState('')
  const [previewPhotoLoading, setPreviewPhotoLoading] = useState(false)
  const previewPhotoCache = useRef<Record<number, { url: string; expiresAt: number }>>({})
  const [saved, setSaved] = useState<number[]>([])
  const [visited, setVisited] = useState<number[]>([])
  const [copyMessage, setCopyMessage] = useState('Tap to copy address')
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [showAuth, setShowAuth] = useState(window.location.pathname === '/admin')
  const [pendingAction, setPendingAction] = useState<'save' | 'visit' | null>(null)
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null)
  const [viewedIds, setViewedIds] = useState<number[]>(() => { try { return JSON.parse(sessionStorage.getItem('wander-eire-viewed') ?? '[]') as number[] } catch { return [] } })
  const [comment, setComment] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [commentMessage, setCommentMessage] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [officialPhotos, setOfficialPhotos] = useState<LocationPhoto[]>([])
  const [notice, setNotice] = useState('')
  const placeMatch = matchPath('/place/:id', location.pathname)
  const selectedRouteId = placeMatch ? Number(placeMatch.params.id) : null
  const selected = Number.isInteger(selectedRouteId) ? locationItems.find((place) => place.id === selectedRouteId) ?? null : null
  const closePlace = () => (location.state as { fromMap?: boolean } | null)?.fromMap ? navigate(-1) : navigate('/', { replace: true })
  const selectedId = useRef<number | null>(null)
  selectedId.current = selected?.id ?? null
  const filtered = useMemo(() => locationItems.filter((p) => (category === 'all' || p.category === category) && (`${p.name} ${p.county}`.toLowerCase().includes(query.toLowerCase()))), [category, query, locationItems])

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
  }, [])

  const copyAddress = async (address: string) => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(address)
      setCopyMessage('Copied to clipboard')
    } catch {
      setCopyMessage('Could not copy — long-press to select')
    }
    copyTimer.current = setTimeout(() => setCopyMessage('Tap to copy address'), 1600)
  }

  useEffect(() => {
    if (!navigator.geolocation) return
    let live = true
    const updatePosition = (position: GeolocationPosition) => {
      const next: [number, number] = [position.coords.longitude, position.coords.latitude]
      if (live) setUserPosition(next)
    }
    const handleError = () => {
      // Ignore permission and timeout errors here; the app still works without live travel tracking.
    }
    const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 })
    return () => {
      live = false
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const locateUser = () => {
    const showLocationError = (message: string) => {
      setNotice(message)
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
      noticeTimer.current = setTimeout(() => setNotice(''), 4000)
    }
    if (!navigator.geolocation) return showLocationError('Location services are unavailable in this browser.')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: [number, number] = [position.coords.longitude, position.coords.latitude]
        setUserPosition(next)
        setMapFocus(next)
      },
      (error) => showLocationError(error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Enable it in your browser settings to find yourself on the map.'
        : error.code === error.TIMEOUT
          ? 'Finding your location timed out. Please try again.'
          : 'Your location is currently unavailable. Please try again.'),
      { timeout: 8000, maximumAge: 60000 },
    )
  }
  const loadViewer = async (session: Session | null) => {
    if (!session?.user || !supabase) {
      setViewer(null); setSaved([]); setVisited([])
      return
    }
    const { data: profile } = await supabase.from('profiles').select('display_name, role').eq('id', session.user.id).maybeSingle()
    const next: Viewer = { id: session.user.id, email: session.user.email ?? '', name: profile?.display_name ?? session.user.user_metadata.display_name ?? session.user.email?.split('@')[0] ?? 'Wanderer', role: profile?.role === 'admin' ? 'admin' : 'user' }
    setViewer(next); setShowAuth(false)
    const [{ data: ticks }, { data: saves }] = await Promise.all([supabase.from('user_ticks').select('location_id').eq('user_id', next.id), supabase.from('user_saves').select('location_id').eq('user_id', next.id)])
    if (ticks) setVisited(ticks.map((x) => x.location_id)); if (saves) setSaved(saves.map((x) => x.location_id))
  }

  useEffect(() => {
    if (!supabase) return
    void supabase.from('locations').select('*').is('archived_at', null).order('name').then(({ data, error }) => {
      if (error) {
        setLocationItems(places)
        setNotice('Live location data could not be loaded. Showing the offline guide for now.')
        setLocationsLoading(false)
        return
      }
      setLocationItems((data ?? []).map((row) => fromDatabase(row)).filter(hasValidCoordinates))
      setLocationsLoading(false)
    })
    supabase.auth.getSession().then(({ data }) => loadViewer(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true })
      }
      void loadViewer(session)
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    let active = true
    setPreviewPhotoUrl('')
    if (!previewPlace || !supabase) { setPreviewPhotoLoading(false); return }
    const cached = previewPhotoCache.current[previewPlace.id]
    if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) { setPreviewPhotoUrl(cached.url); setPreviewPhotoLoading(false); return }
    const client = supabase
    setPreviewPhotoLoading(true)
    void (async () => {
      try {
        const { data } = await client.from('location_photos').select('*').eq('location_id', previewPlace.id).eq('position', 1).maybeSingle()
        if (!data?.object_path) return
        const photo = await resolveOfficialPhoto(data as LocationPhoto)
        if (photo.url) {
          previewPhotoCache.current[previewPlace.id] = { url: photo.url, expiresAt: photo.expiresAt ?? signedUrlExpiresAt() }
          if (active) setPreviewPhotoUrl(photo.url)
        }
      } finally {
        if (active) setPreviewPhotoLoading(false)
      }
    })()
    return () => { active = false }
  }, [previewPlace])

  useEffect(() => {
    if (!selected || !supabase) { setComments([]); setOfficialPhotos([]); return }
    const client = supabase
    const selectedPlaceId = selected.id
    let active = true
    const isCurrent = () => active && selectedId.current === selectedPlaceId
    setComments([]); setOfficialPhotos([]); setCommentMessage('')
    void Promise.all([
      client.from('comments').select('*').eq('location_id', selectedPlaceId).order('created_at'),
      client.from('location_photos').select('*').eq('location_id', selectedPlaceId).order('position'),
    ]).then(async ([commentsResult, officialResult]) => {
      if (commentsResult.data && isCurrent()) setComments(commentsResult.data as Comment[])
      if (officialResult.data) {
        const photoRows = officialResult.data as LocationPhoto[]
        const withUrls = await Promise.all(photoRows.map(resolveOfficialPhoto))
        if (isCurrent()) setOfficialPhotos(withUrls.filter((photo) => photo.url))
      }
    })
    return () => { active = false }
  }, [selected, viewer])

  const refreshPreviewPhoto = async () => {
    if (!previewPlace || !supabase) return
    const { data: photo } = await supabase.from('location_photos').select('*').eq('location_id', previewPlace.id).eq('position', 1).maybeSingle()
    if (!photo?.object_path) return
    const resolved = await resolveOfficialPhoto(photo as LocationPhoto)
    if (resolved.url) {
      previewPhotoCache.current[previewPlace.id] = { url: resolved.url, expiresAt: resolved.expiresAt ?? signedUrlExpiresAt() }
      setPreviewPhotoUrl(resolved.url)
    }
  }

  const refreshPhoto = async (photo: LocationPhoto) => {
    const resolved = await resolveOfficialPhoto(photo)
    if (!resolved.url) return
    setOfficialPhotos((all) => all.map((item) => item.id === photo.id ? resolved : item))
  }

  const toggleRecord = async (kind: 'save' | 'visit', id: number) => {
    if (!viewer) { setPendingAction(kind); setShowAuth(true); return }
    const current = kind === 'save' ? saved : visited
    const setter = kind === 'save' ? setSaved : setVisited
    const active = current.includes(id)
    setter((items) => active ? items.filter((x) => x !== id) : [...items, id])
    if (supabase && !viewer.demo) {
      const table = kind === 'save' ? 'user_saves' : 'user_ticks'
      const { error } = active
        ? await supabase.from(table).delete().eq('user_id', viewer.id).eq('location_id', id)
        : await supabase.from(table).insert({ user_id: viewer.id, location_id: id })
      if (error) {
        setter((items) => active ? (items.includes(id) ? items : [...items, id]) : items.filter((x) => x !== id))
        setNotice(`That ${kind === 'save' ? 'save' : 'visit'} could not be updated. Please try again.`)
      }
    }
  }

  const authenticated = (next: Viewer) => {
    setViewer(next); setShowAuth(false)
    if (pendingPlace) { navigate(`/place/${pendingPlace.id}`, { state: { fromMap: true } }); setPendingPlace(null) }
    if (pendingAction && selected) {
      if (pendingAction === 'save') setSaved((items) => items.includes(selected.id) ? items : [...items, selected.id])
      else setVisited((items) => items.includes(selected.id) ? items : [...items, selected.id])
      if (supabase && !next.demo) {
        const table = pendingAction === 'save' ? 'user_saves' : 'user_ticks'
        void supabase.from(table).upsert({ user_id: next.id, location_id: selected.id })
      }
    }
    setPendingAction(null)
  }

  const explorePlace = (place: Place) => {
    setQuery('')
    setView('map')
    setPreviewPlace(place)
    setMapFocus([...place.coordinates])
    navigate('/')
  }

  const openPlace = (place: Place) => {
    setPreviewPlace(null)
    if (!viewer && !viewedIds.includes(place.id) && viewedIds.length >= 3) {
      setPendingPlace(place); setShowAuth(true); return
    }
    if (!viewedIds.includes(place.id)) {
      const next = [...viewedIds, place.id]
      setViewedIds(next); sessionStorage.setItem('wander-eire-viewed', JSON.stringify(next))
    }
    navigate(`/place/${place.id}`, { state: { fromMap: true } })
  }

  const signOut = async () => {
    setViewer(null); setSaved([]); setVisited([]); navigate('/')
    if (supabase && !viewer?.demo) await supabase.auth.signOut()
  }

  const detailView = selected ? (() => {
    const cat = categories[selected.category]
    return <main className="app detail" aria-hidden={showAuth ? 'true' : undefined} style={{ '--accent': cat.color } as React.CSSProperties}>
      {notice && <p className="app-notice" role="status">{notice}</p>}
      <button className="round-button detail-back" onClick={closePlace} aria-label="Back to map"><ArrowLeft /></button>
      <section className="detail__content">
        <div className="detail__category"><CategoryIcon category={selected.category} size={18}/><span>{cat.label}</span><i/>{selected.county}, Ireland</div>
        <header className="detail__heading">
          <p className="eyebrow">Curated place · Wander Éire</p>
          <h1>{selected.name}</h1>
          <p className="detail__kicker">{selected.kicker}</p>
        </header>
        <div className="detail__actions">
          <button className={visited.includes(selected.id) ? 'active green' : ''} onClick={() => toggleRecord('visit', selected.id)}><Check size={19}/>{visited.includes(selected.id) ? 'Visited' : 'Mark visited'}</button>
          <button className={saved.includes(selected.id) ? 'active amber' : ''} onClick={() => toggleRecord('save', selected.id)}><Bookmark size={18} fill={saved.includes(selected.id) ? 'currentColor' : 'none'}/>{saved.includes(selected.id) ? 'Saved' : 'Save for later'}</button>
          <button onClick={() => explorePlace(selected)}><Mountain size={18}/>Explore landscape</button>
        </div>
        <div className="detail__essentials"><div><small>Cost</small><strong>{selected.cost}</strong></div><div><small>Time & distance</small><strong>{selected.distance || 'Take your time'}</strong></div></div>
        <div className="fact-strip">{selected.facts.map((fact) => <span key={fact}>{fact}</span>)}</div>
        <div className="detail__body">
          <section className="detail-section"><p className="eyebrow">The experience</p><h2>Worth the wander</h2><p>{selected.description}</p></section>
          <section className="detail-section"><p className="eyebrow">Arrival</p><h2>Find your way</h2>
            <button className="address" onClick={() => void copyAddress(selected.address)}><Navigation size={20}/><span><strong>{selected.address}</strong><small>{copyMessage}</small></span></button>
            <div className="parking-note"><span>Parking</span><p>{selected.parking}</p></div>
          </section>
          <section className="community">
            <p className="eyebrow">Local knowledge</p><h2>Notes from the trail</h2><p className="community__intro">Useful details shared by people who’ve been there.</p>
            {comments.map((item) => { const own = viewer?.id === item.user_id; return <article key={item.id}><span>{own ? viewer.name.slice(0, 1).toUpperCase() : 'W'}</span><div><strong>{own ? 'You' : 'A fellow wanderer'}</strong>{item.status === 'pending' && <small>Pending review</small>}<p>{item.body}</p></div></article> })}
            {viewer ? <form className="comment-form" onSubmit={async (event) => {
              event.preventDefault(); if (!comment.trim()) return
              const body = comment.trim(); setCommentBusy(true); setCommentMessage('')
              if (supabase && !viewer.demo) {
                const { data, error } = await supabase.from('comments').insert({ user_id: viewer.id, location_id: selected.id, body }).select().single()
                if (error) setCommentMessage('That note did not send. Please try again.')
                else if (data) { setComments((all) => [...all, data as Comment]); setComment(''); setCommentMessage('Submitted — it will appear publicly after review.') }
              } else { setComments((all) => [...all, { id: Date.now(), user_id: viewer.id, location_id: selected.id, body, status: 'pending', created_at: new Date().toISOString() }]); setComment(''); setCommentMessage('Submitted — it will appear publicly after review.') }
              setCommentBusy(false)
            }}><label htmlFor="trail-note">Share something helpful</label><textarea id="trail-note" required value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder="Path conditions, quiet times, a useful tip…"/><button className="primary-button" disabled={commentBusy}>{commentBusy ? 'Sending…' : 'Submit for review'}</button>{commentMessage && <p className="photo-message" role="status">{commentMessage}</p>}</form> : <button className="contribute-gate" onClick={() => setShowAuth(true)}><MessageCircle/><span><strong>Been here recently?</strong><small>Sign in to share a useful note.</small></span><ChevronRight/></button>}
          </section>
        </div>
      </section>
      <PhotoCarousel photos={officialPhotos} place={selected} onImageError={(photo) => void refreshPhoto(photo)}/>
    </main>
  })() : <ViewLoading/>

  const mapView = <main className="app landscape-app" aria-hidden={showAuth ? 'true' : undefined}>
    {notice && <p className="app-notice" role="status">{notice}</p>}
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Wander Éire home"><span className="brand-mark"><Compass /></span><span>Wander <em>Éire</em></span></a>
      <div className="topbar__actions"><button className="round-button" onClick={locateUser} aria-label="Find my location"><LocateFixed /></button><button className="round-button ink" onClick={() => viewer ? navigate('/profile') : setShowAuth(true)} aria-label={viewer ? 'Open profile' : 'Sign in'}>{viewer ? <span className="avatar-mini">{viewer.name.slice(0, 1).toUpperCase()}</span> : <UserRound />}</button></div>
    </header>

    <section className="map-shell" id="top">
      <div className="map-ui">
        <div className="intro"><p className="eyebrow">An island. A thousand ways to feel it.</p><h1>Follow your<br/><em>sense of wonder.</em></h1></div>
        <label className="search"><Search size={20} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPreviewPlace(null) }} placeholder="Search places or counties" aria-label="Search places or counties" />{query ? <button onClick={() => setQuery('')} aria-label="Clear search"><X size={17}/></button> : <SlidersHorizontal size={18} />}</label>
        <nav className="filters" aria-label="Filter by category">
          <button className={category === 'all' ? 'active all' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All places</button>
          {(Object.keys(categories) as Category[]).map((key) => <button key={key} className={category === key ? 'active' : ''} aria-pressed={category === key} style={{ '--chip': categories[key].color } as React.CSSProperties} onClick={() => setCategory(key)}><CategoryIcon category={key} size={15}/>{categories[key].label}</button>)}
        </nav>
      </div>

      <div className="map-area">
        <MapCanvas places={locationItems} filtered={filtered} selected={previewPlace} focus={mapFocus} userPosition={userPosition} onSelect={setPreviewPlace} />
        {previewPlace && view === 'map' && !query && <PinPreview place={previewPlace} photoUrl={previewPhotoUrl} loading={previewPhotoLoading} onClose={() => setPreviewPlace(null)} onMore={() => openPlace(previewPlace)} onImageError={() => void refreshPreviewPhoto()}/>}
        {query && <div className="search-results"><div className="drawer-handle"/><p className="eyebrow">{filtered.length} {filtered.length === 1 ? 'place' : 'places'} found</p>{filtered.length ? filtered.map((p) => <PlaceRow key={p.id} place={p} onClick={() => openPlace(p)} onMap={() => explorePlace(p)} />) : <div className="empty"><Search/><h2>No trail here yet</h2><p>Try another place or widen your search.</p></div>}</div>}
        {view === 'list' && !query && <div className="list-drawer"><div className="drawer-handle"/><div className="drawer-title"><div><p className="eyebrow">Across the island</p><h2>{category === 'all' ? 'All places' : categories[category].label}</h2></div><span>{filtered.length}</span></div>{filtered.map((p) => <PlaceRow key={p.id} place={p} onClick={() => openPlace(p)} onMap={() => explorePlace(p)} />)}</div>}
        <button className="view-toggle" aria-pressed={view === 'list'} onClick={() => { setPreviewPlace(null); setView(view === 'map' ? 'list' : 'map') }}>{view === 'map' ? <><List size={18}/>List</> : <><MapIcon size={18}/>Map</>}</button>
        {!query && view === 'map' && !previewPlace && <div className="map-caption"><span>32 counties.</span> One island to explore.<small>{filtered.length} places in this guide</small></div>}
      </div>
    </section>
    <footer><span>Made for the long way round.</span><small>Wander Éire · Independent & free</small></footer>
  </main>

  const adminDenied = <main className="access-denied"><LockKeyhole/><p className="eyebrow">Owner access only</p><h1>This gate needs an admin key.</h1><p>You’re signed in, but this account is not an administrator.</p><div><button className="primary-button" onClick={() => navigate('/')}>Back to the map</button><button className="text-button" onClick={signOut}>Sign out</button></div></main>
  const adminView = viewer?.role === 'admin'
    ? <Suspense fallback={<ViewLoading/>}><AdminView viewer={viewer} places={locationItems} onPlacesChange={setLocationItems} onBack={() => navigate('/')} /></Suspense>
    : viewer ? adminDenied : mapView
  const profileView = viewer
    ? <Suspense fallback={<ViewLoading/>}><ProfileView viewer={viewer} places={locationItems} saved={saved} visited={visited} onOpen={(place) => navigate(`/place/${place.id}`)} onBack={() => navigate('/')} onAdmin={() => navigate('/admin')} onSignOut={signOut} onViewerChange={setViewer} /></Suspense>
    : mapView

  return <>
    <Routes>
      <Route path="/" element={mapView}/>
      <Route path="/place/:id" element={<PlaceRoute places={locationItems} loading={locationsLoading}>{() => detailView}</PlaceRoute>}/>
      <Route path="/profile" element={profileView}/>
      <Route path="/admin" element={adminView}/>
      <Route path="/reset-password" element={<Suspense fallback={<ViewLoading/>}><ResetPasswordView onDone={() => navigate(viewer ? '/profile' : '/', { replace: true })} /></Suspense>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    {showAuth && <AuthModal admin={location.pathname === '/admin'} onClose={() => { setShowAuth(false); setPendingPlace(null); if (location.pathname === '/admin') navigate('/') }} onAuthenticated={authenticated} />}
  </>
}

export default App
