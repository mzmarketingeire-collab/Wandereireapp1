import assert from 'node:assert/strict'

// Read-only, bounded network check: downloads only 447 bytes of the trial archive.
const url = 'https://stbkxmzoyonerkyacblp.supabase.co/storage/v1/object/public/map-trial/wicklow-trial.pmtiles'
const archiveSize = 758889
let total = 0
for (const [start, length] of [[0, 127], [16384, 256], [archiveSize - 64, 64]]) {
  const end = start + length - 1
  const response = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}`, Origin: 'http://127.0.0.1:5173' },
    signal: AbortSignal.timeout(15000),
  })
  assert.equal(response.status, 206, 'Storage must return a partial response')
  assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${archiveSize}`)
  assert.equal(response.headers.get('access-control-allow-origin'), '*')
  const data = new Uint8Array(await response.arrayBuffer())
  assert.equal(data.length, length)
  if (start === 0) {
    assert.equal(new TextDecoder().decode(data.slice(0, 7)), 'PMTiles')
    assert.equal(data[7], 3, 'PMTiles version 3 expected')
  }
  total += data.length
  console.log(`PASS range ${start}-${end}: ${data.length} bytes`)
}
console.log(`PASS Supabase range delivery and CORS; ${total} response bytes`)
