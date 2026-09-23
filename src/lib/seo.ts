import { useEffect } from 'react'

const defaultSiteUrl = 'https://wander-eire.markhoare28.workers.dev'
const siteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || defaultSiteUrl).replace(/\/$/, '')

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>

export type PageSeo = {
  title: string
  description: string
  path: string
  robots?: string
  structuredData?: StructuredData
}

const setMeta = (selector: string, value: string) => {
  const element = document.querySelector<HTMLMetaElement>(selector)
  if (element) element.content = value
}

export const absoluteUrl = (path: string) => `${siteUrl}${path === '/' ? '/' : path}`

export const slugify = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const placePath = (place: { id: number; name: string }) => `/place/${place.id}/${slugify(place.name)}`

export function usePageSeo({ title, description, path, robots = 'index, follow, max-image-preview:large', structuredData }: PageSeo) {
  useEffect(() => {
    const canonical = absoluteUrl(path)
    document.title = title
    setMeta('meta[name="description"]', description)
    setMeta('meta[name="robots"]', robots)
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:url"]', canonical)
    setMeta('meta[property="og:image"]', absoluteUrl('/icon-512.png'))
    setMeta('meta[name="twitter:title"]', title)
    setMeta('meta[name="twitter:description"]', description)
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical)
    const script = document.querySelector<HTMLScriptElement>('#structured-data')
    if (script && structuredData) script.textContent = JSON.stringify(structuredData)
  }, [description, path, robots, structuredData, title])
}
