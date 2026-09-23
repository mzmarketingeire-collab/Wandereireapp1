import { createSign } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const required = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

const decodeCredentials = (value) => {
  try { return JSON.parse(value) } catch {
    try { return JSON.parse(Buffer.from(value, 'base64').toString('utf8')) } catch { throw new Error('GSC_SERVICE_ACCOUNT_JSON must contain JSON or base64-encoded JSON.') }
  }
}

const base64url = (value) => Buffer.from(value).toString('base64url')
const credentials = decodeCredentials(required('GSC_SERVICE_ACCOUNT_JSON'))
const siteUrl = required('GSC_SITE_URL')
const now = new Date()
const end = new Date(now); end.setUTCDate(end.getUTCDate() - 3)
const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27)
const date = (value) => value.toISOString().slice(0, 10)

const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
const claim = base64url(JSON.stringify({
  iss: credentials.client_email,
  scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
}))
const unsigned = `${header}.${claim}`
const signer = createSign('RSA-SHA256'); signer.update(unsigned)
const assertion = `${unsigned}.${signer.sign(credentials.private_key, 'base64url')}`

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
})
if (!tokenResponse.ok) throw new Error(`Google token request failed with ${tokenResponse.status}.`)
const { access_token: accessToken } = await tokenResponse.json()

const reportResponse = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
  method: 'POST', headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
  body: JSON.stringify({ startDate: date(start), endDate: date(end), dimensions: ['query', 'page'], rowLimit: 25000, dataState: 'final' }),
})
if (!reportResponse.ok) throw new Error(`Search Console query failed with ${reportResponse.status}.`)
const report = await reportResponse.json()
const rows = (report.rows || []).map((row) => ({
  query: row.keys[0], page: row.keys[1], clicks: row.clicks, impressions: row.impressions,
  ctr: row.ctr, position: row.position,
  opportunityScore: Math.round(row.impressions * Math.max(0.15, 1 - row.ctr) * (row.position >= 4 && row.position <= 20 ? 1.5 : 0.65)),
})).sort((a, b) => b.opportunityScore - a.opportunityScore)

const output = { generatedAt: now.toISOString(), siteUrl, startDate: date(start), endDate: date(end), rows }
const directory = path.join(process.cwd(), 'reports', 'search-intent')
await mkdir(directory, { recursive: true })
await writeFile(path.join(directory, 'latest.json'), `${JSON.stringify(output, null, 2)}\n`)
await writeFile(path.join(directory, `${date(now)}.json`), `${JSON.stringify(output, null, 2)}\n`)
console.log(`Search Console report generated with ${rows.length} query/page rows.`)

