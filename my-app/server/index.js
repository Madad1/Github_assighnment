import { createServer } from 'node:http'

const port = Number(process.env.PORT || 3001)
const githubApi = 'https://api.github.com'

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method !== 'GET') {
    sendJson(response, 405, { message: 'Only GET requests are supported.' })
    return
  }

  let endpoint
  if (url.pathname === '/api/users') {
    const perPage = Math.min(Math.max(Number(url.searchParams.get('per_page')) || 12, 1), 100)
    const since = Math.max(Number(url.searchParams.get('since')) || 0, 0)
    endpoint = new URL(`${githubApi}/users`)
    endpoint.searchParams.set('per_page', String(perPage))
    endpoint.searchParams.set('since', String(since))
  } else if (url.pathname === '/api/search') {
    const query = url.searchParams.get('q')?.trim()
    if (!query) {
      sendJson(response, 400, { message: 'A search query is required.' })
      return
    }

    const perPage = Math.min(Math.max(Number(url.searchParams.get('per_page')) || 12, 1), 100)
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1)
    endpoint = new URL(`${githubApi}/search/users`)
    endpoint.searchParams.set('q', query)
    endpoint.searchParams.set('per_page', String(perPage))
    endpoint.searchParams.set('page', String(page))
  } else {
    sendJson(response, 404, { message: 'API route not found.' })
    return
  }

  try {
    const upstream = await fetch(endpoint, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'github-people-index',
      },
    })
    const body = await upstream.text()
    response.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
    response.end(body)
  } catch {
    sendJson(response, 502, { message: 'GitHub API is currently unavailable.' })
  }
})

server.listen(port, () => {
  console.log(`GitHub People API listening on http://localhost:${port}`)
})
