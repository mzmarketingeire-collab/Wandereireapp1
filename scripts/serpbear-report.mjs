import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.SERPBEAR_URL?.replace(/\/$/, '')
const apiKey = process.env.SERPBEAR_API_KEY
const domain = process.env.SERPBEAR_DOMAIN
if (!baseUrl || !apiKey || !domain) throw new Error('SERPBEAR_URL, SERPBEAR_API_KEY and SERPBEAR_DOMAIN are required.')

const response = await fetch(`${baseUrl}/api/keywords?domain=${encodeURIComponent(domain)}`, {
  headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(30000),
})
if (!response.ok) throw new Error(`SerpBear returned ${response.status}.`)
const payload = await response.json()
const keywords = Array.isArray(payload) ? payload : (payload.keywords || payload.data || [])
const output = { generatedAt: new Date().toISOString(), domain, keywords }
const directory = path.join(process.cwd(), 'reports', 'rank-tracking')
await mkdir(directory, { recursive: true })
await writeFile(path.join(directory, 'latest.json'), `${JSON.stringify(output, null, 2)}\n`)
console.log(`SerpBear report generated with ${keywords.length} keywords.`)

