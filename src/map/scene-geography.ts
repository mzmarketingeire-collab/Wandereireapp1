// Web Mercator coordinates normalised to [0,1]. Local distances use metres at
// the pilot latitude; this is a small local scene, not a global projection.
export const ORIGIN = [-6.35718, 53.00513] as const
export const metresPerWorld = 40075016.686 * Math.cos(ORIGIN[1] * Math.PI / 180)
export function mercator(lng: number, lat: number): [number, number] {
  return [(lng + 180) / 360, (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2]
}
export const originWorld = mercator(...ORIGIN)
export function localPoint(lng: number, lat: number): [number, number] {
  const point = mercator(lng, lat)
  return [(point[0] - originWorld[0]) * metresPerWorld, (point[1] - originWorld[1]) * metresPerWorld]
}
export function insideRing(x: number, y: number, ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
  }
  return inside
}
export function decodeElevation(r: number, g: number, b: number) {
  return -10000 + (r * 65536 + g * 256 + b) * 0.1
}
