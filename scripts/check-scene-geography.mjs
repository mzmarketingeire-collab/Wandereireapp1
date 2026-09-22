import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decodeElevation, insideRing, localPoint, mercator, ORIGIN } from '../src/map/scene-geography.ts'

const lake = JSON.parse(readFileSync(new URL('../src/map/glendalough-lake.json', import.meta.url), 'utf8'))
const ring = lake.geometry.coordinates[0].map(([lng, lat]) => localPoint(lng, lat))
assert.deepEqual(lake.geometry.coordinates[0][0], lake.geometry.coordinates[0].at(-1), 'Lake must be a closed ring')
assert.equal(lake.properties.version, 18)
assert.equal(lake.properties.license, 'ODbL-1.0')
assert.deepEqual(localPoint(...ORIGIN), [0, 0])
assert.deepEqual(mercator(0, 0), [.5, .5])
assert.ok(insideRing(0, 0, ring), 'Lake centre must be inside the water geometry')
assert.ok(!insideRing(...localPoint(-6.3468, 53.00615), ring), 'Eye-level camera must be on the land side of the mapped shore')
assert.equal(decodeElevation(1, 134, 160), 0, 'Terrain RGB sea-level decode')
assert.equal(decodeElevation(1, 138, 136), 100, 'Terrain RGB 100m decode')
const width = Math.max(...ring.map(p => p[0])) - Math.min(...ring.map(p => p[0]))
assert.ok(width > 1300 && width < 1450, 'Lake width must retain metre scale')
console.log('PASS: lake provenance/closure, projection, land-side camera, terrain decoding and metre scale')
