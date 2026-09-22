import type { LngLatBoundsLike } from 'maplibre-gl'

// A generous all-island frame keeps visible sea beyond all four coasts.
export const IRELAND_VIEW: LngLatBoundsLike = [[-12.0, 50.35], [-4.2, 56.4]]
export const IRELAND_CAMERA: LngLatBoundsLike = [[-16.0, 47.0], [0.0, 60.0]]
export const IRELAND_TILE_BOUNDS: [number, number, number, number] = [-11.3, 51.1, -5.3, 55.6]

export const landscapeRegions = [
  { name: 'Wicklow', center: [-6.35, 53.015], zoom: 12.5, bearing: -24 },
  { name: 'Kerry', center: [-9.72, 51.995], zoom: 12.2, bearing: 25 },
  { name: 'Donegal', center: [-8.685, 54.628], zoom: 12.2, bearing: -35 },
  { name: 'Mournes', center: [-5.95, 54.18], zoom: 12.2, bearing: -20 },
] satisfies { name: string; center: [number, number]; zoom: number; bearing: number }[]
