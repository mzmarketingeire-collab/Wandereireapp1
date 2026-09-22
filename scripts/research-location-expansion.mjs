const candidates = [
  ['Carrauntoohil', 'Carrauntoohil, County Kerry, Ireland'],
  ['Gap of Dunloe', 'Gap of Dunloe, County Kerry, Ireland'],
  ['Slea Head', 'Slea Head, County Kerry, Ireland'],
  ['Mizen Head', 'Mizen Head, County Cork, Ireland'],
  ['Barleycove Beach', 'Barley Cove Beach, Crookhaven, County Cork, Ireland'],
  ['Ballyhoura Forest', 'Ballyhoura Mountain Bike Trail, Ardpatrick, County Limerick, Ireland'],
  ['Galtymore', 'Galtee More, County Tipperary, Ireland'],
  ['Coumshingaun Lough', 'Coumshingaun Lough, County Waterford, Ireland'],
  ['Tramore Beach', 'Tramore Beach, County Waterford, Ireland'],
  ['Hook Head Lighthouse', 'Hook Lighthouse, County Wexford, Ireland'],
  ['Raven Point Wood', 'The Raven Nature Reserve, Curracloe, County Wexford, Ireland'],
  ['Brittas Bay', 'Brittas Bay, County Wicklow, Ireland'],
  ['Djouce Mountain', 'Djouce, County Wicklow, Ireland'],
  ['Avondale Forest Park', 'Avondale House and Forest Park, Rathdrum, County Wicklow, Ireland'],
  ['Dollymount Strand', 'Dollymount Strand, Dublin, Ireland'],
  ['Newgrange', 'Newgrange, County Meath, Ireland'],
  ['Trim Castle', 'Trim Castle, County Meath, Ireland'],
  ['Killykeen Forest Park', 'Killykeen Forest Park, County Cavan, Ireland'],
  ['Clonmacnoise', 'Clonmacnoise, County Offaly, Ireland'],
  ['Ridge of Capard', 'Ridge of Capard, County Laois, Ireland'],
  ['Kilkenny Castle', 'Kilkenny Castle, Ireland'],
  ['Birr Castle', 'Birr Castle, County Offaly, Ireland'],
  ['Portumna Forest Park', 'Portumna Forest Park, County Galway, Ireland'],
  ['Dun Aonghasa', 'Dun Aonghasa, Inishmore, County Galway, Ireland'],
  ['Kylemore Abbey', 'Kylemore Abbey, County Galway, Ireland'],
  ['Mullaghmore, Burren National Park', 'Mullaghmore Mountain, Burren, County Clare, Ireland'],
  ['Lahinch Beach', 'Lahinch Beach, County Clare, Ireland'],
  ['Enniscrone Beach', 'Enniscrone Beach, County Sligo, Ireland'],
  ['Knocknarea', 'Knocknarea, County Sligo, Ireland'],
  ['Ceide Fields', 'Ceide Fields, County Mayo, Ireland'],
  ['Wild Nephin National Park', 'Wild Nephin National Park, County Mayo, Ireland'],
  ['Mulranny Beach', 'Mulrany Beach, County Mayo, Ireland'],
  ['Silver Strand Malin Beg', 'Silver Strand, Malin Beg, County Donegal, Ireland'],
  ['Ards Forest Park', 'Ards Forest Park, Creeslough, County Donegal, Ireland'],
  ['Grianan of Aileach', 'Grianan of Aileach, County Donegal, Ireland'],
  ['Marble Arch Caves', 'Marble Arch Caves, County Fermanagh, Northern Ireland'],
  ['Florence Court', 'Florence Court House, County Fermanagh, Northern Ireland'],
  ['Beaghmore Stone Circles', 'Beaghmore Stone Circles, County Tyrone, Northern Ireland'],
  ['Gortin Glen Forest Park', 'Gortin Glen Forest Park, County Tyrone, Northern Ireland'],
  ['Navan Fort', 'Navan Fort, County Armagh, Northern Ireland'],
  ['Gosford Forest Park', 'Gosford Forest Park, County Armagh, Northern Ireland'],
  ['Slieve Donard', 'Slieve Donard, County Down, Northern Ireland'],
  ['Tollymore Forest Park', 'Tollymore Forest Park, County Down, Northern Ireland'],
  ['Tyrella Beach', 'Tyrella Beach, County Down, Northern Ireland'],
  ['Scrabo Tower', 'Scrabo Tower, County Down, Northern Ireland'],
  ['Glenariff Forest Park', 'Glenariff Forest Park, County Antrim, Northern Ireland'],
  ['Carrick-a-Rede', 'Carrick-a-Rede Rope Bridge, County Antrim, Northern Ireland'],
  ['Carrickfergus Castle', 'Carrickfergus Castle, County Antrim, Northern Ireland'],
  ['Benone Strand', 'Benone Strand, County Derry, Northern Ireland'],
  ['Roe Valley Country Park', 'Roe Valley Country Park, County Derry, Northern Ireland'],
]

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const headers = { 'User-Agent': 'Wander-Eire-content-research/1.0 (local development)' }
const results = []

for (const [name, query] of candidates) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '3', extratags: '1' })
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(`${name}: geocoder returned ${response.status}`)
  const matches = await response.json()
  const match = matches[0]
  results.push({
    name,
    query,
    ...(match ? {
      latitude: Number(match.lat),
      longitude: Number(match.lon),
      displayName: match.display_name,
      osmType: match.osm_type,
      osmId: match.osm_id,
      wikidata: match.extratags?.wikidata ?? null,
    } : { error: 'No result' }),
  })
  await delay(1100)
}

console.log(JSON.stringify(results, null, 2))
