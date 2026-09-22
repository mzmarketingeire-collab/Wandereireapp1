import type { StyleSpecification } from 'maplibre-gl'
import { IRELAND_TILE_BOUNDS } from './ireland.ts'

const greatBritainMask = {
  type: 'Feature' as const,
  properties: { name: 'Great Britain' },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[[-3.093831, 53.404547], [-3.09208, 53.404441], [-2.945009, 53.985], [-3.614701, 54.600937], [-3.630005, 54.615013], [-4.844169, 54.790971], [-5.082527, 55.061601], [-4.719112, 55.508473], [-5.047981, 55.783986], [-5.586398, 55.311146], [-5.644999, 56.275015], [-6.149981, 56.78501], [-5.786825, 57.818848], [-5.009999, 58.630013], [-4.211495, 58.550845], [-3.005005, 58.635], [-4.073828, 57.553025], [-3.055002, 57.690019], [-1.959281, 57.6848], [-2.219988, 56.870017], [-3.119003, 55.973793], [-2.085009, 55.909998], [-2.005676, 55.804903], [-1.114991, 54.624986], [-0.430485, 54.464376], [0.184981, 53.325014], [0.469977, 52.929999], [1.681531, 52.73952], [1.559988, 52.099998], [1.050562, 51.806761], [1.449865, 51.289428], [0.550334, 50.765739], [-0.787517, 50.774989], [-2.489998, 50.500019], [-2.956274, 50.69688], [-3.617448, 50.228356], [-4.542508, 50.341837], [-5.245023, 49.96], [-5.776567, 50.159678], [-4.30999, 51.210001], [-3.414851, 51.426009], [-3.422719, 51.426848], [-4.984367, 51.593466], [-5.267296, 51.9914], [-4.222347, 52.301356], [-4.770013, 52.840005], [-4.579999, 53.495004], [-3.093831, 53.404547]]],
  },
}

export const makeLandscapeStyle = (mapTilerKey?: string): StyleSpecification => {
  const usingMapTiler = Boolean(mapTilerKey)
  const encodedKey = usingMapTiler ? encodeURIComponent(mapTilerKey!) : ''
  const outdoorsLayers: StyleSpecification['layers'] = usingMapTiler ? [
    {
      id: 'contours-soft',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      minzoom: 12,
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
      minzoom: 12,
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
      minzoom: 11,
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
      minzoom: 11,
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
      minzoom: 12,
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
        ...(usingMapTiler
          ? { url: `https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${encodedKey}` }
          : { tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] }),
        bounds: IRELAND_TILE_BOUNDS,
        tileSize: 256,
        minzoom: 0,
        maxzoom: 18,
        // Hosted TileJSON supplies the imagery provider's own required credits.
        ...(!usingMapTiler ? { attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>' } : {}),
      },
      ...(usingMapTiler ? {
        'terrain-3d': { type: 'raster-dem' as const, url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodedKey}`, tileSize: 256, bounds: IRELAND_TILE_BOUNDS },
        'terrain-shading': { type: 'raster-dem' as const, url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${encodedKey}`, tileSize: 256, bounds: IRELAND_TILE_BOUNDS },
        contours: { type: 'vector' as const, url: `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${encodedKey}`, bounds: IRELAND_TILE_BOUNDS },
        'outdoor-routes': { type: 'vector' as const, url: `https://api.maptiler.com/tiles/outdoor/tiles.json?key=${encodedKey}`, bounds: IRELAND_TILE_BOUNDS },
      } : {}),
      'great-britain-mask': { type: 'geojson', data: greatBritainMask },
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#132f3b' } },
      {
        id: 'outdoor-map',
        type: 'raster',
        source: 'base-map',
        paint: {
          'raster-opacity': 1,
          'raster-saturation': 0.08,
          'raster-contrast': 0.04,
          'raster-brightness-min': 0.06,
          'raster-brightness-max': 1,
          'raster-resampling': 'linear',
          'raster-fade-duration': 180,
        },
      },
      ...(usingMapTiler ? [{
        id: 'landscape-shading', type: 'hillshade' as const, source: 'terrain-shading',
        paint: {
          'hillshade-exaggeration': 0.22,
          'hillshade-shadow-color': '#223127',
          'hillshade-highlight-color': '#f8f3df',
          'hillshade-accent-color': '#334939',
          'hillshade-illumination-direction': 315,
          'hillshade-illumination-anchor': 'map' as const,
        },
      }] : []),
      ...outdoorsLayers,
      {
        id: 'great-britain-muted',
        type: 'fill',
        source: 'great-britain-mask',
        paint: { 'fill-color': '#132f3b', 'fill-opacity': 1 },
      },
      {
        id: 'great-britain-edge',
        type: 'line',
        source: 'great-britain-mask',
        paint: { 'line-color': '#132f3b', 'line-width': 1 },
      },
    ],
  }
}
