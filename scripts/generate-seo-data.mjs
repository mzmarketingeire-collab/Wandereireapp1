import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputDirectory = path.join(root, 'public', 'seo')
const outputFile = path.join(outputDirectory, 'places.json')
const defaultSiteUrl = 'https://wander-eire.markhoare28.workers.dev'

const exists = async (file) => {
  try { await access(file); return true } catch { return false }
}

const loadLocalEnvironment = async () => {
  const file = path.join(root, '.env.local')
  if (!(await exists(file))) return
  const contents = await readFile(file, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const guideTopics = [
  { slug: 'outdoor-adventures', title: 'Walks, viewpoints and wild places', categories: ['trail', 'viewpoint', 'camp'], minimum: 2 },
  { slug: 'coast-and-beaches', title: 'Beaches and coastal escapes', categories: ['beach'], minimum: 2 },
  { slug: 'history-and-heritage', title: 'Historic places and landmarks', categories: ['historic'], minimum: 2 },
  { slug: 'weekend-plan', title: 'A weekend outdoor itinerary', categories: ['trail', 'viewpoint', 'camp', 'beach', 'historic'], minimum: 4 },
]

const xmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

await loadLocalEnvironment()
await mkdir(outputDirectory, { recursive: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || defaultSiteUrl).replace(/\/$/, '')

const query = new URLSearchParams({
  select: 'id,name,county,category,latitude,longitude,cost,distance,kicker,description,address,parking,facts,updated_at',
  archived_at: 'is.null',
  order: 'id.asc',
})

const cachedRows = async () => {
  if (!(await exists(outputFile))) return null
  const cached = JSON.parse(await readFile(outputFile, 'utf8'))
  return Array.isArray(cached.places) ? cached.places : null
}

let rows
if (!supabaseUrl || !supabaseKey) {
  rows = await cachedRows()
  if (!rows) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required to generate SEO data.')
  console.warn('SEO data refresh skipped: Supabase build variables are unavailable; rebuilding from checked-in data.')
} else {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/locations?${query}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error(`SEO data refresh returned ${response.status}.`)
    rows = await response.json()
  } catch (error) {
    rows = await cachedRows()
    if (!rows) throw error
    console.warn(`SEO data refresh failed; rebuilding from checked-in data: ${error.message}`)
  }
}
const places = rows.map((row) => ({
  ...row,
  slug: slugify(row.name),
  path: `/place/${row.id}/${slugify(row.name)}`,
}))
const generatedAt = new Date().toISOString()
const counties = Object.values(places.reduce((all, place) => {
  const slug = slugify(place.county)
  all[slug] ||= { name: place.county, slug, path: `/guides/${slug}`, placeIds: [], topics: [] }
  all[slug].placeIds.push(place.id)
  return all
}, {})).sort((a, b) => a.name.localeCompare(b.name))

for (const county of counties) {
  const countyPlaces = county.placeIds.map((id) => places.find((place) => place.id === id))
  county.topics = guideTopics.flatMap((topic) => {
    const placeIds = countyPlaces.filter((place) => topic.categories.includes(place.category)).map((place) => place.id)
    if (placeIds.length < topic.minimum) return []
    return [{ ...topic, placeIds, path: `${county.path}/${topic.slug}` }]
  })
}

await writeFile(outputFile, `${JSON.stringify({ generatedAt, places, counties }, null, 2)}\n`)

const urls = [
  { path: '/', lastmod: generatedAt },
  ...places.map((place) => ({ path: place.path, lastmod: place.updated_at || generatedAt })),
  { path: '/guides', lastmod: generatedAt },
  ...counties.flatMap((county) => [
    { path: county.path, lastmod: generatedAt },
    ...county.topics.map((topic) => ({ path: topic.path, lastmod: generatedAt })),
  ]),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ path: urlPath, lastmod }) => `  <url><loc>${xmlEscape(`${siteUrl}${urlPath}`)}</loc><lastmod>${xmlEscape(new Date(lastmod).toISOString().slice(0, 10))}</lastmod></url>`).join('\n')}
</urlset>
`

await writeFile(path.join(root, 'public', 'sitemap.xml'), sitemap)
await writeFile(path.join(root, 'public', 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /profile\nDisallow: /reset-password\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
console.log(`SEO data generated for ${places.length} places.`)
