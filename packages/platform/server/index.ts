import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './lib/auth.js'
import { authMiddleware } from './middleware/auth.js'
import { gamesRoutes } from './routes/games.js'
import { env } from './env.js'
import { mountGame, type GamePlugin } from './game-plugin.js'

// Import game plugins
import { militoPlugin } from '../../games/milito/server/routes.js'
import { memoryMatchPlugin } from '../../games/memory-match/server/routes.js'

const gamePlugins: GamePlugin[] = [
  militoPlugin,
  memoryMatchPlugin,
]

let app = new Elysia()
  .use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  // Mount Better-Auth handler
  .mount(auth.handler)
  // Add user context to all routes
  .use(authMiddleware)
  // Platform routes (room management)
  .use(gamesRoutes)

// Mount all game plugins
for (const plugin of gamePlugins) {
  app = mountGame(app, plugin) as typeof app
}

app.listen(env.PORT)

console.log(`🚀 Server listening on http://localhost:${env.PORT}`)
console.log(`📦 Loaded games: ${gamePlugins.map(p => p.name).join(', ')}`)

export type App = typeof app
