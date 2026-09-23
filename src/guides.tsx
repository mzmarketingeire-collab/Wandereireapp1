import { ArrowLeft, ChevronRight, Compass, Map as MapIcon } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { Category, Place } from './App'
import { absoluteUrl, placePath, slugify, usePageSeo } from './lib/seo'

type GuideTopic = {
  slug: string
  title: string
  intro: string
  categories: Category[]
  minimum: number
}

export const guideTopics: GuideTopic[] = [
  { slug: 'outdoor-adventures', title: 'Walks, viewpoints and wild places', intro: 'A practical shortlist of trails, high ground and open-air places worth building a day around.', categories: ['trail', 'viewpoint', 'camp'], minimum: 2 },
  { slug: 'coast-and-beaches', title: 'Beaches and coastal escapes', intro: 'Sweeping strands and coastal viewpoints, with the useful arrival details gathered in one place.', categories: ['beach'], minimum: 2 },
  { slug: 'history-and-heritage', title: 'Historic places and landmarks', intro: 'Castles, ancient sites and landmark places that reveal the county through its landscape.', categories: ['historic'], minimum: 2 },
  { slug: 'weekend-plan', title: 'A weekend outdoor itinerary', intro: 'A balanced starting point for two unhurried days, mixing scenery, walks and places with a story.', categories: ['trail', 'viewpoint', 'camp', 'beach', 'historic'], minimum: 4 },
]

const placesForTopic = (places: Place[], topic: GuideTopic) => places.filter((place) => topic.categories.includes(place.category))
const availableTopics = (places: Place[]) => guideTopics.filter((topic) => placesForTopic(places, topic).length >= topic.minimum)

function GuideHeader() {
  return <header className="guide-header"><Link className="brand" to="/"><span className="brand-mark"><Compass/></span><span>Wander <em>Éire</em></span></Link><Link className="guide-map-link" to="/"><MapIcon size={17}/>Explore map</Link></header>
}

export function PlaceLinks({ places }: { places: Place[] }) {
  return <div className="guide-place-list">{places.map((place) => <Link key={place.id} to={placePath(place)}>
    <span><small>{place.county}</small><strong>{place.name}</strong><p>{place.kicker}</p></span>
    <span className="guide-place-meta">{place.cost}<br/>{place.distance}</span><ChevronRight aria-hidden="true"/>
  </Link>)}</div>
}

export function GuideIndex({ places }: { places: Place[] }) {
  const counties = [...new Set(places.map((place) => place.county))].sort((a, b) => a.localeCompare(b))
  const description = `Explore practical outdoor guides for all ${counties.length} counties of Ireland, with ${places.length} curated beaches, walks, viewpoints and historic places.`
  usePageSeo({
    title: 'Ireland county guides | Wander Éire', description, path: '/guides',
    structuredData: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Ireland county guides', description, url: absoluteUrl('/guides'), mainEntity: { '@type': 'ItemList', itemListElement: counties.map((county, index) => ({ '@type': 'ListItem', position: index + 1, name: `${county} outdoor guide`, url: absoluteUrl(`/guides/${slugify(county)}`) })) } },
  })
  return <main className="guide-view"><GuideHeader/><section className="guide-intro"><Link className="guide-back" to="/"><ArrowLeft/>Map</Link><p className="eyebrow">Plan county by county</p><h1>Ireland outdoor guides</h1><p>{description}</p></section><section className="county-grid" aria-label="County guides">{counties.map((county) => {
    const countyPlaces = places.filter((place) => place.county === county)
    return <Link key={county} to={`/guides/${slugify(county)}`}><span>{county}</span><small>{countyPlaces.length} {countyPlaces.length === 1 ? 'place' : 'places'}</small><ChevronRight/></Link>
  })}</section></main>
}

export function CountyGuide({ places }: { places: Place[] }) {
  const { countySlug } = useParams()
  const county = [...new Set(places.map((place) => place.county))].find((name) => slugify(name) === countySlug)
  const countyPlaces = county ? places.filter((place) => place.county === county) : []
  const topics = availableTopics(countyPlaces)
  const path = county ? `/guides/${countySlug}` : '/guides'
  const description = county ? `Plan days out in ${county} with ${countyPlaces.length} curated walks, beaches, viewpoints and historic places, including parking, cost and distance details.` : 'Browse Ireland county guides.'
  usePageSeo({ title: county ? `${county} outdoor guide | Wander Éire` : 'Ireland county guides | Wander Éire', description, path, robots: county ? undefined : 'noindex, follow', structuredData: county ? { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${county} outdoor guide`, description, url: absoluteUrl(path), mainEntity: { '@type': 'ItemList', itemListElement: countyPlaces.map((place, index) => ({ '@type': 'ListItem', position: index + 1, name: place.name, url: absoluteUrl(placePath(place)) })) } } : undefined })
  if (!county) return <Navigate to="/guides" replace/>
  return <main className="guide-view"><GuideHeader/><article className="guide-article"><Link className="guide-back" to="/guides"><ArrowLeft/>All counties</Link><header><p className="eyebrow">County guide</p><h1>{county} outdoors</h1><p>{description}</p></header>
    {topics.length > 0 && <nav className="topic-links" aria-label={`${county} guide topics`}>{topics.map((topic) => <Link key={topic.slug} to={`${path}/${topic.slug}`}><strong>{topic.title}</strong><span>{placesForTopic(countyPlaces, topic).length} selected places</span><ChevronRight/></Link>)}</nav>}
    <section><p className="eyebrow">Places to start</p><h2>Explore {county}</h2><p>Use these field notes as a starting point, then check local access, weather and tide conditions before travelling.</p><PlaceLinks places={countyPlaces}/></section>
    <section className="guide-answers"><p className="eyebrow">Quick answers</p><h2>Planning a day in {county}</h2><dl><div><dt>How many places are in this guide?</dt><dd>{countyPlaces.length} curated locations across {new Set(countyPlaces.map((place) => place.category)).size} outdoor categories.</dd></div><div><dt>Can I plan from the map?</dt><dd>Yes. Every place page opens directly into the terrain map for a closer look at its setting.</dd></div><div><dt>Are access details current?</dt><dd>Cost and parking notes are a useful starting point, but local conditions and opening arrangements can change.</dd></div></dl></section>
  </article></main>
}

export function TopicGuide({ places }: { places: Place[] }) {
  const { countySlug, topicSlug } = useParams()
  const county = [...new Set(places.map((place) => place.county))].find((name) => slugify(name) === countySlug)
  const topic = guideTopics.find((item) => item.slug === topicSlug)
  const countyPlaces = county ? places.filter((place) => place.county === county) : []
  const selected = topic ? placesForTopic(countyPlaces, topic) : []
  const valid = Boolean(county && topic && selected.length >= (topic?.minimum ?? Number.POSITIVE_INFINITY))
  const path = valid ? `/guides/${countySlug}/${topicSlug}` : '/guides'
  const description = valid ? `${topic?.title} in ${county}: ${selected.length} curated places with practical notes on cost, distance, parking and what makes each stop worthwhile.` : 'Browse practical outdoor guides for Ireland.'
  usePageSeo({ title: valid ? `${topic?.title} in ${county} | Wander Éire` : 'Ireland county guides | Wander Éire', description, path, robots: valid ? undefined : 'noindex, follow', structuredData: valid ? { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${topic?.title} in ${county}`, description, url: absoluteUrl(path), mainEntity: { '@type': 'ItemList', itemListElement: selected.map((place, index) => ({ '@type': 'ListItem', position: index + 1, name: place.name, url: absoluteUrl(placePath(place)) })) } } : undefined })
  if (!county || !topic) return <Navigate to="/guides" replace/>
  if (!valid) return <Navigate to={`/guides/${countySlug}`} replace/>
  return <main className="guide-view"><GuideHeader/><article className="guide-article"><Link className="guide-back" to={`/guides/${countySlug}`}><ArrowLeft/>{county} guide</Link><header><p className="eyebrow">{county} field guide</p><h1>{topic.title}</h1><p>{topic.intro} This guide draws only from Wander Eire's curated {county} places.</p></header><section><p className="eyebrow">The shortlist</p><h2>{selected.length} places worth considering</h2><PlaceLinks places={selected}/></section><section className="guide-answers"><p className="eyebrow">Before you go</p><h2>Plan around the landscape</h2><p>Open each place for its specific arrival notes, then use Explore landscape to inspect terrain and surroundings. For coastal and mountain trips, check current weather, daylight and local notices on the day.</p></section></article></main>
}
