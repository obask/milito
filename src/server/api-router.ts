import { auth } from './lib/auth.js'

type StatusLike = number | Response
type HandlerContext = {
  request: Request
  params: Record<string, string>
  query: Record<string, string>
  body: any
  user: any
  session: any
  set: { status: StatusLike }
  status: (code: number) => Response
}
type Handler = (context: HandlerContext) => unknown | Promise<unknown>
type Route = { method: string; path: string; handler: Handler }

export const t = new Proxy({}, {
  get: () => (..._args: unknown[]) => ({}),
}) as any

export class ApiRouter {
  readonly prefix: string
  readonly routes: Route[] = []

  constructor(options: { prefix?: string; name?: string } = {}) {
    this.prefix = normalizePath(options.prefix || '')
  }

  use(router: unknown) {
    if (router instanceof ApiRouter) this.routes.push(...router.routes)
    return this
  }

  get(path: string, handler: Handler) {
    this.routes.push({ method: 'GET', path: joinPath(this.prefix, path), handler })
    return this
  }

  post(path: string, handler: Handler) {
    this.routes.push({ method: 'POST', path: joinPath(this.prefix, path), handler })
    return this
  }

  put(path: string, handler: Handler) {
    this.routes.push({ method: 'PUT', path: joinPath(this.prefix, path), handler })
    return this
  }

  delete(path: string, handler: Handler) {
    this.routes.push({ method: 'DELETE', path: joinPath(this.prefix, path), handler })
    return this
  }

  async handle(request: Request) {
    const url = new URL(request.url)
    const route = this.routes
      .map((candidate) => ({ candidate, params: matchPath(candidate.path, url.pathname) }))
      .find(({ candidate, params }) => candidate.method === request.method && params)

    if (!route || !route.params) return json({ error: 'Not found', message: 'Route not found' }, 404)

    const session = await auth.api.getSession({ headers: request.headers })
    const set = { status: 200 as StatusLike }
    const body = await readBody(request)
    const result = await route.candidate.handler({
      request,
      params: route.params,
      query: Object.fromEntries(url.searchParams),
      body,
      user: session?.user || null,
      session: session?.session || null,
      set,
      status: (code: number) => new Response(null, { status: code }),
    })

    if (result instanceof Response) return result
    return json(result, typeof set.status === 'number' ? set.status : 200)
  }
}

async function readBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined
  const text = await request.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status })
}

function normalizePath(path: string) {
  if (!path || path === '/') return ''
  return path.startsWith('/') ? path.replace(/\/$/, '') : '/' + path.replace(/\/$/, '')
}

function joinPath(prefix: string, path: string) {
  const suffix = normalizePath(path)
  return (prefix + suffix) || '/'
}

function matchPath(pattern: string, pathname: string) {
  const left = pattern.split('/').filter(Boolean)
  const right = pathname.split('/').filter(Boolean)
  if (left.length !== right.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < left.length; i++) {
    const part = left[i]
    const value = right[i]
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(value)
    else if (part !== value) return null
  }
  return params
}
