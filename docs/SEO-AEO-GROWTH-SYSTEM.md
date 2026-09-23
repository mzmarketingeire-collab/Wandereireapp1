# Wander Éire SEO, AEO and organic growth system

## What is implemented

- Canonical, crawlable URLs for every live place: `/place/{id}/{slug}`.
- A county guide hub for all 32 counties and topic guides only where the verified
  inventory is substantial enough. The current dataset produces 40 topic guides.
- Route-specific titles, descriptions, canonical tags, Open Graph tags and JSON-LD.
- Cloudflare Worker HTML transformation so direct requests contain useful text and
  links before React runs. This remains portable: `PUBLIC_SITE_URL` controls the
  edge canonical origin and `VITE_PUBLIC_SITE_URL` controls generated files.
- Generated `sitemap.xml`, `robots.txt` and a checked-in public place inventory.
- Visible answer-first details on place and county pages, with crawlable internal
  links between places, counties and guide topics.
- Optional Microsoft Clarity loading with explicit analytics consent. Advertising
  storage remains denied. No script loads unless `VITE_CLARITY_ID` is configured.
- Search Console and SerpBear report scripts plus a weekly GitHub workflow.
- Evidence-led editorial briefs. New prose is never silently auto-published.

## Why the article machine uses review pull requests

Automatically rewriting public articles from rank movement would quickly produce
repetitive, weak pages and unverified claims. The automation therefore handles
the reliable parts: inventory refresh, query collection, opportunity scoring,
rank collection and brief generation. A human approves facts, photographs and
the final article before publication.

Each generated brief includes the matching Search Console evidence, the verified
place inventory, a suggested answer-first structure, internal links and a factual
publication checklist. With no matching query data, it is explicitly labelled as
an inventory-led baseline rather than proven demand.

## Configuration

Application build variables:

- `VITE_PUBLIC_SITE_URL`: current public origin, without a trailing slash.
- `VITE_CLARITY_ID`: Microsoft Clarity project ID.
- Existing Supabase build variables refresh the public SEO inventory.

Cloudflare Worker variable:

- `PUBLIC_SITE_URL`: canonical production origin. If absent, the request origin is
  used, making a future custom-domain move straightforward.

GitHub Actions secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GSC_SERVICE_ACCOUNT_JSON`: raw or base64-encoded Google service-account JSON.
- `SERPBEAR_API_KEY`

GitHub Actions variables:

- `PUBLIC_SITE_URL`
- `GSC_SITE_URL`: the exact Search Console property, such as `sc-domain:example.ie`.
- `SERPBEAR_URL`
- `SERPBEAR_DOMAIN`

The Google service account must be added as a user of the relevant Search Console
property. Secrets must stay in the hosting and GitHub secret stores; never put
them in `.env.example`, documentation, briefs or commits.

## Commands

```sh
npm run build
npm run content:briefs
npm run seo:gsc
npm run seo:ranks
```

`npm run build` refreshes the SEO inventory when Supabase is reachable. If it is
temporarily unavailable, it safely rebuilds county and sitemap data from the
checked-in 122-place snapshot.

## SerpBear

The official Docker layout is in `ops/serpbear/`. Its persistent volume keeps
rank history across container updates. Deployment requires an existing VPS,
strong generated secrets, HTTPS before public exposure, and a confirmed free
scraping method. No VPS, domain, paid scraper or billing has been activated.

## Editorial rules

- Publish a county hub for every county; publish a topic page only when its place
  threshold is met.
- Use Search Console demand to choose the next improvement, not to force keywords
  into unrelated pages.
- Prioritise practical original value: comparisons, arrival details, terrain,
  access and sensible itineraries.
- Verify changeable claims against current primary sources before publication.
- Use admin-approved sweeping landscape photography with its licence and source
  recorded. Community photo uploads remain disabled.
- Sponsored pins and rented business placements must be clearly labelled and must
  not alter editorial rankings or structured-data claims.

