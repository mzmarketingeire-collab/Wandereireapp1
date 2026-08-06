export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const path = new URL(request.url).pathname
    if (request.method === 'GET' && (path === '/' || path === '/index.html' || path === '/sw.js')) {
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }
    return response
  },
}
