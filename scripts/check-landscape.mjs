import assert from 'node:assert/strict'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { makeLandscapeStyle } from '../src/map/landscape-style.ts'
import { IRELAND_TILE_BOUNDS, landscapeRegions } from '../src/map/ireland.ts'

// Validate against MapLibre's actual style schema without network or credentials.
for (const key of [undefined, 'test-key']) {
  const style = makeLandscapeStyle(key)
  const errors = validateStyleMin(style)
  assert.deepEqual(errors.map((error) => error.message), [], 'MapLibre must accept the generated style')
  if (key) {
    assert.equal(style.sources['base-map'].type, 'raster')
    assert.equal(style.sources['terrain-3d'].type, 'raster-dem')
    const hillshade = style.layers.find((layer) => layer.type === 'hillshade')
    assert.ok(hillshade, 'Landscape needs a hillshade layer')
    assert.notEqual(hillshade.source, 'terrain-3d', 'Hillshade and 3D terrain need separate caches for correct rendering')
    for (const source of Object.values(style.sources).filter((source) => source.url)) {
      assert.equal(new URL(source.url).host, 'api.maptiler.com')
      assert.deepEqual(source.bounds, IRELAND_TILE_BOUNDS)
    }
  } else {
    assert.equal(style.sources['terrain-3d'], undefined)
    assert.ok(!JSON.stringify(style).includes('api.maptiler.com'), 'Missing key must not request MapTiler')
  }
}

const [west, south, east, north] = IRELAND_TILE_BOUNDS
for (const [name, lng, lat] of [
  ['Mizen Head', -9.819, 51.451], ['Malin Head', -7.373, 55.38],
  ['Dunmore Head', -10.473, 52.108], ['Burr Point', -5.432, 54.488],
  ['Belfast', -5.93, 54.60],
]) {
  assert.ok(lng >= west && lng <= east && lat >= south && lat <= north, `${name} must be covered`)
}
for (const region of landscapeRegions) {
  assert.ok(region.center[0] >= west && region.center[0] <= east)
  assert.ok(region.center[1] >= south && region.center[1] <= north)
}
console.log('PASS MapLibre style schema, terrain/hillshade sources, no-key fallback, and all-island bounds')
