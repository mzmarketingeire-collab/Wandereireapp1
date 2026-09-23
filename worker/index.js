const siteName = 'Wander Éire'
const defaultDescription = 'Find unforgettable trails, ruins, beaches and wild places across all 32 counties of Ireland.'
const privatePaths = new Set(['/admin', '/profile', '/reset-password'])

const guideTopics = [
  { slug: 'outdoor-adventures', title: 'Walks, viewpoints and wild places' },
  { slug: 'coast-and-beaches', title: 'Beaches and coastal escapes' },
  { slug: 'history-and-heritage', title: 'Historic places and landmarks' },
  { slug: 'weekend-plan', title: 'A weekend outdoor itinerary' },
]

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const jsonLd = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')
const absolute = (origin, path) => `${origin}${path === '/' ? '/' : path}`
const countySlug = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const northernIrelandCounties = new Set(['Antrim', 'Armagh', 'Down', 'Fermanagh', 'Derry', 'Tyrone'])
const addressCountry = (county) => northernIrelandCounties.has(county) ? 'GB' : 'IE'

const placeFallback = (place) => `<main><article><p>${escapeHtml(place.category)} in ${escapeHtml(place.county)}, Ireland</p><h1>${escapeHtml(place.name)}</h1><p>${escapeHtml(place.kicker)}</p><h2>Worth the wander</h2><p>${escapeHtml(place.description)}</p><h2>Quick answers</h2><dl><dt>Cost</dt><dd>${escapeHtml(place.cost)}</dd><dt>Time and distance</dt><dd>${escapeHtml(place.distance)}</dd><dt>Parking</dt><dd>${escapeHtml(place.parking)}</dd></dl><h2>Find your way</h2><p>${escapeHtml(place.address)}</p><p><a href="/guides/${escapeHtml(countySlug(place.county))}">Explore more places in ${escapeHtml(place.county)}</a></p><p><a href="/">Explore the Ireland map</a></p></article></main>`

const listFallback = (title, description, links) => `<main><article><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><ul>${links.map((item) => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>${item.detail ? ` - ${escapeHtml(item.detail)}` : ''}</li>`).join('')}</ul><p><a href="/">Explore the Ireland map</a></p></article></main>`

const makeModel = (pathname, data, origin) => {
  if (privatePaths.has(pathname)) return { title: siteName, description: 'Private Wander Eire account area.', path: pathname, robots: 'noindex, nofollow', schema: null, body: '<main><h1>Wander Eire account</h1><p><a href="/">Return to the map</a></p></main>' }
  if (pathname === '/' || pathname === '/index.html') {
    const links = data.places.map((place) => ({ name: place.name, path: place.path, detail: place.county }))
    return { title: 'Wander Eire - Go somewhere worth remembering', description: defaultDescription, path: '/', robots: 'index, follow, max-image-preview:large', schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: absolute(origin, '/'), description: defaultDescription }, body: listFallback('Explore Ireland outdoors', defaultDescription, [{ name: 'Browse all county guides', path: '/guides' }, ...links]) }
  }

  const placeMatch = pathname.match(/^\/place\/(\d+)(?:\/[^/]+)?\/?$/)
  if (placeMatch) {
    const place = data.places.find((item) => item.id === Number(placeMatch[1]))
    if (!place) return null
    const path = place.path
    const description = `${place.kicker}. Practical details for visiting ${place.name} in ${place.county}, including cost, distance, parking and terrain.`
    return {
      title: `${place.name}, ${place.county} | ${siteName}`, description, path, robots: 'index, follow, max-image-preview:large',
      schema: { '@context': 'https://schema.org', '@type': 'TouristAttraction', name: place.name, description: place.description, url: absolute(origin, path), address: { '@type': 'PostalAddress', streetAddress: place.address, addressCountry: addressCountry(place.county) }, geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude }, isAccessibleForFree: String(place.cost).toLowerCase().includes('free') },
      body: placeFallback(place), redirect: pathname.replace(/\/$/, '') !== path ? path : null,
    }
  }

  if (pathname === '/guides' || pathname === '/guides/') {
    const description = `Explore practical outdoor guides for all ${data.counties.length} counties of Ireland, with ${data.places.length} curated beaches, walks, viewpoints and historic places.`
    const links = data.counties.map((county) => ({ name: `${county.name} outdoor guide`, path: county.path, detail: `${county.placeIds.length} places` }))
    return { title: `Ireland county guides | ${siteName}`, description, path: '/guides', robots: 'index, follow, max-image-preview:large', schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Ireland county guides', description, url: absolute(origin, '/guides'), mainEntity: { '@type': 'ItemList', itemListElement: links.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: absolute(origin, item.path) })) } }, body: listFallback('Ireland outdoor guides', description, links) }
  }

  const guideMatch = pathname.match(/^\/guides\/([^/]+)(?:\/([^/]+))?\/?$/)
  if (guideMatch) {
    const county = data.counties.find((item) => item.slug === guideMatch[1])
    if (!county) return null
    const countyPlaces = county.placeIds.map((id) => data.places.find((place) => place.id === id)).filter(Boolean)
    const topic = guideMatch[2] ? county.topics.find((item) => item.slug === guideMatch[2]) : null
    if (guideMatch[2] && !topic) return null
    const selected = topic ? topic.placeIds.map((id) => data.places.find((place) => place.id === id)).filter(Boolean) : countyPlaces
    const topicName = topic ? (guideTopics.find((item) => item.slug === topic.slug)?.title || topic.title) : null
    const path = topic ? topic.path : county.path
    const title = topic ? `${topicName} in ${county.name}` : `${county.name} outdoor guide`
    const description = topic ? `${topicName} in ${county.name}: ${selected.length} curated places with practical notes on cost, distance, parking and what makes each stop worthwhile.` : `Plan days out in ${county.name} with ${selected.length} curated walks, beaches, viewpoints and historic places, including parking, cost and distance details.`
    const links = selected.map((place) => ({ name: place.name, path: place.path, detail: `${place.cost}; ${place.distance}` }))
    return { title: `${title} | ${siteName}`, description, path, robots: 'index, follow, max-image-preview:large', schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: absolute(origin, path), mainEntity: { '@type': 'ItemList', itemListElement: links.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: absolute(origin, item.path) })) } }, body: listFallback(title, description, links) }
  }
  return null
}

const transformHtml = (response, model, origin) => {
  const canonical = absolute(origin, model.path)
  const replacements = [
    ['title', { element: (element) => element.setInnerContent(model.title) }],
    ['meta[name="description"]', { element: (element) => element.setAttribute('content', model.description) }],
    ['meta[name="robots"]', { element: (element) => element.setAttribute('content', model.robots) }],
    ['link[rel="canonical"]', { element: (element) => element.setAttribute('href', canonical) }],
    ['meta[property="og:title"]', { element: (element) => element.setAttribute('content', model.title) }],
    ['meta[property="og:description"]', { element: (element) => element.setAttribute('content', model.description) }],
    ['meta[property="og:url"]', { element: (element) => element.setAttribute('content', canonical) }],
    ['meta[property="og:image"]', { element: (element) => element.setAttribute('content', absolute(origin, '/icon-512.png')) }],
    ['meta[name="twitter:title"]', { element: (element) => element.setAttribute('content', model.title) }],
    ['meta[name="twitter:description"]', { element: (element) => element.setAttribute('content', model.description) }],
    ['#structured-data', { element: (element) => model.schema ? element.setInnerContent(jsonLd(model.schema), { html: true }) : element.remove() }],
    ['#root', { element: (element) => element.setInnerContent(model.body, { html: true }) }],
  ]
  let rewriter = new HTMLRewriter()
  for (const [selector, handler] of replacements) rewriter = rewriter.on(selector, handler)
  return rewriter.transform(response)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const response = await env.ASSETS.fetch(request)
    const isHtml = request.method === 'GET' && response.headers.get('content-type')?.includes('text/html')
    if (isHtml) {
      const dataResponse = await env.ASSETS.fetch(new Request(new URL('/seo/places.json', request.url)))
      if (dataResponse.ok) {
        const data = await dataResponse.json()
        const origin = (env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '')
        const model = makeModel(url.pathname, data, origin)
        if (model?.redirect) return Response.redirect(absolute(origin, model.redirect), 301)
        if (model) {
          const transformed = transformHtml(response, model, origin)
          const headers = new Headers(transformed.headers)
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
          return new Response(transformed.body, { status: transformed.status, statusText: transformed.statusText, headers })
        }
      }
    }
    if (request.method === 'GET' && (url.pathname === '/sw.js' || url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt')) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }
    return response
  },
}
