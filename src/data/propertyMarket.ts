export type MarketBand = 'high-yield' | 'high-price' | 'medium-price' | 'lower-price'

export type MarketArea = {
  boundaryName: string
  name: string
  salePrice: number
  monthlyRent: number
  grossYield: number
  band: MarketBand
}

export const MARKET_COLORS: Record<MarketBand, string> = {
  'high-yield': '#238653',
  'high-price': '#c84d42',
  'medium-price': '#e59637',
  'lower-price': '#e6c84f',
}

export const RENTAL_BOUNDARY_URL = 'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/National_Statutory_Boundaries_-_Local_Authorities__Ungeneralised_-_2026/FeatureServer/3/query?where=1%3D1&outFields=ENG_NAME_VALUE&returnGeometry=true&outSR=4326&geometryPrecision=4&maxAllowableOffset=0.001&f=geojson'

const rawMarketAreas = [
  ['CARLOW COUNTY COUNCIL', 'Carlow', 281000, 1319],
  ['CAVAN COUNTY COUNCIL', 'Cavan', 260000, 1216],
  ['CLARE COUNTY COUNCIL', 'Clare', 320000, 1249],
  ['CORK CITY COUNCIL', 'Cork City', 350000, 1756],
  ['CORK COUNTY COUNCIL', 'Cork County', 395000, 1346],
  ['DONEGAL COUNTY COUNCIL', 'Donegal', 208000, 1041],
  ['DUBLIN CITY COUNCIL', 'Dublin City', 480000, 2191],
  ['DUN LAOGHAIRE-RATHDOWN COUNTY COUNCIL', 'Dún Laoghaire–Rathdown', 689325, 2548],
  ['FINGAL COUNTY COUNCIL', 'Fingal', 480000, 2152],
  ['GALWAY CITY COUNCIL', 'Galway City', 415500, 1834],
  ['GALWAY COUNTY COUNCIL', 'Galway County', 365550, 1451],
  ['KERRY COUNTY COUNCIL', 'Kerry', 300000, 1241],
  ['KILDARE COUNTY COUNCIL', 'Kildare', 447876, 1785],
  ['KILKENNY COUNTY COUNCIL', 'Kilkenny', 345000, 1303],
  ['LAOIS COUNTY COUNCIL', 'Laois', 350000, 1376],
  ['LEITRIM COUNTY COUNCIL', 'Leitrim', 223000, 1006],
  ['LIMERICK CITY AND COUNTY COUNCIL', 'Limerick', 328000, 1666],
  ['LONGFORD COUNTY COUNCIL', 'Longford', 198000, 1153],
  ['LOUTH COUNTY COUNCIL', 'Louth', 370000, 1524],
  ['MAYO COUNTY COUNCIL', 'Mayo', 245000, 1175],
  ['MEATH COUNTY COUNCIL', 'Meath', 425000, 1608],
  ['MONAGHAN COUNTY COUNCIL', 'Monaghan', 266750, 1138],
  ['OFFALY COUNTY COUNCIL', 'Offaly', 289950, 1221],
  ['ROSCOMMON COUNTY COUNCIL', 'Roscommon', 230500, 1187],
  ['SLIGO COUNTY COUNCIL', 'Sligo', 280000, 1247],
  ['SOUTH DUBLIN COUNTY COUNCIL', 'South Dublin', 485000, 2127],
  ['TIPPERARY COUNTY COUNCIL', 'Tipperary', 275000, 1141],
  ['WATERFORD CITY AND COUNTY COUNCIL', 'Waterford', 326745, 1311],
  ['WESTMEATH COUNTY COUNCIL', 'Westmeath', 330000, 1340],
  ['WEXFORD COUNTY COUNCIL', 'Wexford', 315000, 1285],
  ['WICKLOW COUNTY COUNCIL', 'Wicklow', 470000, 1758],
] as const

const marketBand = (salePrice: number, grossYield: number): MarketBand => {
  if (grossYield >= 6) return 'high-yield'
  if (salePrice >= 400000) return 'high-price'
  if (salePrice >= 300000) return 'medium-price'
  return 'lower-price'
}

export const propertyMarketAreas: MarketArea[] = rawMarketAreas.map(([boundaryName, name, salePrice, monthlyRent]) => {
  const grossYield = (monthlyRent * 12 / salePrice) * 100
  return { boundaryName, name, salePrice, monthlyRent, grossYield, band: marketBand(salePrice, grossYield) }
})

export const propertyMarketByBoundary = new Map(propertyMarketAreas.map((area) => [area.boundaryName, area]))

export const rentalMarketFillExpression: unknown[] = [
  'match',
  ['get', 'ENG_NAME_VALUE'],
  ...propertyMarketAreas.flatMap((area) => [area.boundaryName, MARKET_COLORS[area.band]]),
  '#b8b9b3',
]
