import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { FetchSource, PMTiles, Protocol } from 'pmtiles'

const archiveUrl = 'https://stbkxmzoyonerkyacblp.supabase.co/storage/v1/object/public/map-trial/wicklow-trial.pmtiles'
const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY?.trim()
const metrics = document.querySelector<HTMLParagraphElement>('#metrics')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const explore = document.querySelector<HTMLButtonElement>('#explore')!
let reads = 0
let bytes = 0
let failures = 0
const started = performance.now()
const report = () => {
  metrics.textContent = `Supabase vector archive: ${reads} completed range reads · ${bytes.toLocaleString()} response bytes · ${failures} failed reads`
}

class MeasuredSource extends FetchSource {
  override async getBytes(offset: number, length: number, signal?: AbortSignal, etag?: string) {
    try {
      const result = await super.getBytes(offset, length, signal, etag)
      reads++
      bytes += result.data.byteLength
      report()
      return result
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) failures++
      report()
      throw error
    }
  }
}

const archive = new PMTiles(new MeasuredSource(archiveUrl))
const protocol = new Protocol()
protocol.add(archive)
maplibregl.addProtocol('pmtiles', protocol.tile)
if (!mapTilerKey) {
  status.textContent = 'The MapTiler development key is missing, so the 3D landscape cannot load.'
  throw new Error('VITE_MAPTILER_API_KEY is required for the 3D landscape trial')
}
const encodedMapTilerKey = encodeURIComponent(mapTilerKey)
const map = new maplibregl.Map({
  container: 'map',
  center: [-6.35, 53.015],
  zoom: 12.1,
  pitch: 63,
  bearing: -24,
  minZoom: 10,
  maxZoom: 15,
  maxBounds: [-6.42, 52.97, -6.27, 53.06],
  renderWorldCopies: false,
  style: {
    version: 8,
    sources: {
      satellite: {
        type: 'raster',
        url: `https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${encodedMapTilerKey}`,
        tileSize: 256,
        attribution: '© MapTiler · satellite imagery providers',
      },
      'terrain-3d': {
        type: 'raster-dem',
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodedMapTilerKey}`,
        tileSize: 256,
      },
      'terrain-hillshade': {
        type: 'raster-dem',
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodedMapTilerKey}`,
        tileSize: 256,
      },
      wicklow: {
        type: 'vector', url: `pmtiles://${archiveUrl}`,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="https://protomaps.com">Protomaps</a>',
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#17262a' } },
      {
        id: 'satellite', type: 'raster', source: 'satellite',
        paint: { 'raster-saturation': 0.12, 'raster-contrast': 0.06, 'raster-brightness-min': 0.08, 'raster-brightness-max': 0.98 },
      },
      {
        id: 'terrain-hillshade', type: 'hillshade', source: 'terrain-hillshade',
        paint: {
          'hillshade-exaggeration': 0.28,
          'hillshade-shadow-color': '#17211c',
          'hillshade-highlight-color': '#f4edcf',
          'hillshade-accent-color': '#314837',
          'hillshade-illumination-direction': 315,
          'hillshade-illumination-anchor': 'map',
        },
      },
      {
        id: 'water-tint', type: 'fill', source: 'wicklow', 'source-layer': 'water',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': '#4f9fb4', 'fill-opacity': 0.18 },
      },
      {
        id: 'paths', type: 'line', source: 'wicklow', 'source-layer': 'roads',
        minzoom: 13,
        filter: ['match', ['get', 'kind'], ['path', 'track'], true, false],
        paint: { 'line-color': '#ffead0', 'line-opacity': 0.7, 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.6, 15, 1.8] },
      },
    ],
  },
})
map.addControl(new maplibregl.NavigationControl())
let mapFailed = false
map.on('error', (event) => {
  const message = (event.error?.message ?? 'Unknown map error').replace(/([?&]key=)[^&\s)]+/g, '$1[redacted]')
  console.warn(`MapLibre trial request failed: ${message}`)
  if (/\b(401|403|404)\b.*tiles\.json/i.test(message)) {
    mapFailed = true
    status.textContent = 'A required landscape source could not load. See the redacted browser warning for details.'
  }
})
map.once('load', () => {
  map.setTerrain({ source: 'terrain-3d', exaggeration: 1.45 })
})
map.once('idle', () => {
  if (!mapFailed) status.textContent = `3D terrain, aerial imagery and hillshade ready after ${((performance.now() - started) / 1000).toFixed(2)} seconds.`
  explore.disabled = false
})
const visit = (center: [number, number], zoom: number, bearing: number) => new Promise<void>((resolve, reject) => {
  const done = () => { clearTimeout(timeout); resolve() }
  const timeout = setTimeout(() => { map.off('idle', done); reject(new Error('Map did not become idle within 15 seconds.')) }, 15000)
  map.once('idle', done)
  map.easeTo({ center, zoom, pitch: 63, bearing, duration: 1500 })
})
explore.addEventListener('click', async () => {
  explore.disabled = true
  try {
    await visit([-6.37, 53.007], 13.2, -12)
    await visit([-6.32, 53.025], 13, 38)
    await visit([-6.35, 53.015], 12.1, -24)
    status.textContent = mapFailed ? 'Landscape flight finished with map errors.' : 'Landscape flight complete. All three baseline layers remained active.'
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Sample failed.'
  } finally {
    explore.disabled = false
  }
})
