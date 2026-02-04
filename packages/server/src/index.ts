import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './lib/auth.js'
import { authMiddleware } from './middleware/auth.js'
import { gamesRoutes } from './routes/games.js'
import { gameplayRoutes } from './routes/gameplay.js'
import { militoRoutes } from './routes/milito.js'
import { env } from './env.js'

const app = new Elysia()
  .use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  // Mount Better-Auth handler at root (it uses /api/auth internally)
  .mount(auth.handler)
  // Add user context to all routes
  .use(authMiddleware)
  // Custom API routes
  .use(gamesRoutes)
  .use(gameplayRoutes)
  .use(militoRoutes)
  .listen(env.PORT)

console.log(`🚀 Server listening on http://localhost:${env.PORT}`)

export type App = typeof app
