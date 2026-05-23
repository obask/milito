import { gamesRoutes } from './routes/games.js'
import { gameplayRoutes } from './routes/gameplay.js'
import { militoRoutes } from './routes/milito.js'
import { ApiRouter } from './api-router.js'

const router = new ApiRouter()
  .use(gamesRoutes)
  .use(gameplayRoutes)
  .use(militoRoutes)

export function handleApiRequest(request: Request) {
  return router.handle(request)
}
