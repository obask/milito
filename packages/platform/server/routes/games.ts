import { Elysia, t } from 'elysia'
import { db } from '../db/index.js'
import { games, gameRooms, gamePlayers, gameState } from '../db/schema.js'
import { eq, and, sql } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { authMiddleware } from '../middleware/auth.js'

function generateId() {
  return randomBytes(16).toString('hex')
}

export const gamesRoutes = new Elysia({ prefix: '/api/games' })
  .use(authMiddleware)
  .get('/', async () => {
    return await db.select().from(games)
  })
  .get(
    '/rooms',
    async ({ query }) => {
      let queryBuilder = db
        .select({
          id: gameRooms.id,
          name: gameRooms.name,
          gameId: gameRooms.gameId,
          gameName: games.name,
          gameImage: games.imageUrl,
          hostId: gameRooms.hostId,
          status: gameRooms.status,
          maxPlayers: gameRooms.maxPlayers,
          playerCount: sql<number>`count(${gamePlayers.id})`,
          createdAt: gameRooms.createdAt,
        })
        .from(gameRooms)
        .leftJoin(games, eq(gameRooms.gameId, games.id))
        .leftJoin(gamePlayers, eq(gameRooms.id, gamePlayers.roomId))
        .groupBy(gameRooms.id)
        .$dynamic()

      if (query.gameId) {
        queryBuilder = queryBuilder.where(eq(gameRooms.gameId, query.gameId))
      }

      if (query.status) {
        queryBuilder = queryBuilder.where(eq(gameRooms.status, query.status))
      }

      return await queryBuilder
    },
    {
      query: t.Object({
        gameId: t.Optional(t.String()),
        status: t.Optional(t.Union([t.Literal('waiting'), t.Literal('playing'), t.Literal('finished')])),
      }),
    },
  )
  .get(
    '/rooms/:roomId',
    async ({ params, set }) => {
      const room = await db
        .select()
        .from(gameRooms)
        .where(eq(gameRooms.id, params.roomId))
        .limit(1)

      if (!room[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Room not found' }
      }

      const players = await db
        .select({
          id: gamePlayers.id,
          userId: gamePlayers.userId,
          position: gamePlayers.position,
          score: gamePlayers.score,
        })
        .from(gamePlayers)
        .where(eq(gamePlayers.roomId, params.roomId))
        .orderBy(gamePlayers.position)

      return {
        ...room[0],
        players,
      }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    '/rooms',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const roomId = generateId()

      await db.insert(gameRooms).values({
        id: roomId,
        gameId: body.gameId,
        name: body.name,
        hostId: user.id,
        status: 'waiting',
        maxPlayers: body.maxPlayers,
      })

      await db.insert(gamePlayers).values({
        id: generateId(),
        roomId,
        userId: user.id,
        position: 0,
      })

      return { roomId }
    },
    {
      body: t.Object({
        gameId: t.String(),
        name: t.String({ minLength: 1, maxLength: 50 }),
        maxPlayers: t.Number({ minimum: 2, maximum: 6 }),
      }),
    },
  )
  .post(
    '/rooms/:roomId/join',
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const room = await db
        .select()
        .from(gameRooms)
        .where(eq(gameRooms.id, params.roomId))
        .limit(1)

      if (!room[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Room not found' }
      }

      if (room[0].status !== 'waiting') {
        set.status = 400
        return { error: 'Bad request', message: 'Game already started' }
      }

      const existingPlayer = await db
        .select()
        .from(gamePlayers)
        .where(and(eq(gamePlayers.roomId, params.roomId), eq(gamePlayers.userId, user.id)))
        .limit(1)

      if (existingPlayer[0]) {
        return { success: true, message: 'Already in room' }
      }

      const playerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(gamePlayers)
        .where(eq(gamePlayers.roomId, params.roomId))

      if (playerCount[0].count >= room[0].maxPlayers) {
        set.status = 400
        return { error: 'Bad request', message: 'Room is full' }
      }

      await db.insert(gamePlayers).values({
        id: generateId(),
        roomId: params.roomId,
        userId: user.id,
        position: playerCount[0].count,
      })

      return { success: true }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    '/rooms/:roomId/leave',
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      await db
        .delete(gamePlayers)
        .where(and(eq(gamePlayers.roomId, params.roomId), eq(gamePlayers.userId, user.id)))

      return { success: true }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    '/rooms/:roomId/start',
    async ({ params, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized', message: 'You must be logged in' }
      }

      const room = await db
        .select()
        .from(gameRooms)
        .where(eq(gameRooms.id, params.roomId))
        .limit(1)

      if (!room[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Room not found' }
      }

      if (room[0].hostId !== user.id) {
        set.status = 403
        return { error: 'Forbidden', message: 'Only host can start the game' }
      }

      if (room[0].status !== 'waiting') {
        set.status = 400
        return { error: 'Bad request', message: 'Game already started' }
      }

      const playerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(gamePlayers)
        .where(eq(gamePlayers.roomId, params.roomId))

      const game = await db.select().from(games).where(eq(games.id, room[0].gameId)).limit(1)

      if (playerCount[0].count < game[0].minPlayers) {
        set.status = 400
        return { error: 'Bad request', message: `Need at least ${game[0].minPlayers} players to start` }
      }

      await db
        .update(gameRooms)
        .set({
          status: 'playing',
          startedAt: new Date(),
        })
        .where(eq(gameRooms.id, params.roomId))

      const initialState = {
        cards: [],
        flipped: [],
        matched: [],
      }

      await db.insert(gameState).values({
        roomId: params.roomId,
        state: initialState,
        currentTurn: 0,
      })

      return { success: true }
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .get(
    '/:gameId',
    async ({ params, set }) => {
      const game = await db.select().from(games).where(eq(games.id, params.gameId)).limit(1)

      if (!game[0]) {
        set.status = 404
        return { error: 'Not found', message: 'Game not found' }
      }

      return game[0]
    },
    {
      params: t.Object({
        gameId: t.String(),
      }),
    },
  )
