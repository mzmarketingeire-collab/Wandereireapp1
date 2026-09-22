import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const names = [
  'Carrauntoohil', 'Gap of Dunloe', 'Slea Head', 'Mizen Head', 'Barleycove Beach',
  'Ballyhoura Forest', 'Galtymore', 'Coumshingaun Lough', 'Tramore Beach',
  'Hook Head Lighthouse', 'Raven Point Wood Curracloe', 'Brittas Bay', 'Djouce Mountain',
  'Avondale Forest Park', 'Dollymount Strand', 'Newgrange', 'Trim Castle',
  'Killykeen Forest Park', 'Clonmacnoise', 'Ridge of Capard', 'Kilkenny Castle',
  'Birr Castle', 'Portumna Forest Park', 'Dun Aonghasa', 'Kylemore Abbey',
  'Mullaghmore Burren National Park', 'Lahinch Beach', 'Enniscrone Beach',
  'Knocknarea', 'Ceide Fields', 'Wild Nephin National Park', 'Mulranny Beach',
  'Silver Strand Malin Beg', 'Ards Forest Park Donegal', 'Grianan of Aileach',
  'Marble Arch Caves', 'Florence Court Fermanagh', 'Beaghmore Stone Circles',
  'Gortin Glen Forest Park', 'Navan Fort Armagh', 'Gosford Forest Park',
  'Slieve Donard', 'Tollymore Forest Park', 'Tyrella Beach', 'Scrabo Tower',
  'Glenariff Forest Park', 'Carrick-a-Rede', 'Carrickfergus Castle',
  'Benone Strand', 'Roe Valley Country Park',
]

const focusedQueries = new Map([
  ['Barleycove Beach', 'Barley Cove Cork'],
  ['Ballyhoura Forest', 'Ballyhoura Mountains Limerick'],
  ['Galtymore', 'Galtee Mountains'],
  ['Tramore Beach', 'Tramore Strand Waterford'],
  ['Raven Point Wood Curracloe', 'Raven Point Nature Reserve Wexford'],
  ['Brittas Bay', 'Brittas Bay Wicklow beach'],
  ['Avondale Forest Park', 'Avondale House Wicklow'],
  ['Killykeen Forest Park', 'Killykeen Lough Oughter'],
  ['Ridge of Capard', 'Slieve Bloom Mountains view'],
  ['Kilkenny Castle', 'Kilkenny Castle park'],
  ['Birr Castle', 'Birr Castle Demesne'],
  ['Portumna Forest Park', 'Portumna Lough Derg forest'],
  ['Dun Aonghasa', 'Dún Aonghasa Inis Mór'],
  ['Mullaghmore Burren National Park', 'Mullaghmore County Clare Burren'],
  ['Knocknarea', 'Knocknarea Sligo mountain'],
  ['Ceide Fields', 'Céide Fields Mayo'],
  ['Mulranny Beach', 'Mulranny Mayo beach'],
  ['Ards Forest Park Donegal', 'Ards Forest Park Donegal coast'],
  ['Florence Court Fermanagh', 'Florence Court Fermanagh estate'],
  ['Gortin Glen Forest Park', 'Gortin Glen Tyrone'],
  ['Gosford Forest Park', 'Gosford Forest Park Armagh'],
  ['Slieve Donard', 'Slieve Donard Mourne Mountains'],
  ['Tollymore Forest Park', 'Tollymore Forest Park river'],
  ['Tyrella Beach', 'Tyrella Beach Down'],
  ['Glenariff Forest Park', 'Glenariff waterfall Antrim'],
  ['Carrickfergus Castle', 'Carrickfergus Castle'],
  ['Benone Strand', 'Benone Strand Binevenagh'],
  ['Roe Valley Country Park', 'Roe Valley Country Park Limavady'],
])

const researchNames = process.argv.includes('--focused') ? [...focusedQueries.keys()] : names

const outputDir = path.resolve(process.argv.includes('--focused') ? 'research/location-photos-focused' : 'research/location-photos')
const thumbDir = path.join(outputDir, 'thumbs')
await mkdir(thumbDir, { recursive: true })

const api = 'https://commons.wikimedia.org/w/api.php'
const userAgent = 'Wander-Eire-content-research/1.0 (local development)'
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const cleanText = (value = '') => value.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim()
const safeName = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(20000) })
  if (response.status === 429 && attempt <= 4) {
    await delay(attempt * 5000)
    return fetchJson(url, attempt + 1)
  }
  if (!response.ok) throw new Error(`${response.status} from ${url}`)
  return response.json()
}

async function findCandidates(name) {
  const url = new URL(api)
  url.search = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search',
    gsrsearch: `${focusedQueries.get(name) || name} filetype:bitmap`, gsrnamespace: '6', gsrlimit: process.argv.includes('--focused') ? '12' : '4',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '520',
  })
  const result = await fetchJson(url)
  return Object.values(result.query?.pages ?? {}).flatMap((page) => {
    const image = page.imageinfo?.[0]
    const metadata = image?.extmetadata ?? {}
    const license = metadata.LicenseShortName?.value ?? ''
    const reusable = /^(CC0|Public domain|CC BY|CC BY-SA)/i.test(license)
    const bitmap = /^image\/(jpeg|png|webp)$/i.test(image?.mime ?? '')
    if (!image || !reusable || !bitmap || image.width < 1400 || image.height < 800) return []
    return [{
      title: page.title.replace(/^File:/, ''),
      descriptionUrl: image.descriptionurl,
      originalUrl: image.url,
      thumbnailUrl: image.thumburl,
      width: image.width,
      height: image.height,
      creator: cleanText(metadata.Artist?.value || metadata.Credit?.value || 'Unknown'),
      license,
      licenseUrl: metadata.LicenseUrl?.value || '',
      date: cleanText(metadata.DateTimeOriginal?.value || metadata.DateTime?.value || ''),
      description: cleanText(metadata.ImageDescription?.value || metadata.ObjectName?.value || ''),
    }]
  }).slice(0, 4)
}

const researched = []
for (let locationIndex = 0; locationIndex < researchNames.length; locationIndex += 1) {
  const name = researchNames[locationIndex]
  const candidates = await findCandidates(name)
  const slug = safeName(name)
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
    const candidate = candidates[candidateIndex]
    const response = await fetch(candidate.thumbnailUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(20000) })
    if (!response.ok) continue
    const file = `${String(locationIndex + 1).padStart(2, '0')}-${slug}-${candidateIndex + 1}.jpg`
    await sharp(Buffer.from(await response.arrayBuffer())).resize(260, 170, { fit: 'cover' }).jpeg({ quality: 84 }).toFile(path.join(thumbDir, file))
    candidate.thumbnailFile = `thumbs/${file}`
  }
  researched.push({ location: name, candidates })
  console.log(`${locationIndex + 1}/${researchNames.length} ${name}: ${candidates.length} candidates`)
  await delay(1100)
}

await writeFile(path.join(outputDir, 'candidates.json'), `${JSON.stringify(researched, null, 2)}\n`)

for (let page = 0; page < Math.ceil(researched.length / 10); page += 1) {
  const rows = researched.slice(page * 10, page * 10 + 10)
  const composites = []
  for (let row = 0; row < rows.length; row += 1) {
    const item = rows[row]
    const top = row * 205
    const label = Buffer.from(`<svg width="260" height="195"><rect width="260" height="195" fill="#f4f0e7"/><text x="12" y="28" font-family="Arial" font-size="15" font-weight="700" fill="#17231b">${item.location.replace(/&/g, '&amp;')}</text><text x="12" y="50" font-family="Arial" font-size="11" fill="#526057">${page * 10 + row + 1}. Choose 1-4</text></svg>`)
    composites.push({ input: label, left: 0, top })
    for (let index = 0; index < item.candidates.length; index += 1) {
      const candidate = item.candidates[index]
      if (!candidate.thumbnailFile) continue
      composites.push({ input: path.join(outputDir, candidate.thumbnailFile), left: 280 + index * 270, top })
      const number = Buffer.from(`<svg width="34" height="26"><rect rx="4" width="34" height="26" fill="#fff" fill-opacity=".9"/><text x="13" y="19" font-family="Arial" font-size="15" font-weight="700" fill="#17231b">${index + 1}</text></svg>`)
      composites.push({ input: number, left: 288 + index * 270, top: top + 8 })
    }
  }
  await sharp({ create: { width: 1360, height: 2050, channels: 3, background: '#ffffff' } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(path.join(outputDir, `contact-sheet-${page + 1}.jpg`))
}

console.log(`Researched ${researched.length} locations in ${outputDir}`)
