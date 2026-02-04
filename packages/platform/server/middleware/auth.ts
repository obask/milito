import { Elysia } from 'elysia'
import { auth } from '../lib/auth.js'

// Better-Auth integration using the recommended macro pattern
export const betterAuthPlugin = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers })
        if (!session) return status(401)
        return {
          user: session.user,
          session: session.session,
        }
      },
    },
  })

// Middleware that injects user/session into context without requiring auth
export const authMiddleware = new Elysia({ name: 'auth-middleware' }).derive(
  { as: 'global' },
  async ({ request }: { request: Request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    return {
      user: session?.user || null,
      session: session?.session || null,
    }
  },
)
