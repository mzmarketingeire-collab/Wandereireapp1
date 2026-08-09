import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Map as MapLibreMap, Marker as MapLibreMarker, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  ArrowLeft, Binoculars, Bookmark, Camera, Check, ChevronLeft, ChevronRight, Compass, Footprints,
  Landmark, List, LocateFixed, Map as MapIcon, MessageCircle, Mountain,
  LockKeyhole, Navigation, Search, SlidersHorizontal, TentTree,
  UserRound, Waves, X,
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

export type Category = 'trail' | 'historic' | 'viewpoint' | 'beach' | 'camp'
export type Place = {
  id: number; name: string; county: string; category: Category; coordinates: [number, number]
  cost: string; distance: string; kicker: string; description: string; address: string
  parking: string; facts: string[]; archived?: boolean
}

export type Comment = { id: number; user_id: string; location_id: number; body: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; author?: string }
export type UserPhoto = { id: number; user_id: string; location_id: number; object_path: string; caption: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string; url?: string; expiresAt?: number }
export type LocationPhoto = { id: number; location_id: number; object_path: string; position: number; created_at: string; url?: string; expiresAt?: number }

const SIGNED_URL_TTL_SECONDS = 3600
const signedUrlExpiresAt = () => Date.now() + SIGNED_URL_TTL_SECONDS * 1000

export const categories = {
  trail: { label: 'Trails', color: '#1f7a4d', icon: Footprints },
  historic: { label: 'Historic', color: '#e2603d', icon: Landmark },
  viewpoint: { label: 'Viewpoints', color: '#d4880e', icon: Binoculars },
  beach: { label: 'Beaches', color: '#1c7293', icon: Waves },
  camp: { label: 'Camping', color: '#6b4a85', icon: TentTree },
} satisfies Record<Category, { label: string; color: string; icon: typeof Footprints }>

const greatBritainMask = {
  type: 'Feature' as const,
  properties: { name: 'Great Britain' },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[[-3.093831, 53.404547], [-3.09208, 53.404441], [-2.945009, 53.985], [-3.614701, 54.600937], [-3.630005, 54.615013], [-4.844169, 54.790971], [-5.082527, 55.061601], [-4.719112, 55.508473], [-5.047981, 55.783986], [-5.586398, 55.311146], [-5.644999, 56.275015], [-6.149981, 56.78501], [-5.786825, 57.818848], [-5.009999, 58.630013], [-4.211495, 58.550845], [-3.005005, 58.635], [-4.073828, 57.553025], [-3.055002, 57.690019], [-1.959281, 57.6848], [-2.219988, 56.870017], [-3.119003, 55.973793], [-2.085009, 55.909998], [-2.005676, 55.804903], [-1.114991, 54.624986], [-0.430485, 54.464376], [0.184981, 53.325014], [0.469977, 52.929999], [1.681531, 52.73952], [1.559988, 52.099998], [1.050562, 51.806761], [1.449865, 51.289428], [0.550334, 50.765739], [-0.787517, 50.774989], [-2.489998, 50.500019], [-2.956274, 50.69688], [-3.617448, 50.228356], [-4.542508, 50.341837], [-5.245023, 49.96], [-5.776567, 50.159678], [-4.30999, 51.210001], [-3.414851, 51.426009], [-3.422719, 51.426848], [-4.984367, 51.593466], [-5.267296, 51.9914], [-4.222347, 52.301356], [-4.770013, 52.840005], [-4.579999, 53.495004], [-3.093831, 53.404547]]],
  },
}

const makeFastMapStyle = (mapTilerKey?: string): StyleSpecification => {
  const usingMapTiler = Boolean(mapTilerKey)
  const encodedKey = usingMapTiler ? encodeURIComponent(mapTilerKey!) : ''
  const tiles = usingMapTiler
    ? [`https://api.maptiler.com/maps/outdoor-v4/256/{z}/{x}/{y}@2x.webp?key=${encodedKey}`]
    : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png']
  const outdoorsLayers: StyleSpecification['layers'] = usingMapTiler ? [
    {
      id: 'contours-soft',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      minzoom: 9,
      filter: ['all', ['!', ['in', ['get', 'nth_line'], ['literal', [5, 10]]]], ['!', ['has', 'glacier']]],
      paint: {
        'line-color': '#9b8f69',
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.2, 13, 0.34, 16, 0.42],
        'line-width': 0.7,
      },
    },
    {
      id: 'contours-index',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      minzoom: 9,
      filter: ['all', ['in', ['get', 'nth_line'], ['literal', [5, 10]]], ['!', ['has', 'glacier']]],
      paint: {
        'line-color': '#756b4d',
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.32, 14, 0.5],
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.8, 14, 1.2],
      },
    },
    {
      id: 'hiking-route-casing',
      type: 'line',
      source: 'outdoor-routes',
      'source-layer': 'trail',
      minzoom: 9,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['foot', 'hiking'], true, false]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': 'rgba(255, 253, 246, 0.96)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2.4, 13, 4.4, 17, 6.5],
      },
    },
    {
      id: 'hiking-routes',
      type: 'line',
      source: 'outdoor-routes',
      'source-layer': 'trail',
      minzoom: 9,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['foot', 'hiking'], true, false]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['match', ['get', 'color'], 'blue', '#367eb5', 'green', '#4d8a62', 'yellow', '#c79a2f', 'black', '#5a544b', '#c6533f'],
        'line-opacity': 0.92,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.15, 13, 2.1, 17, 3.2],
      },
    },
    {
      id: 'cycling-routes',
      type: 'line',
      source: 'outdoor-routes',
      'source-layer': 'trail',
      minzoom: 9,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'bicycle']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#276ea2',
        'line-opacity': 0.92,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.25, 14, 2.25, 17, 3],
        'line-dasharray': [2, 1.4],
      },
    },
    {
      id: 'trail-labels',
      type: 'symbol',
      source: 'outdoor-routes',
      'source-layer': 'trail',
      minzoom: 12,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['foot', 'hiking', 'bicycle'], true, false]],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 360,
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name'], ['get', 'ref']],
        'text-font': ['Open Sans Semi Bold', 'Noto Sans Semi Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 12],
        'text-letter-spacing': 0.02,
      },
      paint: {
        'text-color': ['match', ['get', 'class'], 'bicycle', '#1f5f8c', '#8d3b2d'],
        'text-halo-color': 'rgba(255, 253, 246, 0.96)',
        'text-halo-width': 1.8,
      },
    },
  ] : []

  return {
    version: 8,
    ...(usingMapTiler ? { glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${encodedKey}` } : {}),
    sources: {
      'base-map': {
        type: 'raster',
        tiles,
        tileSize: 256,
        minzoom: 0,
        maxzoom: 18,
        attribution: usingMapTiler
          ? '<a href="https://www.maptiler.com/copyright/">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>'
          : '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>',
      },
      ...(usingMapTiler ? {
        contours: { type: 'vector' as const, url: `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${encodedKey}` },
        'outdoor-routes': { type: 'vector' as const, url: `https://api.maptiler.com/tiles/outdoor/tiles.json?key=${encodedKey}` },
      } : {}),
      'great-britain-mask': { type: 'geojson', data: greatBritainMask },
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#6fb9df' } },
      {
        id: 'outdoor-map',
        type: 'raster',
        source: 'base-map',
        paint: {
          'raster-opacity': 1,
          'raster-saturation': -0.02,
          'raster-contrast': 0.1,
          'raster-brightness-min': 0.04,
          'raster-brightness-max': 1,
          'raster-resampling': 'linear',
          'raster-fade-duration': 180,
        },
      },
      ...outdoorsLayers,
      {
        id: 'great-britain-muted',
        type: 'fill',
        source: 'great-britain-mask',
        paint: { 'fill-color': '#aeb1ad', 'fill-opacity': 1 },
      },
      {
        id: 'great-britain-edge',
        type: 'line',
        source: 'great-britain-mask',
        paint: { 'line-color': '#898e88', 'line-width': 1.2 },
      },
    ],
  }
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

function MapCanvas({ places: allPlaces, filtered, selected, focus, onSelect }: {
  places: Place[]
  filtered: Place[]
  selected: Place | null
  focus: [number, number] | null
  onSelect: (p: Place) => void
}) {
  const node = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const mapLibrary = useRef<typeof import('maplibre-gl') | null>(null)
  const markers = useRef<Map<number, { marker: MapLibreMarker; el: HTMLButtonElement }>>(new Map())
  const [mapReady, setMapReady] = useState(false)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!node.current || map.current) return
    let cancelled = false
    const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY as string | undefined
    const mapStyle = makeFastMapStyle(mapTilerKey)
    void import('maplibre-gl').then((library) => {
      if (cancelled || !node.current) return
      const instance = new library.Map({
        container: node.current,
        bounds: [[-12.1, 50.2], [-3.9, 56.4]],
        fitBoundsOptions: { padding: 24, maxZoom: 5.9 },
        maxBounds: [[-13.2, 49.5], [-2.2, 57.25]],
        minZoom: 4.75, maxZoom: 16,
        style: mapStyle,
        attributionControl: { compact: true },
        fadeDuration: 0,
        renderWorldCopies: false,
      })
      instance.addControl(new library.NavigationControl({ showCompass: false }), 'bottom-right')
      mapLibrary.current = library
      map.current = instance
      setMapReady(true)
      instance.once('style.load', () => {
        if (!cancelled) setMapStatus('ready')
      })
    }).catch(() => {
      if (!cancelled) setMapStatus('error')
    })
    return () => {
      cancelled = true
      markers.current.forEach(({ marker }) => marker.remove())
      markers.current.clear()
      map.current?.remove()
      map.current = null
      mapLibrary.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !mapLibrary.current || !mapReady) return
    const MarkerClass = mapLibrary.current.Marker
    const placeIds = new Set(allPlaces.map((place) => place.id))

    markers.current.forEach(({ marker }, id) => {
      if (!placeIds.has(id)) {
        marker.remove()
        markers.current.delete(id)
      }
    })

    allPlaces.forEach((place) => {
      if (markers.current.has(place.id)) return
      const el = document.createElement('button')
      el.className = 'map-pin'
      el.style.setProperty('--pin-color', categories[place.category].color)
      el.setAttribute('aria-label', `Open ${place.name}`)
      el.innerHTML = `<span>${place.category === 'trail' ? '↟' : place.category === 'historic' ? '⌂' : place.category === 'viewpoint' ? '◉' : place.category === 'beach' ? '≈' : '⌁'}</span>`
      el.onclick = () => onSelect(place)
      const marker = new MarkerClass({ element: el }).setLngLat(place.coordinates).addTo(map.current!)
      markers.current.set(place.id, { marker, el })
    })
  }, [allPlaces, mapReady, onSelect])

  const filteredIds = useMemo(() => new Set(filtered.map((place) => place.id)), [filtered])

  useEffect(() => {
    markers.current.forEach(({ el }, id) => {
      el.classList.toggle('map-pin--dim', !filteredIds.has(id))
      el.classList.toggle('map-pin--active', selected?.id === id)
    })
  }, [filteredIds, selected])

  useEffect(() => {
    if (focus && map.current && mapReady) map.current.flyTo({ center: focus, zoom: 10, duration: 1200 })
  }, [focus, mapReady])

  return <>
    <div ref={node} className="map-canvas" aria-label="Map of places across Ireland" />
    {mapStatus === 'loading' && <div className="map-loading" role="status"><span/>Loading the map…</div>}
    {mapStatus === 'error' && <div className="map-loading map-loading--error" role="status">The map background is resting. The place pins still work.</div>}
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
    rail.current?.scrollTo({ left: next * (rail.current.clientWidth || 1), behavior: 'smooth' })
    setActive(next)
  }

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
      {photos.length > 1 && <>
        <div className="location-gallery__arrows"><button onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous photo"><ChevronLeft/></button><button onClick={() => goTo(active + 1)} disabled={active === photos.length - 1} aria-label="Next photo"><ChevronRight/></button></div>
        <div className="location-gallery__dots" aria-label={`Photo ${active + 1} of ${photos.length}`}>{photos.map((photo, index) => <button key={photo.id} className={active === index ? 'active' : ''} onClick={() => goTo(index)} aria-label={`Show photo ${index + 1}`}/>)}</div>
      </>}
    </> : <div className="location-gallery__empty" style={{ '--accent': categories[place.category].color } as React.CSSProperties}><span className="sun"/><Mountain strokeWidth={1}/><p>Photography coming soon</p><small>{place.name} · {place.county}</small></div>}
  </aside>
}

export function PlaceRow({ place, onClick }: { place: Place; onClick: () => void }) {
  return <button className="place-row" onClick={onClick}>
    <span className="place-row__icon" style={{ background: categories[place.category].color }}><CategoryIcon category={place.category} /></span>
    <span className="place-row__copy"><strong>{place.name}</strong><small>{place.county} · {place.cost} · {place.distance}</small></span>
    <ChevronRight size={18} aria-hidden="true" />
  </button>
}

function PinPreview({ place, photoUrl, loading, onClose, onMore, onImageError }: { place: Place; photoUrl: string; loading: boolean; onClose: () => void; onMore: () => void; onImageError: () => void }) {
  const activity = { trail: 'Trail', historic: 'Historic place', viewpoint: 'Viewpoint', beach: 'Beach', camp: 'Camping' }[place.category]
  return <aside className="pin-preview" role="dialog" aria-label={`${place.name} preview`} style={{ '--accent': categories[place.category].color } as React.CSSProperties}>
    <button className="pin-preview__close" onClick={onClose} aria-label="Close place preview"><X size={16}/></button>
    <div className={`pin-preview__image ${loading ? 'loading' : ''}`}>
      {photoUrl ? <img src={photoUrl} alt={`Preview of ${place.name}`} loading="lazy" decoding="async" onError={onImageError}/> : !loading && <CategoryIcon category={place.category} size={38}/>}
    </div>
    <div className="pin-preview__glass">
      <span><CategoryIcon category={place.category} size={15}/>{activity}</span>
      <button onClick={onMore}>Click for more<ChevronRight size={16}/></button>
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
    return () => document.removeEventListener('keydown', handleKeyDown)
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

function App() {
  const [locationItems, setLocationItems] = useState<Place[]>(places)
  const [category, setCategory] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null)
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState('')
  const [previewPhotoLoading, setPreviewPhotoLoading] = useState(false)
  const previewPhotoCache = useRef<Record<number, { url: string; expiresAt: number }>>({})
  const [selected, setSelected] = useState<Place | null>(null)
  const [saved, setSaved] = useState<number[]>([])
  const [visited, setVisited] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [screen, setScreen] = useState<'map' | 'profile' | 'admin' | 'reset-password'>(() => window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/reset-password' ? 'reset-password' : 'map')
  const [showAuth, setShowAuth] = useState(window.location.pathname === '/admin')
  const [pendingAction, setPendingAction] = useState<'save' | 'visit' | null>(null)
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null)
  const [viewedIds, setViewedIds] = useState<number[]>(() => { try { return JSON.parse(sessionStorage.getItem('wander-eire-viewed') ?? '[]') as number[] } catch { return [] } })
  const [comment, setComment] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [commentMessage, setCommentMessage] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [photos, setPhotos] = useState<UserPhoto[]>([])
  const [officialPhotos, setOfficialPhotos] = useState<LocationPhoto[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const [notice, setNotice] = useState('')
  const selectedId = useRef<number | null>(null)
  selectedId.current = selected?.id ?? null
  const filtered = useMemo(() => locationItems.filter((p) => (category === 'all' || p.category === category) && (`${p.name} ${p.county}`.toLowerCase().includes(query.toLowerCase()))), [category, query, locationItems])
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
        return
      }
      setLocationItems((data ?? []).map((row) => fromDatabase(row)).filter(hasValidCoordinates))
    })
    supabase.auth.getSession().then(({ data }) => loadViewer(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.history.replaceState({}, '', '/reset-password')
        setScreen('reset-password')
      }
      void loadViewer(session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

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
        const { data } = await client.from('location_photos').select('object_path').eq('location_id', previewPlace.id).eq('position', 1).maybeSingle()
        if (!data?.object_path) return
        const signed = await client.storage.from('location-photos').createSignedUrl(data.object_path, SIGNED_URL_TTL_SECONDS)
        if (signed.data?.signedUrl) {
          previewPhotoCache.current[previewPlace.id] = { url: signed.data.signedUrl, expiresAt: signedUrlExpiresAt() }
          if (active) setPreviewPhotoUrl(signed.data.signedUrl)
        }
      } finally {
        if (active) setPreviewPhotoLoading(false)
      }
    })()
    return () => { active = false }
  }, [previewPlace])

  useEffect(() => {
    if (!selected || !supabase) { setComments([]); setPhotos([]); setOfficialPhotos([]); return }
    const client = supabase
    const selectedPlaceId = selected.id
    let active = true
    const isCurrent = () => active && selectedId.current === selectedPlaceId
    setComments([]); setPhotos([]); setOfficialPhotos([])
    setPhotoFile(null); setPhotoCaption(''); setPhotoMessage(''); setCommentMessage('')
    void Promise.all([
      client.from('comments').select('*').eq('location_id', selectedPlaceId).order('created_at'),
      client.from('user_photos').select('*').eq('location_id', selectedPlaceId).order('created_at'),
      client.from('location_photos').select('*').eq('location_id', selectedPlaceId).order('position'),
    ]).then(async ([commentsResult, photosResult, officialResult]) => {
      if (commentsResult.data && isCurrent()) setComments(commentsResult.data as Comment[])
      if (photosResult.data) {
        const photoRows = photosResult.data as UserPhoto[]
        const { data } = await client.storage.from('location-photos').createSignedUrls(photoRows.map((photo) => photo.object_path), SIGNED_URL_TTL_SECONDS)
        const expiresAt = signedUrlExpiresAt()
        const urls = new Map(data?.map((item) => [item.path, item.signedUrl ?? undefined]))
        const withUrls = photoRows.map((photo) => ({ ...photo, url: urls.get(photo.object_path), expiresAt }))
        if (isCurrent()) setPhotos(withUrls)
      }
      if (officialResult.data) {
        const photoRows = officialResult.data as LocationPhoto[]
        const { data } = await client.storage.from('location-photos').createSignedUrls(photoRows.map((photo) => photo.object_path), SIGNED_URL_TTL_SECONDS)
        const expiresAt = signedUrlExpiresAt()
        const urls = new Map(data?.map((item) => [item.path, item.signedUrl ?? undefined]))
        const withUrls = photoRows.map((photo) => ({ ...photo, url: urls.get(photo.object_path), expiresAt }))
        if (isCurrent()) setOfficialPhotos(withUrls.filter((photo) => photo.url))
      }
    })
    return () => { active = false }
  }, [selected, viewer])

  const refreshPreviewPhoto = async () => {
    if (!previewPlace || !supabase) return
    const { data: photo } = await supabase.from('location_photos').select('object_path').eq('location_id', previewPlace.id).eq('position', 1).maybeSingle()
    if (!photo?.object_path) return
    const { data } = await supabase.storage.from('location-photos').createSignedUrl(photo.object_path, SIGNED_URL_TTL_SECONDS)
    if (data?.signedUrl) {
      previewPhotoCache.current[previewPlace.id] = { url: data.signedUrl, expiresAt: signedUrlExpiresAt() }
      setPreviewPhotoUrl(data.signedUrl)
    }
  }

  const refreshPhoto = async (photo: UserPhoto | LocationPhoto, official: boolean) => {
    if (!supabase) return
    const { data } = await supabase.storage.from('location-photos').createSignedUrl(photo.object_path, SIGNED_URL_TTL_SECONDS)
    if (!data?.signedUrl) return
    const update = (item: UserPhoto | LocationPhoto) => item.id === photo.id ? { ...item, url: data.signedUrl, expiresAt: signedUrlExpiresAt() } : item
    if (official) setOfficialPhotos((all) => all.map(update) as LocationPhoto[])
    else setPhotos((all) => all.map(update) as UserPhoto[])
  }

  useEffect(() => {
    const followAddressBar = () => {
      const path = window.location.pathname
      setSelected(null)
      setPreviewPlace(null)
      if (path === '/admin') { setScreen('admin'); setShowAuth(!viewer) }
      else if (path === '/reset-password') setScreen('reset-password')
      else { setScreen('map'); setShowAuth(false) }
    }
    window.addEventListener('popstate', followAddressBar)
    return () => window.removeEventListener('popstate', followAddressBar)
  }, [viewer])

  const uploadPhoto = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected || !viewer || !photoFile || !supabase) return
    if (!photoFile.type.startsWith('image/') || photoFile.size > 8 * 1024 * 1024) {
      setPhotoMessage('Choose a JPG, PNG, WebP or HEIC image smaller than 8 MB.'); return
    }
    setPhotoBusy(true); setPhotoMessage('')
    const extension = photoFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const objectPath = `${viewer.id}/${selected.id}/${crypto.randomUUID()}.${extension}`
    const uploadResult = await supabase.storage.from('location-photos').upload(objectPath, photoFile, { contentType: photoFile.type, upsert: false })
    if (uploadResult.error) { setPhotoMessage('Couldn’t send that photo — try again.'); setPhotoBusy(false); return }
    const { data, error } = await supabase.from('user_photos').insert({ user_id: viewer.id, location_id: selected.id, object_path: objectPath, caption: photoCaption.trim() || null }).select().single()
    if (error) {
      await supabase.storage.from('location-photos').remove([objectPath])
      setPhotoMessage('Couldn’t save that photo — try again.'); setPhotoBusy(false); return
    }
    const signed = await supabase.storage.from('location-photos').createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS)
    setPhotos((all) => [...all, { ...(data as UserPhoto), url: signed.data?.signedUrl, expiresAt: signedUrlExpiresAt() }])
    setPhotoFile(null); setPhotoCaption(''); setPhotoBusy(false); setPhotoMessage('Submitted — this goes live once we’ve had a look.')
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
    if (pendingPlace) { setSelected(pendingPlace); setPendingPlace(null) }
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

  const openPlace = (place: Place) => {
    setPreviewPlace(null)
    if (!viewer && !viewedIds.includes(place.id) && viewedIds.length >= 3) {
      setPendingPlace(place); setShowAuth(true); return
    }
    if (!viewedIds.includes(place.id)) {
      const next = [...viewedIds, place.id]
      setViewedIds(next); sessionStorage.setItem('wander-eire-viewed', JSON.stringify(next))
    }
    setSelected(place)
  }

  const signOut = async () => {
    setViewer(null); setSaved([]); setVisited([]); setScreen('map')
    if (supabase && !viewer?.demo) await supabase.auth.signOut()
  }

  if (screen === 'admin' && viewer?.role === 'admin') return <Suspense fallback={<ViewLoading/>}><AdminView viewer={viewer} places={locationItems} onPlacesChange={setLocationItems} onBack={() => { window.history.pushState({}, '', '/'); setScreen('map') }} /></Suspense>
  if (screen === 'admin' && viewer && viewer.role !== 'admin') return <main className="access-denied"><LockKeyhole/><p className="eyebrow">Owner access only</p><h1>This gate needs an admin key.</h1><p>You’re signed in, but this account is not an administrator.</p><div><button className="primary-button" onClick={() => { window.history.pushState({}, '', '/'); setScreen('map') }}>Back to the map</button><button className="text-button" onClick={signOut}>Sign out</button></div></main>
  if (screen === 'profile' && viewer) return <Suspense fallback={<ViewLoading/>}><ProfileView viewer={viewer} places={locationItems} saved={saved} visited={visited} onOpen={(place) => { setSelected(place); setScreen('map') }} onBack={() => setScreen('map')} onAdmin={() => { window.history.pushState({}, '', '/admin'); setScreen('admin') }} onSignOut={signOut} onViewerChange={setViewer} /></Suspense>
  if (screen === 'reset-password') return <Suspense fallback={<ViewLoading/>}><ResetPasswordView onDone={() => { window.history.replaceState({}, '', '/'); setScreen(viewer ? 'profile' : 'map') }} /></Suspense>

  if (selected) {
    const cat = categories[selected.category]
    return <main className="app detail" style={{ '--accent': cat.color } as React.CSSProperties}>
      {notice && <p className="app-notice" role="status">{notice}</p>}
      <button className="round-button detail-back" onClick={() => setSelected(null)} aria-label="Back to map"><ArrowLeft /></button>
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
        </div>
        <div className="detail__essentials"><div><small>Cost</small><strong>{selected.cost}</strong></div><div><small>Time & distance</small><strong>{selected.distance || 'Take your time'}</strong></div></div>
        <div className="fact-strip">{selected.facts.map((fact) => <span key={fact}>{fact}</span>)}</div>
        <div className="detail__body">
          <section className="detail-section"><p className="eyebrow">The experience</p><h2>Worth the wander</h2><p>{selected.description}</p></section>
          <section className="detail-section"><p className="eyebrow">Arrival</p><h2>Find your way</h2>
            <button className="address" onClick={() => { navigator.clipboard?.writeText(selected.address); setCopied(true); setTimeout(() => setCopied(false), 1600) }}><Navigation size={20}/><span><strong>{selected.address}</strong><small>{copied ? 'Copied to clipboard' : 'Tap to copy address'}</small></span></button>
            <div className="parking-note"><span>Parking</span><p>{selected.parking}</p></div>
          </section>
          <section className="photo-section">
            <div><p className="eyebrow">From the community</p><h2>Photos from the road</h2><p>Shared by people who stopped here.</p></div>
            {photos.length > 0 && <div className="photo-grid">{photos.map((photo) => <figure key={photo.id}>{photo.url && <img src={photo.url} alt={photo.caption || `Visitor view of ${selected.name}`} loading="lazy" decoding="async" onError={() => void refreshPhoto(photo, false)}/>}<figcaption>{photo.status === 'pending' && <small>Pending review</small>}{photo.caption && <span>{photo.caption}</span>}</figcaption></figure>)}</div>}
            {viewer ? <form className="photo-form" onSubmit={uploadPhoto}>
              <label className="photo-picker"><Camera/><span><strong>{photoFile ? photoFile.name : 'Add your photo'}</strong><small>JPG, PNG, WebP or HEIC · up to 8 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}/></label>
              {photoFile && <><label>Optional caption<input value={photoCaption} maxLength={240} onChange={(event) => setPhotoCaption(event.target.value)} placeholder="A helpful detail about this view"/></label><button className="primary-button" disabled={photoBusy}>{photoBusy ? 'Uploading…' : 'Submit for review'}</button></>}
              {photoMessage && <p className="photo-message" role="status">{photoMessage}</p>}
            </form> : <button className="contribute-gate" onClick={() => setShowAuth(true)}><Camera/><span><strong>Got a photo from here?</strong><small>Sign in to add it to the guide.</small></span><ChevronRight/></button>}
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
      <PhotoCarousel photos={officialPhotos} place={selected} onImageError={(photo) => void refreshPhoto(photo, true)}/>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthenticated={authenticated} />}
    </main>
  }

  return <main className="app">
    {notice && <p className="app-notice" role="status">{notice}</p>}
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Wander Éire home"><span className="brand-mark"><Compass /></span><span>Wander <em>Éire</em></span></a>
      <div className="topbar__actions"><button className="round-button" onClick={() => navigator.geolocation?.getCurrentPosition((position) => setMapFocus([position.coords.longitude, position.coords.latitude]), () => undefined)} aria-label="Find my location"><LocateFixed /></button><button className="round-button ink" onClick={() => viewer ? setScreen('profile') : setShowAuth(true)} aria-label={viewer ? 'Open profile' : 'Sign in'}>{viewer ? <span className="avatar-mini">{viewer.name.slice(0, 1).toUpperCase()}</span> : <UserRound />}</button></div>
    </header>

    <section className="map-shell" id="top">
      <div className="map-ui">
        <div className="intro"><p className="eyebrow">Your next story starts here</p><h1>Go somewhere<br/><em>worth remembering.</em></h1></div>
        <label className="search"><Search size={20} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPreviewPlace(null) }} placeholder="Search places or counties" aria-label="Search places or counties" />{query ? <button onClick={() => setQuery('')} aria-label="Clear search"><X size={17}/></button> : <SlidersHorizontal size={18} />}</label>
        <nav className="filters" aria-label="Filter by category">
          <button className={category === 'all' ? 'active all' : ''} onClick={() => setCategory('all')}>All places</button>
          {(Object.keys(categories) as Category[]).map((key) => <button key={key} className={category === key ? 'active' : ''} style={{ '--chip': categories[key].color } as React.CSSProperties} onClick={() => setCategory(key)}><CategoryIcon category={key} size={15}/>{categories[key].label}</button>)}
        </nav>
      </div>

      <div className="map-area">
        <MapCanvas places={locationItems} filtered={filtered} selected={previewPlace} focus={mapFocus} onSelect={setPreviewPlace} />
        {previewPlace && view === 'map' && !query && <PinPreview place={previewPlace} photoUrl={previewPhotoUrl} loading={previewPhotoLoading} onClose={() => setPreviewPlace(null)} onMore={() => openPlace(previewPlace)} onImageError={() => void refreshPreviewPhoto()}/>}
        {query && <div className="search-results"><div className="drawer-handle"/><p className="eyebrow">{filtered.length} {filtered.length === 1 ? 'place' : 'places'} found</p>{filtered.length ? filtered.map((p) => <PlaceRow key={p.id} place={p} onClick={() => openPlace(p)} />) : <div className="empty"><Search/><h2>No trail here yet</h2><p>Try another place or widen your search.</p></div>}</div>}
        {view === 'list' && !query && <div className="list-drawer"><div className="drawer-handle"/><div className="drawer-title"><div><p className="eyebrow">Across the island</p><h2>{category === 'all' ? 'All places' : categories[category].label}</h2></div><span>{filtered.length}</span></div>{filtered.map((p) => <PlaceRow key={p.id} place={p} onClick={() => openPlace(p)} />)}</div>}
        <button className="view-toggle" onClick={() => { setPreviewPlace(null); setView(view === 'map' ? 'list' : 'map') }}>{view === 'map' ? <><List size={18}/>List</> : <><MapIcon size={18}/>Map</>}</button>
        {!query && view === 'map' && !previewPlace && <div className="map-caption"><span>32 counties.</span> One island to explore.<small>{filtered.length} places in this guide</small></div>}
      </div>
    </section>
    <footer><span>Made for the long way round.</span><small>Wander Éire · Independent & free</small></footer>
    {showAuth && <AuthModal admin={screen === 'admin'} onClose={() => { setShowAuth(false); setPendingPlace(null); if (screen === 'admin') { window.history.pushState({}, '', '/'); setScreen('map') } }} onAuthenticated={authenticated} />}
  </main>
}

export default App
