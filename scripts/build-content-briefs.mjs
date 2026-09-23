import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const data = JSON.parse(await readFile(path.join(root, 'public', 'seo', 'places.json'), 'utf8'))
let searchRows = []
try { searchRows = JSON.parse(await readFile(path.join(root, 'reports', 'search-intent', 'latest.json'), 'utf8')).rows || [] } catch { /* Baseline briefs do not require Search Console. */ }

const topicTerms = {
  'outdoor-adventures': ['walk', 'trail', 'hike', 'mountain', 'viewpoint', 'outdoor'],
  'coast-and-beaches': ['beach', 'coast', 'sea', 'swim', 'strand'],
  'history-and-heritage': ['historic', 'history', 'castle', 'heritage', 'ancient'],
  'weekend-plan': ['weekend', 'things to do', 'places to visit', 'itinerary', 'day out'],
}
const clean = (value) => String(value).replace(/[<>:"/\\|?*]/g, '').trim()
const directory = path.join(root, 'content', 'briefs', 'generated')
await rm(directory, { recursive: true, force: true })
await mkdir(directory, { recursive: true })

const briefs = []
for (const county of data.counties) {
  for (const topic of county.topics) {
    const places = topic.placeIds.map((id) => data.places.find((place) => place.id === id)).filter(Boolean)
    const terms = topicTerms[topic.slug] || []
    const queries = searchRows.filter((row) => {
      const query = row.query.toLowerCase()
      return query.includes(county.name.toLowerCase()) && terms.some((term) => query.includes(term))
    }).slice(0, 10)
    const evidence = queries.length ? queries.map((row) => `- ${row.query} - ${row.impressions} impressions, ${row.clicks} clicks, position ${row.position.toFixed(1)}`).join('\n') : '- No matching Search Console query yet. Treat this as a baseline inventory brief, not proven demand.'
    const filename = `${county.slug}--${topic.slug}.md`
    const title = `${topic.title} in ${county.name}`
    const content = `# Content brief: ${clean(title)}\n\nStatus: editorial review required\nTarget route: ${topic.path}\nEvidence refreshed: ${data.generatedAt}\n\n## Search evidence\n\n${evidence}\n\n## Verified place inventory\n\n${places.map((place) => `- [${place.name}](${place.path}): ${place.kicker}; ${place.cost}; ${place.distance}`).join('\n')}\n\n## Recommended intent\n\nHelp someone choose and plan a real outing in ${county.name}. Answer practical questions early; do not pad the page with generic county history.\n\n## Suggested structure\n\n- A concise answer-first introduction\n- A comparison of the listed places by experience, time and cost\n- Arrival, parking and terrain considerations\n- A short itinerary only when the locations fit together geographically\n- Frequently asked questions supported by visible page copy\n- Internal links to every cited place and the ${county.name} county hub\n\n## Publication checks\n\n- Verify opening, access, cost, parking and seasonal claims against a current primary source\n- Use only the curated place inventory; never invent locations or first-hand experience\n- Add an admin-approved landscape photo with source and licence recorded\n- Ensure the page adds judgment or comparison beyond the underlying place cards\n- Human editor approval is mandatory before publication\n`
    await writeFile(path.join(directory, filename), content)
    briefs.push({ title, path: topic.path, file: filename, queries: queries.length, places: places.length })
  }
}

const index = `# Generated content opportunities\n\nGenerated: ${new Date().toISOString()}\n\nThese are review briefs, not publish-ready articles. Search evidence is used when available; otherwise the brief is clearly marked as inventory-led.\n\n${briefs.map((brief) => `- [${brief.title}](./${brief.file}) - ${brief.places} places, ${brief.queries} matching queries - target: ${brief.path}`).join('\n')}\n`
await writeFile(path.join(directory, 'README.md'), index)
console.log(`Generated ${briefs.length} reviewable content briefs.`)

