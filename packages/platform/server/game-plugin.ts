import { Elysia } from 'elysia'

export interface GamePlugin {
  /** Unique game identifier (e.g., 'milito', 'memory-match') */
  id: string
  /** Display name */
  name: string
  /** Minimum players required */
  minPlayers: number
  /** Maximum players allowed */
  maxPlayers: number
  /** Elysia routes for this game (mounted at /api/{id}) */
  routes: Elysia
}

/**
 * Mount a game plugin onto the main app
 */
export function mountGame(app: Elysia, plugin: GamePlugin): Elysia {
  console.log(`Mounting game: ${plugin.name} at /api/${plugin.id}`)
  return app.use(plugin.routes)
}
